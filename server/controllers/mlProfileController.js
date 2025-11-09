
import axios from "axios";
import fs from "fs";
import path from "path";
import FormData from "form-data";
import { User } from "../models/user.model.js";
import { Job } from "../models/job.model.js";
import cloudinary from "../utils/cloudinary.js"; 

const ML_SERVICE_URL =
  process.env.ML_SERVICE_URL || "http://127.0.0.1:5001/extract";

const MIN_RELEVANCE_SCORE = 60;
const MIN_JOB_REQUIREMENTS_COUNT = 1;

const normalizeSkills = (skillsArray) =>
  !skillsArray || !Array.isArray(skillsArray)
    ? []
    : skillsArray
        .map((s) => String(s).toLowerCase().replace(/\s/g, "").trim())
        .filter(Boolean);


export const updateProfileWithMLSkills = async (req, res) => {
  if (!req.user || !req.user._id) {
    return res
      .status(401)
      .json({
        success: false,
        message: "Unauthorized: User not authenticated.",
      });
  }

  const resumeFile = req.file;
  const userId = req.user._id;
  const { fullname, email, phoneNumber, bio } = req.body;

  if (!resumeFile) {
    return res
      .status(400)
      .json({
        success: false,
        message: "Resume file required for skill extraction.",
      });
  }

  const temporaryFilePath = resumeFile.path; 
  let extractedSkills = [];
  let skillsExtracted = false;

  try {
   
    const mlFormData = new FormData();
    mlFormData.append("file", fs.createReadStream(temporaryFilePath), {
      filename: resumeFile.originalname,
      contentType: resumeFile.mimetype,
    });

    const mlResponse = await axios.post(ML_SERVICE_URL, mlFormData, {
      headers: mlFormData.getHeaders(),
      timeout: 30000, 
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    if (mlResponse.data?.skills) {
      extractedSkills = mlResponse.data.skills;
      skillsExtracted = true;
    }

   
    const publicId = `resume-${userId}-${Date.now()}`;
    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          resource_type: "raw", 
          folder: "resumes",
          public_id: publicId,
        },
        (err, result) => (err ? reject(err) : resolve(result))
      );
      fs.createReadStream(temporaryFilePath).pipe(stream);
    });

   
    const cloudResumeUrl = uploadResult.secure_url;

 
    const updateFields = {
      fullname,
      email,
      phoneNumber,
      "profile.bio": bio,
      "profile.resume": cloudResumeUrl, 
      "profile.resumeDiskPath": null, 
      "profile.resumeOriginalName": resumeFile.originalname,
      "profile.skills": (extractedSkills || [])
        .map((s) => String(s).trim())
        .filter(Boolean),
    };

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true, runValidators: true }
    )
      .select("-password")
      .lean();

    if (!updatedUser)
      throw new Error(`User ID ${userId} not found during update.`);

    return res.status(200).json({
      success: true,
      message: "Profile and skills updated successfully.",
      user: updatedUser,
      skillsExtracted,
    });
  } catch (error) {
    console.error(
      "\n--- SERVER CRITICAL ERROR (UPDATE) ---",
      error?.response?.data || error.message || error
    );
    return res
      .status(500)
      .json({
        success: false,
        message: "Failed to process resume or update profile.",
      });
  } finally {
 
    try {
      if (temporaryFilePath && fs.existsSync(temporaryFilePath)) {
        fs.unlinkSync(temporaryFilePath);
      }
    } catch (cleanupError) {
      console.error("[ERROR] Failed to clean up temp file:", cleanupError);
    }
  }
};



export const suggestJobs = async (req, res) => {
  if (!req.user || !req.user._id) {
    return res.status(401).json({ success: false, message: "Unauthorized." });
  }
  const userId = req.user._id;

  try {
    const user = await User.findById(userId);
    if (!user || !user.profile || !user.profile.skills) {
      return res.status(200).json({ success: true, suggestedJobs: [] });
    }

    const studentSkills = normalizeSkills(user.profile.skills);
    if (studentSkills.length === 0) {
      return res.status(200).json({
        success: true,
        message:
          "No skills found in profile. Please upload a resume or add skills manually.",
        suggestedJobs: [],
      });
    }

    const allJobs = await Job.find({
      /* add filters for active/open jobs */
    })
      .populate("company")
      .lean();

    const scoredJobs = allJobs.map((job) => {
      const jobRequirements = normalizeSkills(job.requirements);
      const reqCount = jobRequirements.length;

      if (reqCount < MIN_JOB_REQUIREMENTS_COUNT) {
        return { ...job, matchCount: 0, relevanceScore: 0, matchedSkills: [] };
      }

      const matchedSkills = jobRequirements.filter((reqSkill) =>
        studentSkills.includes(reqSkill)
      );
      const matchCount = matchedSkills.length;
      const relevanceScore = (matchCount / reqCount) * 100;

      return {
        ...job,
        matchCount,
        relevanceScore: Math.round(relevanceScore),
        matchedSkills,
      };
    });

    const suggestedJobs = scoredJobs
      .filter((j) => j.relevanceScore >= MIN_RELEVANCE_SCORE)
      .sort((a, b) => b.relevanceScore - a.relevanceScore);

    return res.status(200).json({ success: true, suggestedJobs });
  } catch (error) {
    console.error("Suggest Jobs Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to generate job suggestions." });
  }
};
