import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import { generateQuestions, analyzeAnswerCorrectness } from "../controllers/ollama.controller.js";

const router = express.Router();

router.post("/generate-questions", isAuthenticated, generateQuestions);
router.post("/analyze-correctness", isAuthenticated, analyzeAnswerCorrectness);

export default router;

