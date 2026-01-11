const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const cron = require('node-cron');
const fs = require('fs');

dotenv.config();

const app = express();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('common'));

// Static folder for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
const authRoutes = require('./routes/authRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);

// Database Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/attendance_system')
.then(async () => {
    console.log('MongoDB Connected');
    
    // Create indexes for better performance
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
})
.catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});

// Cron Job for 11:00 AM Notification (Simulated log for now)
cron.schedule('0 11 * * *', () => {
    console.log('SYSTEM NOTIFICATION: Please mark your attendance!');
    // In a real app, this would push a notification via WebSocket or FCM
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
