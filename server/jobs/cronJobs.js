const cron = require("node-cron");
const Booking = require("../models/Booking");
const BookingOtp = require("../models/BookingOtp");
const Worker = require("../models/Workers");
const { getIO } = require("../socket/socket");
const { sendNotification } = require("../services/notificationService");

const PENDING_BOOKING_TIMEOUT_MINS = 5;
const INACTIVE_WORKER_TIMEOUT_MINS = 15;

async function checkPendingBookings() {
    try {
        const timeoutThreshold = new Date(Date.now() - PENDING_BOOKING_TIMEOUT_MINS * 60 * 1000);
        const expiredBookings = await Booking.find({
            status: "pending",
            createdAt: { $lt: timeoutThreshold }
        });

        for (const booking of expiredBookings) {
            booking.status = "cancelled";
            await booking.save();

            // Release the worker if assigned
            if (booking.worker) {
                await Worker.findByIdAndUpdate(booking.worker, { status: "online" });
            }

            const io = getIO();
            io.to(`booking_${booking._id}`).emit("booking:statusChanged", booking);

            sendNotification({
                recipient: booking.user,
                role: "user",
                title: "Booking Cancelled",
                message: "No worker accepted your booking in time. It has been automatically cancelled.",
                data: { bookingId: booking._id }
            });

            console.log(`[CRON] Cancelled pending booking ${booking._id}`);
        }
    } catch (error) {
        console.error("[CRON] Error in checkPendingBookings:", error.message);
    }
}

async function expireArrivalOTPs() {
    try {
        const expiredOtps = await BookingOtp.find({
            type: "arrival",
            verified: false,
            expiresAt: { $lt: new Date() }
        });

        for (const otpDoc of expiredOtps) {
            const booking = await Booking.findById(otpDoc.booking);
            if (booking && booking.status === "accepted") {
                booking.status = "cancelled";
                await booking.save();

                if (booking.worker) {
                    await Worker.findByIdAndUpdate(booking.worker, { status: "online" });
                }

                const io = getIO();
                io.to(`booking_${booking._id}`).emit("booking:statusChanged", booking);

                sendNotification({
                    recipient: booking.user,
                    role: "user",
                    title: "Booking Cancelled",
                    message: "The arrival OTP expired. The booking has been automatically cancelled.",
                    data: { bookingId: booking._id }
                });
                
                if (booking.worker) {
                    sendNotification({
                        recipient: booking.worker,
                        role: "worker",
                        title: "Booking Cancelled",
                        message: "The arrival OTP expired. The booking has been automatically cancelled.",
                        data: { bookingId: booking._id }
                    });
                }

                console.log(`[CRON] Cancelled booking ${booking._id} due to expired Arrival OTP`);
            }
            await BookingOtp.findByIdAndDelete(otpDoc._id);
        }
    } catch (error) {
        console.error("[CRON] Error in expireArrivalOTPs:", error.message);
    }
}

async function expireCompletionOTPs() {
    try {
        const expiredOtps = await BookingOtp.find({
            type: "completion",
            verified: false,
            expiresAt: { $lt: new Date() }
        });

        for (const otpDoc of expiredOtps) {
            // Delete the expired OTP so a new one can be generated
            console.log(`[CRON] Expired Completion OTP deleted for booking ${otpDoc.booking}`);
            await BookingOtp.findByIdAndDelete(otpDoc._id);
            
            // Optionally notify parties that OTP expired and they should request a new one
        }
    } catch (error) {
        console.error("[CRON] Error in expireCompletionOTPs:", error.message);
    }
}

async function sweepInactiveWorkers() {
    try {
        // Find all online workers who have autoOfflineTimeout > 0 (meaning not manual-only)
        const activeWorkers = await Worker.find({ status: "online", autoOfflineTimeout: { $gt: 0 } });
        let offlineCount = 0;

        for (const worker of activeWorkers) {
            const timeoutThreshold = new Date(Date.now() - worker.autoOfflineTimeout * 60 * 1000);
            if (worker.lastActive < timeoutThreshold) {
                worker.status = "offline";
                await worker.save();
                offlineCount++;
            }
        }
        
        if (offlineCount > 0) {
            console.log(`[CRON] Set ${offlineCount} inactive workers to offline.`);
        }
    } catch (error) {
        console.error("[CRON] Error in sweepInactiveWorkers:", error.message);
    }
}

const { refreshDashboardData } = require("../controllers/adminController");
const cloudinary = require("../config/cloudinary");

// Helper to extract Cloudinary public_id from secure_url
function extractPublicId(url) {
    if (!url || !url.includes("cloudinary.com")) return null;
    try {
        const parts = url.split("/");
        const filenameWithExt = parts.pop();
        const folder2 = parts.pop();
        const folder1 = parts.pop();
        const filename = filenameWithExt.split(".")[0];
        // Expecting something like "fixmate/bookings/xyz123"
        return `${folder1}/${folder2}/${filename}`;
    } catch (error) {
        return null;
    }
}

async function cleanupOldCancelledBookingImages() {
    try {
        // 30 days ago
        const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        
        // Find cancelled bookings older than 30 days that still have images
        const oldBookings = await Booking.find({
            status: "cancelled",
            updatedAt: { $lt: cutoffDate },
            $or: [
                { issueImage: { $ne: "" } },
                { beforePhoto: { $ne: "" } },
                { afterPhoto: { $ne: "" } }
            ]
        });

        if (oldBookings.length === 0) return;

        console.log(`[CRON] Cleaning up Cloudinary assets for ${oldBookings.length} old cancelled bookings...`);

        for (const booking of oldBookings) {
            const urlsToDelete = [booking.issueImage, booking.beforePhoto, booking.afterPhoto].filter(Boolean);
            
            for (const url of urlsToDelete) {
                const publicId = extractPublicId(url);
                if (publicId) {
                    await cloudinary.uploader.destroy(publicId).catch(err => 
                        console.error(`Failed to delete Cloudinary asset ${publicId}:`, err.message)
                    );
                }
            }

            // Clear the URLs from the DB so we don't try to delete them again
            booking.issueImage = "";
            booking.beforePhoto = "";
            booking.afterPhoto = "";
            await booking.save();
        }
    } catch (error) {
        console.error("[CRON] Error in cleanupOldCancelledBookingImages:", error.message);
    }
}

async function checkPlatformFeeLocks() {
    try {
        const PlatformFeeOwed = require("../models/PlatformFeeOwed");
        
        // Find unpaid fees past due
        const overdueFees = await PlatformFeeOwed.find({
            status: "pending",
            dueAt: { $lt: new Date() }
        });

        for (const fee of overdueFees) {
            const worker = await Worker.findById(fee.worker);
            if (worker && worker.canAcceptJobs) {
                worker.canAcceptJobs = false;
                await worker.save();
                
                sendNotification({
                    recipient: worker.user, // Worker's user id
                    role: "worker",
                    title: "Account Locked",
                    message: "Your account has been locked due to unpaid platform fees. Pay your dues to accept new jobs."
                });

                console.log(`[CRON] Locked worker ${worker._id} due to unpaid fees`);
            }
        }
    } catch (error) {
        console.error("[CRON] Error in checkPlatformFeeLocks:", error.message);
    }
}

function initCronJobs() {
    // Run every minute
    cron.schedule("* * * * *", async () => {
        await checkPendingBookings();
        await expireArrivalOTPs();
        await expireCompletionOTPs();
        await sweepInactiveWorkers();
    });

    // Run every 15 minutes for less frequent checks
    cron.schedule("*/15 * * * *", async () => {
        await checkPlatformFeeLocks();
    });

    // Run every 5 minutes to refresh admin dashboard cache
    cron.schedule("*/5 * * * *", async () => {
        await refreshDashboardData();
    });

    // Run daily at 2:00 AM to clean up orphaned Cloudinary images
    cron.schedule("0 2 * * *", async () => {
        await cleanupOldCancelledBookingImages();
    });

    // Trigger an initial refresh on startup so the cache isn't empty
    refreshDashboardData();

    console.log("Background CRON jobs initialized.");
}

module.exports = { initCronJobs };
