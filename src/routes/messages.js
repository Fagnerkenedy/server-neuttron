const express = require("express");
// const router = express.Router();
const cors = require("cors");
const messagesController = require("../controllers/messages")

module.exports = (io) => {
    const router = express.Router();

    router.use(express.urlencoded({ extended: false }));
    router.use(express.json());
    router.use(cors());
    
    router.get('/', (req, res) => {res.status(200).json( {success: true, message: "Nothing to see here!"})})
    
    router.post("/webhook", (req, res) => messagesController.webhookPost(req, res, io));
    router.get("/webhook", messagesController.webhookGet);
    return router
}