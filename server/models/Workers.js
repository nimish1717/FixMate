const mongoose = require("mongoose");

const WorkerSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
        },
        category: {
            type: String,
            enum: ["Plumbing", "Electrical", "AC Repair"],
            required: true,
        },
        aadhaar: {
            type: String,
            required: false, // Optional for backward compatibility with existing workers
        },
        experience: {
            type: Number,
            default: 0,
        },
        trustScore: {
            type: Number,
            default: 100,
            min: 0,
            max: 100,
        },
        rating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5,
        },
        totalJobs: {
            type: Number,
            default: 0,
        },
        status: {
            type: String,
            enum: ["online", "busy", "offline"],
            default: "offline",
        },
        autoOfflineTimeout: {
            type: Number,
            default: 0, // 0 means Manual Only
        },
        shopkeeper: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Shopkeeper",
        },
        pendingShopkeeperRequest: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Shopkeeper",
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        lastActive: {
            type: Date,
            default: Date.now,
        },
        location: {
            type: {
                type: String,
                enum: ["Point"],
                default: "Point",
            },
            coordinates: {
                type: [Number],
                default: [0, 0],
            },
        },
        canAcceptJobs: {
            type: Boolean,
            default: true,
        },
        totalUnpaidFees: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);
WorkerSchema.index({ location: "2dsphere" });
WorkerSchema.index({ category: 1, trustScore: -1, status: 1 });
WorkerSchema.index({ category: 1, experience: -1, status: 1 });

module.exports = mongoose.model("Worker", WorkerSchema);