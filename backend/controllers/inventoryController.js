const Product = require('../models/Product');
const Accessory = require('../models/Accessory');
const RepairPart = require('../models/RepairPart');
const Order = require('../models/Order');

// @desc    Get inventory statistics
// @route   GET /api/inventory/stats
// @access  Private/Admin
exports.getInventoryStats = async (req, res) => {
    try {
        // Fetch all items
        const products = await Product.find({}, 'stock minStock sold price');
        const accessories = await Accessory.find({}, 'stock minStock sold price');
        const parts = await RepairPart.find({}, 'stock minStock sold price');

        const allItems = [...products, ...accessories, ...parts];

        let totalStock = 0;
        let totalValue = 0;
        let lowStockCount = 0;
        let criticalStockCount = 0;
        let outOfStockCount = 0;
        let totalItemsSold = 0;

        allItems.forEach(item => {
            totalStock += item.stock;
            totalValue += (item.stock * item.price);
            totalItemsSold += item.sold;

            if (item.stock === 0) {
                outOfStockCount++;
            } else if (item.stock < 2) {
                criticalStockCount++;
            } else if (item.stock < 5) {
                lowStockCount++;
            }
        });

        // Calculate total revenue from paid/delivered orders
        const orders = await Order.find({
            status: { $in: ['paid', 'processing', 'shipped', 'delivered'] }
        }, 'totalAmount');

        const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);

        res.json({
            success: true,
            data: {
                totalStock,
                totalValue,
                lowStockCount,
                criticalStockCount,
                outOfStockCount,
                totalItemsSold,
                totalRevenue
            }
        });
    } catch (error) {
        console.error('Error fetching inventory stats:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get all inventory items combined (Products, Accessories, RepairParts)
// @route   GET /api/inventory/items
// @access  Private/Admin
exports.getInventoryItems = async (req, res) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 15;
        const skip = (page - 1) * limit;
        const search = req.query.search ? req.query.search.toLowerCase() : '';
        const typeFilter = req.query.type || 'All';
        const stockFilter = req.query.stock || 'All';

        const matchStage = {};

        if (search) {
            matchStage.$or = [
                { name: { $regex: search, $options: 'i' } },
                { barcode: { $regex: search, $options: 'i' } },
                { category: { $regex: search, $options: 'i' } }
            ];
        }

        if (stockFilter === 'Low') {
            matchStage.$expr = { $and: [ { $gt: ["$stock", 0] }, { $lte: ["$stock", { $ifNull: ["$minStock", 5] }] } ] };
        } else if (stockFilter === 'Out') {
            matchStage.stock = 0;
        }

        // Base projection
        const projectStage = {
            name: 1, category: 1, subCategory: 1, brand: 1, model: 1, barcode: 1,
            stock: 1, minStock: 1, sold: 1, price: 1, costPrice: 1,
            supplierName: 1, supplierContact: 1, image: 1, isActive: 1, itemType: 1
        };

        // Aggregation pipeline starting with Products
        let pipeline = [];
        
        // Ensure itemType is appended in each collection
        if (typeFilter === 'All' || typeFilter === 'Product') {
            pipeline.push({ $addFields: { itemType: 'Product' } });
            pipeline.push({ $project: projectStage });
        }

        // Union with Accessories
        if (typeFilter === 'All' || typeFilter === 'Accessory') {
            const accessoryPipeline = [
                { $addFields: { itemType: 'Accessory' } },
                { $project: projectStage }
            ];
            if (typeFilter === 'All') {
                pipeline.push({ $unionWith: { coll: "accessories", pipeline: accessoryPipeline } });
            } else if (typeFilter === 'Accessory') {
                pipeline = accessoryPipeline; // if only accessory requested, start with this
            }
        }

        // Union with RepairParts
        if (typeFilter === 'All' || typeFilter === 'RepairPart') {
            const partsPipeline = [
                { $addFields: { itemType: 'RepairPart' } },
                { $project: projectStage }
            ];
            if (typeFilter === 'All') {
                pipeline.push({ $unionWith: { coll: "repairparts", pipeline: partsPipeline } });
            } else if (typeFilter === 'RepairPart') {
                pipeline = partsPipeline; // if only repair requested, start with this
            }
        }
        
        // If typeFilter is Accessory or RepairPart and NOT All, we need to run aggregate on the specific model
        let TargetModel = Product;
        if (typeFilter === 'Accessory') TargetModel = Accessory;
        if (typeFilter === 'RepairPart') TargetModel = RepairPart;

        // Apply filters
        if (Object.keys(matchStage).length > 0) {
            pipeline.push({ $match: matchStage });
        }

        // Sort by stock ascending internally before pagination
        pipeline.push({ $sort: { stock: 1, name: 1 } });

        // Clone pipeline for count before skipping and limiting
        const countPipeline = [...pipeline, { $count: 'total' }];
        const totalCountParams = await TargetModel.aggregate(countPipeline);
        const totalItems = totalCountParams.length > 0 ? totalCountParams[0].total : 0;

        // Apply pagination
        pipeline.push({ $skip: skip });
        pipeline.push({ $limit: limit });

        const items = await TargetModel.aggregate(pipeline);

        res.json({
            success: true,
            count: items.length,
            totalItems,
            totalPages: Math.ceil(totalItems / limit),
            currentPage: page,
            data: items
        });
    } catch (error) {
        console.error('Error fetching inventory items:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get recent sales (from orders)
// @route   GET /api/inventory/sales
// @access  Private/Admin
exports.getRecentSales = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;

        const orders = await Order.find({
            status: { $in: ['paid', 'processing', 'shipped', 'delivered'] }
        })
            .sort({ createdAt: -1 })
            .limit(limit)
            .populate('user', 'name email')
            .lean();

        // Flatten the items array across orders for a simple sales list
        const salesList = [];
        orders.forEach(order => {
            const customerName = order.user
                ? order.user.name
                : (order.shippingAddress?.fullName || 'Guest User');

            order.items.forEach(item => {
                salesList.push({
                    orderId: order._id,
                    orderNumber: order.orderNumber,
                    date: order.createdAt,
                    customer: customerName,
                    productName: item.name,
                    productType: item.productType || 'Product',
                    quantity: item.quantity,
                    price: item.price,
                    total: item.quantity * item.price,
                    itemImage: item.image
                });
            });
        });

        res.json({ success: true, count: salesList.length, data: salesList });
    } catch (error) {
        console.error('Error fetching recent sales:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

const StockHistory = require('../models/StockHistory');

// @desc    Update stock/price instantly and log history
// @route   PUT /api/inventory/:type/:id/stock
// @access  Private/Admin
exports.updateStock = async (req, res) => {
    try {
        const { type, id } = req.params;
        const { stock, price, costPrice, reason, notes } = req.body;

        let Model;
        let itemModelName;
        if (type === 'Product') {
            Model = Product;
            itemModelName = 'Product';
        } else if (type === 'Accessory') {
            Model = Accessory;
            itemModelName = 'Accessory';
        } else if (type === 'RepairPart') {
            Model = RepairPart;
            itemModelName = 'RepairPart';
        } else {
            return res.status(400).json({ success: false, message: 'Invalid item type' });
        }

        const item = await Model.findById(id);
        if (!item) {
            return res.status(404).json({ success: false, message: 'Item not found' });
        }

        const previousStock = item.stock;
        const newStock = stock !== undefined ? Number(stock) : previousStock;

        let shouldLog = false;

        if (newStock !== previousStock) {
            item.stock = newStock;
            shouldLog = true;
        }

        if (price !== undefined) {
            item.price = Number(price);
        }

        if (costPrice !== undefined) {
            item.costPrice = Number(costPrice);
        }

        await item.save();

        // Create Audit Log
        if (shouldLog) {
            await StockHistory.create({
                itemId: item._id,
                itemModel: itemModelName,
                itemName: item.name,
                barcode: item.barcode,
                user: req.user._id, // Assuming req.user is set by your auth middleware
                userName: `${req.user.firstName || req.user.name || 'Admin'} ${req.user.lastName || ''}`,
                previousStock,
                newStock,
                changeAmount: newStock - previousStock,
                reason: reason || 'Manual Correction',
                notes: notes || 'Updated via Admin Quick Edit'
            });
        }

        res.json({ success: true, data: item });
    } catch (error) {
        console.error('Error updating stock:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// @desc    Get stock history logs
// @route   GET /api/inventory/history
// @access  Private/Admin
exports.getStockHistory = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 100;
        const logs = await StockHistory.find()
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();

        res.json({ success: true, count: logs.length, data: logs });
    } catch (error) {
        console.error('Error fetching stock history:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
