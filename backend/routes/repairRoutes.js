const express = require('express');
const router = express.Router();
const repairController = require('../controllers/repairController');
const repairTicketController = require('../controllers/repairTicketController'); // New controller
const { protect, authorize } = require('../middleware/auth'); // Ensure middleware is imported

// ==========================================
// REPAIR TICKET ROUTES (USER)
// ==========================================
router.post('/tickets', protect, repairTicketController.createTicket);
router.get('/tickets/my-tickets', protect, repairTicketController.getMyTickets);
router.get('/tickets/:id', protect, repairTicketController.getTicket);

// ==========================================
// CATALOG ROUTES
// ==========================================

router.get('/', repairController.getRepairCatalog);
router.post('/', repairController.createDevice);
router.put('/:id', repairController.updateDevice);
router.delete('/:id', repairController.deleteDevice);
router.post('/advice', repairController.getRepairAdvice);
router.put('/:id/services', repairController.updateDeviceServices);

module.exports = router;
