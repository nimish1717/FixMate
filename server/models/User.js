const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        phone: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        email: {
            type: String,
            lowercase: true,
            unique: true,
            sparse: true
        },
        role: {
            type: String,
            enum: ["user", "worker", "shopkeeper", "admin"],
            default: "user",
        },
        profileImage: {
            type: String,
            default: "",
        },
        isBlocked: {
            type: Boolean,
            default: false,
        },
        trustScore: {
            type: Number,
            default: 100,
            min: 0,
            max: 100,
        },
    },
    {
        timestamps: true,
    }
);
module.exports = mongoose.model("User", UserSchema);