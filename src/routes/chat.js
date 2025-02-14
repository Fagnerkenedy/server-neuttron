const express = require("express");
const router = express.Router();
const cors = require("cors");
const chatController = require("../controllers/chat")

router.use(express.urlencoded({ extended: false }));
router.use(express.json());
router.use(cors());

router.get('/', (req, res) => {res.status(200).json( {success: true, message: "Nothing to see here!"})})

router.post("/:org/send-message", chatController.sendMessage);
router.post("/:org/conversation/:conversationId", chatController.updateUnread);
router.get("/:org/conversation/:conversationId", chatController.getConversation);
router.get("/:org/conversations", chatController.getConversations);
router.get("/:org/messages/:conversationId", chatController.getMessages);

module.exports = router