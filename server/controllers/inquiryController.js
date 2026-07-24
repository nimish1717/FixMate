const ShopInquiry = require("../models/ShopInquiry");
const Shop = require("../models/Shop");
const Message = require("../models/Message");
const Shopkeeper = require("../models/Shopkeeper");

const createOrGetInquiry = async (req, res) => {
    try {
        const { shopId } = req.body;
        let inquiry = await ShopInquiry.findOne({ user: req.user.id, shop: shopId, status: "open" });
        if (!inquiry) {
            inquiry = await ShopInquiry.create({
                user: req.user.id,
                shop: shopId,
            });
        }
        res.status(200).json({ success: true, inquiry });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const getInquiries = async (req, res) => {
    try {
        if (req.user.role === "shopkeeper") {
            const sk = await Shopkeeper.findOne({ user: req.user.id });
            if (!sk) return res.status(404).json({ success: false, message: "Shopkeeper not found" });
            const shopDoc = await Shop.findOne({ shopkeeperId: sk._id });
            if (!shopDoc) return res.status(404).json({ success: false, message: "Shop not found" });

            const inquiries = await ShopInquiry.find({ shop: shopDoc._id })
                .populate("user", "name phone")
                .populate("shop")
                .sort({ updatedAt: -1 });
            return res.status(200).json({ success: true, inquiries });
        } else {
            const inquiries = await ShopInquiry.find({ user: req.user.id })
                .populate("shop")
                .populate({ path: "shop", populate: { path: "shopkeeperId" } })
                .sort({ updatedAt: -1 });
            return res.status(200).json({ success: true, inquiries });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const getInquiryById = async (req, res) => {
    try {
        const inquiry = await ShopInquiry.findById(req.params.id)
            .populate("user", "name")
            .populate("shop");
        if (!inquiry) return res.status(404).json({ success: false, message: "Inquiry not found" });
        res.status(200).json({ success: true, inquiry });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const getMessages = async (req, res) => {
    try {
        const messages = await Message.find({ inquiryId: req.params.id }).sort({ createdAt: 1 });
        res.status(200).json({ success: true, messages });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = { createOrGetInquiry, getInquiries, getInquiryById, getMessages };
