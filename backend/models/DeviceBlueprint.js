const mongoose = require('mongoose');

const deviceBlueprintSchema = new mongoose.Schema({
    brand: {
        type: String,
        required: true,
        enum: ['Apple', 'Samsung', 'Google', 'Xiaomi', 'Huawei', 'OnePlus', 'Sony', 'Other']
    },
    modelName: {
        type: String,
        required: true,
        unique: true
    },
    basePrice: {
        type: Number,
        required: true
    },
    releaseYear: Number,
    imageUrl: String,

    // Specifications
    validStorages: [{
        type: String // e.g., ["64GB", "128GB"]
    }],

    // Offer / Description
    marketingName: String,
    description: String,

    // Advanced Pricing Logic
    priceConfig: {
        batteryPenalty: {
            threshold: { type: Number, default: 85 }, // Percentage below which penalty applies
            deductionPerPercent: { type: Number, default: 5 } // Euros deducted per 1% drop below threshold
        },
        conditionModifiers: {
            new: { type: Number, default: 1.0 },
            like_new: { type: Number, default: 0.9 },
            good: { type: Number, default: 0.75 },
            fair: { type: Number, default: 0.5 },
            broken: { type: Number, default: 0.2 } // Changed poor to broken to match frontend
        },
        conditionDescriptions: {
            new: { type: String, default: "Neu und unbenutzt. Du hast das Gerät weder verwendet noch ausgepackt." },
            like_new: { type: String, default: "Absolut makellos! Auch nach langem Suchen findest du nicht die kleinste Gebrauchsspur." },
            good: { type: String, default: "Einige leichte Gebrauchsspuren wie feine Kratzer auf dem Display." },
            fair: { type: String, default: "Deutliche Kratzer oder Kerben am Rahmen oder Display." },
            broken: { type: String, default: "Das Gerät hat schwere Schäden, Risse oder technische Defekte." }
        },
        storagePrices: {
            type: Map,
            of: Number,
            default: {}
        }
    },

    // Custom overrides (optional)
    customModifiers: {
        storage: Map,
        condition: Map
    }
}, { timestamps: true });

module.exports = mongoose.model('DeviceBlueprint', deviceBlueprintSchema);
