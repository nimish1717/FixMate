const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const Worker = require("../models/Workers");

let io;

function init(server) {
    io = new Server(server, {
        cors: {
            origin: "*"
        }
    });

    // Authentication Middleware
    io.use((socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            
            if (!token) {
                return next(new Error("Authentication error: No token provided"));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // Attach user data to the socket object
            socket.user = decoded;
            next();
        } catch (error) {
            next(new Error("Authentication error: Invalid token"));
        }
    });

    io.on("connection", (socket) => {
        console.log(`Socket connected: ${socket.id} (User ID: ${socket.user.id}, Role: ${socket.user.role})`);

        // Join personal room based on role
        if (socket.user.role === "user") {
            socket.join(`user_${socket.user.id}`);
        } else if (socket.user.role === "worker") {
            // Find the Worker profile ID so notifications (which target worker_WorkerID) work properly
            Worker.findOne({ user: socket.user.id }).then(workerDoc => {
                if (workerDoc) {
                    socket.join(`worker_${workerDoc._id}`);
                    workerDoc.lastActive = new Date();
                    workerDoc.save().catch(err => console.error("Error updating lastActive:", err.message));
                }
            }).catch(err => console.error("Error finding worker for socket:", err.message));
        } else if (socket.user.role === "shopkeeper") {
            socket.join(`shopkeeper_${socket.user.id}`);
        }

        // Initialize sub-modules (we will inject the socket object)
        require("./bookingSocket")(io, socket);
        require("./chatSocket")(io, socket);
        require("./locationSocket")(io, socket);
        require("./inquirySocket")(io, socket);

        socket.on("disconnect", () => {
            console.log(socket.id, "disconnected");
        });
    });

    return io;
}

function getIO() {
    if (!io) {
        throw new Error("Socket.io not initialized!");
    }
    return io;
}

module.exports = {
    init,
    getIO
};
