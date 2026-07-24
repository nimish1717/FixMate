const mongoose = require("mongoose");

const partInquirySchema = new mongoose.Schema(
    {
        shopId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Shop",
            required: true,
        },
        workerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Worker",
            required: true,
        },
        partDetails: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ["pending", "available", "unavailable"],
            default: "pending",
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("PartInquiry", partInquirySchema);
