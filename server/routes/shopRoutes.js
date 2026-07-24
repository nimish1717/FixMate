const express = require("express");
const router = express.Router();
const { getNearbyShops } = require("../controllers/shopController");

router.get("/nearby", getNearbyShops);

module.exports = router;
