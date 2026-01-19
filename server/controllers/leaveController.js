const Leave = require('../models/Leave');
const User = require('../models/User');

// Create Leave Request
exports.createLeave = async (req, res) => {
    try {
        const { leaveType, startDate, endDate, reason } = req.body;
        const userId = req.user.id;

        if (!leaveType || !startDate || !endDate || !reason) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Calculate number of days
        const start = new Date(startDate);
        const end = new Date(endDate);
        const timeDifference = end - start;
        const numberOfDays = Math.ceil(timeDifference / (1000 * 60 * 60 * 24)) + 1;

        if (numberOfDays <= 0) {
            return res.status(400).json({ message: 'End date must be after start date' });
        }

        const newLeave = new Leave({
            user: userId,
            leaveType,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            numberOfDays,
            reason,
        });

        await newLeave.save();
        res.status(201).json({ message: 'Leave request created successfully', leave: newLeave });
    } catch (error) {
        console.error('Error creating leave:', error);
        res.status(500).json({ message: 'Error creating leave request', error: error.message });
    }
};

// Get My Leaves
exports.getMyLeaves = async (req, res) => {
    try {
        const userId = req.user.id;
        const leaves = await Leave.find({ user: userId })
            .populate('user', 'name email department role')
            .populate('approvedBy', 'name email')
            .sort({ createdAt: -1 });

        res.json(leaves);
    } catch (error) {
        console.error('Error fetching leaves:', error);
        res.status(500).json({ message: 'Error fetching leaves', error: error.message });
    }
};

// Get All Leaves (Admin/SuperAdmin can view all leaves)
exports.getAllLeaves = async (req, res) => {
    try {
        const userRole = req.user.role;

        if (!['Admin', 'SuperAdmin'].includes(userRole)) {
            return res.status(403).json({ message: 'Not authorized to view all leaves' });
        }

        let query = {};
        
        // Admin can only see leaves from their department (if applicable)
        if (userRole === 'Admin') {
            const admin = await User.findById(req.user.id);
            if (admin.department) {
                const departmentUsers = await User.find({ department: admin.department }).select('_id');
                query.user = { $in: departmentUsers.map(u => u._id) };
            }
        }

        const leaves = await Leave.find(query)
            .populate('user', 'name email department role')
            .populate('approvedBy', 'name email')
            .sort({ createdAt: -1 });

        res.json(leaves);
    } catch (error) {
        console.error('Error fetching all leaves:', error);
        res.status(500).json({ message: 'Error fetching leaves', error: error.message });
    }
};

// Get Leave by ID
exports.getLeaveById = async (req, res) => {
    try {
        const { id } = req.params;
        const leave = await Leave.findById(id)
            .populate('user', 'name email department role')
            .populate('approvedBy', 'name email');

        if (!leave) {
            return res.status(404).json({ message: 'Leave not found' });
        }

        res.json(leave);
    } catch (error) {
        console.error('Error fetching leave:', error);
        res.status(500).json({ message: 'Error fetching leave', error: error.message });
    }
};

// Approve Leave
exports.approveLeave = async (req, res) => {
    try {
        const { id } = req.params;
        const { comments } = req.body;
        const approverId = req.user.id;

        if (!['Admin', 'SuperAdmin'].includes(req.user.role)) {
            return res.status(403).json({ message: 'Not authorized to approve leaves' });
        }

        const leave = await Leave.findByIdAndUpdate(
            id,
            {
                status: 'Approved',
                approvedBy: approverId,
                approvalDate: new Date(),
                comments,
                updatedAt: new Date(),
            },
            { new: true }
        ).populate('user', 'name email').populate('approvedBy', 'name email');

        if (!leave) {
            return res.status(404).json({ message: 'Leave not found' });
        }

        res.json({ message: 'Leave approved successfully', leave });
    } catch (error) {
        console.error('Error approving leave:', error);
        res.status(500).json({ message: 'Error approving leave', error: error.message });
    }
};

// Reject Leave
exports.rejectLeave = async (req, res) => {
    try {
        const { id } = req.params;
        const { comments } = req.body;
        const approverId = req.user.id;

        if (!['Admin', 'SuperAdmin'].includes(req.user.role)) {
            return res.status(403).json({ message: 'Not authorized to reject leaves' });
        }

        const leave = await Leave.findByIdAndUpdate(
            id,
            {
                status: 'Rejected',
                approvedBy: approverId,
                approvalDate: new Date(),
                comments,
                updatedAt: new Date(),
            },
            { new: true }
        ).populate('user', 'name email').populate('approvedBy', 'name email');

        if (!leave) {
            return res.status(404).json({ message: 'Leave not found' });
        }

        res.json({ message: 'Leave rejected successfully', leave });
    } catch (error) {
        console.error('Error rejecting leave:', error);
        res.status(500).json({ message: 'Error rejecting leave', error: error.message });
    }
};

// Cancel Leave (User can cancel their own pending leaves)
exports.cancelLeave = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const leave = await Leave.findById(id);
        if (!leave) {
            return res.status(404).json({ message: 'Leave not found' });
        }

        if (leave.user.toString() !== userId && req.user.role !== 'SuperAdmin') {
            return res.status(403).json({ message: 'Not authorized to cancel this leave' });
        }

        if (leave.status !== 'Pending' && leave.status !== 'Approved') {
            return res.status(400).json({ message: 'Can only cancel Pending or Approved leaves' });
        }

        const updatedLeave = await Leave.findByIdAndUpdate(
            id,
            {
                status: 'Cancelled',
                updatedAt: new Date(),
            },
            { new: true }
        ).populate('user', 'name email').populate('approvedBy', 'name email');

        res.json({ message: 'Leave cancelled successfully', leave: updatedLeave });
    } catch (error) {
        console.error('Error cancelling leave:', error);
        res.status(500).json({ message: 'Error cancelling leave', error: error.message });
    }
};

// Update Leave (Only if pending)
exports.updateLeave = async (req, res) => {
    try {
        const { id } = req.params;
        const { leaveType, startDate, endDate, reason } = req.body;
        const userId = req.user.id;

        const leave = await Leave.findById(id);
        if (!leave) {
            return res.status(404).json({ message: 'Leave not found' });
        }

        if (leave.user.toString() !== userId && req.user.role !== 'SuperAdmin') {
            return res.status(403).json({ message: 'Not authorized to update this leave' });
        }

        if (leave.status !== 'Pending') {
            return res.status(400).json({ message: 'Can only update Pending leaves' });
        }

        // Calculate number of days
        const start = new Date(startDate);
        const end = new Date(endDate);
        const timeDifference = end - start;
        const numberOfDays = Math.ceil(timeDifference / (1000 * 60 * 60 * 24)) + 1;

        if (numberOfDays <= 0) {
            return res.status(400).json({ message: 'End date must be after start date' });
        }

        const updatedLeave = await Leave.findByIdAndUpdate(
            id,
            {
                leaveType,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                numberOfDays,
                reason,
                updatedAt: new Date(),
            },
            { new: true }
        ).populate('user', 'name email').populate('approvedBy', 'name email');

        res.json({ message: 'Leave updated successfully', leave: updatedLeave });
    } catch (error) {
        console.error('Error updating leave:', error);
        res.status(500).json({ message: 'Error updating leave', error: error.message });
    }
};

// Delete Leave (Only if pending)
exports.deleteLeave = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const leave = await Leave.findById(id);
        if (!leave) {
            return res.status(404).json({ message: 'Leave not found' });
        }

        if (leave.user.toString() !== userId && req.user.role !== 'SuperAdmin') {
            return res.status(403).json({ message: 'Not authorized to delete this leave' });
        }

        if (leave.status !== 'Pending') {
            return res.status(400).json({ message: 'Can only delete Pending leaves' });
        }

        await Leave.findByIdAndDelete(id);
        res.json({ message: 'Leave deleted successfully' });
    } catch (error) {
        console.error('Error deleting leave:', error);
        res.status(500).json({ message: 'Error deleting leave', error: error.message });
    }
};
