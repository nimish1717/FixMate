const mongoose = require("mongoose");

const shopkeeperSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
        },

        // DEPRECATED: These fields are migrating to the new 'Shop' collection.
        // Left here temporarily so the frontend doesn't break during migration.
        shopName: {
            type: String,
            required: true,
            trim: true,
        },

        address: {
            type: String,
            required: true,
            trim: true,
        },
        gstin: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            uppercase: true
        },
        rating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5,
        },

        isVerified: {
            type: Boolean,
            default: false,
        },
        isActive: {
            type: Boolean,
            default: true
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
    },
    {
        timestamps: true,
    }
);

shopkeeperSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Shopkeeper", shopkeeperSchema);