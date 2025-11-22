import logging
import shutil
import uuid
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

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


@app.get("/health")
async def health_check():
    return {"status": "ok", "model": "emotion_resnet34.pth"}


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


if __name__ == "__main__":
    uvicorn.run(
        "api_server:app",
        host="0.0.0.0",
        port=5002,
        reload=False,
    )

