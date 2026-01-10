const express = require('express');
const router = express.Router();
const { loginUser, registerUser, getMe, setupSuperAdmin } = require('../controllers/authController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/login', loginUser);
router.post('/register', protect, authorize('SuperAdmin', 'Admin'), registerUser);
router.get('/me', protect, getMe);
router.post('/setup', setupSuperAdmin);

module.exports = router;
