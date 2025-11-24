import axios from "axios";
import { User } from "../models/User.model.js";

const OLLAMA_API_URL = process.env.OLLAMA_API_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.1:8b";

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
    
    // Generate fallback questions (used if Ollama fails or times out)
    const fallbackQuestions = [
      `Explain the core concepts and working principles of ${skill1}.`,
      skill2
        ? `What are the key differences between ${skill1} and ${skill2}? When would you use each?`
        : `What are the main advantages, limitations, and best practices of ${skill1}?`,
      skill3
        ? `How does ${skill3} work under the hood? Explain the fundamental mechanism.`
        : skill2
        ? `What are the best practices and common pitfalls when working with ${skill2}?`
        : `Explain the architecture or algorithm behind ${skill1}.`
    ].slice(0, 3);

    // Try Ollama for question generation
    const prompt = `Generate exactly 3 technical interview questions as a JSON array.

Skills: ${skill1}, ${skill2}, ${skill3}

Requirements:
- Questions must be TECHNICAL and test KNOWLEDGE
- Question 1: About ${skill1} - test concepts, implementation, or problem-solving
- Question 2: About ${skill2 || skill1} - test understanding of core principles
- Question 3: About ${skill3 || skill2 || skill1} - test advanced knowledge or best practices
- DO NOT ask: "Where did you learn X?", "Where did you use X?", "How familiar are you with X?"
- DO ask: "How does X work?", "What is the difference between X and Y?", "Explain the algorithm/architecture of X"

Return ONLY a JSON array in this format:
["Question 1", "Question 2", "Question 3"]

Example:
["Explain how React hooks work and when to use them?", "What is the difference between Python and JavaScript? When would you use each?", "How does machine learning gradient descent work?"]`;

    try {
      let response;
      try {
        // Try /api/chat endpoint first (newer Ollama versions)
        console.log(`Attempting Ollama /api/chat for question generation with model: ${OLLAMA_MODEL}`);
        response = await axios.post(
          `${OLLAMA_API_URL}/api/chat`,
          {
            model: OLLAMA_MODEL,
            messages: [
              {
                role: "user",
                content: prompt
              }
            ],
            stream: false,
            format: "json",
            options: {
              num_predict: 200,  // Limit response length for faster generation
              temperature: 0.7
            }
          },
          {
            timeout: 30000  // 30 second timeout
          }
        );
        // Extract response from chat format
        if (response.data.message && response.data.message.content) {
          response.data.response = response.data.message.content;
        }
      } catch (chatErr) {
        console.error("Ollama /api/chat error:", chatErr.response?.status, chatErr.message);
        // Fallback to /api/generate endpoint (older Ollama versions)
        if (chatErr.response?.status === 404 || chatErr.code === 'ECONNREFUSED') {
          console.log("Trying fallback /api/generate endpoint...");
          try {
            response = await axios.post(
              `${OLLAMA_API_URL}/api/generate`,
              {
                model: OLLAMA_MODEL,
                prompt: prompt,
                stream: false,
                format: "json",
                options: {
                  num_predict: 200,
                  temperature: 0.7
                }
              },
              {
                timeout: 30000
              }
            );
            console.log("Fallback /api/generate succeeded");
          } catch (generateErr) {
            console.error("Ollama /api/generate also failed:", generateErr.message);
            // Use fallback questions
            return res.status(200).json({
              success: true,
              questions: fallbackQuestions,
              warning: "Using fallback questions. Ollama service unavailable."
            });
          }
        } else {
          // Timeout or other error - use fallback
          console.log("Ollama unavailable or timeout - using fallback questions");
          return res.status(200).json({
            success: true,
            questions: fallbackQuestions,
            warning: "Using fallback questions due to Ollama timeout."
          });
        }
      }

      let questions = [];
      
      // Parse Ollama response
      if (response.data.response) {
        const rawResponse = response.data.response.trim();
        console.log("Raw Ollama response:", rawResponse.substring(0, 200));
        
        try {
          // Try to extract JSON array from the response
          let jsonStr = rawResponse;
          
          // Remove markdown code blocks if present
          jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          
          // Try to find JSON array in the response
          const jsonMatch = jsonStr.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            jsonStr = jsonMatch[0];
          }
          
          const parsed = JSON.parse(jsonStr);
          
          // Handle different response formats
          if (Array.isArray(parsed)) {
            // Format: ["question1", "question2", "question3"]
            questions = parsed.slice(0, 3).map(q => {
              if (typeof q === 'string') return q.trim();
              if (typeof q === 'object' && q !== null) {
                // Try to extract question text from object - check description field first
                return (q.description || q.question || q.text || q.content || q.title || JSON.stringify(q)).trim();
              }
              return String(q).trim();
            }).filter(q => q && q.length > 0 && q !== '[object Object]');
          } else if (typeof parsed === "object" && parsed !== null) {
            // Format: { "questions": [...] } or { "React": [{ "question": "..." }] }
            if (parsed.questions && Array.isArray(parsed.questions)) {
              questions = parsed.questions.slice(0, 3).map(q => {
                if (typeof q === 'string') return q.trim();
                if (typeof q === 'object' && q !== null) {
                  // Check description field first (common format from Ollama)
                  return (q.description || q.question || q.text || q.content || q.title || JSON.stringify(q)).trim();
                }
                return String(q).trim();
              }).filter(q => q && q.length > 0 && q !== '[object Object]');
            } else {
              // Format: { "React": [{ "question": "..." }] } - extract from all keys
              const allQuestions = [];
              for (const key in parsed) {
                if (Array.isArray(parsed[key])) {
                  const extracted = parsed[key].map(q => {
                    if (typeof q === 'string') return q.trim();
                    if (typeof q === 'object' && q !== null) {
                      // Extract question text from object - check description field first
                      const questionText = q.description || q.question || q.text || q.content || q.title;
                      if (questionText && typeof questionText === 'string') {
                        return questionText.trim();
                      }
                      // If no text field found, skip this object
                      return null;
                    }
                    return String(q).trim();
                  }).filter(q => q && q.length > 0 && q !== '[object Object]' && q !== 'null');
                  allQuestions.push(...extracted);
                }
              }
              questions = allQuestions.slice(0, 3);
            }
          }
        } catch (parseErr) {
          console.error("JSON parse error:", parseErr.message);
          // If JSON parsing fails, try to extract questions from text
          const text = rawResponse;
          const lines = text.split("\n").filter(line => {
            const trimmed = line.trim();
            return trimmed.length > 10 && !trimmed.startsWith("{") && !trimmed.startsWith("[");
          });
          questions = lines.slice(0, 3).map(line => {
            return line.replace(/^\d+[\.\)]\s*/, "").replace(/^[-*]\s*/, "").trim();
          }).filter(q => q.length > 0);
        }
      }
      
      console.log(`Extracted ${questions.length} questions from Ollama response`);
      
      // Ensure all questions are strings (not objects)
      questions = questions.map(q => {
        if (typeof q === 'string') return q;
        if (typeof q === 'object' && q !== null) {
          // Check description field first (common format from Ollama)
          return q.description || q.question || q.text || q.content || q.title || JSON.stringify(q);
        }
        return String(q);
      }).filter(q => q && typeof q === 'string' && q.length > 0 && q !== '[object Object]');
      
      // If Ollama returns valid questions, use them (fill with fallback if less than 3)
      if (questions.length > 0) {
        // Fill remaining slots with fallback questions
        while (questions.length < 3 && fallbackQuestions.length > questions.length) {
          questions.push(fallbackQuestions[questions.length]);
        }
        
        // Final validation - ensure all are strings
        const finalQuestions = questions.slice(0, 3).map(q => {
          if (typeof q === 'string') return q;
          return String(q);
        });
        
        return res.status(200).json({
          success: true,
          questions: finalQuestions
        });
      } else {
        // Ollama response was invalid - use fallback
        console.log("Ollama response invalid - using fallback questions");
        return res.status(200).json({
          success: true,
          questions: fallbackQuestions
        });
      }
    } catch (ollamaErr) {
      console.error("Ollama API error:", ollamaErr.message);
      // Use fallback questions on any error
      return res.status(200).json({
        success: true,
        questions: fallbackQuestions,
        warning: "Using fallback questions. Ollama service unavailable."
      });
    }
  } catch (error) {
    console.error("Generate questions error:", error);
    
    // Fallback if something goes wrong
    const skill1 = skills[0] || "programming";
    const skill2 = skills[1] || skills[0] || "programming";
    const skill3 = skills[2] || skills[1] || skills[0] || "programming";
    
    const fallbackQuestions = [
      `Explain the core concepts and working principles of ${skill1}.`,
      `What are the key differences between ${skill1} and ${skill2}? When would you use each?`,
      `How does ${skill3} work under the hood? Explain the fundamental mechanism.`
    ];
    
    return res.status(200).json({
      success: true,
      questions: fallbackQuestions
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
          timeout: 120000
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

