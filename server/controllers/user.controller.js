import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import getDataUri from "../utils/datauri.js";
import cloudinary from "../utils/cloudinary.js";
import axios from "axios";
import fs from "fs";
import path from "path";

// ================= REGISTER =================
export const register = async (req, res) => {
  try {
    const { fullname, email, phoneNumber, password, role } = req.body;

    if (!fullname || !email || !phoneNumber || !password || !role) {
      return res.status(400).json({
        message: "Something is missing",
        success: false,
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
        success: false,
      });
    }

    // handle optional profile image
    let profilePhotoUrl = null;
    if (req.file) {
      const fileUri = getDataUri(req.file);
      const cloudResponse = await cloudinary.uploader.upload(fileUri.content);
      profilePhotoUrl = cloudResponse.secure_url;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      fullname,
      email,
      phoneNumber,
      password: hashedPassword,
      role,
      profile: {
        profilePhoto: profilePhotoUrl,
      },
    });

    return res.status(200).json({
      message: "Account created successfully",
      success: true,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error",
      success: false,
    });
  }
};

// ================= LOGIN =================
export const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({
        message: "Something is missing",
        success: false,
      });
    }

    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        message: "Incorrect email or password.",
        success: false,
      });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(400).json({
        message: "Incorrect email or password.",
        success: false,
      });
    }

    if (role !== user.role) {
      return res.status(400).json({
        message: "Account doesn't exist with current role.",
        success: false,
      });
    }

    const tokenData = { userId: user._id };
    const token = jwt.sign(tokenData, process.env.SECRET_KEY, {
      expiresIn: "1d",
    });

    user = {
      _id: user._id,
      fullname: user.fullname,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      profile: user.profile,
    };

    return res
      .status(200)
      .cookie("token", token, {
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: "strict",
      })
      .json({
        message: `Welcome back ${user.fullname}`,
        user,
        success: true,
      });
  } catch (error) {
    console.log(error);
  }
};

// ================= LOGOUT =================
export const logout = async (req, res) => {
  try {
    return res.status(200).cookie("token", "", { maxAge: 0 }).json({
      message: "Logged out successfully.",
      success: true,
    });
  } catch (error) {
    console.log(error);
  }
};

// ================= UPDATE PROFILE =================



export const updateProfile = async (req, res) => {
  try {
    const { fullname, email, phoneNumber, bio, skills } = req.body;
    const userId = req.id;

    let user = await User.findById(userId);
    if (!user)
      return res.status(404).json({ success: false, message: "User not found" });

    if (fullname) user.fullname = fullname;
    if (email) user.email = email;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (bio) user.profile.bio = bio;
    if (skills) user.profile.skills = skills.split(",").map((s) => s.trim()).filter(Boolean);

    if (req.file) {
      // If multer wrote to disk (diskStorage), it provides a .path
      if (req.file.path) {
        // Move uploads/temp/<file> -> uploads/resumes/resume-<userId>-<ts>.<ext>
        const resumesDir = path.join(process.cwd(), "uploads", "resumes");
        if (!fs.existsSync(resumesDir)) fs.mkdirSync(resumesDir, { recursive: true });

        const ext = path.extname(req.file.originalname) || ".pdf";
        const finalFileName = `resume-${userId}-${Date.now()}${ext}`;
        const finalDiskPath = path.join(resumesDir, finalFileName);

        // move (rename) with copy fallback for Windows locks
        try {
          fs.renameSync(req.file.path, finalDiskPath);
        } catch {
          fs.copyFileSync(req.file.path, finalDiskPath);
          fs.unlinkSync(req.file.path);
        }

        // store public URL and absolute disk path
        user.profile.resume = `/uploads/resumes/${finalFileName}`;  // public URL (served by express.static)
        user.profile.resumeDiskPath = finalDiskPath;                // absolute path for secure download
        user.profile.resumeOriginalName = req.file.originalname;

      } else if (req.file.buffer) {
        // Memory storage -> Cloudinary (kept from your original)
        const uploadResult = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { resource_type: "raw", folder: "resumes" },
            (error, result) => (error ? reject(error) : resolve(result))
          );
          stream.end(req.file.buffer);
        });
        user.profile.resume = uploadResult.secure_url;
        user.profile.resumeDiskPath = null; // not local
        user.profile.resumeOriginalName = req.file.originalname;
      }
    }

    await user.save();

    const safeUser = {
      _id: user._id,
      fullname: user.fullname,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      profile: user.profile,
    };

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: safeUser,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ================= DOWNLOAD RESUME =================




export const downloadResume = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).lean();
    if (!user || !user.profile || !user.profile.resume) {
      return res.status(404).send("Resume not found");
    }

    const fileUrl = user.profile.resume; // could be /uploads/... OR https://cloud...
    const fileName = user.profile.resumeOriginalName || "resume.pdf";

    // Remote URL (Cloudinary)
    if (/^https?:\/\//i.test(fileUrl)) {
      const response = await axios.get(fileUrl, { responseType: "stream" });
      res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
      if (response.headers["content-type"]) {
        res.setHeader("Content-Type", response.headers["content-type"]);
      }
      response.data.pipe(res);
      return;
    }

    // Local file
    // Prefer absolute path if stored:
    let absPath = user.profile.resumeDiskPath;

    // Fallback: resolve from the stored public URL (/uploads/resumes/...)
    if (!absPath) {
      const cleanRel = fileUrl.replace(/^\/+/, ""); // remove leading slash
      absPath = path.join(process.cwd(), cleanRel);
    }

    // Normalize and ensure it stays within /uploads/resumes
    const base = path.join(process.cwd(), "uploads", "resumes");
    const normalized = path.normalize(absPath);
    if (!normalized.startsWith(base)) {
      return res.status(400).send("Invalid resume path");
    }

    if (!fs.existsSync(normalized)) {
      return res.status(404).send("Local resume not found");
    }

    return res.download(normalized, fileName);
  } catch (error) {
    console.error("Download resume error:", error);
    res.status(500).send("Error downloading file");
  }
};
