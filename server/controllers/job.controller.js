import { Job } from "../models/job.model.js";
import { Company } from "../models/company.model.js";
export const postJob = async (req, res) => {
  try {
    const {
      title,
      description,
      requirements,
      salary,
      location,
      jobType,
      experience,
      position,
      companyId,
    } = req.body;

    const userId = req.id;

    // ✅ 1. Basic validation
    if (
      !title ||
      !description ||
      !requirements ||
      !salary ||
      !location ||
      !jobType ||
      !experience ||
      !position ||
      !companyId
    ) {
      return res.status(400).json({
        message: "All fields are required",
        success: false,
      });
    }

    // ✅ 2. Check if the company exists
    const companyExists = await Company.findById(companyId);
    if (!companyExists) {
      return res.status(404).json({
        message: "Invalid company ID — company not found",
        success: false,
      });
    }

    // ✅ 3. Ownership check — recruiter can only post under their own company
    if (companyExists.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        message: "You are not authorized to post jobs for this company",
        success: false,
      });
    }

    // ✅ 4. Create job with verified ownership
    const job = await Job.create({
      title,
      description,
      requirements: requirements.split(",").map((r) => r.trim()),
      salary: Number(salary),
      location,
      jobType,
      experienceLevel: experience,
      position,
      company: companyExists._id, // safe verified reference
      created_by: userId,
    });

    return res.status(201).json({
      message: "New job created successfully",
      job,
      success: true,
    });
  } catch (error) {
    console.error("Error posting job:", error);
    return res.status(500).json({
      message: "Server error while creating job",
      success: false,
    });
  }
};
export const getAllJobs = async (req, res) => {
  try {
    const keyword = req.query.keyword || "";
    const query = {
      $or: [
        { title: { $regex: keyword, $options: "i" } },
        { description: { $regex: keyword, $options: "i" } },
      ],
    };
    const jobs = await Job.find(query)
      .populate({
        path: "company",
      })
      .sort({ createdAt: -1 });

    if (!jobs) {
      return res.status(404).json({
        message: "jobs not found",
        success: true,
      });
    }
    return res.status(200).json({
      jobs,
      success: true,
    });
  } catch (error) {
    console.log(error);
  }
};

export const getJobById = async (req, res) => {
  try {
    const jobId = req.params.id;

    // Validate ID
    if (!jobId) {
      return res.status(400).json({
        message: "Job ID is required",
        success: false,
      });
    }

    // Fetch job with populated fields
    const job = await Job.findById(jobId)
      .populate("company") // populate company details
      .populate({
        path: "applications",
        populate: { path: "applicant", select: "_id fullname email" }, // populate applicant details
      });

    if (!job) {
      return res.status(404).json({
        message: "Job not found",
        success: false,
      });
    }

    return res.status(200).json({
      job,
      success: true,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Server error",
      success: false,
    });
  }
};

export const getAdminJobs = async (req, res) => {
  try {
    const adminId = req.id;

    const jobs = await Job.find({ created_by: adminId })
      .populate("company")
      .sort({ createdAt: -1 });

    if (!jobs || jobs.length === 0) {
      return res.status(404).json({
        message: "No jobs found for this admin",
        success: false,
      });
    }

    return res.status(200).json({
      jobs,
      success: true,
    });
  } catch (error) {
    console.error("Error fetching admin jobs:", error);
    return res.status(500).json({
      message: "Server error while fetching admin jobs",
      success: false,
    });
  }
};

export const updateJob = async (req, res) => {
  try {
    let { title, description, requirements, salary, location, jobType, experienceLevel, position } = req.body;

    if (typeof requirements === "string") {
      try {
        requirements = JSON.parse(requirements);
      } catch {
        requirements = [requirements];
      }
    }

    const updateData = {
      title,
      description,
      requirements,
      salary,
      location,
      jobType,
      experienceLevel,
      position,
    };

    const job = await Job.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    });

    if (!job) {
      return res.status(404).json({
        message: "Job not found.",
        success: false,
      });
    }

    return res.status(200).json({
      message: "Job information updated.",
      success: true,
      job,
    });
  } catch (error) {
    console.error("Error updating job:", error);
    return res.status(500).json({
      message: error.message || "Internal server error.",
      success: false,
    });
  }
};
