import logging
import shutil
import uuid
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import whisper

from confidence_scorer import ConfidenceScorer

BASE_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = BASE_DIR / "uploads" / "interviews"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(
    title="Facial Emotion Analysis API",
    version="1.0.0",
    description="Analyzes interview videos using emotion_resnet34.pth",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

scorer = ConfidenceScorer(
    emotion_model_path=BASE_DIR / "models" / "emotion_resnet34.pth",
    stress_model_path=BASE_DIR / "models" / "stress_detector_resnet50.pth",
)

# Load Whisper model (base model for good balance of speed and accuracy)
try:
    whisper_model = whisper.load_model("base")
    logging.info("Whisper model loaded successfully")
except Exception as e:
    logging.error(f"Failed to load Whisper model: {e}")
    whisper_model = None


@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "model": "emotion_resnet34.pth",
        "whisper_loaded": whisper_model is not None
    }


@app.post("/analyze-interview")
async def analyze_interview(video: UploadFile = File(...)):
    if not video:
        raise HTTPException(status_code=400, detail="Video file is required.")

    ext = Path(video.filename or "").suffix or ".webm"
    file_name = f"interview-{uuid.uuid4().hex}{ext}"
    save_path = UPLOAD_DIR / file_name

    try:
        with save_path.open("wb") as buffer:
            shutil.copyfileobj(video.file, buffer)
    except Exception as exc:
        logging.exception("Failed to save uploaded video.")
        raise HTTPException(
            status_code=500, detail="Failed to save uploaded video."
        ) from exc
    finally:
        video.file.close()

    try:
        result = scorer.analyze_video(str(save_path))
        if result:
            stress_pct = result.get("metrics", {}).get("stress_percentage")
            if stress_pct is not None:
                logging.info(
                    "Stress status: %s (%.2f%%)",
                    "STRESSED" if stress_pct > 40 else "CALM",
                    stress_pct,
                )
    except Exception as exc:
        logging.exception("Failed to analyze video.")
        raise HTTPException(
            status_code=500, detail="Failed to analyze video."
        ) from exc

    return JSONResponse(
        {
            "success": True,
            "message": "Analysis completed successfully",
            "video_path": f"/uploads/interviews/{file_name}",
            "data": result,
        }
    )


@app.post("/transcribe-audio")
async def transcribe_audio(audio: UploadFile = File(...)):
    """
    Transcribe audio file using OpenAI Whisper
    """
    if not audio:
        raise HTTPException(status_code=400, detail="Audio file is required.")
    
    if whisper_model is None:
        raise HTTPException(
            status_code=503,
            detail="Whisper model not loaded. Please check server logs."
        )
    
    ext = Path(audio.filename or "").suffix or ".wav"
    file_name = f"audio-{uuid.uuid4().hex}{ext}"
    save_path = UPLOAD_DIR / file_name
    
    try:
        with save_path.open("wb") as buffer:
            shutil.copyfileobj(audio.file, buffer)
    except Exception as exc:
        logging.exception("Failed to save uploaded audio.")
        raise HTTPException(
            status_code=500, detail="Failed to save uploaded audio."
        ) from exc
    finally:
        audio.file.close()
    
    try:
        # Transcribe audio using Whisper
        result = whisper_model.transcribe(
            str(save_path),
            language="en",  # Set to None for auto-detection
            task="transcribe"
        )
        
        transcript = result.get("text", "").strip()
        
        # Clean up audio file after transcription
        try:
            save_path.unlink()
        except Exception:
            pass
        
        return JSONResponse(
            {
                "success": True,
                "transcript": transcript,
                "language": result.get("language", "en"),
            }
        )
    except Exception as exc:
        logging.exception("Failed to transcribe audio.")
        # Clean up on error
        try:
            save_path.unlink()
        except Exception:
            pass
        raise HTTPException(
            status_code=500, detail="Failed to transcribe audio."
        ) from exc


@app.post("/transcribe-video")
async def transcribe_video(video: UploadFile = File(...)):
    """
    Transcribe video file directly using OpenAI Whisper (extracts audio automatically)
    """
    if not video:
        raise HTTPException(status_code=400, detail="Video file is required.")
    
    if whisper_model is None:
        raise HTTPException(
            status_code=503,
            detail="Whisper model not loaded. Please check server logs."
        )
    
    ext = Path(video.filename or "").suffix or ".webm"
    file_name = f"video-transcribe-{uuid.uuid4().hex}{ext}"
    save_path = UPLOAD_DIR / file_name
    
    logging.info(f"Received video file: {video.filename}, saving to: {save_path}")
    
    try:
        with save_path.open("wb") as buffer:
            shutil.copyfileobj(video.file, buffer)
        file_size = save_path.stat().st_size
        logging.info(f"Video file saved successfully. Size: {file_size} bytes")
    except Exception as exc:
        logging.exception("Failed to save uploaded video for transcription.")
        raise HTTPException(
            status_code=500, detail="Failed to save uploaded video."
        ) from exc
    finally:
        video.file.close()
    
    try:
        logging.info(f"Starting Whisper transcription for: {save_path}")
        # Whisper can transcribe video files directly (extracts audio automatically)
        # Note: Whisper uses ffmpeg internally for video files, so ffmpeg must be installed
        result = whisper_model.transcribe(
            str(save_path),
            language="en",  # Set to None for auto-detection
            task="transcribe",
            fp16=False  # Disable fp16 for better compatibility
        )
        
        transcript = result.get("text", "").strip()
        logging.info(f"Transcription completed. Transcript length: {len(transcript)}")
        if transcript:
            logging.info(f"Transcript preview: {transcript[:100]}")
        else:
            logging.warning("Transcription returned empty text!")
            logging.warning(f"Full result keys: {result.keys()}")
        
        # Clean up video file after transcription
        try:
            save_path.unlink()
            logging.info("Cleaned up video file after transcription")
        except Exception as cleanup_err:
            logging.warning(f"Failed to clean up video file: {cleanup_err}")
        
        return JSONResponse(
            {
                "success": True,
                "transcript": transcript,
                "language": result.get("language", "en"),
            }
        )
    except Exception as exc:
        logging.exception("Failed to transcribe video.")
        # Clean up on error
        try:
            save_path.unlink()
        except Exception:
            pass
        raise HTTPException(
            status_code=500, detail=f"Failed to transcribe video: {str(exc)}"
        ) from exc


if __name__ == "__main__":
    uvicorn.run(
        "api_server:app",
        host="0.0.0.0",
        port=5002,
        reload=False,
    )

