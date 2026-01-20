// Attendance routes: check-in/out, history, rectification, approval, export, analytics
const express = require('express');
const router = express.Router();
const { 
    checkIn, 
    checkOut, 
    getAttendance, 
    rectifyAttendance, 
    approveAttendance, 
    exportAttendance,
    getAnalytics 
} = require('../controllers/attendanceController');
// protect: JWT verification; authorize: role guard; upload: Multer for image handling
const { protect, authorize } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/uploadMiddleware');

router.post('/checkin', protect, upload.single('image'), checkIn);
router.put('/checkout', protect, upload.single('image'), checkOut);
router.get('/', protect, getAttendance);
router.put('/:id/rectify', protect, authorize('SuperAdmin', 'Admin'), rectifyAttendance);
router.put('/:id/approve', protect, authorize('SuperAdmin', 'Admin'), approveAttendance);
router.get('/export', protect, exportAttendance);
router.get('/analytics', protect, authorize('SuperAdmin', 'Admin'), getAnalytics);

module.exports = router;
