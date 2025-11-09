import multer from "multer";
import path from "path";

const storageML = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/temp");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

export const uploadTemp = multer({
  storage: storageML,
  limits: { fileSize: 1024 * 1024 * 5 },
});
