const express = require('express');
const { getPurchaseOrders, getPurchaseOrder, createPurchaseOrder, updatePurchaseOrderStatus } = require('../controllers/purchaseOrderController');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('admin'));

router
    .route('/')
    .get(getPurchaseOrders)
    .post(createPurchaseOrder);

router
    .route('/:id')
    .get(getPurchaseOrder);

router
    .route('/:id/status')
    .put(updatePurchaseOrderStatus);

module.exports = router;
