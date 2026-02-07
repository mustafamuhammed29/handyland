const express = require('express');
const router = express.Router();
const controller = require('../controllers/repairArchiveController');

router.get('/', controller.getAllCases);
router.post('/', controller.createCase);
router.delete('/:id', controller.deleteCase);
router.put('/:id', controller.updateCase);

module.exports = router;
