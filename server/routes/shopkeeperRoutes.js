const express = require("express");
const {
    createShopkeeper,
    getAllShopkeepers,
    getShopkeeperById,
    updateShopkeeper,
    verifyShopkeeper,
    deleteShopkeeper,
    getShopkeeperProfile
} = require("../controllers/shopkeeperController");
const { protect } = require("../middleware/authMiddleware");
const authorize = require("../middleware/authorize");


const router = express.Router();

router.get(
    "/me",
    protect,
    authorize("shopkeeper"),
    getShopkeeperProfile
);

router.post(
    "/create-shopkeeper",
    protect,
    authorize("admin"),
    createShopkeeper
);
router.get(
    "/get-shopkeepers",
    protect,
    authorize("admin"),
    getAllShopkeepers
);
router.get(
    "/get-shopkeeper/:id",
    protect,
    authorize("admin"),
    getShopkeeperById
);

router.put(
    "/update-shopkeeper/:id",
    protect,
    authorize("admin"),
    updateShopkeeper
);

router.delete(
    "/delete-shopkeeper/:id",
    protect,
    authorize("admin"),
    deleteShopkeeper
);

router.patch(
    "/verify-shopkeeper/:id",
    protect,
    authorize("admin"),
    verifyShopkeeper
);

module.exports = router;