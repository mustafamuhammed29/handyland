const mongoose = require('mongoose');

const deviceBlueprintSchema = new mongoose.Schema({
    model: { type: String, required: true },
    brand: { type: String, required: true },
    basePrice: { type: Number, required: true },
    image: { type: String },
    validStorages: { type: [String], default: ['128GB', '256GB'] },

    // === Storage Prices (add-on per storage tier) ===
    // Example: { "128GB": 0, "256GB": 30, "512GB": 70 }
    storagePrices: {
        type: Map,
        of: Number,
        default: {}
    },

    // === Screen Condition Modifiers (BackMarket style: 4 tiers) ===
    // hervorragend=1.0, sehr_gut=0.9, gut=0.75, beschadigt=0.5
    screenModifiers: {
        hervorragend: { type: Number, default: 1.0 },
        sehr_gut: { type: Number, default: 0.9 },
        gut: { type: Number, default: 0.75 },
        beschadigt: { type: Number, default: 0.5 }
    },

    // === Body Condition Modifiers (same 4 tiers) ===
    bodyModifiers: {
        hervorragend: { type: Number, default: 1.0 },
        sehr_gut: { type: Number, default: 0.95 },
        gut: { type: Number, default: 0.85 },
        beschadigt: { type: Number, default: 0.6 }
    },

    // === Functionality Modifier ===
    // functional (Ja) = 1.0, non_functional (Nein) = penalty
    functionalMultiplier: { type: Number, default: 1.0 },
    nonFunctionalMultiplier: { type: Number, default: 0.4 },

    category: { type: String, default: 'Smartphone' },
    active: { type: Boolean, default: true }
}, {
    timestamps: true
});

module.exports = mongoose.model('DeviceBlueprint', deviceBlueprintSchema);
