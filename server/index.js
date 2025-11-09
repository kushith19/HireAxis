import express from "express"
import cookieParser from "cookie-parser"
import cors from "cors"
import dotenv from "dotenv"
import connectDB from "./utils/db.js"
import userRoute from "./routes/user.routes.js"
dotenv.config({})
import companyRoute from "./routes/company.routes.js"
import JobRoute from "./routes/job.routes.js"
import applicationRoute from "./routes/application.routes.js"
import fs from "fs"
import path from "path";

const app=express();

//middleware
app.use(express.json());
app.use(express.urlencoded({extended:true}))
app.use(cookieParser());


const corsOptions = {
  origin: "http://localhost:5173", 
  credentials: true                
};

app.use(cors(corsOptions));



const PORT=process.env.PORT || 8000;

//api's

app.use("/api/v1/user",userRoute)
app.use("/api/v1/company",companyRoute)
app.use("/api/v1/job",JobRoute)
app.use("/api/v1/application",applicationRoute)


// static serving 
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// ensure dirs
const tempDir = path.join(process.cwd(), "uploads", "temp");
const resumesDir = path.join(process.cwd(), "uploads", "resumes");
[tempDir, resumesDir].forEach((d) => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});




app.listen(PORT,()=>{
  console.log(`Server running on ${PORT}`);
  connectDB();
})