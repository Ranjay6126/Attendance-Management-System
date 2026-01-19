const express = require('express');
const router = express.Router();
const { loginUser, registerUser, getMe, setupSuperAdmin, uploadProfileImage } = require('../controllers/authController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { uploadMiddleware } = require('../middleware/uploadMiddleware');

router.post('/login', loginUser);
router.post('/register', protect, authorize('SuperAdmin', 'Admin'), registerUser);
router.get('/me', protect, getMe);
router.post('/setup', setupSuperAdmin);
router.post('/upload-profile-image', protect, uploadMiddleware, uploadProfileImage);

module.exports = router;
