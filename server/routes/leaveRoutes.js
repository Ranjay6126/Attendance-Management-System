const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
    createLeave,
    getMyLeaves,
    getAllLeaves,
    getLeaveById,
    approveLeave,
    rejectLeave,
    cancelLeave,
    updateLeave,
    deleteLeave,
} = require('../controllers/leaveController');

// Leave requests
router.post('/create', protect, createLeave);
router.get('/my-leaves', protect, getMyLeaves);
router.get('/all-leaves', protect, authorize('SuperAdmin', 'Admin'), getAllLeaves);
router.get('/:id', protect, getLeaveById);
router.put('/:id/approve', protect, authorize('SuperAdmin', 'Admin'), approveLeave);
router.put('/:id/reject', protect, authorize('SuperAdmin', 'Admin'), rejectLeave);
router.put('/:id/cancel', protect, cancelLeave);
router.put('/:id/update', protect, updateLeave);
router.delete('/:id', protect, deleteLeave);

module.exports = router;
