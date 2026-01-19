const mongoose = require('mongoose');

const LeaveSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    leaveType: {
        type: String,
        enum: ['Sick Leave', 'Casual Leave', 'Paid Leave', 'Unpaid Leave', 'Maternity Leave', 'Paternity Leave', 'Bereavement Leave', 'Other'],
        required: true,
    },
    startDate: {
        type: Date,
        required: true,
    },
    endDate: {
        type: Date,
        required: true,
    },
    numberOfDays: {
        type: Number,
        required: true,
    },
    reason: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected', 'Cancelled'],
        default: 'Pending',
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
    approvalDate: {
        type: Date,
        default: null,
    },
    comments: {
        type: String,
        default: null,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Leave', LeaveSchema);
