const Booking = require("../models/Booking");
const Worker = require("../models/Workers");

// In-memory store for throttling: { [workerId]: { latitude, longitude, timestamp } }
const lastLocationUpdates = {};

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth's radius in metres
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in metres
}

module.exports = (io, socket) => {
    socket.on("location:update", async (data) => {
        try {
            // Only workers should emit locations
            if (socket.user.role !== "worker") return;

            const workerDoc = await Worker.findOne({ user: socket.user.id });
            if (!workerDoc) return;
            const workerId = workerDoc._id.toString();

            // 1. Throttle Location Updates
            const now = Date.now();
            const lastUpdate = lastLocationUpdates[workerId];

            if (lastUpdate) {
                const timeDiff = now - lastUpdate.timestamp;
                const distance = calculateDistance(
                    lastUpdate.latitude, lastUpdate.longitude,
                    data.latitude, data.longitude
                );

                // If less than 7 seconds HAVE passed AND movement is < 20 meters, ignore
                if (timeDiff < 7000 && distance < 20) {
                    return; // Skip broadcasting to save bandwidth
                }
            }

            // 2. Validate Booking Ownership
            const booking = await Booking.findById(data.bookingId);
            if (!booking) return;

            if (!booking.worker || booking.worker.toString() !== workerId) {
                console.log(`Unauthorized location update attempt by worker ${workerId} for booking ${data.bookingId}`);
                return; // Reject spoofed location
            }

            // Update throttle map
            lastLocationUpdates[workerId] = {
                latitude: data.latitude,
                longitude: data.longitude,
                timestamp: now
            };

            // 3. Update Worker DB (Fire and forget to not block socket)
            Worker.findByIdAndUpdate(workerId, {
                location: {
                    type: "Point",
                    coordinates: [data.longitude, data.latitude] // GeoJSON format: [longitude, latitude]
                },
                lastActive: new Date()
            }).catch(err => console.error("Failed to update Worker location in DB", err));

            // Also save to Booking for Coming Charge calculations
            booking.workerLastLocation = {
                lat: data.latitude,
                lng: data.longitude,
                timestamp: new Date()
            };
            booking.save().catch(err => console.error("Failed to update booking workerLastLocation", err));

            // 4. Broadcast to user
            io.to(`user_${booking.user}`).emit("location:update", {
                workerId: workerId,
                bookingId: data.bookingId,
                latitude: data.latitude,
                longitude: data.longitude,
                timestamp: new Date()
            });
        } catch (error) {
            console.error("Error in location:update:", error);
        }
    });
};
