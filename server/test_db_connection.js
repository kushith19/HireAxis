import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const testConnection = async () => {
  try {
    console.log("🔍 Testing MongoDB Atlas connection...");
    console.log("MONGO_URI:", process.env.MONGO_URI ? "✅ Found" : "❌ Missing");
    
    if (!process.env.MONGO_URI) {
      console.error("❌ MONGO_URI is not set in .env file");
      process.exit(1);
    }

    console.log("📡 Connecting to MongoDB Atlas...");
    await mongoose.connect(process.env.MONGO_URI);
    
    console.log("✅ MongoDB Atlas connected successfully!");
    console.log("📊 Connection state:", mongoose.connection.readyState);
    console.log("🗄️  Database name:", mongoose.connection.name);
    
    // Test a simple query
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`📁 Collections found: ${collections.length}`);
    collections.forEach(col => {
      console.log(`   - ${col.name}`);
    });
    
    await mongoose.disconnect();
    console.log("✅ Connection test completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Database connection failed:");
    console.error("Error:", error.message);
    
    if (error.message.includes("authentication failed")) {
      console.error("💡 Check your MongoDB Atlas username/password");
    } else if (error.message.includes("ENOTFOUND") || error.message.includes("getaddrinfo")) {
      console.error("💡 Check your internet connection and MongoDB Atlas cluster URL");
    } else if (error.message.includes("IP")) {
      console.error("💡 Check your MongoDB Atlas IP whitelist settings");
    }
    
    process.exit(1);
  }
};

testConnection();

