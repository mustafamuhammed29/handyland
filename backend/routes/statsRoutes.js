const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');

router.get('/', statsController.getDashboardStats);
router.get('/user', statsController.getUserStats);

module.exports = router;
