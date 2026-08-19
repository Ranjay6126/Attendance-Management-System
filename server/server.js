// Core server and framework imports
const express = require('express');
const mongoose = require('mongoose');
// Security and DX middlewares
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const morgan = require('morgan');
// Utilities
const path = require('path');
const cron = require('node-cron');
const fs = require('fs');

dotenv.config();

const app = express();

// Ensure uploads directory exists (for storing selfie images)
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware: parse JSON, enable CORS, set secure headers, log requests
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('common'));

// Static folder for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes: authentication, attendance, notifications, and leaves
const authRoutes = require('./routes/authRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const leaveRoutes = require('./routes/leaveRoutes');
const { initializeSchedulers } = require('./scheduler');

app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/leaves', leaveRoutes);

// Database Connection with fallback default URI
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/attendance_system')
.then(async () => {
    console.log('MongoDB Connected');
    
    // Create indexes for better query performance
    const Attendance = require('./models/Attendance');
    const User = require('./models/User');
    
    try {
        await Attendance.createIndexes([
            { user: 1, date: 1 },
            { date: -1 },
            { user: 1, date: -1 }
        ]);
        
        await User.createIndexes([
            { email: 1 },
            { role: 1 }
        ]);
        
        console.log('Database indexes created successfully');
    } catch (err) {
        console.log('Index creation note:', err.message);
    }
    
    // Initialize attendance schedulers (reminders & auto-absent)
    initializeSchedulers();
})
.catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});

// Cron Job for 11:00 AM Notification (simulated log; real app would push notifications)
cron.schedule('0 11 * * *', () => {
    console.log('SYSTEM NOTIFICATION: Please mark your attendance!');
    // In a real app, this would push a notification via WebSocket or FCM
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
