require("dotenv").config({ path: __dirname + "/../.env" });
const mongoose = require("mongoose");
const Shopkeeper = require("../models/Shopkeeper");
const Shop = require("../models/Shop");
const User = require("../models/User");

const migrate = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB.");

        const shopkeepers = await Shopkeeper.find({}).populate("user");
        console.log(`Found ${shopkeepers.length} shopkeepers to migrate.`);

        for (const sk of shopkeepers) {
            // Check if Shop already exists for this shopkeeper to prevent duplicates on rerun
            const existingShop = await Shop.findOne({ shopkeeperId: sk._id });
            if (!existingShop) {
                const shopPhone = sk.user ? sk.user.phone : "";
                
                await Shop.create({
                    shopkeeperId: sk._id,
                    shopName: sk.shopName,
                    address: sk.address,
                    phone: shopPhone,
                    location: sk.location,
                    isActive: sk.isActive
                });
                console.log(`Created Shop for Shopkeeper ID: ${sk._id}`);
            } else {
                console.log(`Shop already exists for Shopkeeper ID: ${sk._id}. Skipping.`);
            }
        }

        console.log("Migration completed successfully.");
        process.exit(0);
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
};

migrate();
