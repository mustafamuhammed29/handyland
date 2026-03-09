const mongoose = require('mongoose');

const stockHistorySchema = new mongoose.Schema({
    itemId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'itemModel' // Dynamic reference
    },
    itemModel: {
        type: String,
        required: true,
        enum: ['Product', 'Accessory', 'RepairPart']
    },
    itemName: { type: String, required: true },
    barcode: { type: String },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    userName: { type: String, required: true }, // Store name for quick display if user is deleted
    previousStock: { type: Number, required: true },
    newStock: { type: Number, required: true },
    changeAmount: { type: Number, required: true },
    reason: {
        type: String,
        required: true,
        enum: ['Manual Correction', 'Restock', 'Return', 'Sale', 'System sync']
    },
    notes: { type: String } // Optional specific reason/notes
}, { timestamps: true });

// Indexes for fast history queries
stockHistorySchema.index({ itemId: 1 });
stockHistorySchema.index({ createdAt: -1 });
stockHistorySchema.index({ reason: 1 });

module.exports = mongoose.model('StockHistory', stockHistorySchema);
