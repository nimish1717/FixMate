const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
    {
        booking: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Booking",
            required: true,
            unique: true,
        },

        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        worker: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Worker",
            required: true,
        },

        punctualityRating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },

        behaviourRating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },

        qualityRating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },

        cleanlinessRating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },

        problemFixedRating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },

        comment: {
            type: String,
            required: true,
            trim: true,
            minlength: 10,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Review", reviewSchema);