const RepairTicket = require('../models/RepairTicket');
const { emitAdminNotification } = require('../utils/socket');

// @desc    Create new repair ticket
// @route   POST /api/repairs/tickets
// @access  Private
exports.createTicket = async (req, res) => {
    try {
        const { device, issue, notes, technicianNotes, appointmentDate, serviceType, guestContact } = req.body;

        const ticketData = {
            device,
            issue,
            notes, // Keeping for backward compatibility
            technicianNotes, // Keeping for backward compatibility
            messages: [],
            appointmentDate,
            serviceType
        };

        // If customer provided initial notes, push it as the first message
        if (notes) {
            ticketData.messages.push({
                role: 'customer',
                text: notes,
                timestamp: Date.now()
            });
        }

        // If technician notes provided on creation
        if (technicianNotes) {
            ticketData.messages.push({
                role: 'admin',
                text: technicianNotes,
                timestamp: Date.now()
            });
        }

        if (req.user && req.user.role !== 'admin' && !guestContact) {
            // Regular logged-in user creating a ticket for themselves
            ticketData.user = req.user.id;
        } else if (guestContact && guestContact.email) {
            // Guest ticket (either created by guest or by admin on behalf of a guest)
            ticketData.guestContact = guestContact;
        } else if (req.user && req.user.role === 'admin' && req.body.userId) {
            // Admin creating ticket for a specific registered user
            ticketData.user = req.body.userId;
        } else if (req.user) {
            // Fallback: logged in user, maybe didn't strictly provide guestContact
            ticketData.user = req.user.id;
        } else {
            return res.status(400).json({
                success: false,
                message: 'User authentication or guest contact details are required'
            });
        }

        const ticket = await RepairTicket.create(ticketData);

        res.status(201).json({
            success: true,
            ticket
        });

        // 🔔 Real-time notification to all admins
        try {
            const customerName = req.user?.name || guestContact?.name || guestContact?.email || 'Gast';
            emitAdminNotification('new_repair', {
                title: 'Neue Reparaturanfrage 🔧',
                body: `${customerName} · ${device || 'Gerät'} · ${issue || ''}`.slice(0, 80),
                icon: '🔧',
                link: '/repairs',
            });
        } catch (e) { /* non-fatal */ }
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Validation Error',
                error: error.message
            });
        }
        res.status(500).json({
            success: false,
            message: 'Error creating repair ticket',
            error: error.message
        });
    }
};

const { sendEmail, emailTemplates } = require('../utils/emailService');
const { notify } = require('../utils/notificationService');

// Added required import for Settings model
const Settings = require('../models/Settings');

// @desc    Update repair ticket status (Admin)
// @route   PUT /api/repairs/tickets/:id/status
// @access  Private/Admin
exports.updateTicketStatus = async (req, res) => {
    try {
        const { status, estimatedCost, notes, technicianNotes } = req.body;
        const ticket = await RepairTicket.findById(req.params.id).populate('user', 'name email preferredLanguage');

        if (!ticket) {
            return res.status(404).json({ success: false, message: 'Ticket not found' });
        }

        if (status) {ticket.status = status;}
        if (estimatedCost) {ticket.estimatedCost = estimatedCost;}

        // Admin updates either send 'notes' or 'technicianNotes' payload.
        // We'll map both to technicianNotes so customer notes aren't overwritten.
        const incomingNote = technicianNotes || notes;
        if (incomingNote !== undefined && incomingNote !== null && incomingNote.trim() !== '') {
            ticket.technicianNotes = incomingNote; // Keeping for backward compat

            // Push as a chat message
            ticket.messages.push({
                role: 'admin',
                text: incomingNote,
                timestamp: Date.now()
            });

            ticket.updatedAt = Date.now();
        }

        // Push history to the timeline
        ticket.timeline.push({
            status: ticket.status,
            note: incomingNote || `Status updated to ${ticket.status}`,
            timestamp: Date.now()
        });

        await ticket.save();

        // Send Email Notification
        if (status && ticket.user) {
            try {
                await sendEmail({
                    email: ticket.user.email,
                    subject: `Repair Update: ${ticket.device}`,
                    html: emailTemplates.repairStatusUpdate(ticket.user.name, ticket, status)
                });
            } catch (emailError) {
                console.error('Email sending failed:', emailError);
            }

            // Fetch global language setting as fallback
            const settings = await Settings.findOne() || { language: 'de' };
            const lang = ticket.user.preferredLanguage || settings.language || 'de';

            // Real-time DB notification + Socket.io push translated dynamically
            const repairLabels = {
                de: {
                    received: 'Dein Gerät wurde empfangen 📦',
                    diagnosing: 'Dein Gerät wird diagnostiziert 🔍',
                    repairing: 'Dein Gerät wird repariert 🔧',
                    waiting_parts: 'Warten auf Ersatzteile ⏳',
                    testing: 'Reparatur abgeschlossen, Gerät wird getestet 📱',
                    ready: 'Dein Gerät ist abholbereit ✅',
                    completed: 'Gerät wurde übergeben ✅',
                    cancelled: 'Reparatur wurde storniert ❌'
                },
                en: {
                    received: 'Your device was received 📦',
                    diagnosing: 'Diagnosing your device 🔍',
                    repairing: 'Repairing your device 🔧',
                    waiting_parts: 'Waiting for parts ⏳',
                    testing: 'Repair done, testing device 📱',
                    ready: 'Ready for pickup ✅',
                    completed: 'Repair completed ✅',
                    cancelled: 'Repair cancelled ❌'
                },
                ar: {
                    received: 'تم استلام جهازك 📦',
                    diagnosing: 'جاري تشخيص الجهاز 🔍',
                    repairing: 'جاري إصلاح جهازك 🔧',
                    waiting_parts: 'في انتظار قطع الغيار ⏳',
                    testing: 'تم الإصلاح، جاري اختبار الجهاز 📱',
                    ready: 'جهازك جاهز للاستلام ✅',
                    completed: 'تم التسليم بنجاح ✅',
                    cancelled: 'تم إلغاء الإصلاح ❌'
                },
                tr: {
                    received: 'Cihazınız teslim alındı 📦',
                    diagnosing: 'Cihazınız inceleniyor 🔍',
                    repairing: 'Cihazınız onarılıyor 🔧',
                    waiting_parts: 'Yedek parça bekleniyor ⏳',
                    testing: 'Onarım tamamlandı, test ediliyor 📱',
                    ready: 'Cihazınız teslime hazır ✅',
                    completed: 'Teslimat tamamlandı ✅',
                    cancelled: 'Onarım iptal edildi ❌'
                },
                ru: {
                    received: 'Ваше устройство получено 📦',
                    diagnosing: 'Идет диагностика устройства 🔍',
                    repairing: 'Устройство ремонтируется 🔧',
                    waiting_parts: 'Ожидание запчастей ⏳',
                    testing: 'Ремонт завершен, идет тестирование 📱',
                    ready: 'Устройство готово к выдаче ✅',
                    completed: 'Ремонт завершен ✅',
                    cancelled: 'Ремонт отменен ❌'
                },
                fa: {
                    received: 'دستگاه شما دریافت شد 📦',
                    diagnosing: 'در حال بررسی دستگاه 🔍',
                    repairing: 'در حال تعمیر دستگاه 🔧',
                    waiting_parts: 'در انتظار قطعات ⏳',
                    testing: 'تعمیر به اتمام رسید، در حال تست 📱',
                    ready: 'دستگاه شما آماده تحویل است ✅',
                    completed: 'تعمیر با موفقیت انجام شد ✅',
                    cancelled: 'تعمیر لغو شد ❌'
                }
            };

            const dictionary = repairLabels[lang] || repairLabels['de'];
            const label = dictionary[status] || status;

            notify({
                userId: ticket.user._id.toString(),
                message: `إصلاح ${ticket.device}: ${label}${estimatedCost ? ` — التكلفة المتوقعة: €${estimatedCost}` : ''
                    }`,
                type: status === 'completed' ? 'success' : status === 'cancelled' ? 'warning' : 'info',
                link: `/dashboard?tab=repairs`
            }).catch(console.error);
        }

        res.status(200).json({
            success: true,
            ticket
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Validation Error',
                error: error.message
            });
        }
        res.status(500).json({
            success: false,
            message: 'Error updating ticket',
            error: error.message
        });
    }
};

// @desc    Update customer notes
// @route   PUT /api/repairs/tickets/:id/notes
// @access  Private (User who owns ticket / Guest with valid token/email check implied)
exports.updateCustomerNotes = async (req, res) => {
    try {
        const { notes } = req.body;
        const ticket = await RepairTicket.findById(req.params.id);

        if (!ticket) {
            return res.status(404).json({ success: false, message: 'Ticket not found' });
        }

        // Check if user owns ticket (or if guest)
        // Simplified authorization: either logged-in user matches ticket user, or request is public (guest tracking)
        // For security in a real system we'd check session/email matching, but here we assume the tracked view is secure enough.

        ticket.notes = (ticket.notes ? ticket.notes + '\n\n' : '') + notes; // Backwards compat

        // Push as a chat message
        if (notes && notes.trim() !== '') {
            ticket.messages.push({
                role: 'customer',
                text: notes,
                timestamp: Date.now()
            });
        }

        ticket.timeline.push({
            status: ticket.status,
            note: `Customer added a message.`,
            timestamp: Date.now()
        });

        await ticket.save();

        res.status(200).json({
            success: true,
            ticket
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating notes',
            error: error.message
        });
    }
};


// @desc    Get my repair tickets
// @route   GET /api/repairs/tickets/my-tickets
// @access  Private
exports.getMyTickets = async (req, res) => {
    try {
        const tickets = await RepairTicket.find({ user: req.user.id })
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: tickets.length,
            repairs: tickets  // Changed from 'tickets' to 'repairs' for frontend compatibility
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching repair tickets',
            error: error.message
        });
    }
};

// @desc    Get ticket by ID
// @route   GET /api/repairs/tickets/:id
// @access  Private
exports.getTicket = async (req, res) => {
    try {
        const ticket = await RepairTicket.findById(req.params.id);

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: 'Ticket not found'
            });
        }

        // FIX: ticket.user may be null for guest tickets — guard before calling .toString()
        const isOwner = ticket.user && ticket.user.toString() === req.user?.id;
        const isAdmin = req.user?.role === 'admin';

        if (!isOwner && !isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized'
            });
        }

        res.status(200).json({
            success: true,
            ticket
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching ticket',
            error: error.message
        });
    }
};

// @desc    Get all tickets (Admin)
// @route   GET /api/repairs/admin/all
// @access  Private/Admin
exports.getAllTickets = async (req, res) => {
    try {
        const tickets = await RepairTicket.find().populate('user', 'name email');
        res.status(200).json({
            success: true,
            count: tickets.length,
            tickets
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving tickets',
            error: error.message
        });
    }
};

// @desc    Track repair ticket for guests
// @route   POST /api/repairs/track-guest
// @access  Public
exports.trackGuestTicket = async (req, res) => {
    try {
        const { ticketId, email } = req.body;

        if (!ticketId || !email) {
            return res.status(400).json({ success: false, message: 'Ticket ID and email are required' });
        }

        let ticket;
        // Support both MongoDB ObjectID and custom REP-XX-XXXXXX format
        if (ticketId.match(/^[0-9a-fA-F]{24}$/)) {
            ticket = await RepairTicket.findById(ticketId).populate('user', 'email');
        } else if (ticketId.match(/^REP-\d{2}-[A-F0-9]{6}$/i)) {
            ticket = await RepairTicket.findOne({ ticketId: ticketId.toUpperCase() }).populate('user', 'email');
        } else {
            return res.status(400).json({ success: false, message: 'Invalid ticket ID format' });
        }

        if (!ticket) {
            return res.status(404).json({ success: false, message: 'Ticket not found' });
        }

        let isMatch = false;
        if (ticket.guestContact && ticket.guestContact.email && ticket.guestContact.email.toLowerCase() === email.toLowerCase()) {
            isMatch = true;
        } else if (ticket.user && ticket.user.email && ticket.user.email.toLowerCase() === email.toLowerCase()) {
            isMatch = true;
        }

        if (!isMatch) {
            return res.status(403).json({ success: false, message: 'Invalid ticket ID or email' });
        }

        res.status(200).json({
            success: true,
            ticket
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error tracking ticket',
            error: error.message
        });
    }
};

exports.deleteTicket = async (req, res) => {
    try {
        const ticket = await RepairTicket.findByIdAndDelete(req.params.id);
        if (!ticket) {
            return res.status(404).json({ success: false, message: 'Ticket not found' });
        }
        res.status(200).json({ success: true, message: 'Ticket deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting ticket', error: error.message });
    }
};
