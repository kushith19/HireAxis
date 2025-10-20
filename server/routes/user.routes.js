import express from "express";
import {
  login,
  logout,
  register,
  updateProfile,
  downloadResume,
} from "../controllers/user.controller.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import { singleUpload } from "../middlewares/multer.js";
import { uploadTemp } from './middlewares/multerML.config.js'; 
import { isAuthenticated } from './middlewares/isAuthenticated.js'; 
import { updateProfileWithMLSkills, suggestJobs } from './controllers/mlProfileController.js';

const router = express.Router();

router.route("/register").post(singleUpload,register);
router.route("/login").post(login);
router.route("/profile/update").post(isAuthenticated, singleUpload,updateProfile);
// Download resume
router.get("/user/:userId/download-resume", isAuthenticated, downloadResume);
router.route("/logout").get(logout);



router.post(
    '/profile/update-ml', 
    isAuthenticated, // Assuming user must be logged in
    uploadTemp.single('resumeFile'), // IMPORTANT: Must match the name in the frontend FormData
    updateProfileWithMLSkills
);

// 2. Route for suggesting jobs based on extracted skills
router.get(
    '/suggest/jobs', 
    isAuthenticated, 
    suggestJobs
);






export default router;
