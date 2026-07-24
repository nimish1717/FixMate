const mongoose = require("mongoose");

const platformFeeOwedSchema = new mongoose.Schema(
    {
        worker: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Worker",
            required: true,
        },
        booking: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Booking",
            required: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        status: {
            type: String,
            enum: ["pending", "paid"],
            default: "pending",
        },
        dueAt: {
            type: Date,
            required: true,
        },
        paidAt: {
            type: Date,
        },
    },
    { timestamps: true }
);

platformFeeOwedSchema.index({ worker: 1, status: 1 });
platformFeeOwedSchema.index({ dueAt: 1, status: 1 });

module.exports = mongoose.model("PlatformFeeOwed", platformFeeOwedSchema);
