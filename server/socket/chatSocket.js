const Message = require("../models/Message");

module.exports = (io, socket) => {
    socket.on("chat:send", async (data) => {
        try {
            if (data.bookingId) {
                const Booking = require("../models/Booking");
                const booking = await Booking.findById(data.bookingId);
                if (!booking) return socket.emit("error", { message: "Booking not found" });

                if (socket.user.role === "admin") {
                    return socket.emit("error", { message: "Admins cannot send chat messages" });
                }

                if (!socket.user.id) {
                    return socket.emit("error", { message: "Invalid user session" });
                }

                const userId = socket.user.id.toString();
                const isAuthorized = 
                    (booking.user && booking.user.toString() === userId) ||
                    (booking.worker && booking.worker.toString() === userId) ||
                    (booking.shopkeeper && booking.shopkeeper.toString() === userId);

                if (!isAuthorized) {
                    return socket.emit("error", { message: "Unauthorized to send messages here" });
                }

                const msg = await Message.create({
                    bookingId: data.bookingId,
                    senderId: socket.user.id,
                    text: data.text
                });

                const msgPayload = {
                    _id: msg._id,
                    senderId: msg.senderId,
                    bookingId: msg.bookingId,
                    text: msg.text,
                    createdAt: msg.createdAt
                };

                io.to(`booking_${data.bookingId}`).emit("chat:new", msgPayload);

            } else if (data.inquiryId) {
                const ShopInquiry = require("../models/ShopInquiry");
                const inquiry = await ShopInquiry.findById(data.inquiryId).populate("shop");
                if (!inquiry) return socket.emit("error", { message: "Inquiry not found" });

                if (socket.user.role === "admin") {
                    return socket.emit("error", { message: "Admins cannot send chat messages" });
                }

                if (!socket.user.id) {
                    return socket.emit("error", { message: "Invalid user session" });
                }

                const userId = socket.user.id.toString();
                const isAuthorized = 
                    (inquiry.user.toString() === userId) ||
                    (inquiry.shop && inquiry.shop.shopkeeperId.toString() === userId);

                if (!isAuthorized) {
                    return socket.emit("error", { message: "Unauthorized to send messages here" });
                }

                const msg = await Message.create({
                    inquiryId: data.inquiryId,
                    senderId: socket.user.id,
                    text: data.text
                });

                const msgPayload = {
                    _id: msg._id,
                    senderId: msg.senderId,
                    inquiryId: msg.inquiryId,
                    text: msg.text,
                    createdAt: msg.createdAt
                };

                io.to(`inquiry_${data.inquiryId}`).emit("chat:new", msgPayload);
            }
        } catch (error) {
            console.error("Chat send error:", error);
        }
    });
};
