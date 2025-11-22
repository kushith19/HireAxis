import mongoose from "mongoose"
const userSchema=new mongoose.Schema({
  fullname:{
    type:String,
    required:true
  },
  email:{
    type:String,
    required:true,
    unique:true
  },
  phoneNumber:{
    type:String,
    required:true
  },
  password:{
    type:String,
    required:true
  },
  role:{
    type:String,
    enum:['student','recruiter'],
    required:true
  },
  profile:{
    bio:{type:String},
    skills:[{type:String}],
    resume:{type:String},
    resumeOriginalName:{type:String},
    company:{type:mongoose.Schema.Types.ObjectId,ref:'Company'},
    profilePhoto:{
      type:String,
      default:""
    },
    testResults:{
      finalScore:{type:Number},
      facialConfidenceScore:{type:Number},
      correctnessScore:{type:Number},
      testDate:{type:Date},
      questions:[{type:String}],
      videoPath:{type:String}
    }
  },
},{timestamps:true});

// Check if model already exists to prevent overwrite error
export const User = mongoose.models.User || mongoose.model('User', userSchema);