require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 5000;

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('Created uploads directory');
}

// Connect to Database
connectDB();

const http = require('http');
const socketIo = require('socket.io');

const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: '*', // Allow all for now, or restrict to client URLs
        methods: ["GET", "POST"]
    }
});

// Make io accessible globally or pass it to routes
app.set('io', io);

io.on('connection', (socket) => {
    console.log('New client connected');
    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

// Start Server
server.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);

    // Start Image Auto-Filler (runs every 5 minutes)
    const { startAutoFiller } = require('./services/imageAutoFiller');
    startAutoFiller(io, 5 * 60 * 1000);
});
