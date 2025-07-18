const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: [
        'http://localhost:5173',
        'http://localhost:5174',
        'https://gatherguru-frontend.vercel.app',
        'https://gatherguru-frontend.netlify.app',
        process.env.FRONTEND_URL
    ].filter(Boolean),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: ['set-cookie']
}));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
const eventBannersDir = path.join(uploadsDir, 'event-banners');
const profileImagesDir = path.join(uploadsDir, 'profile-images');

if (!require('fs').existsSync(uploadsDir)) {
    require('fs').mkdirSync(uploadsDir);
}
if (!require('fs').existsSync(eventBannersDir)) {
    require('fs').mkdirSync(eventBannersDir);
}
if (!require('fs').existsSync(profileImagesDir)) {
    require('fs').mkdirSync(profileImagesDir);
}

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/gatherguru', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('MongoDB Connected');
    } catch (err) {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    }
};

connectDB();

// Routes
app.use('/api/events', require('./routes/eventRoutes'));
app.use('/api', require('./routes/authRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/organizer', require('./routes/organizerRoutes'));
app.use('/api/profile', require('./routes/profileRoutes'));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        message: err.message || 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`)); 