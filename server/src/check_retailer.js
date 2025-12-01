const mongoose = require('mongoose');
const User = require('./models/User');
const RetailerProfile = require('./models/RetailerProfile');
require('dotenv').config();

const checkRetailers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const retailers = await User.find({ role: 'RETAILER' });
        console.log(`Found ${retailers.length} retailers`);

        for (const retailer of retailers) {
            console.log(`Retailer: ${retailer.name} (${retailer.email})`);
            console.log(`  RetailerProfile ID: ${retailer.retailerProfile}`);

            if (retailer.retailerProfile) {
                const profile = await RetailerProfile.findById(retailer.retailerProfile);
                console.log(`  Profile Found: ${!!profile}`);
                if (profile) {
                    console.log(`  Store Name: ${profile.storeName}`);
                    const Product = require('./models/Product');
                    const products = await Product.find({ retailer: retailer.retailerProfile });
                    console.log(`  Products Count: ${products.length}`);
                    products.forEach(p => console.log(`    - ${p.name} (Price: ${p.price}, Stock: ${p.stockQuantity})`));
                }
            } else {
                console.log('  NO RETAILER PROFILE LINKED!');
            }
        }

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

checkRetailers();
