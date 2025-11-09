import express from "express";
import {
    login,
    logout,
    register,
    updateProfile,
    downloadResume,
} from "../controllers/user.controller.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";
// FIX: Import both new Multer middlewares
import { singleUploadMemory, singleUploadDisk } from "../middlewares/multer.js"; 
import { updateProfileWithMLSkills, suggestJobs } from '../controllers/mlProfileController.js';

const router = express.Router();

// Existing routes use MEMORY storage (safe for standard updates)
router.route("/register").post(singleUploadMemory, register); 
router.route("/login").post(login);
router.route("/profile/update").post(isAuthenticated, singleUploadMemory, updateProfile); 

// Download resume
router.get("/user/:userId/download-resume", isAuthenticated, downloadResume);
router.route("/logout").get(logout);


// --- ML-Enabled Route: Uses DISK Storage ---
router.post(
    '/profile/update-ml', 
    isAuthenticated,
    singleUploadDisk, // <-- CRITICAL: Disk storage provides req.file.path
    updateProfileWithMLSkills
);

// 2. Route for suggesting jobs based on extracted skills
router.get(
    '/suggest/jobs', 
    isAuthenticated, 
    suggestJobs
);


export default router;