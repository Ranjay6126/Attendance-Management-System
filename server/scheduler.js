const cron = require('node-cron');
const User = require('./models/User');
const Attendance = require('./models/Attendance');
const Notification = require('./models/Notification');
const dotenv = require('dotenv');

dotenv.config();

// Task 1: Send Notification at 10:00 AM
const scheduleNotificationReminder = () => {
    // Runs every day at 10:00 AM
    cron.schedule('0 10 * * *', async () => {
        console.log('🔔 Running 10:00 AM attendance reminder...');
        try {
            const today = new Date().toISOString().split('T')[0];
            const dayOfWeek = new Date().getDay();
            
            // Skip if Sunday (0)
            if (dayOfWeek === 0) {
                console.log('Sunday - Skipping notification');
                return;
            }

            // Get all users except SuperAdmin
            const users = await User.find({ role: { $ne: 'SuperAdmin' } });
            
            // Check if they've already marked attendance today
            for (const user of users) {
                const existingAttendance = await Attendance.findOne({
                    user: user._id,
                    date: today
                });

                if (!existingAttendance) {
                    // Create notification
                    await Notification.create({
                        user: user._id,
                        title: '📅 Mark Your Attendance',
                        message: 'Good morning! Please mark your attendance for today.',
                        type: 'attendance_reminder'
                    });
                    
                    console.log(`📢 Reminder sent to ${user.email} - Please mark attendance!`);
                }
            }
        } catch (error) {
            console.error('Error in notification scheduler:', error);
        }
    });
};

// Task 2: Auto-mark Absent at 6:00 PM
const scheduleAutoMarkAbsent = () => {
    // Runs every day at 6:00 PM (18:00)
    cron.schedule('0 18 * * *', async () => {
        console.log('⏰ Running auto-mark absent job...');
        try {
            const today = new Date().toISOString().split('T')[0];
            const dayOfWeek = new Date().getDay();
            
            // Skip if Sunday (0)
            if (dayOfWeek === 0) {
                console.log('Sunday - Skipping auto-mark absent');
                return;
            }

            // Get all users (Employee and Admin)
            const users = await User.find({ role: { $in: ['Employee', 'Admin'] } });
            
            let markedAbsentCount = 0;
            
            for (const user of users) {
                const existingAttendance = await Attendance.findOne({
                    user: user._id,
                    date: today
                });

                // If no attendance record exists, create one as Absent
                if (!existingAttendance) {
                    await Attendance.create({
                        user: user._id,
                        date: today,
                        status: 'Absent',
                        attendanceType: 'Office',
                        remarks: 'Auto-marked absent - No attendance recorded'
                    });
                    
                    // Create absence notification
                    await Notification.create({
                        user: user._id,
                        title: '❌ Marked as Absent',
                        message: `You were marked as Absent for ${today} as no attendance was recorded.`,
                        type: 'absence_alert'
                    });
                    
                    markedAbsentCount++;
                    console.log(`❌ ${user.email} marked as Absent`);
                }
            }

            console.log(`✅ Auto-mark absent complete: ${markedAbsentCount} users marked absent`);
        } catch (error) {
            console.error('Error in auto-mark absent scheduler:', error);
        }
    });
};

// Initialize all schedulers
const initializeSchedulers = () => {
    console.log('📅 Initializing attendance schedulers...');
    scheduleNotificationReminder();
    scheduleAutoMarkAbsent();
    console.log('✅ Schedulers initialized successfully');
    console.log('⏰ Schedulers configured:');
    console.log('   📢 10:00 AM - Attendance reminder notification');
    console.log('   ❌ 6:00 PM - Auto-mark absent (if no attendance)');
    console.log('   (Sundays are excluded from both tasks)');
};

module.exports = { initializeSchedulers };
