const express = require('express');
const http = require('http');
const cors = require('cors');
require("dotenv").config();
const { initCronJobs } = require("./jobs/cronJobs");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const mlRoutes = require("./routes/mlRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const adminRoutes = require("./routes/adminRoutes");
const workerRoutes = require("./routes/workerRoutes");
const shopRoutes = require("./routes/shopRoutes");
const shopkeeperRoutes = require("./routes/shopkeeperRoutes");
const inquiryRoutes = require("./routes/inquiryRoutes");
const reportRoutes = require("./routes/reportRoutes");

connectDB();
const app = express();
app.use(cors());
const server = http.createServer(app);

const { init } = require('./socket/socket');
init(server);

app.use(express.json());

// Initialize Background Jobs
initCronJobs();

app.get('/health', (req, res) => {
    res.send("FIXMATE server is running!");
})

app.use("/api/auth", authRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/bookings", reviewRoutes);
app.use("/api/ml", mlRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/workers", workerRoutes);
app.use("/api/shops", shopRoutes);
app.use("/api/shopkeepers", shopkeeperRoutes);
app.use("/api/inquiries", inquiryRoutes);
app.use("/api/reports", reportRoutes);


const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

module.exports = app;