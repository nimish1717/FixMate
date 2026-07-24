const Shopkeeper = require("../models/Shopkeeper");
const User = require("../models/User");
const Shop = require("../models/Shop");

const createShopkeeper = async (req, res) => {
    try {
        const { name, phone, email, shopName, address, gstin } = req.body;
        const existingUser = await User.findOne({ phone });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User already exist"
            });
        }
        const getRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{1}Z[A-Z0-9]{1}$/;

        if (!getRegex.test(gstin)) {
            return res.status(400).json({
                success: false,
                message: "Invalid GSTIN format"
            });
        }
        const existingGST = await Shopkeeper.findOne({ gstin });
        if (existingGST) {
            return res.status(400).json({
                success: false,
                message: "GSTIN already registered"
            });
        }
        const user = await User.create({
            name,
            phone,
            email,
            role: "shopkeeper"
        })
        const shopkeeper = await Shopkeeper.create({
            user: user._id,
            shopName,
            address,
            gstin
        });

        const shop = await Shop.create({
            shopkeeperId: shopkeeper._id,
            shopName,
            address,
            phone
        });

        return res.status(201).json({
            success: true,
            message: "Shopkeeper created successfully",
            shopkeeper,
            shop
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const getAllShopkeepers = async (req, res) => {
    try {
        const shopkeepers = await Shopkeeper.find({ isActive: true }).populate("user", "name phone email");
        return res.status(200).json({
            success: true,
            count: shopkeepers.length,
            shopkeepers
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

const getShopkeeperById = async (req, res) => {
    try {
        const { id } = req.params;
        const shopkeeper = await Shopkeeper.findById(id).populate("user", "name email phone");
        if (!shopkeeper) {
            return res.status(404).json({
                success: false,
                message: "Shopkeeper not found"
            })
        }
        return res.status(200).json({
            success: true,
            shopkeeper
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

const updateShopkeeper = async (req, res) => {
    try {
        const { id } = req.params;
        const { shopName, address, gstin } = req.body;
        const shopkeeper = await Shopkeeper.findById(id);
        if (!shopkeeper) {
            return res.status(404).json({
                success: false,
                message: "Shopkeeper not found"
            });
        }
        if (gstin) {
            const gstRegex =
                /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{1}Z[A-Z0-9]{1}$/;

            if (!gstRegex.test(gstin)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid GSTIN format"
                });
            }
            const existingGST = await Shopkeeper.findOne({
                gstin,
                _id: { $ne: id }
            });
            if (existingGST) {
                return res.status(400).json({
                    success: false,
                    message: "GSTIN already registered"
                });
            }
            shopkeeper.gstin = gstin;
        }
        if (shopName) {
            shopkeeper.shopName = shopName;
        }
        if (address) {
            shopkeeper.address = address;
        }
        await shopkeeper.save();  //save the updated value
        return res.status(200).json({
            success: true,
            message: "Shopkeeper updated successfully",
            shopkeeper
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

const verifyShopkeeper = async (req, res) => {
    try {
        const { id } = req.params;
        const { isVerified } = req.body;

        const shopkeeper = await Shopkeeper.findById(id);
        if (!shopkeeper) {
            return res.status(404).json({
                success: false,
                message: "Shopkeeper not found"
            })
        }
        shopkeeper.isVerified = isVerified;
        await shopkeeper.save();
        return res.status(200).json({
            success: true,
            message: `Shopkeeper ${isVerified ? "verified" : "unverified"
                } successfully`,
            shopkeeper
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

const deleteShopkeeper = async (req, res) => {
    try {
        const { id } = req.params;
        const shopkeeper = await Shopkeeper.findById(id);

        if (!shopkeeper) {
            return res.status(404).json({
                success: false,
                message: "Shopkeeper not found"
            });
        }

        shopkeeper.isActive = false;
        await shopkeeper.save();
        return res.status(200).json({
            success: true,
            message: "Shopkeeper deleted successfully"
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

const getShopkeeperProfile = async (req, res) => {
    try {
        const shopkeeper = await Shopkeeper.findOne({ user: req.user.id }).populate("user", "name email phone");
        if (!shopkeeper) {
            return res.status(404).json({ success: false, message: "Shopkeeper profile not found" });
        }
        return res.status(200).json({ success: true, shopkeeper });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    createShopkeeper,
    getAllShopkeepers,
    getShopkeeperById,
    updateShopkeeper,
    verifyShopkeeper,
    deleteShopkeeper,
    getShopkeeperProfile
};