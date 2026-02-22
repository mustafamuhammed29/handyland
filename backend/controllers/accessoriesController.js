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
        const accessoryData = { ...req.body };
        if (!accessoryData.id) {
            accessoryData.id = 'acc_' + Date.now() + Math.floor(Math.random() * 1000);
        }
        const newAccessory = new Accessory(accessoryData);
        await newAccessory.save();
        res.status(201).json(newAccessory);
    } catch (error) {
        console.error("Create Accessory Error:", error);
        res.status(500).json({ message: "Error saving data: " + error.message });
    }
};

exports.updateAccessory = async (req, res) => {
    try {
        const isObjectId = /^[0-9a-fA-F]{24}$/.test(req.params.id);
        const query = isObjectId ? { _id: req.params.id } : { id: req.params.id };

        const accessory = await Accessory.findOneAndUpdate(
            query,
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
        const isObjectId = /^[0-9a-fA-F]{24}$/.test(req.params.id);
        const query = isObjectId ? { _id: req.params.id } : { id: req.params.id };

        const result = await Accessory.findOneAndDelete(query);
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
