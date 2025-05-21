const modelIntegration = require("../../model/modelIntegration")

const Field = modelIntegration();

module.exports = {
    create: async (req, res) => {
        try {
            const newField = new Field(req.body);
            const savedField = await newField.save();
            res.json(savedField);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    read: async (req, res) => {
        try {
            const fields = await Field.find();
            res.json(fields);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    update: async (req, res) => {
        try {
            const updatedField = await Field.findByIdAndUpdate(req.params.id, req.body, { new: true });
            res.json(updatedField);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    delete: async (req, res) => {
        try {
            const deletedField = await Field.findByIdAndDelete(req.params.id);
            res.json(deletedField);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}