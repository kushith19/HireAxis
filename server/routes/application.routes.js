import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import {
  applyJob,
  getAppliedJobs,
  getApplicants,
  updateStatus,
} from "../controllers/application.controller.js";

const router = express.Router();

// Apply for a job
router.route("/:id/apply").get(isAuthenticated, applyJob);

// Get all jobs a user has applied to
router.route("/getappliedjobs").get(isAuthenticated, getAppliedJobs);

// Get all applicants for a specific job (for company/admin)
router.route("/:id/applicants").get(isAuthenticated, getApplicants);

// Update application status (accept/reject)
router.route("/:id/status").put(isAuthenticated, updateStatus);

export default router;
