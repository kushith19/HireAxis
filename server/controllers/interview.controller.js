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
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.1:8b";

/**
 * Transcribe video directly using OpenAI Whisper via the Python service
 * Whisper can handle video files directly, so no need for FFmpeg
 */
async function transcribeVideo(videoPath) {
  try {
    // Check if video file exists
    if (!fs.existsSync(videoPath)) {
      console.warn("Video file not found for transcription");
      return "";
    }

    try {
      // Send video file directly to Whisper transcription service
      const formData = new FormData();
      formData.append("video", fs.createReadStream(videoPath), {
        filename: path.basename(videoPath),
        contentType: "video/webm"
      });

      const response = await axios.post(
        `${FACIAL_SERVICE_URL}/transcribe-video`,
        formData,
        {
          headers: formData.getHeaders(),
          timeout: 180000, // 3 minutes timeout for transcription
          maxContentLength: Infinity,
          maxBodyLength: Infinity
        }
      );

      if (response.data.success && response.data.transcript) {
        console.log("Transcription completed successfully");
        console.log("Transcript preview:", response.data.transcript.substring(0, 100));
        return response.data.transcript;
      } else {
        console.warn("Transcription service returned no transcript");
        console.warn("Response data:", JSON.stringify(response.data, null, 2));
        return "";
      }
    } catch (whisperErr) {
      console.error("Whisper transcription error:");
      console.error("Status:", whisperErr?.response?.status);
      console.error("Status text:", whisperErr?.response?.statusText);
      console.error("Response data:", whisperErr?.response?.data);
      console.error("Error message:", whisperErr.message);
      console.error("Full error:", whisperErr);
      // Fallback to empty transcript if Whisper fails
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
  // Try /api/chat first (newer Ollama), fallback to /api/generate
  const OLLAMA_API_BASE = `${OLLAMA_API_URL}/api/chat`;
  const OLLAMA_API_BASE_FALLBACK = `${OLLAMA_API_URL}/api/generate`;

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

      let response;
      try {
        // Try /api/chat endpoint first (newer Ollama versions)
        console.log(`Attempting Ollama /api/chat with model: ${OLLAMA_MODEL}`);
        response = await axios.post(
          OLLAMA_API_BASE,
          {
            model: OLLAMA_MODEL,
            messages: [
              {
                role: "user",
                content: prompt
              }
            ],
            stream: false,
            format: "json"
          },
          { timeout: 120000 }
        );
        // Extract response from chat format
        if (response.data.message && response.data.message.content) {
          response.data.response = response.data.message.content;
        } else if (response.data.response) {
          // Already in the right format
          console.log("Response already in correct format");
        } else {
          console.warn("Unexpected response format from /api/chat:", Object.keys(response.data));
        }
      } catch (chatErr) {
        console.error("Ollama /api/chat error:", chatErr.response?.status, chatErr.response?.statusText);
        console.error("Error details:", chatErr.message);
        // Fallback to /api/generate endpoint (older Ollama versions)
        if (chatErr.response?.status === 404 || chatErr.code === 'ECONNREFUSED') {
          console.log("Trying fallback /api/generate endpoint...");
          try {
            response = await axios.post(
              OLLAMA_API_BASE_FALLBACK,
              {
                model: OLLAMA_MODEL,
                prompt: prompt,
                stream: false,
                format: "json"
              },
              { timeout: 120000 }
            );
            console.log("Fallback /api/generate succeeded");
          } catch (generateErr) {
            console.error("Ollama /api/generate also failed:", generateErr.response?.status, generateErr.message);
            throw generateErr;
          }
        } else {
          throw chatErr;
        }
      }

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

    // 2. Video Transcription (Whisper handles video directly, no FFmpeg needed)
    let transcript = "";
    let correctnessScores = [];

    try {
      // Transcribe video directly using Whisper
      transcript = await transcribeVideo(videoPath);
      
      // Log transcript for debugging
      console.log("\n=== TRANSCRIPT DEBUG ===");
      console.log("Transcript length:", transcript.length);
      console.log("Transcript content:", transcript);
      console.log("Questions:", questions);
      console.log("=======================\n");
      
      // Analyze correctness for each question
      if (transcript && transcript.trim().length > 0) {
        correctnessScores = await analyzeCorrectness(questions, transcript);
        
        // Log correctness scores
        console.log("\n=== CORRECTNESS SCORES ===");
        correctnessScores.forEach((item, idx) => {
          console.log(`Question ${idx + 1}: ${item.question}`);
          console.log(`Score: ${item.score}`);
          console.log(`Reasoning: ${item.reasoning}`);
        });
        console.log("==========================\n");
      } else {
        console.warn("No transcript available, using fallback scoring");
        correctnessScores = await analyzeCorrectness(questions, "");
      }
    } catch (transcriptionErr) {
      console.error("Transcription processing error:", transcriptionErr.message);
      console.error("Error stack:", transcriptionErr.stack);
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

