import dotenv from "dotenv";

dotenv.config();

if (!process.env.MONGO_URL) {
    throw new Error("MONGO_URL is not defined in the environment variables");
}

if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in the environment variables");
}

if (!process.env.IMAGEKIT_PRIVATE_KEY) {
    throw new Error("IMAGEKIT_PRIVATE_KEY is not defined in the environment variables");
}

if (!process.env.GOOGLE_CLIENT_ID) {
    throw new Error("GOOGLE_CLIENT_ID is not defined in the environment variables");
}

if (!process.env.GOOGLE_CLIENT_SECRET) {
    throw new Error("GOOGLE_CLIENT_SECRET is not defined in the environment variables");
}

if( !process.env.GOOGLE_CALLBACK_URL) {
    throw new Error("GOOGLE_CALLBACK_URL is not defined in the environment variables");
}

const config = {
    MONGO_URL: process.env.MONGO_URL,
    JWT_SECRET: process.env.JWT_SECRET,
    IMAGEKIT_PRIVATE_KEY: process.env.IMAGEKIT_PRIVATE_KEY,
    Google_Client_ID: process.env.GOOGLE_CLIENT_ID,
    Google_Client_Secret: process.env.GOOGLE_CLIENT_SECRET,
    Google_Redirect_URI: process.env.GOOGLE_CALLBACK_URL,
};

export default config;