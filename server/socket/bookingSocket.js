const Booking = require("../models/Booking");
const Worker = require("../models/Workers");

module.exports = (io, socket) => {
    socket.on("booking:join", async (bookingId) => {
        try {
            const booking = await Booking.findById(bookingId);
            
            if (!booking) {
                return socket.emit("error", { message: "Booking not found" });
            }

            if (socket.user.role === "admin") {
                console.log(`Admin joined booking_${bookingId}`);
                socket.join(`booking_${bookingId}`);
                return;
            }

            if (!socket.user.id) {
                return socket.emit("error", { message: "Invalid user session" });
            }

            const userId = socket.user.id.toString();

            // For workers: socket.user.id is the User account ID, but booking.worker
            // stores the Worker profile ID. We must resolve it before comparing.
            let workerProfileId = null;
            if (socket.user.role === "worker") {
                const workerDoc = await Worker.findOne({ user: socket.user.id }).select("_id");
                if (workerDoc) workerProfileId = workerDoc._id.toString();
            }

            const isAuthorized = 
                (booking.user && booking.user.toString() === userId) ||
                (workerProfileId && booking.worker && booking.worker.toString() === workerProfileId) ||
                (booking.shopkeeper && booking.shopkeeper.toString() === userId);

            if (!isAuthorized) {
                console.log(`Unauthorized attempt by User ${userId} to join booking_${bookingId}`);
                return socket.emit("error", { message: "Unauthorized to join this booking room" });
            }

            console.log(`Socket ${socket.id} joining booking room: booking_${bookingId}`);
            socket.join(`booking_${bookingId}`);
        } catch (error) {
            console.error("Error joining booking room:", error);
            socket.emit("error", { message: "Internal server error" });
        }
    });

    socket.on("booking:leave", (bookingId) => {
        socket.leave(`booking_${bookingId}`);
    });
};
