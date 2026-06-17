import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "User reference is required"]
    },
    refreshTokenHash: {
        type: String,
        required: [true, "Refresh token hash is required"]
    },
    ipAddress: {
        type: String,
        required: [true, "IP address is required"]
    },
    userAgent: {
        type: String,
        required: [true, "User agent is required"]
    },
    login_method: {
        type: String,
        enum: ["email", "phone"],
        default: "null"
    },
    revoked: {
        type: Boolean,
        default: false
    },
},
    {
        timestamps: true
    }
)

const sessionModel = mongoose.model("Session", sessionSchema);

export default sessionModel;