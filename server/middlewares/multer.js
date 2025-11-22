import multer from "multer";
import fs from 'fs';
import path from 'path';


const memoryStorage = multer.memoryStorage();
export const singleUploadMemory = multer({ storage: memoryStorage }).single("file");


const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const UPLOAD_DIR = path.join(process.cwd(), "uploads", "temp");
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  }
});
export const singleUploadDisk = multer({ storage: diskStorage }).single("file");

const interviewStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const UPLOAD_DIR = path.join(process.cwd(), "uploads", "interviews");
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      "interview-" + uniqueSuffix + path.extname(file.originalname || ".webm")
    );
  }
});

export const singleInterviewUpload = multer({
  storage: interviewStorage,
  limits: {
    fileSize: 200 * 1024 * 1024 // 200MB
  }
}).single("video");
