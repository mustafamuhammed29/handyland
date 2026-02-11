const Accessory = require('../models/Accessory');

exports.getAccessories = async (req, res) => {
    try {
        const accessories = await Accessory.find();
        res.json(accessories);
    } catch (error) {
        console.error("Get Accessories Error:", error);
        res.status(500).json({ message: "Error reading data: " + error.message });
    }
};

exports.createAccessory = async (req, res) => {
    try {
        const newAccessory = new Accessory(req.body);
        await newAccessory.save();
        res.status(201).json(newAccessory);
    } catch (error) {
        console.error("Create Accessory Error:", error);
        res.status(500).json({ message: "Error saving data: " + error.message });
    }
};

exports.updateAccessory = async (req, res) => {
    try {
        const accessory = await Accessory.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (accessory) {
            res.json(accessory);
        } else {
            res.status(404).json({ message: "Accessory not found" });
        }
    } catch (error) {
        console.error("Update Error:", error);
        res.status(500).json({ message: "Error updating data: " + error.message });
    }
};

exports.deleteAccessory = async (req, res) => {
    try {
        const result = await Accessory.findByIdAndDelete(req.params.id);
        if (result) {
            res.json({ message: "Accessory deleted" });
        } else {
            res.status(404).json({ message: "Item not found" });
        }
    } catch (error) {
        console.error("Delete Error:", error);
        res.status(500).json({ message: "Error deleting data: " + error.message });
    }
};
