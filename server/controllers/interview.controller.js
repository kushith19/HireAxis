import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import { User } from "../models/User.model.js";

const execAsync = promisify(exec);
const FACIAL_SERVICE_URL =
  process.env.FACIAL_SERVICE_URL || "http://127.0.0.1:5002";
const OLLAMA_API_URL = process.env.OLLAMA_API_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3";

/**
 * Extract audio from video using ffmpeg
 */
async function extractAudio(videoPath, audioPath) {
  try {
    // Check if ffmpeg is available
    await execAsync("which ffmpeg || which ffmpeg.exe || echo 'ffmpeg not found'");
    
    // Extract audio to WAV format
    await execAsync(
      `ffmpeg -i "${videoPath}" -vn -acodec pcm_s16le -ar 16000 -ac 1 "${audioPath}" -y`
    );
    return true;
  } catch (error) {
    console.error("Audio extraction error:", error.message);
    return false;
  }
}

/**
 * Transcribe audio using Ollama (if available) or return placeholder
 * For production, replace with proper speech-to-text service (Google Cloud Speech, Whisper, etc.)
 */
async function transcribeAudio(audioPath) {
  try {
    // Check if audio file exists
    if (!fs.existsSync(audioPath)) {
      console.warn("Audio file not found for transcription");
      return "";
    }

    // Try using Ollama for transcription if available
    // Note: This is a basic approach - for production, use dedicated STT services
    try {
      // Read audio file as base64 (Ollama can handle audio in some models)
      // For now, we'll use a text-based approach since most Ollama models are text-only
      // In production, integrate: Google Cloud Speech-to-Text, AWS Transcribe, OpenAI Whisper API
      
      console.log("Transcription: Audio extracted successfully. Using placeholder transcript.");
      console.log("NOTE: For accurate transcription, integrate a speech-to-text service.");
      
      // Return placeholder - in production, this should be actual transcription
      return "Candidate provided answers to the interview questions. [Transcription service not configured - using placeholder]";
    } catch (ollamaErr) {
      console.error("Ollama transcription error:", ollamaErr.message);
      return "";
    }
  } catch (error) {
    console.error("Transcription error:", error.message);
    return "";
  }
}

/**
 * Analyze correctness for all questions
 */
async function analyzeCorrectness(questions, transcript) {
  const scores = [];
  const OLLAMA_API_BASE = `${OLLAMA_API_URL}/api/generate`;

  // Split transcript into segments (rough estimate - 3 questions = 3 segments)
  // This is a simple approach - in production, you'd use timestamps or silence detection
  const transcriptLength = transcript.length;
  const segmentLength = Math.floor(transcriptLength / questions.length);
  const transcriptSegments = [];
  
  for (let i = 0; i < questions.length; i++) {
    const start = i * segmentLength;
    const end = i === questions.length - 1 ? transcriptLength : (i + 1) * segmentLength;
    transcriptSegments.push(transcript.substring(start, end).trim());
  }

  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];
    // Use the corresponding segment, or full transcript if segmentation fails
    const answerSegment = transcriptSegments[i] || transcript;
    
    try {
      const prompt = `You are a strict technical interviewer evaluating a candidate's answer to a technical question.

TECHNICAL QUESTION: "${question}"

CANDIDATE'S ANSWER: "${answerSegment}"

EVALUATION CRITERIA (be strict and accurate):
1. Does the answer directly address the question? (0-25 points)
   - If answer is completely off-topic or says "I don't know" → 0-10 points
   - If answer is partially relevant → 10-20 points
   - If answer directly addresses the question → 20-25 points

2. Technical accuracy and depth (0-50 points)
   - Completely wrong or no technical content → 0-15 points
   - Partially correct but shallow → 15-30 points
   - Mostly correct with some depth → 30-40 points
   - Accurate and demonstrates good understanding → 40-50 points

3. Clarity and completeness (0-25 points)
   - Unclear or incomplete → 0-10 points
   - Somewhat clear but missing details → 10-20 points
   - Clear and reasonably complete → 20-25 points

IMPORTANT:
- If the candidate says "I don't know", "No", or gives a very short non-answer → score should be LOW (0-30)
- If the answer is wrong or shows misunderstanding → score should be LOW (10-40)
- Only give high scores (70-100) for accurate, detailed, technically correct answers
- Be strict - this is a technical assessment

Return ONLY a JSON object with this exact format:
{
  "score": <number between 0 and 100>,
  "reasoning": "<brief explanation of why this score was given>"
}

Do not include any other text or formatting.`;

      const response = await axios.post(
        OLLAMA_API_BASE,
        {
          model: OLLAMA_MODEL,
          prompt: prompt,
          stream: false,
          format: "json"
        },
        { timeout: 30000 }
      );

      let score = 0; // Default to 0 for strict evaluation
      let reasoning = "Unable to parse response";

      if (response.data.response) {
        try {
          const parsed = JSON.parse(response.data.response);
          if (typeof parsed.score === "number") {
            score = Math.max(0, Math.min(100, parsed.score));
            reasoning = parsed.reasoning || "No reasoning provided";
          } else {
            // If no score in parsed JSON, check for score in text
            const text = JSON.stringify(parsed);
            const scoreMatch = text.match(/"score"\s*:\s*(\d+(?:\.\d+)?)/);
            if (scoreMatch) {
              score = Math.max(0, Math.min(100, parseFloat(scoreMatch[1])));
              reasoning = parsed.reasoning || "Score extracted from response";
            }
          }
        } catch (parseErr) {
          // Try to extract score from raw text response
          const text = response.data.response;
          // Look for JSON-like patterns
          const jsonMatch = text.match(/\{[\s\S]*"score"\s*:\s*(\d+(?:\.\d+)?)[\s\S]*\}/);
          if (jsonMatch) {
            score = Math.max(0, Math.min(100, parseFloat(jsonMatch[1])));
            reasoning = "Score extracted from response text";
          } else {
            // Look for any number that might be a score
            const scoreMatch = text.match(/(\d+(?:\.\d+)?)/);
            if (scoreMatch) {
              const extracted = parseFloat(scoreMatch[1]);
              // Only use if it's a reasonable score (0-100)
              if (extracted >= 0 && extracted <= 100) {
                score = extracted;
                reasoning = "Score extracted from response";
              }
            }
          }
        }
      }

      // If we still have 0 score and the answer segment is very short or empty, keep it low
      if (score === 0 && answerSegment.trim().length < 10) {
        reasoning = "Answer too short or empty - cannot evaluate";
      }

      scores.push({ question, score, reasoning });
    } catch (error) {
      console.error(`Error analyzing question "${question}":`, error.message);
      // Fallback score
      scores.push({
        question,
        score: 50,
        reasoning: "Analysis unavailable - using fallback score"
      });
    }
  }

  return scores;
}

export const analyzeInterview = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Interview video is required."
      });
    }

    // Parse questions from form data (sent as JSON string)
    let questions = [];
    try {
      if (req.body.questions) {
        questions = typeof req.body.questions === 'string' 
          ? JSON.parse(req.body.questions) 
          : req.body.questions;
      }
    } catch (parseErr) {
      console.error("Failed to parse questions:", parseErr.message);
    }

    const userId = req.user?._id;

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Questions array is required."
      });
    }

    const videoPath = req.file.path;
    const fileName = path.basename(videoPath);
    const publicPath = `/uploads/interviews/${fileName}`;

    // Copy video into facial-emotion-marks/uploads/interviews for Python model access
    try {
      const femUploadDir = path.join(
        process.cwd(),
        "..",
        "facial-emotion-marks",
        "uploads",
        "interviews"
      );
      fs.mkdirSync(femUploadDir, { recursive: true });
      const femPath = path.join(femUploadDir, fileName);
      fs.copyFileSync(videoPath, femPath);
    } catch (copyErr) {
      console.warn("Warning: unable to copy video to facial-emotion-marks:", copyErr.message);
    }

    // 1. Facial Analysis
    let facialAnalysis = null;
    try {
      const formData = new FormData();
      formData.append("video", fs.createReadStream(videoPath), {
        filename: req.file.originalname || req.file.filename,
        contentType: req.file.mimetype || "video/webm"
      });

      const response = await axios.post(
        `${FACIAL_SERVICE_URL}/analyze-interview`,
        formData,
        {
          headers: formData.getHeaders(),
          timeout: 120000,
          maxContentLength: Infinity,
          maxBodyLength: Infinity
        }
      );

      facialAnalysis = response.data?.data || response.data?.analysis || response.data;
    } catch (analysisErr) {
      console.error(
        "Facial analysis service error:",
        analysisErr?.response?.data || analysisErr.message || analysisErr
      );
    }

    // 2. Audio Extraction and Transcription
    const audioPath = videoPath.replace(/\.[^.]+$/, ".wav");
    let transcript = "";
    let correctnessScores = [];

    try {
      // Extract audio
      const audioExtracted = await extractAudio(videoPath, audioPath);
      
      if (audioExtracted && fs.existsSync(audioPath)) {
        // Transcribe audio
        transcript = await transcribeAudio(audioPath);
        
        // Log transcript for debugging
        console.log("\n=== TRANSCRIPT DEBUG ===");
        console.log("Transcript length:", transcript.length);
        console.log("Transcript content:", transcript);
        console.log("Questions:", questions);
        console.log("=======================\n");
        
        // Analyze correctness for each question
        correctnessScores = await analyzeCorrectness(questions, transcript);
        
        // Log correctness scores
        console.log("\n=== CORRECTNESS SCORES ===");
        correctnessScores.forEach((item, idx) => {
          console.log(`Question ${idx + 1}: ${item.question}`);
          console.log(`Score: ${item.score}`);
          console.log(`Reasoning: ${item.reasoning}`);
        });
        console.log("==========================\n");
        
        // Clean up audio file
        try {
          fs.unlinkSync(audioPath);
        } catch (unlinkErr) {
          console.warn("Failed to delete audio file:", unlinkErr.message);
        }
      } else {
        console.warn("Audio extraction failed, using fallback scoring");
        console.log("Audio path:", audioPath);
        console.log("Audio exists:", fs.existsSync(audioPath));
        // Fallback: analyze with empty transcript
        correctnessScores = await analyzeCorrectness(questions, "");
      }
    } catch (audioErr) {
      console.error("Audio processing error:", audioErr.message);
      console.error("Error stack:", audioErr.stack);
      // Fallback scoring
      correctnessScores = await analyzeCorrectness(questions, "");
    }

    // 3. Calculate average correctness score
    const averageCorrectness = correctnessScores.length > 0
      ? correctnessScores.reduce((sum, item) => sum + item.score, 0) / correctnessScores.length
      : 50;

    // 4. Combine scores (50% facial, 50% correctness)
    const facialScore = facialAnalysis?.confidence_score || 50;
    const finalScore = (facialScore * 0.5) + (averageCorrectness * 0.5);

    // 5. Prepare response data
    const result = {
      facialAnalysis: facialAnalysis || {
        confidence_score: 50,
        confidence_level: "Unknown",
        recommendation: "Facial analysis unavailable"
      },
      correctnessAnalysis: {
        averageScore: averageCorrectness,
        scores: correctnessScores,
        transcript: transcript || "Transcription unavailable"
      },
      finalScore: Math.round(finalScore * 10) / 10, // Round to 1 decimal
      testDate: new Date(),
      questions: questions
    };

    // 6. Save to database if user is authenticated
    let updatedUser = null;
    if (userId) {
      try {
        updatedUser = await User.findByIdAndUpdate(
          userId,
          {
            $set: {
              "profile.testResults": {
                finalScore: result.finalScore,
                facialConfidenceScore: facialScore,
                correctnessScore: averageCorrectness,
                testDate: result.testDate,
                questions: questions,
                videoPath: publicPath
              }
            }
          },
          { new: true }
        ).select("-password").lean();
      } catch (dbErr) {
        console.error("Failed to save test results to database:", dbErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Interview analysis completed",
      videoPath: publicPath,
      data: result,
      user: updatedUser // Return updated user for Redux update
    });
  } catch (error) {
    console.error(
      "Interview analysis error:",
      error?.response?.data || error.message || error
    );
    return res.status(500).json({
      success: false,
      message:
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Failed to analyze interview video."
    });
  }
};

