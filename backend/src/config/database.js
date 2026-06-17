import mongoose from "mongoose";
import config from "./config.js";

async function connectDB(){
    try{
        await mongoose.connect(config.MONGO_URL)
        console.log("Connected to the database successfully");
    }catch(err){
        console.error("Error connecting to the database:", err);    
        process.exit(1); // Exit the process with an error code
    }
}

export default connectDB;