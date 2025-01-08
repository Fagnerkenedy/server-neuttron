const express = require("express");
const router = express.Router();
const cors = require("cors");
const messagesController = require("../controllers/messages")

router.use(express.urlencoded({ extended: false }));
router.use(express.json());
router.use(cors());

router.get('/', (req, res) => {res.status(200).json( {success: true, message: "Nothing to see here!"})})

router.post("/webhook", messagesController.webhookPost);
router.get("/webhook", messagesController.webhookGet);

module.exports = router