const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
    {
        booking: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Booking",
            required: true,
        },
        reporter: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        worker: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Worker",
            required: true,
        },
        shopkeeper: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Shopkeeper",
            required: true,
        },
        category: {
            type: String,
            required: true,
        },
        reportType: {
            type: String,
            enum: ["worker_report", "customer_report"],
            default: "worker_report"
        },
        note: {
            type: String,
            default: "",
        },
        status: {
            type: String,
            enum: ["open", "resolved", "pending_review"],
            default: "open",
        },

        // Phase 6: Trust Score Sabotage Protection
        // If the reporter is a new/untrusted account, the score deduction is held pending admin review.
        requiresAdminReview: {
            type: Boolean,
            default: false,
        },
        adminReviewReason: {
            type: String,
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Report", reportSchema);
