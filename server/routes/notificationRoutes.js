const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { protect } = require('../middleware/authMiddleware');

// Get all notifications for logged-in user
router.get('/', protect, async (req, res) => {
    try {
        const notifications = await Notification.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .limit(50);
        
        const unreadCount = await Notification.countDocuments({
            user: req.user._id,
            isRead: false
        });
        
        res.json({
            notifications,
            unreadCount
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching notifications', error: error.message });
    }
});

// Mark notification as read
router.put('/:id/read', protect, async (req, res) => {
    try {
        const notification = await Notification.findByIdAndUpdate(
            req.params.id,
            { isRead: true },
            { new: true }
        );
        res.json(notification);
    } catch (error) {
        res.status(500).json({ message: 'Error updating notification', error: error.message });
    }
});

// Mark all notifications as read
router.put('/mark-all/read', protect, async (req, res) => {
    try {
        await Notification.updateMany(
            { user: req.user._id, isRead: false },
            { isRead: true }
        );
        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating notifications', error: error.message });
    }
});

// Delete a notification
router.delete('/:id', protect, async (req, res) => {
    try {
        await Notification.findByIdAndDelete(req.params.id);
        res.json({ message: 'Notification deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting notification', error: error.message });
    }
});

module.exports = router;
