const Review = require("../models/Review");
const Booking = require("../models/Booking");
const Worker = require("../models/Workers");
const BookingOtp = require("../models/BookingOtp");
const { calculateWorkerStats } = require("../utils/calculateWorkerStats");

const createReview = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            punctualityRating,
            behaviourRating,
            qualityRating,
            cleanlinessRating,
            problemFixedRating,
            comment,
        } = req.body;

        const booking = await Booking.findById(id);

        if (!booking) {
            return res.status(404).json({ success: false, message: "Booking not found" });
        }

        if (booking.user.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: "Unauthorized to review this booking" });
        }

        if (booking.status !== "payment_completed") {
            return res.status(400).json({ success: false, message: "Booking must be paid before reviewing" });
        }

        if (booking.reviewSubmitted) {
            return res.status(400).json({ success: false, message: "Review already submitted" });
        }

        const review = await Review.create({
            booking: booking._id,
            user: req.user.id,
            worker: booking.worker,
            punctualityRating,
            behaviourRating,
            qualityRating,
            cleanlinessRating,
            problemFixedRating,
            comment,
        });

        const avgRating = (punctualityRating + behaviourRating + qualityRating + cleanlinessRating + problemFixedRating) / 5;
        const worker = await Worker.findById(booking.worker);

        const { newTotalJobs, newWorkerRating, newTrustScore } = calculateWorkerStats(worker, avgRating);

        worker.rating = newWorkerRating;
        worker.totalJobs = newTotalJobs;
        worker.trustScore = newTrustScore;
        worker.status = "online";
        await worker.save();

        booking.reviewSubmitted = true;
        booking.status = "review_submitted";
        booking.completedAt = new Date();
        await booking.save();

        await BookingOtp.deleteMany({ booking: booking._id });

        const { getIO } = require("../socket/socket");
        const io = getIO();
        io.to(`booking_${booking._id}`).emit("booking:statusChanged", booking);

        res.status(201).json({
            success: true,
            message: "Review submitted successfully",
            review,
        });

    } catch (error) {
        console.error("Review creation error:", error);
        res.status(500).json({ success: false, message: "An unexpected error occurred while submitting your review. Please try again later." });
    }
};

module.exports = {
    createReview
};
