import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import { singleInterviewUpload } from "../middlewares/multer.js";
import { analyzeInterview } from "../controllers/interview.controller.js";

const router = express.Router();

router.post(
  "/analyze",
  isAuthenticated,
  singleInterviewUpload,
  analyzeInterview
);

export default router;

