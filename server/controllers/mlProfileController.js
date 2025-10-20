import axios from 'axios';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data'; // Need to install: npm install form-data
import { User } from '../models/userModel.js'; // Adjust path to your User model
import { Job } from '../models/jobModel.js'; // Adjust path to your Job model

// NOTE: This URL must match your Docker deployment port!
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001/extract'; 


// Helper function to clean and normalize skills for comparison
const normalizeSkills = (skillsArray) => {
    if (!skillsArray || !Array.isArray(skillsArray)) return [];
    return skillsArray.map(skill => skill.toLowerCase().trim());
};

// --- Controller 1: Update Profile & Extract Skills ---
export const updateProfileWithMLSkills = async (req, res, next) => {
    const resumeFile = req.file; 
    const userId = req.user._id; 
    const { fullname, email, phoneNumber, bio } = req.body;

    if (!resumeFile) {
        return res.status(400).json({ success: false, message: "Resume file required for skill extraction." });
    }

    let extractedSkills = [];
    let skillsExtracted = false;

    try {
        // 1. Prepare Form Data for ML Service
        const mlFormData = new FormData();
        // Use fs.createReadStream to efficiently send the file from disk
        mlFormData.append('file', fs.createReadStream(resumeFile.path), {
            filename: resumeFile.originalname,
            contentType: resumeFile.mimetype,
        });

        // 2. Call the Python ML Service (Docker Container on 5001)
        const mlResponse = await axios.post(ML_SERVICE_URL, mlFormData, {
            headers: mlFormData.getHeaders(),
        });

        if (mlResponse.data && mlResponse.data.skills) {
            extractedSkills = mlResponse.data.skills;
            skillsExtracted = true;
        }

        // 3. Handle Permanent Resume Storage (TODO: Replace placeholder logic)
        // **IMPORTANT**: You need to upload resumeFile.path to your permanent cloud storage (S3/Cloudinary) here
        const cloudResumeUrl = `/uploads/${resumeFile.filename}`; // PLACEHOLDER: Use the actual URL from your cloud upload
        
        // 4. Update User Profile in Mongoose
        const updateFields = {
            fullname,
            email,
            phoneNumber,
            'profile.bio': bio,
            'profile.resume': cloudResumeUrl, // URL to the saved resume
            'profile.resumeOriginalName': resumeFile.originalname,
            'profile.skills': extractedSkills.map(skill => skill.trim()), // Set the new extracted skills
        };

        const updatedUser = await User.findByIdAndUpdate(userId, updateFields, { new: true, runValidators: true })
                                      .select('-password') 
                                      .lean(); 

        // 5. Cleanup temporary file
        fs.unlinkSync(resumeFile.path); 

        return res.status(200).json({ 
            success: true, 
            message: "Profile and skills updated successfully.", 
            user: updatedUser,
            skillsExtracted 
        });

    } catch (error) {
        console.error("ML Integration Error:", error);
        
        // Ensure temporary file is cleaned up if an error occurs
        if (resumeFile && fs.existsSync(resumeFile.path)) {
            fs.unlinkSync(resumeFile.path);
        }
        // If ML service fails, return a 500 error but keep the app running
        return res.status(500).json({ success: false, message: "Failed to process resume or update profile." });
    }
};


// --- Controller 2: Suggest Jobs Based on Skills ---
export const suggestJobs = async (req, res, next) => {
    try {
        const userId = req.user._id; 
        
        // 1. Fetch Student Skills
        const user = await User.findById(userId); 
        const studentSkills = normalizeSkills(user.profile.skills);

        if (studentSkills.length === 0) {
            return res.status(200).json({ 
                success: true, 
                message: "No skills found in profile. Please upload a resume or add skills manually.",
                suggestedJobs: [] 
            });
        }

        // 2. Fetch All Active Job Postings
        // NOTE: Job requirements are stored in the 'requirements' field (an array of strings)
        const allJobs = await Job.find({ /* filter for active jobs here */ }).populate("company").lean();

        // 3. Skill Matching and Scoring
        const scoredJobs = allJobs.map(job => {
            const jobRequirements = normalizeSkills(job.requirements);
            let matchCount = 0;
            
            // Calculate skill overlap
            const matchedSkills = jobRequirements.filter(reqSkill => studentSkills.includes(reqSkill));
            matchCount = matchedSkills.length;

            // Relevance Score: Percentage of job requirements matched by student skills
            // This is a powerful metric for the frontend UI
            const relevanceScore = jobRequirements.length > 0 
                ? (matchCount / jobRequirements.length) * 100 
                : 0; 
            
            return {
                ...job,
                matchCount, 
                relevanceScore: Math.round(relevanceScore), 
                matchedSkills: matchedSkills,
            };
        });

        // 4. Filtering and Sorting
        const minMatchCount = 1; // Require at least one skill match
        const suggestedJobs = scoredJobs
            .filter(job => job.matchCount >= minMatchCount)
            .sort((a, b) => {
                // Primary Sort: By Relevance Score (Descending)
                return b.relevanceScore - a.relevanceScore; 
            });

        return res.status(200).json({ 
            success: true, 
            suggestedJobs 
        });

    } catch (error) {
        console.error("Suggest Jobs Error:", error);
        return res.status(500).json({ success: false, message: "Failed to generate job suggestions." });
    }
};