const mongoose = require('mongoose');

const deviceBlueprintSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    model: { type: String, required: true },
    brand: { type: String, required: true },
    basePrice: { type: Number, required: true },
    image: { type: String }, // URL to device image

    // Price Configuration
    priceConfig: {
        storagePrices: {
            type: Map,
            of: Number,
            default: {}
            // Example: { "64GB": 0, "128GB": 20, "256GB": 50 }
        },
        conditionModifiers: {
            type: Map,
            of: Number,
            default: {
                "new": 1.0,
                "like_new": 0.9,
                "good": 0.75,
                "fair": 0.6,
                "broken": 0.3
            }
        },
        batteryPenalty: {
            threshold: { type: Number, default: 85 },
            deductionPerPercent: { type: Number, default: 5 }
        }
    },

    // Category for grouping (e.g., "Smartphone", "Tablet")
    category: { type: String, default: 'Smartphone' },

    active: { type: Boolean, default: true }
}, {
    timestamps: true
});

module.exports = mongoose.model('DeviceBlueprint', deviceBlueprintSchema);
