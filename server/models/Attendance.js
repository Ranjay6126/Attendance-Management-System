const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    date: {
        type: String, // Format YYYY-MM-DD for easy querying
        required: true,
    },
    checkInTime: {
        type: Date,
    },
    checkOutTime: {
        type: Date,
    },
    status: {
        type: String,
        enum: ['Present', 'Absent', 'Leave', 'Pending Approval'],
        default: 'Pending Approval',
    },
    attendanceType: {
        type: String,
        enum: ['Office', 'WFH', 'Field'],
        default: 'Office',
    },
    checkInImage: {
        type: String,
    },
    checkOutImage: {
        type: String,
    },
    checkInLocation: {
        latitude: Number,
        longitude: Number,
        address: String,
    },
    checkOutLocation: {
        latitude: Number,
        longitude: Number,
        address: String,
    },
    workingHours: {
        type: Number, // In hours or minutes
        default: 0,
    },
    rectificationCount: {
        type: Number,
        default: 0,
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    approvalStatus: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending',
    },
    remarks: {
        type: String,
        default: '',
    }
}, { timestamps: true });

module.exports = mongoose.model('Attendance', AttendanceSchema);
