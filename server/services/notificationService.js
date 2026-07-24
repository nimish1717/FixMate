const Notification = require("../models/Notification");
const { getIO } = require("../socket/socket");

exports.sendNotification = async ({ recipient, role, title, message, data = {} }) => {
    try {
        // 1. Save to MongoDB
        const notification = await Notification.create({
            recipient,
            role,
            title,
            message,
            data
        });

        // 2. Emit via Socket.IO to personal room
        try {
            const io = getIO();
            io.to(`${role}_${recipient}`).emit("notification:new", notification);
        } catch (socketError) {
            console.error("Socket emission failed for notification:", socketError.message);
        }

        return notification;
    } catch (error) {
        console.error("Failed to save notification:", error.message);
        return null;
    }
};
