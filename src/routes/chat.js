const express = require("express");
// const router = express.Router();
const cors = require("cors");
const chatController = require("../controllers/chat")

module.exports = (io) => {
    const router = express.Router();

    router.use(express.urlencoded({ extended: false }));
    router.use(express.json());
    router.use(cors());

    router.get('/', (req, res) => {
        res.status(200).json({ success: true, message: "Nothing to see here!" });
    });

    router.post("/send-message", (req, res) => chatController.sendMessage(req, res, io));

    return router;
};