const express = require('express');
const router = express.Router();
const emailController = require('../controllers/emailController');
const { protect, authorize } = require('../middleware/auth');

// All routes require admin authentication
router.use(protect);
router.use(authorize('admin'));

router.get('/templates', emailController.getTemplates);
router.post('/test', emailController.sendTestEmail);
router.get('/logs', emailController.getEmailLogs);

module.exports = router;
