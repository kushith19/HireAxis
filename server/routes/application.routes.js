import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js";
import {
  applyJob,
  getAppliedJobs,
  getApplicants,
  updateStatus,
} from "../controllers/application.controller.js";

const router = express.Router();


router.route("/:id/apply").get(isAuthenticated, applyJob);


router.route("/getappliedjobs").get(isAuthenticated, getAppliedJobs);

router.route("/:id/applicants").get(isAuthenticated, getApplicants);

router.route("/:id/status").put(isAuthenticated, updateStatus);

export default router;
