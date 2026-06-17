import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, "Email is required"],
        lowercase: true,
        trim: true,
        match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            "Please enter a valid email"
        ]
    },

    phone: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        match: [/^\d{10}$/, "Please enter a valid 10-digit phone number"]
    },

    countryCode: {
        type: String,
        required: true,
        trim: true,
        match: [/^\+\d+$/, "Please enter a valid country code"]
    },

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "User reference is required"]
    },

    phoneOtpHash: {
        type: String,
        required: [true, "OTP hash is required"]
    },

    emailOtpHash: {
        type: String,
        required: [true, "OTP hash is required"]
    },

    failedAttempts: {
        type: Number,
        default: 0
    },

    lockUntil: {
        type: Date,
        default: null
    },

    expiresAt: {
        type: Date,
        required: [true, "Expiration time is required"],
        expires: 0
    }

},
    {
        timestamps: true
    }
);

const OTPModel = mongoose.model("OTP", otpSchema);

export default OTPModel;