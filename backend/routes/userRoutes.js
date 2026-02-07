const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

// All routes require admin authentication
router.use(protect);
router.use(authorize('admin'));

// User management routes
router.get('/admin/all', userController.getAllUsers);
router.get('/admin/stats', userController.getUserStats);
router.get('/admin/:id', userController.getUser);
router.put('/admin/:id/status', userController.updateUserStatus);
router.put('/admin/:id/role', userController.updateUserRole);
router.delete('/admin/:id', userController.deleteUser);

module.exports = router;
