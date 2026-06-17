import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: [true, "First name is required"],
        trim: true,
    },

    lastName: {
        type: String,
        required: [true, "Last name is required"],
        trim: true
    },

    name: { // firstName  + lastName
        type: String,
        required: [true, "Name is required"],
        trim: true,
        unique: true,
    },

    email: {
        type: String,
        required: [true, "Email is required"],
        trim: true,
        unique: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please enter a valid email"],
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

    password: {
        type: String,
        required: [true, "Password is required"],
        trim: true,
        unique: [true, "Password must be unique"],
        minlength: [8, "Password must be at least 8 characters long"],
    },

    profilePictureURL: {
        type: String,
        default: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTh1pLlmnu9qHOG3fyLc3uTB7VpCbi5a6F0CxzgaEPBzQ&s=10",
    },

    profilePictureName: {
        type: String,
        default: "profile.jpg",
    },

    isVerified: {
        type: Boolean,
        default: false,
    },

    role: {
        type: String,
        enum: ['user', 'owner', 'security', 'admin'],
        default: 'user',
    },

    status: {
        type: String,
        enum: ["active", "inactive", "blocked"],
        default: "active",
    },

    loginAttempts: {
        type: Number,
        default: 0,
    },

    lockUntil: {
        type: Date,
        default: null,
    },

    verifyBy: {
        type: String,
        enum: ["email", "phone"],
        default: null,
    },

    resetPasswordToken: {
        type: String,
        default: null
    },

    resetPasswordExpires: {
        type: Date,
        default: null
    }

},
    {
        timestamps: true,
    }
)

const userModel = mongoose.model("User", userSchema);

export default userModel;