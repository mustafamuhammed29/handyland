const express = require('express');
const { getSuppliers, getSupplier, createSupplier, updateSupplier, deleteSupplier } = require('../controllers/supplierController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('admin'));

router
    .route('/')
    .get(getSuppliers)
    .post(createSupplier);

router
    .route('/:id')
    .get(getSupplier)
    .put(updateSupplier)
    .delete(deleteSupplier);

module.exports = router;
