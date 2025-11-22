import axios from "axios";
import { User } from "../models/User.model.js";

const OLLAMA_API_URL = process.env.OLLAMA_API_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3";

/**
 * Generate interview questions based on user skills from their profile
 */
export const generateQuestions = async (req, res) => {
  try {
    const userId = req.user?._id;
    
    // Fetch user's skills from database
    let skills = [];
    if (userId) {
      try {
        const user = await User.findById(userId).select("profile.skills");
        if (user?.profile?.skills && Array.isArray(user.profile.skills)) {
          skills = user.profile.skills.filter(Boolean); // Remove empty/null values
        }
      } catch (dbErr) {
        console.error("Error fetching user skills:", dbErr.message);
      }
    }

    // Fallback to skills from request body if database fetch fails
    if (skills.length === 0 && req.body.skills) {
      skills = Array.isArray(req.body.skills) 
        ? req.body.skills.filter(Boolean)
        : [];
    }

    if (skills.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No skills found in user profile. Please add skills to your profile first."
      });
    }

    // Randomly select 3 skills from the user's skills
    const shuffledSkills = [...skills].sort(() => Math.random() - 0.5);
    const selectedSkills = shuffledSkills.slice(0, Math.min(3, skills.length));
    
    // If we have less than 3 skills, reuse them
    while (selectedSkills.length < 3 && skills.length > 0) {
      const randomSkill = skills[Math.floor(Math.random() * skills.length)];
      if (!selectedSkills.includes(randomSkill)) {
        selectedSkills.push(randomSkill);
      } else if (selectedSkills.length < 3) {
        // If all skills are already selected, just add a random one
        selectedSkills.push(skills[Math.floor(Math.random() * skills.length)]);
      }
    }
    
    const skill1 = selectedSkills[0] || skills[0] || "first skill";
    const skill2 = selectedSkills[1] || selectedSkills[0] || skills[0] || "second skill";
    const skill3 = selectedSkills[2] || selectedSkills[1] || selectedSkills[0] || skills[0] || "third skill";
    
    const skillsList = skills.slice(0, 10).join(", ");

    const prompt = `You are a senior technical interviewer. Generate exactly 3 technical interview questions to test deep knowledge of these skills: ${skillsList}

CRITICAL REQUIREMENTS:
1. Questions must be TECHNICAL and test KNOWLEDGE, not experience stories
2. Question 1: Technical question about ${skill1} - test concepts, implementation, or problem-solving
3. Question 2: Technical question about ${skill2} - test understanding of core principles
4. Question 3: Technical question about ${skill3} - test advanced knowledge or best practices
5. DO NOT ask: "Where did you learn X?", "Where did you use X?", "How familiar are you with X?", "Tell me about your experience with X"
6. DO ask: "How does X work?", "What is the difference between X and Y?", "Explain the algorithm/architecture of X", "What are the key concepts in X?", "How would you implement X?"
7. Questions should require technical explanation, not personal stories
8. Format as a JSON array of exactly 3 strings
9. Return ONLY the JSON array, no additional text

Example good questions:
- "Explain how gradient descent works in machine learning and what are its limitations?"
- "What is the difference between REST and GraphQL APIs? When would you use each?"
- "How does React's virtual DOM improve performance compared to direct DOM manipulation?"

Example format: ["Technical question 1", "Technical question 2", "Technical question 3"]`;

    try {
      const response = await axios.post(
        `${OLLAMA_API_URL}/api/generate`,
        {
          model: OLLAMA_MODEL,
          prompt: prompt,
          stream: false,
          format: "json"
        },
        {
          timeout: 30000
        }
      );

      let questions = [];
      
      // Handle streaming response (if stream: true) or direct response
      if (response.data.response) {
        try {
          const parsed = JSON.parse(response.data.response);
          if (Array.isArray(parsed)) {
            questions = parsed.slice(0, 3);
          } else if (typeof parsed === "object" && parsed.questions) {
            questions = Array.isArray(parsed.questions) ? parsed.questions.slice(0, 3) : [];
          }
        } catch (parseErr) {
          // If JSON parsing fails, try to extract questions from text
          const text = response.data.response;
          const lines = text.split("\n").filter(line => line.trim().length > 0);
          questions = lines.slice(0, 3).map(line => line.replace(/^\d+[\.\)]\s*/, "").trim());
        }
      }

      // Fallback to technical questions if Ollama fails
      // Use randomly selected skills
      const shuffledSkills = [...skills].sort(() => Math.random() - 0.5);
      const selectedSkills = shuffledSkills.slice(0, Math.min(3, skills.length));
      while (selectedSkills.length < 3 && skills.length > 0) {
        const randomSkill = skills[Math.floor(Math.random() * skills.length)];
        if (!selectedSkills.includes(randomSkill)) {
          selectedSkills.push(randomSkill);
        } else {
          selectedSkills.push(skills[Math.floor(Math.random() * skills.length)]);
        }
      }
      
      if (questions.length === 0) {
        questions = [
          `Explain the core concepts and working principles of ${selectedSkills[0] || skills[0]}.`,
          selectedSkills[1] || skills[1]
            ? `What are the key differences between ${selectedSkills[0] || skills[0]} and ${selectedSkills[1] || skills[1]}? When would you use each?`
            : `What are the main advantages and limitations of ${selectedSkills[0] || skills[0]}?`,
          selectedSkills[2] || skills[2]
            ? `How does ${selectedSkills[2] || skills[2]} work under the hood? Explain the fundamental mechanism.`
            : selectedSkills[1] || skills[1]
            ? `What are the best practices and common pitfalls when working with ${selectedSkills[1] || skills[1]}?`
            : `Explain the architecture or algorithm behind ${selectedSkills[0] || skills[0]}.`
        ].slice(0, 3);
      }

      return res.status(200).json({
        success: true,
        questions: questions.slice(0, 3) // Ensure max 3 questions
      });
    } catch (ollamaErr) {
      console.error("Ollama API error:", ollamaErr.message);
      
      // Fallback to technical questions (always use actual skills, never generic)
      // Randomly select skills
      const shuffledSkills = [...skills].sort(() => Math.random() - 0.5);
      const selectedSkills = shuffledSkills.slice(0, Math.min(3, skills.length));
      while (selectedSkills.length < 3 && skills.length > 0) {
        const randomSkill = skills[Math.floor(Math.random() * skills.length)];
        if (!selectedSkills.includes(randomSkill)) {
          selectedSkills.push(randomSkill);
        } else {
          selectedSkills.push(skills[Math.floor(Math.random() * skills.length)]);
        }
      }
      
      const fallbackQuestions = [];
      
      if (selectedSkills[0] || skills[0]) {
        fallbackQuestions.push(
          `Explain the core concepts and working principles of ${selectedSkills[0] || skills[0]}.`
        );
      }
      if (selectedSkills[1] || skills[1]) {
        fallbackQuestions.push(
          `What are the key differences between ${selectedSkills[0] || skills[0]} and ${selectedSkills[1] || skills[1]}? When would you use each?`
        );
      }
      if (selectedSkills[2] || skills[2]) {
        fallbackQuestions.push(
          `How does ${selectedSkills[2] || skills[2]} work under the hood? Explain the fundamental mechanism.`
        );
      }
      
      // If we don't have 3 skills, reuse skills to create 3 technical questions
      while (fallbackQuestions.length < 3 && skills.length > 0) {
        const skillIndex = Math.floor(Math.random() * skills.length);
        const skill = skills[skillIndex];
        if (fallbackQuestions.length === 0) {
          fallbackQuestions.push(
            `Explain the core concepts and working principles of ${skill}.`
          );
        } else if (fallbackQuestions.length === 1) {
          fallbackQuestions.push(
            `What are the main advantages, limitations, and best practices of ${skill}?`
          );
        } else {
          fallbackQuestions.push(
            `Explain the architecture or algorithm behind ${skill}.`
          );
        }
      }

      const questions = fallbackQuestions.slice(0, 3);

      return res.status(200).json({
        success: true,
        questions: questions,
        warning: "Using fallback question generation. Ollama service unavailable."
      });
    }
  } catch (error) {
    console.error("Generate questions error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate questions."
    });
  }
};

/**
 * Analyze answer correctness using Ollama
 */
export const analyzeAnswerCorrectness = async (req, res) => {
  try {
    const { question, transcript } = req.body;

    if (!question || !transcript) {
      return res.status(400).json({
        success: false,
        message: "Question and transcript are required."
      });
    }

    const prompt = `You are an expert interviewer evaluating a candidate's answer.

Question: "${question}"

Candidate's Answer: "${transcript}"

Evaluate the answer based on:
1. Relevance to the question (0-30 points)
2. Technical accuracy and depth (0-40 points)
3. Clarity and communication (0-30 points)

Return ONLY a JSON object with this exact format:
{
  "score": <number between 0 and 100>,
  "reasoning": "<brief explanation>"
}

Do not include any other text or formatting.`;

    try {
      const response = await axios.post(
        `${OLLAMA_API_URL}/api/generate`,
        {
          model: OLLAMA_MODEL,
          prompt: prompt,
          stream: false,
          format: "json"
        },
        {
          timeout: 30000
        }
      );

      let result = { score: 50, reasoning: "Unable to parse response" };

      if (response.data.response) {
        try {
          const parsed = JSON.parse(response.data.response);
          if (typeof parsed.score === "number") {
            result = {
              score: Math.max(0, Math.min(100, parsed.score)), // Clamp between 0-100
              reasoning: parsed.reasoning || "No reasoning provided"
            };
          }
        } catch (parseErr) {
          // Try to extract score from text response
          const text = response.data.response;
          const scoreMatch = text.match(/(\d+(?:\.\d+)?)/);
          if (scoreMatch) {
            const extractedScore = parseFloat(scoreMatch[1]);
            result = {
              score: Math.max(0, Math.min(100, extractedScore)),
              reasoning: "Score extracted from response"
            };
          }
        }
      }

      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (ollamaErr) {
      console.error("Ollama API error:", ollamaErr.message);
      
      // Fallback score based on transcript length and keywords
      const fallbackScore = Math.min(100, Math.max(30, transcript.length / 10));
      
      return res.status(200).json({
        success: true,
        data: {
          score: fallbackScore,
          reasoning: "Fallback scoring: Ollama service unavailable"
        },
        warning: "Using fallback scoring. Ollama service unavailable."
      });
    }
  } catch (error) {
    console.error("Analyze correctness error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to analyze answer correctness."
    });
  }
};

