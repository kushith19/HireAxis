import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import connectDB from "./utils/db.js";
import userRoute from "./routes/user.routes.js";
import companyRoute from "./routes/company.routes.js";
import JobRoute from "./routes/job.routes.js";
import applicationRoute from "./routes/application.routes.js";
import interviewRoute from "./routes/interview.routes.js";
import ollamaRoute from "./routes/ollama.routes.js";
import fs from "fs";
import path from "path";

const app = express();

// CORS must be FIRST - before any other middleware
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 200
}));

// Other middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// APIs
app.use("/api/v1/user", userRoute);
app.use("/api/v1/company", companyRoute);
app.use("/api/v1/job", JobRoute);
app.use("/api/v1/application", applicationRoute);
app.use("/api/v1/interview", interviewRoute);
app.use("/api/v1/ollama", ollamaRoute);

// ensure upload directories
const uploadsRoot = path.join(process.cwd(), "uploads");
const uploadDirs = [
  path.join(uploadsRoot, "temp"),
  path.join(uploadsRoot, "resumes"),
  path.join(uploadsRoot, "interviews")
];
uploadDirs.forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// static serving
app.use("/uploads", express.static(uploadsRoot));

const PORT = process.env.PORT || 8000;

// Log CORS and port info
console.log("🌐 CORS enabled for: http://localhost:5173");
console.log("🚀 Server starting on port:", PORT);

// Connect DB first, then start server (recommended)
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect DB:", err);
    process.exit(1);
  });