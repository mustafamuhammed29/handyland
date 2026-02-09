const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

// Public/Protected User Routes
router.put('/profile', protect, userController.updateUserProfile);
router.put('/change-password', protect, userController.changePassword);

// Admin Routes (Require Admin Role)
router.get('/admin/all', protect, authorize('admin'), userController.getAllUsers);
router.get('/admin/stats', protect, authorize('admin'), userController.getUserStats);
router.get('/admin/:id', protect, authorize('admin'), userController.getUser);
router.put('/admin/:id/status', protect, authorize('admin'), userController.updateUserStatus);
router.put('/admin/:id/role', protect, authorize('admin'), userController.updateUserRole);
router.delete('/admin/:id', protect, authorize('admin'), userController.deleteUser);

module.exports = router;
