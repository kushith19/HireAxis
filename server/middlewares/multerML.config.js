import multer from 'multer';
import path from 'path';

// Set up storage for the file, placing it in a temporary folder
const storageML = multer.diskStorage({
    destination: (req, file, cb) => {
        // Use a temporary folder for files being sent to the ML service
        cb(null, 'uploads/temp'); 
    },
    filename: (req, file, cb) => {
        // Create a unique filename using timestamp and original extension
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    },
});

// Middleware to handle single file upload under the field name 'resumeFile'
// NOTE: We MUST use 'resumeFile' here to match the frontend code
export const uploadTemp = multer({ 
    storage: storageML,
    limits: { fileSize: 1024 * 1024 * 5 } // Limit file size to 5MB
});

// We will use uploadTemp.single('resumeFile') in the router.