const mongoose = require('mongoose');
const User = require('./src/models/User');
const dotenv = require('dotenv');

dotenv.config();

const bcrypt = require('bcryptjs');

const checkUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const users = await User.find({}, 'name email role');
        console.log('Existing Users:', users);

        const deliveryPartner = users.find(u => u.role === 'DELIVERY_PARTNER');
        if (!deliveryPartner) {
            console.log('No Delivery Partner found. Creating one...');
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash('password123', salt);

            const newUser = await User.create({
                name: 'Jack Ryad',
                email: 'jack@delivery.com',
                passwordHash: passwordHash,
                role: 'DELIVERY_PARTNER',
                phone: '9876543211'
            });
            console.log('Created Delivery Partner:', newUser);
        } else {
            console.log('Delivery Partner exists:', deliveryPartner);
        }

        process.exit();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkUsers();
