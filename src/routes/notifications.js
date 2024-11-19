const express = require("express");
const router = express.Router();
const cors = require("cors");
const notificationController = require("../controllers/notifications")
const authMiddleware = require('../middleware/auth')

router.use(express.urlencoded({ extended: false }));
router.use(express.json());
router.use(cors());

router.get('/', (req, res) => {res.status(200).json( {success: true, message: "You're Lost, There's Nothing Here!"})})

// Charts Routes
router.post("/", authMiddleware.auth, notificationController.payment);

module.exports = router