const User = require('../models/User');
const Address = require('../models/Address'); // Added
const Order = require('../models/Order');
const bcrypt = require('bcryptjs');

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        user.name = req.body.name || user.name;
        user.phone = req.body.phone || user.phone;
        user.address = req.body.address || user.address;

        // Only allow email update if not taken by another user
        if (req.body.email && req.body.email !== user.email) {
            const existing = await User.findOne({ email: req.body.email });
            if (existing) {
                return res.status(400).json({ success: false, message: 'Email already in use' });
            }
            user.email = req.body.email;
        }

        // Validate and update password if provided
        if (req.body.password) {
            const pw = req.body.password;
            const hasLetter = /[A-Za-z]/.test(pw);
            const hasNumber = /\d/.test(pw);
            const hasSpecial = /[@$!%*#?&]/.test(pw);
            if (pw.length < 8 || pw.length > 20 || !hasLetter || !hasNumber || !hasSpecial) {
                return res.status(400).json({
                    success: false,
                    message: 'Password must be 8-20 characters with at least one letter, number, and special character.'
                });
            }
            user.password = pw;
        }

        const updatedUser = await user.save();

        res.json({
            success: true,
            user: {
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                phone: updatedUser.phone,
                address: updatedUser.address,
                role: updatedUser.role
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating user profile', error: error.message });
    }
};

// @desc    Change Password
// @route   PUT /api/users/change-password
// @access  Private
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user.id).select('+password');

        if (!user) {return res.status(404).json({ success: false, message: 'User not found' });}

        // Use account model's matchPassword method for consistency
        const isMatch = await user.matchPassword(currentPassword);
        if (!isMatch) {return res.status(400).json({ success: false, message: 'Invalid current password' });}

        // Validate new password
        const pw = newPassword;
        const hasLetter = /[A-Za-z]/.test(pw);
        const hasNumber = /\d/.test(pw);
        const hasSpecial = /[@$!%*#?&]/.test(pw);
        if (!pw || pw.length < 8 || pw.length > 20 || !hasLetter || !hasNumber || !hasSpecial) {
            return res.status(400).json({
                success: false,
                message: 'New password must be 8-20 characters with at least one letter, number, and special character.'
            });
        }

        user.password = newPassword; // Will be hashed by pre-save hook
        await user.save();

        res.json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error changing password', error: error.message });
    }
};

// @desc    Get notification preferences
// @route   GET /api/users/notifications
// @access  Private
exports.getNotificationPrefs = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('notificationPrefs');
        if (!user) {return res.status(404).json({ message: 'User not found' });}
        // Fallback defaults if the field doesn't exist yet (old accounts)
        res.json({
            success: true,
            data: user.notificationPrefs || {
                orderUpdates: true,
                repairStatus: true,
                promotions: false,
                newsletter: false
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Update notification preferences
// @route   PUT /api/users/notifications
// @access  Private
exports.updateNotificationPrefs = async (req, res) => {
    try {
        const { orderUpdates, repairStatus, promotions, newsletter } = req.body;
        const user = await User.findById(req.user.id);
        if (!user) {return res.status(404).json({ message: 'User not found' });}

        // Only update provided keys
        user.notificationPrefs = {
            orderUpdates: orderUpdates !== undefined ? !!orderUpdates : (user.notificationPrefs?.orderUpdates ?? true),
            repairStatus: repairStatus !== undefined ? !!repairStatus : (user.notificationPrefs?.repairStatus ?? true),
            promotions: promotions !== undefined ? !!promotions : (user.notificationPrefs?.promotions ?? false),
            newsletter: newsletter !== undefined ? !!newsletter : (user.notificationPrefs?.newsletter ?? false),
        };

        await user.save();
        res.json({ success: true, data: user.notificationPrefs });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error saving preferences', error: error.message });
    }
};

// @desc    Get user addresses
// @route   GET /api/users/addresses
// @access  Private
exports.getAddresses = async (req, res) => {
    try {
        const addresses = await Address.find({ user: req.user.id });
        res.json(addresses);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Add new address
// @route   POST /api/users/addresses
// @access  Private
exports.addAddress = async (req, res) => {
    try {
        const { type, name, street, city, state, zipCode, country } = req.body;
        const address = await Address.create({
            user: req.user.id,
            name: name || req.user.name, // Use provided name or fallback to user's name
            type,
            street,
            city,
            state,
            zipCode,
            country
        });
        res.status(201).json(address);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error adding address', error: error.message });
    }
};

// @desc    Delete address
// @route   DELETE /api/users/addresses/:id
// @access  Private
exports.deleteAddress = async (req, res) => {
    try {
        const address = await Address.findById(req.params.id);
        if (!address) {return res.status(404).json({ message: 'Address not found' });}

        if (address.user.toString() !== req.user.id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        await address.deleteOne();
        res.json({ message: 'Address removed' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error', error: error.message });
    }
};

// @desc    Get all users (Admin)
// @route   GET /api/users/admin/all
// @access  Private/Admin
exports.getAllUsers = async (req, res) => {
    try {
        const { role, status, page = 1, limit = 20, search } = req.query;

        const query = {};

        if (role) {
            query.role = role;
        }

        if (status) {
            query.isActive = status === 'active';
        }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const users = await User.find(query)
            .select('-password +loginAttempts +lockUntil')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const count = await User.countDocuments(query);

        res.status(200).json({
            success: true,
            count,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page),
            users
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching users',
            error: error.message
        });
    }
};

// @desc    Get single user (Admin)
// @route   GET /api/users/admin/:id
// @access  Private/Admin
exports.getUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Get user's orders
        const orders = await Order.find({ user: req.params.id })
            .select('orderNumber totalAmount status createdAt')
            .sort({ createdAt: -1 })
            .limit(10);

        res.status(200).json({
            success: true,
            user: {
                ...user.toObject(),
                ordersCount: orders.length,
                recentOrders: orders
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching user',
            error: error.message
        });
    }
};

// @desc    Update user status (Admin)
// @route   PUT /api/users/admin/:id/status
// @access  Private/Admin
exports.updateUserStatus = async (req, res) => {
    try {
        const { isActive } = req.body;

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        user.isActive = isActive;
        await user.save();

        res.status(200).json({
            success: true,
            message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                isActive: user.isActive
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating user status',
            error: error.message
        });
    }
};

// @desc    Update user role (Admin)
// @route   PUT /api/users/admin/:id/role
// @access  Private/Admin
exports.updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;

        if (!['user', 'seller', 'admin'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid role. Must be: user, seller, or admin'
            });
        }

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Prevent changing own role
        if (user._id.toString() === req.user.id) {
            return res.status(400).json({
                success: false,
                message: 'Cannot change your own role'
            });
        }

        user.role = role;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'User role updated successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating user role',
            error: error.message
        });
    }
};

// @desc    Delete user (Admin)
// @route   DELETE /api/users/admin/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Prevent deleting own account
        if (user._id.toString() === req.user.id) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete your own account'
            });
        }

        await user.deleteOne();

        res.status(200).json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting user',
            error: error.message
        });
    }
};

// @desc    Get user statistics (Admin)
// @route   GET /api/users/admin/stats
// @access  Private/Admin
exports.getUserStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const activeUsers = await User.countDocuments({ isActive: true });
        const inactiveUsers = await User.countDocuments({ isActive: false });

        const usersByRole = await User.aggregate([
            { $group: { _id: '$role', count: { $sum: 1 } } }
        ]);

        const recentUsers = await User.find()
            .select('name email role createdAt')
            .sort({ createdAt: -1 })
            .limit(5);

        res.status(200).json({
            success: true,
            stats: {
                totalUsers,
                activeUsers,
                inactiveUsers,
                usersByRole: usersByRole.reduce((acc, item) => {
                    acc[item._id] = item.count;
                    return acc;
                }, {}),
                recentUsers
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching user statistics',
            error: error.message
        });
    }
};

// @desc    Adjust user wallet balance (Admin)
// @route   POST /api/users/admin/:id/wallet
// @access  Private/Admin
exports.adjustWalletBalance = async (req, res) => {
    try {
        const { amount, note } = req.body; // Amount can be positive or negative
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const adjustmentAmount = parseFloat(amount);
        if (isNaN(adjustmentAmount)) {
            return res.status(400).json({ success: false, message: 'Invalid amount' });
        }

        // Apply adjustment
        user.balance = (user.balance || 0) + adjustmentAmount;

        // Ensure balance does not go negative if you don't allow it.
        // For now, let's allow negative if admins specifically want it, or restrict to 0.
        if (user.balance < 0) {
            user.balance = 0; // Prevent negative balances
        }

        await user.save();

        // Create transaction record
        const Transaction = require('../models/Transaction');
        await Transaction.create({
            user: user._id,
            amount: Math.abs(adjustmentAmount),
            type: adjustmentAmount > 0 ? 'deposit' : 'debit',
            paymentMethod: 'bank_transfer', // or create a 'manual' enum type if you added one, 'bank_transfer' works for now
            status: 'completed',
            description: `Admin Adjustment: ${note || (adjustmentAmount > 0 ? 'Manual Credit' : 'Manual Debit')}`
        });

        res.status(200).json({
            success: true,
            message: `User balance adjusted by ${adjustmentAmount > 0 ? '+' : ''}${adjustmentAmount}€`,
            newBalance: user.balance
        });

    } catch (error) {
        console.error('Admin Wallet Adjustment error:', error);
        res.status(500).json({
            success: false,
            message: 'Error adjusting wallet balance',
            error: error.message
        });
    }
};

// @desc    Unlock user account (Admin) - clears loginAttempts and lockUntil
// @route   PUT /api/users/admin/:id/unlock
// @access  Private/Admin
exports.unlockUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('+loginAttempts +lockUntil');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        await User.updateOne(
            { _id: user._id },
            { $set: { loginAttempts: 0 }, $unset: { lockUntil: 1 } }
        );

        res.status(200).json({
            success: true,
            message: `Account for ${user.email} has been unlocked successfully`
        });
    } catch (error) {
        console.error('Unlock user error:', error);
        res.status(500).json({
            success: false,
            message: 'Error unlocking user account',
            error: error.message
        });
    }
};
