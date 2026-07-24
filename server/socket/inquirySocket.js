const ShopInquiry = require("../models/ShopInquiry");
const Shop = require("../models/Shop");

module.exports = (io, socket) => {
    socket.on("inquiry:join", async (inquiryId) => {
        try {
            const inquiry = await ShopInquiry.findById(inquiryId).populate("shop");
            
            if (!inquiry) {
                return socket.emit("error", { message: "Inquiry not found" });
            }

            if (socket.user.role === "admin") {
                socket.join(`inquiry_${inquiryId}`);
                return;
            }

            if (!socket.user.id) {
                return socket.emit("error", { message: "Invalid user session" });
            }

            const userId = socket.user.id.toString();

            const isAuthorized = 
                (inquiry.user.toString() === userId) ||
                (inquiry.shop && inquiry.shop.shopkeeperId.toString() === userId);

            if (!isAuthorized) {
                return socket.emit("error", { message: "Unauthorized to join this inquiry room" });
            }

            socket.join(`inquiry_${inquiryId}`);
        } catch (error) {
            console.error("Error joining inquiry room:", error);
            socket.emit("error", { message: "Internal server error" });
        }
    });

    socket.on("inquiry:leave", (inquiryId) => {
        socket.leave(`inquiry_${inquiryId}`);
    });
};
