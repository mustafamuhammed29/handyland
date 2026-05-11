const express = require('express');
const router = express.Router();
const repairController = require('../controllers/repairController');
const repairTicketController = require('../controllers/repairTicketController');
const { protect, authorize, optionalProtect } = require('../middleware/auth');

// Public routes (Catalog & Estimation)
router.get('/', repairController.getRepairCatalog);
router.get('/catalog', repairController.getRepairCatalog);
router.post('/estimate', repairController.estimateRepairCost); // Replaces getRepairAdvice
router.get('/track-guest/:ticketId', repairTicketController.lookupTicket);

// Protected routes (Tickets) - specific paths BEFORE :id catch-all
router.post('/tickets', optionalProtect, repairTicketController.createTicket);
router.get('/my-repairs', protect, repairTicketController.getTickets); // Alias for frontend compatibility
router.get('/tickets/my-tickets', protect, repairTicketController.getTickets);

// Admin Ticket Management - must come BEFORE /tickets/:id
router.get('/tickets/admin/stats', protect, authorize('admin'), repairTicketController.getTicketStats);
router.put('/tickets/:id/status', protect, authorize('admin'), repairTicketController.updateStatus);
router.delete('/tickets/:id', protect, authorize('admin'), repairTicketController.deleteTicket);

// This MUST be last among /tickets routes — it catches any :id
router.get('/tickets/:id', optionalProtect, repairTicketController.getTicket);

// Admin routes (Catalog Management)
router.get('/admin/stats', protect, authorize('admin'), repairController.getRepairCatalogStats);
router.get('/admin/all', protect, authorize('admin'), repairTicketController.getTickets);
router.post('/devices', protect, authorize('admin'), repairController.createDevice);
router.put('/devices/:id', protect, authorize('admin'), repairController.updateDevice);
router.delete('/devices/:id', protect, authorize('admin'), repairController.deleteDevice);
router.put('/devices/:id/services', protect, authorize('admin'), repairController.updateDeviceServices);

module.exports = router;
