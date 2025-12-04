const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');

// Import Routes
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const retailerRoutes = require('./routes/retailerRoutes');
const customerRoutes = require('./routes/customerRoutes');
const deliveryRoutes = require('./routes/deliveryRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const smartSyncRoutes = require('./routes/smartSyncRoutes');
const smartSyncAgentRoutes = require('./routes/smartSyncAgentRoutes');

const app = express();

// Middleware
app.use(helmet({
    crossOriginResourcePolicy: false, // Allow loading images from uploads
}));
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176'],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));

// Static folder for uploads and public assets
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use(express.static(path.join(__dirname, '../public')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/retailer', retailerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/smartsync', smartSyncRoutes);
app.use('/api/smartsync', smartSyncAgentRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/customers', customerRoutes);


// Root Route
app.get('/', (req, res) => {
    res.send('KnockKnock API is running...');
});

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

module.exports = app;
