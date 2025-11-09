import multer from "multer";
import fs from 'fs';
import path from 'path';


const memoryStorage = multer.memoryStorage();
export const singleUploadMemory = multer({ storage: memoryStorage }).single("file");


const diskStorage = multer.diskStorage({
    destination: (req, file, cb) => {
       
        const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'temp');
        fs.mkdirSync(UPLOAD_DIR, { recursive: true });
        cb(null, UPLOAD_DIR); 
    },
    filename: (req, file, cb) => {
     
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    },
});
export const singleUploadDisk = multer({ storage: diskStorage }).single("file"); 
