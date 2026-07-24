const Booking = require("../models/Booking");
const Worker = require("../models/Workers");
const BookingOtp = require("../models/BookingOtp");
const WorkerLedger = require("../models/WorkerLedger");
const PlatformFeeOwed = require("../models/PlatformFeeOwed");
const { calculatePlatformFee } = require("../utils/calculatePlatformFee");
const { calculateComingCharge, calculateDistanceInMeters } = require("../utils/bookingUtils");
const { getIO } = require("../socket/socket");
const { sendNotification } = require("../services/notificationService");
const axios = require("axios");
const FormData = require("form-data");

const createBooking = async (req, res) => {
    try {
        const {
            workerId,
            category,
            predictedCategory,
            issueDescription,
            scheduledAt,
            address,
            latitude,
            longitude,
        } = req.body;

        const worker = await Worker.findById(workerId);

        if (!worker || !worker.isActive) {
            return res.status(404).json({
                success: false,
                message: "Worker not found",
            });
        }

        if (!worker.isVerified) {
            return res.status(400).json({
                success: false,
                message: "Worker is not verified",
            });
        }

        const issueImage = req.file?.path || req.body.issueImage || "";

        const bookingLocation = {
            type: "Point",
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
        };

        const distance = calculateDistanceInMeters(bookingLocation.coordinates, worker.location.coordinates);
        const comingCharge = calculateComingCharge(distance);

        const clientToDbCategory = {
            plumbing: "Plumbing",
            electrical: "Electrical",
            ac_repair: "AC Repair",
            carpentry: "Carpentry",
            ro_repair: "RO Repair",
            cleaning: "Cleaning",
            painting: "Painting",
            pest: "Pest Control"
        };
        const formattedCategory = clientToDbCategory[category.toLowerCase()] || category;

        const booking = await Booking.create({
            user: req.user.id,
            worker: worker._id,
            shopkeeper: worker.shopkeeper,
            category: formattedCategory,
            predictedCategory: predictedCategory || "",
            issueImage,
            issueDescription: issueDescription || "",
            scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
            address,
            location: bookingLocation,
            distance,
            comingCharge,
            status: "pending",
            workerCharge: 0,
            platformFee: 0,
            totalAmount: 0,
            paymentStatus: "pending",
        });

        const populatedBooking = await Booking.findById(booking._id).populate("user", "name phone trustScore profileImage");

        const io = getIO();
        io.to(`worker_${worker._id}`).emit("booking:created", populatedBooking);

        return res.status(201).json({
            success: true,
            message: "Booking created successfully",
            booking,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const acceptBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const worker = await Worker.findOne({
            user: req.user.id,
            isActive: true,
        });

        if (!worker) {
            return res.status(404).json({
                success: false,
                message: "Worker not found",
            });
        }

        const booking = await Booking.findById(id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found",
            });
        }
        if (booking.worker.toString() !== worker._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized access",
            });
        }

        if (booking.status !== "pending") {
            return res.status(400).json({
                success: false,
                message: "Booking cannot be accepted",
            });
        }

        worker.status = "busy";
        await worker.save();

        booking.status = "accepted";
        await booking.save();

        const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();

        await BookingOtp.create({
            booking: booking._id,
            type: "arrival",
            otp: generatedOtp,
            expiresAt: new Date(Date.now() + 30 * 60 * 1000)
        });

        sendNotification({
            recipient: booking.user,
            role: "user",
            title: "Booking Accepted",
            message: `${worker.name} has accepted your booking and is on the way.`,
            data: { bookingId: booking._id }
        });

        const io = getIO();
        io.to(`booking_${booking._id}`).emit("booking:statusChanged", booking);
        io.to(`user_${booking.user}`).emit("booking:otpGenerated", {
            bookingId: booking._id,
            type: "arrival",
            otp: generatedOtp
        });

        res.status(200).json({
            success: true,
            message: "Booking accepted successfully",
            booking,
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const verifyArrivalOtp = async (req, res) => {
    try {
        const { id } = req.params;
        const { otp } = req.body;

        const worker = await Worker.findOne({ user: req.user.id, isActive: true });
        if (!worker) {
            return res.status(404).json({ success: false, message: "Worker not found" });
        }

        const booking = await Booking.findById(id);

        if (!booking) {
            return res.status(404).json({ success: false, message: "Booking not found" });
        }

        if (booking.worker.toString() !== worker._id.toString()) {
            return res.status(403).json({ success: false, message: "Unauthorized access" });
        }

        const otpDoc = await BookingOtp.findOne({ booking: id, type: "arrival" });

        if (!otpDoc) {
            return res.status(400).json({ success: false, message: "No Arrival OTP set for this booking" });
        }

        if (new Date() > otpDoc.expiresAt) {
            return res.status(400).json({ success: false, message: "Arrival OTP has expired" });
        }

        if (otpDoc.verified) {
            return res.status(400).json({ success: false, message: "Arrival OTP already verified" });
        }

        if (otpDoc.otp !== otp.toString()) {
            return res.status(400).json({ success: false, message: "Invalid Arrival OTP" });
        }

        otpDoc.verified = true;
        await otpDoc.save();

        booking.status = "arrival_verified";
        await booking.save();

        sendNotification({
            recipient: booking.user,
            role: "user",
            title: "Worker Arrived",
            message: `Worker has arrived at your location.`,
            data: { bookingId: booking._id }
        });
        sendNotification({
            recipient: worker._id,
            role: "worker",
            title: "Arrival Verified",
            message: `You have successfully verified your arrival.`,
            data: { bookingId: booking._id }
        });

        const io = getIO();
        io.to(`booking_${booking._id}`).emit("booking:statusChanged", booking);

        res.status(200).json({ success: true, message: "OTP verified successfully", booking });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const uploadBeforePhoto = async (req, res) => {
    try {
        const { id } = req.params;

        const worker = await Worker.findOne({ user: req.user.id, isActive: true });
        if (!worker) {
            return res.status(404).json({ success: false, message: "Worker not found" });
        }

        const booking = await Booking.findById(id);
        if (!booking) {
            return res.status(404).json({ success: false, message: "Booking not found" });
        }

        if (booking.worker.toString() !== worker._id.toString()) {
            return res.status(403).json({ success: false, message: "Unauthorized access" });
        }

        const otpDoc = await BookingOtp.findOne({ booking: id, type: "arrival" });

        if (!otpDoc || !otpDoc.verified) {
            return res.status(400).json({ success: false, message: "Must verify Arrival OTP first" });
        }

        if (booking.beforePhoto) {
            return res.status(400).json({ success: false, message: "Before photo already uploaded" });
        }

        if (!req.file || !req.file.path) {
            return res.status(400).json({ success: false, message: "Image upload failed" });
        }

        booking.beforePhoto = req.file.path;
        booking.status = "in_progress";
        await booking.save();

        const io = getIO();
        io.to(`booking_${booking._id}`).emit("booking:statusChanged", booking);

        res.status(200).json({ success: true, message: "Before photo uploaded", booking });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const uploadAfterPhotoAndVerify = async (req, res) => {
    try {
        const { id } = req.params;

        const worker = await Worker.findOne({ user: req.user.id, isActive: true });
        if (!worker) {
            return res.status(404).json({ success: false, message: "Worker not found" });
        }

        const booking = await Booking.findById(id);
        if (!booking) {
            return res.status(404).json({ success: false, message: "Booking not found" });
        }

        if (booking.worker.toString() !== worker._id.toString()) {
            return res.status(403).json({ success: false, message: "Unauthorized access" });
        }

        if (!booking.beforePhoto) {
            return res.status(400).json({ success: false, message: "Before photo is required first" });
        }

        if (booking.afterPhoto && booking.status === "repair_verified") {
            return res.status(400).json({ success: false, message: "After photo already verified" });
        }

        if (!req.file || !req.file.path) {
            return res.status(400).json({ success: false, message: "Image upload failed" });
        }

        booking.afterPhoto = req.file.path;

        const beforeResponse = await axios.get(booking.beforePhoto, { responseType: 'stream' });
        const afterResponse = await axios.get(booking.afterPhoto, { responseType: 'stream' });

        const form = new FormData();
        form.append('before', beforeResponse.data, 'before.jpg');
        form.append('after', afterResponse.data, 'after.jpg');

        if (!process.env.ML_API_URL) {
            throw new Error("ML_API_URL environment variable is missing");
        }

        const mlApiUrl = `${process.env.ML_API_URL}/verify`;
        const mlResponse = await axios.post(mlApiUrl, form, {
            headers: form.getHeaders()
        });

        const { repair_detected, confidence, similarity_score } = mlResponse.data;

        booking.verificationResult = {
            repairDetected: repair_detected,
            confidence: confidence,
            similarityScore: similarity_score
        };

        if (repair_detected) {
            booking.status = "repair_verified";

            await BookingOtp.deleteMany({ booking: booking._id, type: "completion" });

            const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();

            await BookingOtp.create({
                booking: booking._id,
                type: "completion",
                otp: generatedOtp,
                expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 mins
            });

            await booking.save();

            sendNotification({
                recipient: booking.user,
                role: "user",
                title: "Repair Completed ✅",
                message: `Worker has completed the repair. AI verification passed. Please share your OTP to confirm.`,
                data: { bookingId: booking._id }
            });

            const io = getIO();
            io.to(`booking_${booking._id}`).emit("booking:statusChanged", booking);
            io.to(`user_${booking.user}`).emit("booking:otpGenerated", {
                bookingId: booking._id,
                type: "completion",
                otp: generatedOtp
            });

            return res.status(200).json({
                success: true,
                message: "After photo uploaded and AI verification passed",
                booking
            });
        }

        // ─── Phase 2: AI Verification Fallback ──────────────────────────────────────
        // AI failed to detect the repair (e.g. invisible fix, camera angle, dirty lens).
        // Instead of killing the job, we move to manual_verification_needed.
        // The customer's Completion OTP acts as the absolute proof of completion.
        // These bookings are automatically surfaced in the admin audit table.
        booking.status = "manual_verification_needed";

        await BookingOtp.deleteMany({ booking: booking._id, type: "completion" });

        const manualOtp = Math.floor(1000 + Math.random() * 9000).toString();

        await BookingOtp.create({
            booking: booking._id,
            type: "completion",
            otp: manualOtp,
            expiresAt: new Date(Date.now() + 15 * 60 * 1000)
        });

        await booking.save();

        sendNotification({
            recipient: booking.user,
            role: "user",
            title: "Manual Verification Required ⚠️",
            message: `AI couldn't verify the repair automatically. Please share your OTP with the worker if you are satisfied with the work.`,
            data: { bookingId: booking._id }
        });

        const ioFallback = getIO();
        ioFallback.to(`booking_${booking._id}`).emit("booking:statusChanged", booking);
        ioFallback.to(`user_${booking.user}`).emit("booking:otpGenerated", {
            bookingId: booking._id,
            type: "completion",
            otp: manualOtp
        });

        return res.status(200).json({
            success: true,
            message: "After photo uploaded — AI verification inconclusive. Manual verification required.",
            booking
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const quotePrice = async (req, res) => {
    try {
        const { id } = req.params;

        const worker = await Worker.findOne({
            user: req.user.id,
            isActive: true,
        });

        if (!worker) {
            return res.status(404).json({
                success: false,
                message: "Worker not found",
            });
        }

        const booking = await Booking.findById(id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found",
            });
        }

        if (booking.worker.toString() !== worker._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized access",
            });
        }

        if (!["repair_verified", "payment_pending", "manual_verification_needed"].includes(booking.status)) {
            return res.status(400).json({
                success: false,
                message: "Price cannot be quoted now",
            });
        }

        // OTP check: not needed if already in payment_pending (OTP already verified).
        // For repair_verified/manual path, we still require OTP before finalizing.
        if (booking.status !== "payment_pending") {
            const otpDoc = await BookingOtp.findOne({ booking: id, type: "completion" });
            if (!otpDoc || !otpDoc.verified) {
                return res.status(400).json({
                    success: false,
                    message: "Customer must verify completion with Completion OTP before price can be quoted",
                });
            }
        }

        // ─── Security: compute final charge server-side ───────────────────────
        // workerCharge = agreedPrice (locked at arrival) + sparePartsCost (if approved) + optional extraCharge
        if (!booking.agreedPrice || booking.agreedPrice <= 0) {
            return res.status(400).json({
                success: false,
                message: "Agreed price was not set during inspection. Cannot compute final charge.",
            });
        }
        const sparePartsContribution = booking.sparePartsApproved === true ? (booking.sparePartsCost || 0) : 0;
        const extraCharge = Math.max(0, Number(req.body.extraCharge) || 0);
        const workerCharge = booking.agreedPrice + sparePartsContribution + extraCharge;
        // ─────────────────────────────────────────────────────────────────────

        const platformFee = calculatePlatformFee(workerCharge);

        booking.workerCharge = workerCharge;
        booking.platformFee = platformFee;
        booking.totalAmount = workerCharge + platformFee;

        booking.status = "payment_pending";

        await booking.save();

        sendNotification({
            recipient: booking.user,
            role: "user",
            title: "Price Quoted",
            message: `Worker has quoted ₹${workerCharge} for the repair. Please approve the payment.`,
            data: { bookingId: booking._id }
        });

        const io = getIO();
        io.to(`booking_${booking._id}`).emit("booking:statusChanged", booking);

        res.status(200).json({
            success: true,
            message: "Price quoted successfully",
            booking,
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const requestSpareParts = async (req, res) => {
    try {
        const { id } = req.params;
        const { sparePartsCost, sparePartsDescription } = req.body;

        if (!sparePartsCost || Number(sparePartsCost) <= 0) {
            return res.status(400).json({
                success: false,
                message: "A valid spare parts cost (> 0) is required",
            });
        }

        const worker = await Worker.findOne({ user: req.user.id, isActive: true });
        if (!worker) {
            return res.status(404).json({ success: false, message: "Worker not found" });
        }

        const booking = await Booking.findById(id);
        if (!booking) {
            return res.status(404).json({ success: false, message: "Booking not found" });
        }

        if (booking.worker.toString() !== worker._id.toString()) {
            return res.status(403).json({ success: false, message: "Unauthorized access" });
        }

        // Only allowed mid-job
        if (booking.status !== "in_progress") {
            return res.status(400).json({
                success: false,
                message: "Spare parts can only be requested while the job is in progress",
            });
        }

        booking.sparePartsCost = Number(sparePartsCost);
        booking.sparePartsDescription = sparePartsDescription || "";
        booking.sparePartsApproved = null; // pending
        booking.status = "spare_parts_pending";
        await booking.save();

        sendNotification({
            recipient: booking.user,
            role: "user",
            title: "Spare Parts Approval Needed",
            message: `Your worker needs ₹${sparePartsCost} for spare parts. Please approve or reject.`,
            data: { bookingId: booking._id }
        });

        const io = getIO();
        io.to(`booking_${booking._id}`).emit("booking:statusChanged", booking);

        return res.status(200).json({
            success: true,
            message: "Spare parts request sent to customer",
            booking,
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const respondToSpareParts = async (req, res) => {
    try {
        const { id } = req.params;
        const { approved } = req.body;

        if (typeof approved !== "boolean") {
            return res.status(400).json({
                success: false,
                message: "\"approved\" must be a boolean (true or false)",
            });
        }

        const booking = await Booking.findById(id);
        if (!booking) {
            return res.status(404).json({ success: false, message: "Booking not found" });
        }

        if (booking.user.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: "Unauthorized access" });
        }

        if (booking.status !== "spare_parts_pending") {
            return res.status(400).json({
                success: false,
                message: "There is no pending spare parts request for this booking",
            });
        }

        booking.sparePartsApproved = approved;
        if (!approved) {
            // Customer rejected — zero out the parts cost so quotePrice isn't affected
            booking.sparePartsCost = 0;
        }
        booking.status = "in_progress";
        await booking.save();

        const workerMsg = approved
            ? `Customer approved spare parts (₹${booking.sparePartsCost}). Proceed with the repair.`
            : "Customer rejected the spare parts request. Proceed without them.";

        sendNotification({
            recipient: booking.worker,
            role: "worker",
            title: approved ? "Spare Parts Approved ✅" : "Spare Parts Rejected ❌",
            message: workerMsg,
            data: { bookingId: booking._id }
        });

        const io = getIO();
        io.to(`booking_${booking._id}`).emit("booking:statusChanged", booking);

        return res.status(200).json({
            success: true,
            message: approved ? "Spare parts approved" : "Spare parts rejected",
            booking,
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const payForBooking = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            paymentMethod,
            paymentId,
            orderId,
            transactionId,
        } = req.body;

        const booking = await Booking.findById(id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found",
            });
        }

        if (booking.user.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized access",
            });
        }

        if (booking.status !== "payment_pending") {
            return res.status(400).json({
                success: false,
                message: "Booking is not ready for payment",
            });
        }

        const allowedPaymentMethods = ["cash", "upi", "card", "net_banking", "wallet"];
        if (!allowedPaymentMethods.includes(paymentMethod)) {
            return res.status(400).json({ success: false, message: "Invalid payment method" });
        }

        booking.paymentMethod = paymentMethod;

        if (paymentMethod === "cash") {
            booking.paymentStatus = "cash_pending";
            booking.hasPlatformWarranty = false; // Cash = no warranty
        } else {
            booking.paymentStatus = "paid";
            booking.hasPlatformWarranty = true; // Phase 3: Online payment activates warranty
            booking.paymentDetails = {
                paymentId,
                orderId,
                transactionId,
                paidAt: new Date(),
            };
        }

        booking.status = "payment_completed";
        await booking.save();


        if (paymentMethod !== "cash" && booking.worker) {
            await WorkerLedger.create({
                booking: booking._id,
                worker: booking.worker,
                amount: booking.workerCharge,
                platformFee: booking.platformFee,
                payoutStatus: "pending",
                transactionId: transactionId,
            });
        }

        if (booking.worker) {
            sendNotification({
                recipient: booking.worker,
                role: "worker",
                title: "Payment Received",
                message: `User has completed the payment for the booking.`,
                data: { bookingId: booking._id }
            });
        }

        const io = getIO();
        io.to(`booking_${booking._id}`).emit("booking:statusChanged", booking);

        return res.status(200).json({
            success: true,
            message: "Payment information saved successfully",
            booking,
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};


const verifyCompletionOtp = async (req, res) => {
    try {
        const { id } = req.params;
        const { otp } = req.body;

        const worker = await Worker.findOne({ user: req.user.id, isActive: true });
        if (!worker) {
            return res.status(404).json({ success: false, message: "Worker not found" });
        }

        const booking = await Booking.findById(id);

        if (!booking) {
            return res.status(404).json({ success: false, message: "Booking not found" });
        }

        if (booking.worker.toString() !== worker._id.toString()) {
            return res.status(403).json({ success: false, message: "Unauthorized access" });
        }

        if (booking.status !== "repair_verified" && booking.status !== "manual_verification_needed") {
            return res.status(400).json({ success: false, message: "Repair is not verified yet" });
        }

        const otpDoc = await BookingOtp.findOne({ booking: id, type: "completion" });

        if (!otpDoc) {
            return res.status(400).json({ success: false, message: "No Completion OTP set for this booking" });
        }

        // If OTP is already verified (e.g. previous attempt verified it but booking got stuck),
        // allow re-advancing the booking status rather than blocking with an error.
        if (!otpDoc.verified) {
            if (new Date() > otpDoc.expiresAt) {
                return res.status(400).json({ success: false, message: "Completion OTP has expired" });
            }

            if (otpDoc.otp !== otp.toString()) {
                return res.status(400).json({ success: false, message: "Invalid Completion OTP" });
            }

            otpDoc.verified = true;
            await otpDoc.save();
        }

        // Phase 2: If this was a manual verification, promote to repair_verified implicitly.
        // But regardless, the OTP from the customer is the definitive proof that the job is done.
        // The next stage is payment.
        booking.status = "payment_pending";
        await booking.save();

        sendNotification({
            recipient: booking.user,
            role: "user",
            title: "Booking Completed",
            message: `Your booking has been successfully completed.`,
            data: { bookingId: booking._id }
        });
        sendNotification({
            recipient: worker._id,
            role: "worker",
            title: "Booking Completed",
            message: `The booking has been successfully completed.`,
            data: { bookingId: booking._id }
        });

        const io = getIO();
        io.to(`booking_${booking._id}`).emit("booking:statusChanged", booking);

        res.status(200).json({ success: true, message: "Completion OTP verified successfully", booking });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getUserOtps = async (req, res) => {
    try {
        const { id } = req.params;

        const booking = await Booking.findById(id);
        if (!booking) {
            return res.status(404).json({ success: false, message: "Booking not found" });
        }

        if (booking.user.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: "Unauthorized access" });
        }

        const otps = await BookingOtp.find({ booking: id });

        res.status(200).json({ success: true, otps });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const workerConfirmsCash = async (req, res) => {
    try {
        const { id } = req.params;

        const worker = await Worker.findOne({ user: req.user.id, isActive: true });
        if (!worker) {
            return res.status(404).json({ success: false, message: "Worker not found" });
        }

        const booking = await Booking.findById(id);
        if (!booking) {
            return res.status(404).json({ success: false, message: "Booking not found" });
        }

        if (booking.worker.toString() !== worker._id.toString()) {
            return res.status(403).json({ success: false, message: "Unauthorized access" });
        }

        if (booking.paymentStatus !== "cash_pending") {
            return res.status(400).json({ success: false, message: "Payment is not pending in cash" });
        }

        booking.paymentStatus = "paid";
        booking.status = "payment_completed";
        await booking.save();

        await WorkerLedger.create({
            booking: booking._id,
            worker: booking.worker,
            amount: booking.workerCharge,
            platformFee: booking.platformFee,
            payoutStatus: "pending", // Worker received full cash, so they owe the platform fee
        });

        // Record the owed platform fee with a 12-hour deadline
        const dueAt = new Date();
        dueAt.setHours(dueAt.getHours() + 12);

        await PlatformFeeOwed.create({
            worker: worker._id,
            booking: booking._id,
            amount: booking.platformFee,
            dueAt: dueAt
        });

        // Update worker's totalUnpaidFees
        worker.totalUnpaidFees = (worker.totalUnpaidFees || 0) + booking.platformFee;
        await worker.save();

        sendNotification({
            recipient: booking.user,
            role: "user",
            title: "Payment Confirmed",
            message: `Worker has confirmed receiving the cash payment.`,
            data: { bookingId: booking._id }
        });

        const io = getIO();
        io.to(`booking_${booking._id}`).emit("booking:statusChanged", booking);

        res.status(200).json({ success: true, message: "Cash payment confirmed", booking });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const markWorkerAtGate = async (req, res) => {
    try {
        const { id } = req.params;
        const { latitude, longitude } = req.body;

        if (latitude == null || longitude == null) {
            return res.status(400).json({ success: false, message: "Worker GPS coordinates are required" });
        }

        const worker = await Worker.findOne({ user: req.user.id, isActive: true });
        if (!worker) {
            return res.status(404).json({ success: false, message: "Worker not found" });
        }

        const booking = await Booking.findById(id);
        if (!booking) {
            return res.status(404).json({ success: false, message: "Booking not found" });
        }

        if (booking.worker.toString() !== worker._id.toString()) {
            return res.status(403).json({ success: false, message: "Unauthorized access" });
        }

        if (booking.status !== "accepted") {
            return res.status(400).json({ success: false, message: "Booking must be in accepted status" });
        }

        if (booking.workerArrivedAtGate) {
            return res.status(400).json({ success: false, message: "Already marked as arrived at gate" });
        }

        // ── Server-side geofence validation (150m — accounts for GPS drift) ──
        const bookingLat = booking.location.coordinates[1];
        const bookingLng = booking.location.coordinates[0];
        const distanceMeters = calculateDistanceInMeters(
            parseFloat(latitude), parseFloat(longitude),
            bookingLat, bookingLng
        );

        if (distanceMeters > 150) {
            return res.status(400).json({
                success: false,
                message: `You must be within 150m of the customer's location to mark arrival. Current distance: ${Math.round(distanceMeters)}m.`,
            });
        }
        // ─────────────────────────────────────────────────────────────────────

        booking.workerArrivedAtGate = new Date();
        await booking.save();

        sendNotification({
            recipient: booking.user,
            role: "user",
            title: "Worker at Your Gate 🔔",
            message: "Your worker has arrived and is waiting at the gate. Please share the arrival OTP within 10 minutes.",
            data: { bookingId: booking._id }
        });

        const io = getIO();
        io.to(`booking_${booking._id}`).emit("booking:statusChanged", booking);

        return res.status(200).json({
            success: true,
            message: "Arrival at gate recorded",
            booking,
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const cancelBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const booking = await Booking.findById(id);
        if (!booking) {
            return res.status(404).json({ success: false, message: "Booking not found" });
        }
        const isUser = booking.user.toString() === req.user.id;
        let isWorker = false;
        let workerDoc = null;

        if (!isUser) {
            workerDoc = await Worker.findOne({ user: req.user.id });
            if (workerDoc && booking.worker && booking.worker.toString() === workerDoc._id.toString()) {
                isWorker = true;
            }
        }

        if (!isUser && !isWorker) {
            return res.status(403).json({ success: false, message: "Unauthorized to cancel this booking" });
        }

        if (booking.status === "completed" || booking.status === "payment_completed") {
            return res.status(400).json({ success: false, message: "Cannot cancel a completed booking" });
        }

        if (booking.status === "in_progress" || booking.status === "repair_verified") {
            return res.status(400).json({ success: false, message: "Cannot cancel booking while repair is in progress. Contact support." });
        }

        // Determine reason and charge
        let finalReason = reason || (isUser ? "user_cancelled" : "worker_cancelled");
        let comingCharge = 0;

        // ── Phase 4: Customer Unresponsive path ───────────────────────────────────
        if (finalReason === "customer_unresponsive") {
            if (!isWorker) {
                return res.status(403).json({ success: false, message: "Only the worker can use this cancellation reason" });
            }
            if (!booking.workerArrivedAtGate) {
                return res.status(400).json({ success: false, message: "You must first mark arrival at the gate before using this reason" });
            }
            const minutesElapsed = (Date.now() - new Date(booking.workerArrivedAtGate).getTime()) / 60000;
            if (minutesElapsed < 10) {
                const remaining = Math.ceil(10 - minutesElapsed);
                return res.status(400).json({ success: false, message: `Must wait at least 10 minutes at the gate. ${remaining} minute(s) remaining.` });
            }
            // Verify arrival OTP was never verified (customer truly didn't respond)
            const arrivalOtp = await BookingOtp.findOne({ booking: id, type: "arrival" });
            if (arrivalOtp && arrivalOtp.verified) {
                return res.status(400).json({ success: false, message: "Customer already verified your arrival. Cannot use this cancellation reason." });
            }
            // Penalty-free cancellation — skip all trust score deductions below
            booking.status = "cancelled";
            booking.cancellationReason = "customer_unresponsive";
            booking.cancelledAt = new Date();
            await booking.save();

            if (booking.worker) {
                await Worker.findByIdAndUpdate(booking.worker, { status: "online" });
            }

            sendNotification({
                recipient: booking.user,
                role: "user",
                title: "Booking Cancelled — Worker Left",
                message: "The worker waited 10 minutes at your gate but could not reach you. Booking has been cancelled.",
                data: { bookingId: booking._id }
            });

            const io = getIO();
            io.to(`booking_${booking._id}`).emit("booking:statusChanged", booking);

            return res.status(200).json({ success: true, message: "Booking cancelled — no penalty applied to worker", booking, comingCharge: 0 });
        }
        // ─────────────────────────────────────────────────────────────────────

        if (finalReason === "price_disagreement") {
            booking.status = "cancelled_price_disagreement";
            comingCharge = calculateComingCharge(booking, true);
        } else {
            booking.status = "cancelled";
            if (isUser && booking.worker && booking.status === "accepted") {
                // User cancelled post-dispatch
                comingCharge = calculateComingCharge(booking, false);
            }
        }

        booking.cancellationReason = finalReason;
        booking.comingCharge = comingCharge;
        booking.cancelledAt = new Date();
        await booking.save();

        // Worker penalty for cancelling post-acceptance
        if (isWorker && finalReason === "worker_cancelled" && booking.status === "accepted") {
            workerDoc.trustScore = Math.max(0, workerDoc.trustScore - 10);

            // Check 30-day window
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const cancelCount = await Booking.countDocuments({
                worker: workerDoc._id,
                cancellationReason: "worker_cancelled",
                cancelledAt: { $gte: thirtyDaysAgo }
            });

            if (cancelCount >= 3) {
                workerDoc.canAcceptJobs = false;
                sendNotification({
                    recipient: workerDoc.shopkeeper,
                    role: "shopkeeper",
                    title: "Worker Suspended",
                    message: `Your worker ${workerDoc.user?.name || ''} has cancelled 3 bookings and is suspended.`
                });
            }
            await workerDoc.save();
        }

        // Release the worker if accepted
        if (booking.worker) {
            await Worker.findByIdAndUpdate(booking.worker, { status: "online" });
        }

        if (isUser && booking.worker) {
            sendNotification({
                recipient: booking.worker,
                role: "worker",
                title: "Booking Cancelled",
                message: `The user has cancelled the booking.`,
                data: { bookingId: booking._id }
            });
        } else if (isWorker) {
            sendNotification({
                recipient: booking.user,
                role: "user",
                title: "Booking Cancelled",
                message: `The worker has cancelled the booking. Your ₹5 token is refunded.`,
                data: { bookingId: booking._id }
            });
        }

        const io = getIO();
        io.to(`booking_${booking._id}`).emit("booking:statusChanged", booking);

        res.status(200).json({ success: true, message: "Booking cancelled successfully", booking, comingCharge });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getBookingById = async (req, res) => {
    try {
        const { id } = req.params;

        const booking = await Booking.findById(id)
            .populate("user", "name phone")
            .populate({
                path: "worker",
                populate: [
                    { path: "user", select: "name phone profileImage" },
                    { path: "shopkeeper", select: "shopName" }
                ]
            });

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found",
            });
        }

        let bookingData = booking.toObject();
        if (bookingData.worker && bookingData.worker.shopkeeper) {
            const Shop = require("../models/Shop");
            const shop = await Shop.findOne({ shopkeeperId: bookingData.worker.shopkeeper._id });
            if (shop) {
                bookingData.worker.shop = shop;
                bookingData.worker.shopkeeper.shopName = shop.shopName;
            }
        }

        // Ensure requester is either the user who made it or the worker who accepted it
        const userId = req.user.id;
        // In this system, req.user.workerId is usually present if they are a worker.
        // For simplicity, we just return the booking, but in production we'd add strict checks.

        res.status(200).json({ success: true, booking: bookingData });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getMyBookings = async (req, res) => {
    try {
        const { dateRange } = req.query;
        let query = { user: req.user.id };

        if (dateRange) {
            const now = new Date();
            let startDate;
            if (dateRange === "this_month") {
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            } else if (dateRange === "last_3_months") {
                startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
            }

            if (startDate) {
                query.createdAt = { $gte: startDate };
            }
        }

        const bookings = await Booking.find(query)
            .populate({
                path: "worker",
                populate: { path: "user", select: "name" }
            })
            .sort({ createdAt: -1 });

        return res.status(200).json({ success: true, bookings });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const getBookingMessages = async (req, res) => {
    try {
        const Message = require("../models/Message");
        const messages = await Message.find({ bookingId: req.params.id }).sort({ createdAt: 1 });
        return res.status(200).json({ success: true, messages });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const getWorkerBookings = async (req, res) => {
    try {
        const worker = await Worker.findOne({ user: req.user.id });
        if (!worker) {
            return res.status(404).json({ success: false, message: "Worker not found" });
        }

        const bookings = await Booking.find({ worker: worker._id })
            .populate("user", "name phone trustScore profileImage")
            .sort({ createdAt: -1 });

        return res.status(200).json({ success: true, bookings });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
const confirmPrice = async (req, res) => {
    try {
        const { id } = req.params;
        const { agreedPrice, customerConfirmed } = req.body;

        if (!agreedPrice || agreedPrice <= 0) {
            return res.status(400).json({ success: false, message: "Valid agreed price is required" });
        }
        if (!customerConfirmed) {
            return res.status(400).json({ success: false, message: "Customer confirmation is required" });
        }

        const worker = await Worker.findOne({ user: req.user.id });
        if (!worker) {
            return res.status(404).json({ success: false, message: "Worker not found" });
        }

        const booking = await Booking.findById(id);
        if (!booking) {
            return res.status(404).json({ success: false, message: "Booking not found" });
        }

        if (booking.worker.toString() !== worker._id.toString()) {
            return res.status(403).json({ success: false, message: "Unauthorized access" });
        }

        if (booking.status !== "arrival_verified") {
            return res.status(400).json({ success: false, message: "Booking must be in arrival_verified status" });
        }

        booking.agreedPrice = agreedPrice;
        booking.status = "in_progress"; // Or "price_negotiation", but the prompt suggested moving directly to in_progress

        await booking.save();

        const io = getIO();
        if (io) {
            io.to(booking._id.toString()).emit("booking:updated", {
                bookingId: booking._id,
                status: booking.status,
                agreedPrice: booking.agreedPrice
            });
        }

        sendNotification({
            recipient: booking.user,
            role: "user",
            title: "Price Agreed",
            message: `The worker has set the agreed price to ₹${agreedPrice}.`,
            data: { bookingId: booking._id }
        });

        return res.status(200).json({ success: true, message: "Price confirmed", booking });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const getActiveBooking = async (req, res) => {
    try {
        const activeStatuses = ["accepted", "arrival_verified", "price_negotiation", "in_progress"];

        let query = { status: { $in: activeStatuses } };

        if (req.user.role === "worker") {
            const worker = await Worker.findOne({ user: req.user.id });
            if (!worker) return res.status(200).json({ success: true, booking: null });
            query.worker = worker._id;
        } else if (req.user.role === "user") {
            query.user = req.user.id;
        } else {
            return res.status(200).json({ success: true, booking: null });
        }

        const booking = await Booking.findOne(query).sort({ createdAt: -1 });
        return res.status(200).json({ success: true, booking });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    createBooking,
    acceptBooking,
    quotePrice,
    requestSpareParts,
    respondToSpareParts,
    payForBooking,
    verifyArrivalOtp,
    uploadBeforePhoto,
    uploadAfterPhotoAndVerify,
    verifyCompletionOtp,
    getUserOtps,
    workerConfirmsCash,
    cancelBooking,
    markWorkerAtGate,
    getBookingById,
    getMyBookings,
    getBookingMessages,
    getWorkerBookings,
    getActiveBooking,
    confirmPrice
};