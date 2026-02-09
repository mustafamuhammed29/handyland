const express = require('express');
const router = express.Router();
const repairController = require('../controllers/repairController');
const repairTicketController = require('../controllers/repairTicketController');
const { protect, authorize } = require('../middleware/auth');

// Public routes (Catalog & Estimation)
router.get('/', repairController.getRepairCatalog);
router.get('/catalog', repairController.getRepairCatalog);
router.post('/estimate', repairController.estimateRepairCost); // Replaces getRepairAdvice

// Protected routes (Tickets)
router.post('/tickets', protect, repairTicketController.createTicket);
router.get('/tickets/my-tickets', protect, repairTicketController.getMyTickets);
router.get('/tickets/:id', protect, repairTicketController.getTicket);

// Admin routes (Catalog Management & Ticket Status)
router.post('/devices', protect, authorize('admin'), repairController.createDevice);
router.put('/devices/:id', protect, authorize('admin'), repairController.updateDevice);
router.delete('/devices/:id', protect, authorize('admin'), repairController.deleteDevice);
router.put('/devices/:id/services', protect, authorize('admin'), repairController.updateDeviceServices);

// Admin Ticket Management
router.put('/tickets/:id/status', protect, authorize('admin'), repairTicketController.updateTicketStatus);

module.exports = router;
