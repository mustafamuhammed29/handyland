const express = require('express');
const router = express.Router();
const accessoriesController = require('../controllers/accessoriesController');

router.get('/', accessoriesController.getAccessories);
router.post('/', accessoriesController.createAccessory);

router.put('/:id', accessoriesController.updateAccessory);
router.delete('/:id', accessoriesController.deleteAccessory);

module.exports = router;
