require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('./models/User');
const RetailerProfile = require('./models/RetailerProfile');
const Product = require('./models/Product');
const connectDB = require('./config/db');

const seedData = async () => {
    try {
        await connectDB();
        console.log('MongoDB Connected');

        // Clear existing data (optional, be careful)
        // await User.deleteMany({});
        // await RetailerProfile.deleteMany({});
        // await Product.deleteMany({});

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash('password123', salt);

        // 1. Create/Update Admin
        let admin = await User.findOne({ email: 'admin@knockanti.com' });
        if (!admin) {
            admin = await User.create({
                name: 'Super Admin',
                email: 'admin@knockanti.com',
                phone: '9999999999',
                passwordHash,
                role: 'ADMIN',
                status: 'ACTIVE'
            });
            console.log('Admin created');
        } else {
            admin.passwordHash = passwordHash;
            await admin.save();
            console.log('Admin password updated');
        }

        // 2. Create/Update Retailer
        let retailer = await User.findOne({ email: 'retailer@knockanti.com' });
        let profile;

        if (!retailer) {
            retailer = new User({
                name: 'Rajesh Gupta',
                email: 'retailer@knockanti.com',
                phone: '9876543210',
                passwordHash,
                role: 'RETAILER',
                status: 'ACTIVE'
            });
            const savedRetailer = await retailer.save();

            // Generate API key for SmartSync
            const apiKey = crypto.randomBytes(32).toString('hex');

            profile = await RetailerProfile.create({
                user: savedRetailer._id,
                storeName: 'Gupta General Store',
                gstin: '27AAAAA0000A1Z5',
                apiKey, // Add API key for SmartSync
                address: {
                    street: '12, MG Road, Indiranagar',
                    city: 'Bangalore',
                    state: 'Karnataka',
                    pincode: '560038'
                }
            });

            savedRetailer.retailerProfile = profile._id;
            await savedRetailer.save();
            console.log('Retailer created');
        } else {
            retailer.passwordHash = passwordHash;
            retailer.status = 'ACTIVE'; // Force active
            await retailer.save();
            console.log('Retailer password updated');
            profile = await RetailerProfile.findOne({ user: retailer._id });

            // Add API key if missing
            if (profile && !profile.apiKey) {
                profile.apiKey = crypto.randomBytes(32).toString('hex');
                await profile.save();
                console.log('Retailer API key generated');
            }
        }

        // 3. Add/Update Products (Always run this to fix data)
        if (profile) {
            // Remove existing products for this retailer (to avoid duplicates or bad data)
            // We search by both potential IDs to clean up previous mess
            await Product.deleteMany({
                $or: [
                    { retailer: retailer._id },
                    { retailer: profile._id }
                ]
            });

            const products = [
                { name: 'Amul Butter 500g', price: 285, stockQuantity: 50, category: 'Dairy', sku: 'AMUL-001' },
                { name: 'Tata Salt 1kg', price: 28, stockQuantity: 100, category: 'Essentials', sku: 'TATA-001' },
                { name: 'Maggi Noodles 4-Pack', price: 56, stockQuantity: 200, category: 'Snacks', sku: 'MAGGI-004' },
                { name: 'Coca Cola 750ml', price: 45, stockQuantity: 60, category: 'Drinks', sku: 'COKE-750' },
                { name: 'Aashirvaad Atta 5kg', price: 240, stockQuantity: 30, category: 'Essentials', sku: 'Essentials', sku: 'ASH-005' }
            ];

            await Product.insertMany(products.map(p => ({
                ...p,
                retailer: profile._id // Correct: Link to RetailerProfile
            })));
            console.log('Products re-seeded correctly');
        }

        // 4. Create/Update Customer
        let customer = await User.findOne({ email: 'customer@knockanti.com' });
        if (!customer) {
            await User.create({
                name: 'Rahul Sharma',
                email: 'customer@knockanti.com',
                phone: '9898989898',
                passwordHash,
                role: 'CUSTOMER',
                status: 'ACTIVE'
            });
            console.log('Customer created');
        } else {
            customer.passwordHash = passwordHash;
            await customer.save();
            console.log('Customer password updated');
        }

        // 5. Create/Update Delivery Partner
        let deliveryPartner = await User.findOne({ email: 'delivery@knockanti.com' });
        if (!deliveryPartner) {
            await User.create({
                name: 'Vikram Singh',
                email: 'delivery@knockanti.com',
                phone: '9777777777',
                passwordHash,
                role: 'DELIVERY_PARTNER',
                status: 'ACTIVE',
                isOnline: true
            });
            console.log('Delivery Partner created');
        } else {
            deliveryPartner.passwordHash = passwordHash;
            await deliveryPartner.save();
            console.log('Delivery Partner password updated');
        }

        console.log('Seeding complete!');
        process.exit();
    } catch (error) {
        console.error('Error seeding data:', error);
        process.exit(1);
    }
};

seedData();
