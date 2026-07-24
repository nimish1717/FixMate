const router = require("express").Router();
const { predictCategory } = require("../controllers/mlController");
const { protect } = require("../middleware/authMiddleware");
const authorize = require("../middleware/authorize");
const upload = require("../middleware/upload");

router.post(
    "/predict-category",
    protect,
    authorize("user"),
    upload.single("issueImage"),
    predictCategory
);

module.exports = router;
