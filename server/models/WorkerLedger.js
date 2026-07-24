const mongoose = require("mongoose");

const WorkerLedgerSchema = new mongoose.Schema(
    {
        booking: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Booking",
            required: true,
        },
        worker: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Worker",
            required: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        platformFee: {
            type: Number,
            required: true,
        },
        payoutStatus: {
            type: String,
            enum: ["pending", "paid"],
            default: "pending",
        },
        transactionId: {
            type: String, // Useful if the payout happens online
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("WorkerLedger", WorkerLedgerSchema);
