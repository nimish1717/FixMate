const Worker = require("../models/Workers");
const Shopkeeper = require("../models/Shopkeeper");
const User = require("../models/User");
const Shop = require("../models/Shop");
const WorkerLedger = require("../models/WorkerLedger");
const Review = require("../models/Review");

const clientToDbCategory = {
    plumbing: "Plumbing",
    electrical: "Electrical",
    ac_repair: "AC Repair",
    carpentry: "Carpentry",
    ro_repair: "RO Repair",
    cleaning: "Cleaning",
    painting: "Painting",
    pest: "Pest Control"
};

const createWorker = async (req, res) => {
    try {
        const {
            name,
            phone,
            email,
            category,
            experience,
        } = req.body;

        const shopkeeper = await Shopkeeper.findOne({
            user: req.user.id,
            isActive: true,
        });

        if (!shopkeeper) {
            return res.status(404).json({
                success: false,
                message: "Shopkeeper not found",
            });
        }

        const existingUser = await User.findOne({ phone });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "Phone number already exists",
            });
        }

        const user = await User.create({
            name,
            phone,
            email,
            role: "worker",
        });

        const worker = await Worker.create({
            user: user._id,
            shopkeeper: shopkeeper._id,
            category,
            experience,
        });

        return res.status(201).json({
            success: true,
            message: "Worker created successfully",
            worker,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

const getMyWorkers = async (req, res) => {
    try {
        const shopkeeper = await Shopkeeper.findOne({
            user: req.user.id,
            isActive: true
        });
        if (!shopkeeper) {
            return res.status(404).json({
                success: false,
                message: "Shopkeeper Not found"
            });
        }

        // We removed isActive: true to allow shopkeepers to see deactivated workers too
        const workers = await Worker.find({
            shopkeeper: shopkeeper._id,
        }).populate(
            "user",
            "name phone email role"
        );

        const Booking = require("../models/Booking");
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const workersWithStats = await Promise.all(
            workers.map(async (worker) => {
                const jobsThisMonth = await Booking.countDocuments({
                    worker: worker._id,
                    status: "completed",
                    createdAt: { $gte: startOfMonth }
                });

                const warrantyClaims = await Booking.countDocuments({
                    worker: worker._id,
                    isWarrantyClaim: true
                });

                return {
                    ...worker.toObject(),
                    jobsThisMonth,
                    warrantyClaims
                };
            })
        );

        return res.status(200).json({
            success: true,
            count: workersWithStats.length,
            workers: workersWithStats,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

const getWorkerById = async (req, res) => {
    try {
        const { id } = req.params;
        const worker = await Worker.findById(id).populate("user", "name phone email role").populate("shopkeeper", "shopName");

        if (!worker) {
            return res.status(404).json({
                success: false,
                message: "Worker not found"
            })
        }

        let workerData = worker.toObject();

        // Fetch the associated Shop for this shopkeeper
        if (worker.shopkeeper) {
            const shop = await Shop.findOne({ shopkeeperId: worker.shopkeeper._id });
            if (shop) {
                workerData.shop = shop;
                // For backward compatibility on the frontend until fully transitioned
                workerData.shopkeeper.shopName = shop.shopName;
            }
        }

        if (req.user.role === "shopkeeper") {
            const shopkeeper = await Shopkeeper.findOne({
                user: req.user.id,
                isActive: true
            })
            if (!shopkeeper) {
                return res.status(404).json({
                    success: false,
                    message: "Shopkeeper not found",
                });
            }
            if (worker.shopkeeper._id.toString() !== shopkeeper._id.toString()) {
                return res.status(403).json({
                    success: false,
                    message: "Access denied",
                });
            }
        }

        const Review = require("../models/Review");
        const reviews = await Review.find({ worker: worker._id })
            .populate("user", "name")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            worker: workerData,
            reviews,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

const updateWorker = async (req, res) => {
    try {
        const { id } = req.params;
        const { category, experience, status } = req.body;
        const shopkeeper = await Shopkeeper.findOne({
            user: req.user.id,
            isActive: true
        })
        if (!shopkeeper) {
            return res.status(404).json({
                success: false,
                message: "Shopkeeper not found"
            })
        }
        const worker = await Worker.findById(id);
        if (!worker) {
            return res.status(404).json({
                success: false,
                message: "Worker not found"
            })
        }
        if (worker.shopkeeper.toString() !== shopkeeper._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Access denied",
            });
        }
        if (category !== undefined) {
            worker.category = category;
        }
        if (experience !== undefined) {
            worker.experience = experience;
        }
        if (status !== undefined) {
            worker.status = status;
        }
        if (req.body.isActive !== undefined) {
            worker.isActive = req.body.isActive;
        }
        await worker.save();
        return res.status(200).json({
            success: true,
            message: "Worker updated successfully",
            worker,
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

const verifyWorker = async (req, res) => {
    try {
        const { id } = req.params;
        const { isVerified } = req.body;
        const worker = await Worker.findById(id);
        if (!worker) {
            return res.status(404).json({
                success: false,
                message: "Worker not found",
            });
        }
        if (req.user.role === "shopkeeper") {
            const shopkeeper = await Shopkeeper.findOne({
                user: req.user.id,
                isActive: true,
            });

            if (!shopkeeper) {
                return res.status(404).json({
                    success: false,
                    message: "Shopkeeper not found",
                });
            }
            if (worker.shopkeeper.toString() !== shopkeeper._id.toString()) {
                return res.status(403).json({
                    success: false,
                    message: "Access denied",
                });
            }
        }
        worker.isVerified = isVerified;
        await worker.save();

        return res.status(200).json({
            success: true,
            message: `Worker ${isVerified ? "verified" : "unverified"
                } successfully`,
            worker,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

const deleteWorker = async (req, res) => {
    try {
        const { id } = req.params;
        const shopkeeper = await Shopkeeper.findOne({
            user: req.user.id,
            isActive: true,
        });
        if (!shopkeeper) {
            return res.status(404).json({
                success: false,
                message: "Shopkeeper not found",
            });
        }
        const worker = await Worker.findById(id);
        if (!worker) {
            return res.status(404).json({
                success: false,
                message: "Worker not found",
            });
        }
        if (worker.shopkeeper.toString() !== shopkeeper._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Access denied",
            });
        }
        worker.isActive = false;
        await worker.save();

        return res.status(200).json({
            success: true,
            message: "Worker deleted successfully",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

const getNearbyWorkers = async (req, res) => {
    try {
        const { longitude, latitude, category, radius = 10000, status, experience, trustScore, sortBy } = req.query;

        if (!longitude || !latitude) {
            return res.status(400).json({ success: false, message: "Longitude and latitude are required" });
        }

        let geoQuery = {
            isActive: true,
            canAcceptJobs: true,
            status: status === "all" ? { $in: ["online", "busy"] } : "online"
        };

        if (category) {
            geoQuery.category = clientToDbCategory[category] || category;
        }

        if (experience) {
            geoQuery.experience = { $gte: parseInt(experience) };
        }

        if (trustScore) {
            geoQuery.trustScore = { $gte: parseInt(trustScore) };
        }

        const aggregatePipeline = [
            {
                $geoNear: {
                    near: {
                        type: "Point",
                        coordinates: [parseFloat(longitude), parseFloat(latitude)]
                    },
                    distanceField: "dist.calculated",
                    maxDistance: parseInt(radius),
                    query: geoQuery,
                    spherical: true
                }
            }
        ];

        if (sortBy === "trustScore") {
            aggregatePipeline.push({ $sort: { trustScore: -1, "dist.calculated": 1 } });
        } else if (sortBy === "experience") {
            aggregatePipeline.push({ $sort: { experience: -1, "dist.calculated": 1 } });
        }

        aggregatePipeline.push({ $limit: 20 });

        let workersAgg = await Worker.aggregate(aggregatePipeline);
        const workers = await Worker.populate(workersAgg, [
            { path: "user", select: "name phone email role" },
            { path: "shopkeeper", select: "shopName" }
        ]);

        const shopkeeperIds = workers.map(w => w.shopkeeper?._id || w.shopkeeper).filter(Boolean);
        const shops = await Shop.find({ shopkeeperId: { $in: shopkeeperIds } });
        const shopMap = shops.reduce((acc, shop) => {
            acc[shop.shopkeeperId.toString()] = shop;
            return acc;
        }, {});

        const mappedWorkers = workers.map(w => {
            let workerData = w;
            if (workerData.shopkeeper) {
                const skId = workerData.shopkeeper._id ? workerData.shopkeeper._id.toString() : workerData.shopkeeper.toString();
                const shop = shopMap[skId];
                if (shop) {
                    workerData.shop = shop;
                    if (workerData.shopkeeper._id) {
                        workerData.shopkeeper.shopName = shop.shopName;
                    }
                }
            }
            return workerData;
        });

        return res.status(200).json({
            success: true,
            count: mappedWorkers.length,
            workers: mappedWorkers,
        });

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const toggleAvailability = async (req, res) => {
    try {
        const { status, coordinates } = req.body;
        if (!["online", "busy", "offline"].includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status" });
        }

        let updateData = { status };
        if (coordinates && Array.isArray(coordinates) && coordinates.length === 2) {
            updateData.location = { type: "Point", coordinates };
        }

        const worker = await Worker.findOneAndUpdate(
            { user: req.user.id },
            updateData,
            { returnDocument: 'after' }
        ).populate("user", "name phone");
        if (!worker) {
            return res.status(404).json({ success: false, message: "Worker not found" });
        }

        return res.status(200).json({ success: true, message: "Availability updated", worker });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const getWorkerEarnings = async (req, res) => {
    try {
        const worker = await Worker.findOne({ user: req.user.id });
        if (!worker) {
            return res.status(404).json({ success: false, message: "Worker not found" });
        }

        const ledgers = await WorkerLedger.find({ worker: worker._id })
            .populate({
                path: "booking",
                select: "category createdAt",
            })
            .sort({ createdAt: -1 });

        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
        startOfWeek.setHours(0, 0, 0, 0);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        let today = 0;
        let week = 0;
        let month = 0;

        ledgers.forEach((l) => {
            const date = new Date(l.createdAt);
            const net = l.amount - l.platformFee;
            if (date >= startOfToday) today += net;
            if (date >= startOfWeek) week += net;
            if (date >= startOfMonth) month += net;
        });

        return res.status(200).json({
            success: true,
            summary: { today, week, month },
            history: ledgers,
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const getPendingFees = async (req, res) => {
    try {
        const worker = await Worker.findOne({ user: req.user.id });
        if (!worker) {
            return res.status(404).json({ success: false, message: "Worker not found" });
        }

        const PlatformFeeOwed = require("../models/PlatformFeeOwed");
        const fees = await PlatformFeeOwed.find({ worker: worker._id, status: "pending" })
            .populate("booking", "category")
            .sort({ dueAt: 1 });

        return res.status(200).json({ success: true, fees, totalUnpaidFees: worker.totalUnpaidFees });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const payPlatformFee = async (req, res) => {
    try {
        // Mock payment flow for platform fees
        const worker = await Worker.findOne({ user: req.user.id });
        if (!worker) {
            return res.status(404).json({ success: false, message: "Worker not found" });
        }

        const PlatformFeeOwed = require("../models/PlatformFeeOwed");
        const fees = await PlatformFeeOwed.find({ worker: worker._id, status: "pending" });

        if (fees.length === 0) {
            return res.status(400).json({ success: false, message: "No pending fees" });
        }

        // Mock payment processing
        await PlatformFeeOwed.updateMany({ worker: worker._id, status: "pending" }, { status: "paid", paidAt: new Date() });

        worker.totalUnpaidFees = 0;
        worker.canAcceptJobs = true; // Unlock
        await worker.save();

        return res.status(200).json({ success: true, message: "Fees paid successfully" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const getProfile = async (req, res) => {
    try {
        const worker = await Worker.findOne({ user: req.user.id }).populate("pendingShopkeeperRequest", "shopName address");
        if (!worker) return res.status(404).json({ success: false, message: "Worker not found" });
        return res.status(200).json({ success: true, worker });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const searchWorkerByPhone = async (req, res) => {
    try {
        const { phone } = req.query;
        if (!phone) return res.status(400).json({ success: false, message: "Phone required" });

        const user = await User.findOne({ phone, role: "worker" });
        if (!user) return res.status(404).json({ success: false, message: "No worker found with this phone number" });

        const worker = await Worker.findOne({ user: user._id }).populate("user", "name phone");
        if (!worker) return res.status(404).json({ success: false, message: "Worker profile not found" });

        return res.status(200).json({
            success: true,
            worker: {
                _id: worker._id,
                name: worker.user.name,
                category: worker.category,
                isVerified: worker.isVerified,
                hasShopkeeper: !!worker.shopkeeper,
                hasPendingRequest: !!worker.pendingShopkeeperRequest
            }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const requestVerification = async (req, res) => {
    try {
        const { id } = req.params;
        const shopkeeper = await Shopkeeper.findOne({ user: req.user.id });
        if (!shopkeeper) return res.status(404).json({ success: false, message: "Shopkeeper not found" });

        const worker = await Worker.findById(id);
        if (!worker) return res.status(404).json({ success: false, message: "Worker not found" });

        if (worker.shopkeeper) {
            return res.status(400).json({ success: false, message: "Worker is already verified by another shop" });
        }

        worker.pendingShopkeeperRequest = shopkeeper._id;
        await worker.save();

        return res.status(200).json({ success: true, message: "Verification request sent to worker" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const removeWorker = async (req, res) => {
    try {
        const { id } = req.params;
        const shopkeeper = await Shopkeeper.findOne({ user: req.user.id });
        if (!shopkeeper) return res.status(404).json({ success: false, message: "Shopkeeper not found" });

        const worker = await Worker.findById(id);
        if (!worker) return res.status(404).json({ success: false, message: "Worker not found" });

        if (worker.shopkeeper?.toString() !== shopkeeper._id.toString()) {
            return res.status(403).json({ success: false, message: "Access denied" });
        }

        worker.shopkeeper = null;
        worker.isVerified = false;
        await worker.save();

        return res.status(200).json({ success: true, message: "Worker removed from your shop" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const acceptVerification = async (req, res) => {
    try {
        const worker = await Worker.findOne({ user: req.user.id });
        if (!worker) return res.status(404).json({ success: false, message: "Worker not found" });

        if (!worker.pendingShopkeeperRequest) {
            return res.status(400).json({ success: false, message: "No pending request" });
        }

        worker.shopkeeper = worker.pendingShopkeeperRequest;
        worker.isVerified = true;
        worker.pendingShopkeeperRequest = null;
        await worker.save();

        return res.status(200).json({ success: true, message: "You are now verified and linked to the shop" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const rejectVerification = async (req, res) => {
    try {
        const worker = await Worker.findOne({ user: req.user.id });
        if (!worker) return res.status(404).json({ success: false, message: "Worker not found" });

        worker.pendingShopkeeperRequest = null;
        await worker.save();

        return res.status(200).json({ success: true, message: "Request rejected" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const heartbeat = async (req, res) => {
    try {
        const worker = await Worker.findOneAndUpdate(
            { user: req.user.id },
            { lastActive: new Date() }
        );
        if (!worker) {
            return res.status(404).json({ success: false, message: "Worker not found" });
        }
        res.status(200).json({ success: true, message: "Heartbeat recorded" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

const getMyReviews = async (req, res) => {
    try {
        const worker = await Worker.findOne({ user: req.user.id });
        if (!worker) {
            return res.status(404).json({ success: false, message: "Worker profile not found" });
        }

        const reviews = await Review.find({ worker: worker._id })
            .populate("user", "name profileImage")
            .populate("booking", "category createdAt status")
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, reviews });
    } catch (error) {
        console.error("Fetch reviews error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

const updateAutoOfflineTimeout = async (req, res) => {
    try {
        const { timeout } = req.body;

        if (timeout === undefined || isNaN(timeout)) {
            return res.status(400).json({ success: false, message: "Invalid timeout value" });
        }

        const worker = await Worker.findOneAndUpdate(
            { user: req.user.id },
            { autoOfflineTimeout: Number(timeout) },
            { new: true }
        );

        if (!worker) {
            return res.status(404).json({ success: false, message: "Worker not found" });
        }

        res.status(200).json({ success: true, autoOfflineTimeout: worker.autoOfflineTimeout });
    } catch (error) {
        console.error("Update autoOfflineTimeout error:", error);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

module.exports = {
    createWorker,
    getMyWorkers,
    getWorkerById,
    updateWorker,
    verifyWorker,
    deleteWorker,
    getNearbyWorkers,
    toggleAvailability,
    getWorkerEarnings,
    getPendingFees,
    payPlatformFee,
    getProfile,
    searchWorkerByPhone,
    requestVerification,
    removeWorker,
    acceptVerification,
    rejectVerification,
    heartbeat,
    getMyReviews,
    updateAutoOfflineTimeout
}