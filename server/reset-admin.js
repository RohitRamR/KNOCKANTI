require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');
const connectDB = require('./src/config/db');

const resetAdmin = async () => {
    try {
        await connectDB();
        console.log('MongoDB Connected');

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash('password123', salt);

        let admin = await User.findOne({
            $or: [
                { email: 'admin@knockanti.com' },
                { phone: '9999999999' }
            ]
        });

        if (!admin) {
            admin = await User.create({
                name: 'Super Admin',
                email: 'admin@knockanti.com',
                phone: '9999999999',
                passwordHash,
                role: 'ADMIN',
                status: 'ACTIVE'
            });
            console.log('Admin created with password: password123');
        } else {
            console.log(`Found admin user: ${admin.email} (${admin.phone})`);
            // Ensure email is correct if we found by phone
            admin.email = 'admin@knockanti.com';
            admin.role = 'ADMIN'; // Force role to ADMIN
            admin.passwordHash = passwordHash;
            await admin.save();
            console.log('Admin password reset to: password123');
        }

        process.exit();
    } catch (error) {
        console.error('Error resetting admin:', error);
        process.exit(1);
    }
};

resetAdmin();
