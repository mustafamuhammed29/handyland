const express = require('express');
const router = express.Router();
const emailTemplateController = require('../controllers/emailTemplateController');
const { protect, authorize } = require('../middleware/auth');

// All routes are protected and restricted to administrators
router.use(protect);
router.use(authorize('admin'));

router.route('/')
    .get(emailTemplateController.getTemplates);

router.route('/:id')
    .get(emailTemplateController.getTemplate)
    .put(emailTemplateController.updateTemplate);

module.exports = router;
