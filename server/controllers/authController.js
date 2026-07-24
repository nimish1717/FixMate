const User = require("../models/User");
const Shopkeeper = require("../models/Shopkeeper");
const Shop = require("../models/Shop");
const Worker = require("../models/Workers");
const jwt = require("jsonwebtoken");

const otpStore = new Map();

const generateToken = (user) => {
    return jwt.sign(
        {
            id: user._id,
            role: user.role
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "7d",
        }
    );
};

const sendOtp = async (req, res) => {
    try {
        const { phone } = req.body;
        if (!phone) {
            return res.status(400).json({
                success: false,
                message: "Phone number is required"
            });
        }
        const otp = "123456";
        otpStore.set(phone, otp);
        return res.status(200).json({
            success: true,
            message: "OTP Sent Successfully",
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
}

const verifyOtp = async (req, res) => {
    try {
        const { phone, otp, name, role } = req.body;
        const storedOtp = otpStore.get(phone);

        if (!storedOtp || storedOtp != otp) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP"
            });
        }

        let user = await User.findOne({ phone });
        if (!user) {
            return res.status(200).json({
                success: false,
                isRegistered: false,
                message: "User not found. Please register."
            });
        }
        otpStore.delete(phone);
        const token = generateToken(user);

        return res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            user,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (
            email !== process.env.ADMIN_EMAIL ||
            password !== process.env.ADMIN_PASSWORD
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid Credentials"
            });
        }
        const token = jwt.sign(
            {
                role: "admin",
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d",
            }
        );
        return res.status(200).json({
            success: true,
            message: "Admin Login Succesfull",
            token,
            user: { _id: "admin", name: "Admin", role: "admin" }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

const register = async (req, res) => {
    try {
        const { phone, otp, name, role, category, aadhaar, shopName, address, gstin } = req.body;
        const storedOtp = otpStore.get(phone);

        if (!storedOtp || storedOtp != otp) {
            return res.status(400).json({
                success: false,
                message: "Invalid OTP"
            });
        }

        let user = await User.findOne({ phone });
        if (user) {
            return res.status(400).json({
                success: false,
                message: "User already exists. Please log in."
            });
        }

        const userRole = role || "user";

        user = await User.create({
            name,
            phone,
            role: userRole,
        });

        if (userRole === "shopkeeper") {
            const shopkeeper = await Shopkeeper.create({
                user: user._id,
                shopName: shopName || name + "'s Shop",
                address: address || "Not provided",
                gstin: gstin || "PENDING",
            });
            await Shop.create({
                shopkeeperId: shopkeeper._id,
                shopName: shopkeeper.shopName,
                address: shopkeeper.address,
                phone: user.phone,
            });
        } else if (userRole === "worker") {
            await Worker.create({
                user: user._id,
                category: category || "Plumbing",
                aadhaar: aadhaar || undefined,
            });
        }

        otpStore.delete(phone);
        const token = generateToken(user);
        return res.status(201).json({
            success: true,
            message: "Registration successful",
            token,
            user,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
}

const getMe = async (req, res) => {
    try {
        if (req.user.role === "admin") {
            return res.status(200).json({
                success: true,
                user: { _id: "admin", name: "Admin", role: "admin" }
            });
        }

        const user = await User.findById(req.user.id).select("-__v");
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    verifyOtp,
    sendOtp,
    adminLogin,
    register,
    getMe
};