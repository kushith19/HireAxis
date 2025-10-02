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

const router = express.Router();

router.route("/register").post(singleUpload,register);
router.route("/login").post(login);
router.route("/profile/update").post(isAuthenticated, singleUpload,updateProfile);
// Download resume
router.get("/user/:userId/download-resume", isAuthenticated, downloadResume);
router.route("/logout").get(logout);

export default router;
