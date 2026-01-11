const Attendance = require('../models/Attendance');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');
const https = require('https');

// Helper for reverse geocoding
const getAddressFromCoordinates = (latitude, longitude) => {
    return new Promise((resolve) => {
        try {
            const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`;
            https.get(url, { headers: { 'User-Agent': 'PlanningGuru/1.0' } }, (res) => {
                let data = '';
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => {
                    try {
                        const parsed = JSON.parse(data);
                        if (parsed && parsed.display_name) {
                            resolve(parsed.display_name);
                        } else {
                            resolve(`Lat: ${latitude}, Long: ${longitude}`);
                        }
                    } catch (e) {
                        resolve(`Lat: ${latitude}, Long: ${longitude}`);
                    }
                });
            }).on('error', () => {
                resolve(`Lat: ${latitude}, Long: ${longitude}`);
            });
        } catch (error) {
            resolve(`Lat: ${latitude}, Long: ${longitude}`);
        }
    });
};

// Helper for Audit Logging
const logAction = async (action, performedBy, targetUser, details) => {
    try {
        await AuditLog.create({
            action,
            performedBy,
            targetUser,
            details
        });
    } catch (err) {
        console.error('Audit Log Error:', err);
    }
};

// @desc    Check In
// @route   POST /api/attendance/checkin
// @access  Private
const checkIn = async (req, res) => {
    try {
        const { latitude, longitude, attendanceType } = req.body;
        const userId = req.user._id;
        const today = new Date().toISOString().split('T')[0];

        // Check if already checked in
        const existingAttendance = await Attendance.findOne({ user: userId, date: today });
        if (existingAttendance) {
            return res.status(400).json({ message: 'Already checked in for today' });
        }

        const checkInImage = req.file ? req.file.path : '';
        
        // Get address from coordinates using reverse geocoding
        const address = await getAddressFromCoordinates(latitude, longitude);

        const attendance = await Attendance.create({
            user: userId,
            date: today,
            checkInTime: new Date(),
            status: 'Pending Approval',
            attendanceType: attendanceType || 'Office',
            checkInImage,
            checkInLocation: {
                latitude,
                longitude,
                address
            }
        });

        res.status(201).json(attendance);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Check Out
// @route   PUT /api/attendance/checkout
// @access  Private
const checkOut = async (req, res) => {
    try {
        const { latitude, longitude } = req.body;
        const userId = req.user._id;
        const today = new Date().toISOString().split('T')[0];

        const attendance = await Attendance.findOne({ user: userId, date: today });

        if (!attendance) {
            return res.status(400).json({ message: 'No check-in record found for today' });
        }

        if (attendance.checkOutTime) {
            return res.status(400).json({ message: 'Already checked out for today' });
        }

        const checkOutImage = req.file ? req.file.path : '';
        const checkOutTime = new Date();
        
        // Get address from coordinates using reverse geocoding
        const address = await getAddressFromCoordinates(latitude, longitude);
        
        // Calculate working hours
        const duration = (checkOutTime - new Date(attendance.checkInTime)) / (1000 * 60 * 60); // in hours

        attendance.checkOutTime = checkOutTime;
        attendance.checkOutImage = checkOutImage;
        attendance.checkOutLocation = {
            latitude,
            longitude,
            address
        };
        attendance.workingHours = duration;

        await attendance.save();

        res.json(attendance);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get Attendance History
// @route   GET /api/attendance
// @access  Private
const getAttendance = async (req, res) => {
    try {
        const { role, _id } = req.user;
        let query = {};
        
        if (role === 'Employee') {
            // Get last 3 months based on date field, not createdAt
            const threeMonthsAgo = new Date();
            threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
            const threeMonthsAgoStr = threeMonthsAgo.toISOString().split('T')[0];
            query = { user: _id, date: { $gte: threeMonthsAgoStr } };
        } else if (role === 'Admin') {
            // Admin can see all employees (no date restriction)
            query = {};
        } else if (role === 'SuperAdmin') {
            // SuperAdmin can see all (no restrictions)
            query = {};
        }
        
        const attendance = await Attendance.find(query)
            .populate('user', 'name email department role')
            .sort({ date: -1 });

        res.json(attendance);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Rectify Attendance
// @route   PUT /api/attendance/:id/rectify
// @access  Private (Admin/SuperAdmin)
const rectifyAttendance = async (req, res) => {
    try {
        const { status, checkInTime, checkOutTime, attendanceType, remarks } = req.body;
        const attendance = await Attendance.findById(req.params.id);

        if (!attendance) {
            return res.status(404).json({ message: 'Attendance not found' });
        }

        let maxRectifications = 5;
        if (req.user.role === 'SuperAdmin') maxRectifications = 10;

        if (attendance.rectificationCount >= maxRectifications) {
            return res.status(400).json({ message: 'Rectification limit reached for this record' });
        }

        // Store old values for audit
        const oldValues = { 
            status: attendance.status, 
            checkInTime: attendance.checkInTime, 
            checkOutTime: attendance.checkOutTime,
            attendanceType: attendance.attendanceType
        };

        attendance.status = status || attendance.status;
        if (checkInTime) attendance.checkInTime = checkInTime;
        if (checkOutTime) attendance.checkOutTime = checkOutTime;
        if (attendanceType) attendance.attendanceType = attendanceType;
        if (remarks) attendance.remarks = remarks;
        
        // Recalculate working hours if times changed
        if (attendance.checkInTime && attendance.checkOutTime) {
             attendance.workingHours = (new Date(attendance.checkOutTime) - new Date(attendance.checkInTime)) / (1000 * 60 * 60);
        }

        attendance.rectificationCount += 1;
        await attendance.save();

        // Audit Log
        await logAction('RECTIFY_ATTENDANCE', req.user._id, attendance.user, {
            attendanceId: attendance._id,
            oldValues,
            newValues: req.body,
            rectificationCount: attendance.rectificationCount
        });

        res.json(attendance);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Approve/Reject Attendance
// @route   PUT /api/attendance/:id/approve
// @access  Private (Admin/SuperAdmin)
const approveAttendance = async (req, res) => {
    try {
        const { approvalStatus, remarks, attendanceType } = req.body; 
        const attendance = await Attendance.findById(req.params.id);

        if (!attendance) {
            return res.status(404).json({ message: 'Attendance not found' });
        }

        attendance.approvalStatus = approvalStatus;
        attendance.approvedBy = req.user._id;
        if (remarks) attendance.remarks = remarks;
        if (attendanceType) attendance.attendanceType = attendanceType;
        
        if (approvalStatus === 'Approved') {
            attendance.status = 'Present'; 
        } else if (approvalStatus === 'Rejected') {
            attendance.status = 'Absent';
        }

        await attendance.save();

        // Audit Log
        await logAction('APPROVE_REJECT_ATTENDANCE', req.user._id, attendance.user, {
            attendanceId: attendance._id,
            status: approvalStatus,
            remarks
        });

        res.json(attendance);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Download Report
// @route   GET /api/attendance/export
// @access  Private
const exportAttendance = async (req, res) => {
    try {
        const { startDate, endDate, employeeId, attendanceType } = req.query;
        const { role, _id } = req.user;

        let query = {};

        // Role-based constraints
        if (role === 'Employee') {
            query.user = _id;
        } else if (role === 'Admin' || role === 'SuperAdmin') {
            if (employeeId) query.user = employeeId;
        }

        // Date Filter
        if (startDate && endDate) {
            query.date = { $gte: startDate, $lte: endDate };
        }

        // Attendance Type Filter
        if (attendanceType) {
            query.attendanceType = attendanceType;
        }

        const attendance = await Attendance.find(query).populate('user', 'name email');

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Attendance');

        worksheet.columns = [
            { header: 'Employee ID', key: 'empId', width: 25 },
            { header: 'Name', key: 'name', width: 20 },
            { header: 'Username', key: 'email', width: 25 },
            { header: 'Date', key: 'date', width: 15 },
            { header: 'Entry Time', key: 'entryTime', width: 20 },
            { header: 'Exit Time', key: 'exitTime', width: 20 },
            { header: 'Working Hours', key: 'hours', width: 15 },
            { header: 'Attendance Type', key: 'type', width: 15 },
            { header: 'Entry Location', key: 'entryLoc', width: 30 },
            { header: 'Exit Location', key: 'exitLoc', width: 30 },
            { header: 'Entry Lat', key: 'entryLat', width: 15 },
            { header: 'Entry Long', key: 'entryLong', width: 15 },
            { header: 'Exit Lat', key: 'exitLat', width: 15 },
            { header: 'Exit Long', key: 'exitLong', width: 15 },
            { header: 'Approval Status', key: 'approval', width: 15 },
            { header: 'Remarks', key: 'remarks', width: 20 },
        ];

        attendance.forEach(record => {
            worksheet.addRow({
                empId: record.user ? record.user._id.toString() : 'Unknown',
                name: record.user ? record.user.name : 'Unknown',
                email: record.user ? record.user.email : 'Unknown',
                date: record.date,
                entryTime: record.checkInTime ? new Date(record.checkInTime).toLocaleTimeString() : '-',
                exitTime: record.checkOutTime ? new Date(record.checkOutTime).toLocaleTimeString() : '-',
                hours: record.workingHours ? record.workingHours.toFixed(2) : '0',
                type: record.attendanceType,
                entryLoc: record.checkInLocation?.address || '-',
                exitLoc: record.checkOutLocation?.address || '-',
                entryLat: record.checkInLocation?.latitude || '-',
                entryLong: record.checkInLocation?.longitude || '-',
                exitLat: record.checkOutLocation?.latitude || '-',
                exitLong: record.checkOutLocation?.longitude || '-',
                approval: record.approvalStatus,
                remarks: record.remarks || '-'
            });
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=' + `attendance_report_${Date.now()}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get Analytics Data
// @route   GET /api/attendance/analytics
// @access  Private (Admin/SuperAdmin)
const getAnalytics = async (req, res) => {
    try {
        const today = new Date();
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            last7Days.push(d.toISOString().split('T')[0]);
        }
        const todayStr = today.toISOString().split('T')[0];
        
        // 1. Today's Stats & Distribution
        const attendanceToday = await Attendance.find({ date: todayStr });
        
        const typeDistribution = {
            Office: attendanceToday.filter(a => a.attendanceType === 'Office').length,
            WFH: attendanceToday.filter(a => a.attendanceType === 'WFH').length,
            Field: attendanceToday.filter(a => a.attendanceType === 'Field').length,
        };

        // 2. Daily Trend (Last 7 Days) via Aggregation
        const trendData = await Attendance.aggregate([
            { $match: { date: { $in: last7Days } } },
            { $group: { _id: "$date", count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);
        
        // Merge with all dates to ensure 0s are represented
        const dailyTrend = last7Days.map(date => {
            const found = trendData.find(item => item._id === date);
            return { date, count: found ? found.count : 0 };
        });

        // 3. Avg Working Hours (Last 7 Days)
        const recentAttendance = await Attendance.find({ 
            date: { $in: last7Days },
            workingHours: { $gt: 0 } 
        });
        
        const totalHours = recentAttendance.reduce((acc, curr) => acc + (curr.workingHours || 0), 0);
        const avgWorkingHours = recentAttendance.length ? (totalHours / recentAttendance.length).toFixed(2) : 0;

        // 4. Employee-wise Attendance (Top 5 Present in Last 30 Days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);
        
        const employeeStats = await Attendance.aggregate([
            { $match: { date: { $gte: thirtyDaysAgo.toISOString().split('T')[0] }, status: 'Present' } },
            { $group: { _id: "$user", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 },
            { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'userInfo' } },
            { $unwind: "$userInfo" },
            { $project: { name: "$userInfo.name", count: 1 } }
        ]);

        res.json({
            todayStats: {
                total: attendanceToday.length,
                present: attendanceToday.length,
            },
            typeDistribution,
            dailyTrend,
            avgWorkingHours,
            employeeStats
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    checkIn,
    checkOut,
    getAttendance,
    rectifyAttendance,
    approveAttendance,
    exportAttendance,
    getAnalytics
};
