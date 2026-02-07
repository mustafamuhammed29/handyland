const Accessory = require('../models/Accessory');
const { v4: uuidv4 } = require('uuid');

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
        const newAccessory = new Accessory({
            ...req.body,
            id: uuidv4()
        });
        await newAccessory.save();
        res.status(201).json(newAccessory);
    } catch (error) {
        console.error("Create Accessory Error:", error);
        res.status(500).json({ message: "Error saving data" });
    }
};

exports.deleteAccessory = async (req, res) => {
    try {
        const result = await Accessory.findOneAndDelete({ id: req.params.id });
        if (result) {
            res.json({ message: "Accessory deleted" });
        } else {
            res.status(404).json({ message: "Item not found" });
        }
    } catch (error) {
        console.error("Delete Error:", error);
        res.status(500).json({ message: "Error deleting data" });
    }
};

exports.updateAccessory = async (req, res) => {
    try {
        const accessory = await Accessory.findOneAndUpdate(
            { id: req.params.id },
            req.body,
            { new: true }
        );
        if (accessory) {
            res.json(accessory);
        } else {
            res.status(404).json({ message: "Accessory not found" });
        }
    } catch (error) {
        console.error("Update Error:", error);
        res.status(500).json({ message: "Error updating data" });
    }
};
