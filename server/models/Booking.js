const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
    {
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

        shopkeeper: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Shopkeeper",
            required: true,
        },
        category: {
            type: String,
            enum: ["Plumbing", "Electrical", "AC Repair"],
            required: true,
        },
        predictedCategory: {
            type: String,
            default: "",
        },
        issueImage: {
            type: String,
            default: "",
        },
        issueDescription: {
            type: String,
            default: "",
            trim: true,
        },
        scheduledAt: {
            type: Date,
            default: null, // If null, implies "now"
        },
        isWarrantyClaim: {
            type: Boolean,
            default: false,
        },
        distance: {
            type: Number,
            required: true,
        },
        agreedPrice: {
            type: Number,
            default: null,
        },
        comingCharge: {
            type: Number,
            default: 0,
        },
        sparePartsCost: {
            type: Number,
            default: 0,
            min: 0,
        },
        sparePartsDescription: {
            type: String,
            default: "",
            trim: true,
        },
        // null = not yet requested, true = approved, false = rejected
        sparePartsApproved: {
            type: Boolean,
            default: null,
        },
        cancellationReason: {
            type: String,
            enum: ["user_cancelled", "worker_cancelled", "price_disagreement", "auto_cancelled", "customer_unresponsive"],
        },
        workerLastLocation: {
            lat: { type: Number },
            lng: { type: Number },
            timestamp: { type: Date }
        },
        address: {
            type: String,
            required: true,
            trim: true,
        },
        location: {
            type: {
                type: String,
                enum: ["Point"],
                default: "Point",
            },
            coordinates: {
                type: [Number],
                required: true,
            },
        },
        status: {
            type: String,
            enum: [
                "pending",
                "accepted",
                "arrival_verified",
                "price_negotiation",
                "in_progress",
                "spare_parts_pending",
                "repair_verified",
                "payment_pending",
                "payment_completed",
                "review_submitted",
                "completed",
                "cancelled",
                "cancelled_price_disagreement",
                "manual_verification_needed",
            ],
            default: "pending",
        },
        beforePhoto: {
            type: String,
            default: "",
        },
        afterPhoto: {
            type: String,
            default: "",
        },
        verificationResult: {
            repairDetected: {
                type: Boolean,
                default: false,
            },

            confidence: {
                type: Number,
                default: 0,
            },

            similarityScore: {
                type: Number,
                default: 0,
            },
        },
        workerCharge: {
            type: Number,
            default: 0,
            min: 0,
        },
        platformFee: {
            type: Number,
            default: 0,
            min: 0,
        },
        totalAmount: {
            type: Number,
            default: 0,
            min: 0,
        },
        paymentMethod: {
            type: String,
            enum: [
                "cash",
                "upi",
                "card",
                "net_banking",
                "wallet",
            ],
            default: "cash",
        },

        paymentStatus: {
            type: String,
            enum: [
                "pending",
                "paid",
                "cash_pending",
                "failed",
                "refunded",
            ],
            default: "pending",
        },

        paymentDetails: {
            paymentId: {
                type: String,
                default: "",
            },

            orderId: {
                type: String,
                default: "",
            },

            transactionId: {
                type: String,
                default: "",
            },

            paidAt: {
                type: Date,
            },
        },

        reviewSubmitted: {
            type: Boolean,
            default: false,
        },

        // Phase 3: Platform Guarantee — true ONLY when payment was made via online gateway
        // (paymentStatus = "paid"). Cash payments do not qualify. Used to show warranty badge.
        hasPlatformWarranty: {
            type: Boolean,
            default: false,
        },

        completedAt: {
            type: Date,
        },

        cancelledAt: {
            type: Date,
        },

        // Phase 4: Set when worker marks themselves at the customer's gate (geofenced).
        // Used to validate the 10-minute customer-unresponsive cancellation window.
        workerArrivedAtGate: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

bookingSchema.index({ location: "2dsphere" });
bookingSchema.index({ user: 1, status: 1 });
bookingSchema.index({ worker: 1, status: 1 });

module.exports = mongoose.model("Booking", bookingSchema);