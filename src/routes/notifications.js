const express = require("express");
const router = express.Router();
const cors = require("cors");
const notificationController = require("../controllers/notifications")

router.use(express.urlencoded({ extended: false }));
router.use(express.json());
router.use(cors());

// router.get('/', (req, res) => {res.status(200).json( {success: true, message: "You're Lost, There's Nothing Here!"})})

// Charts Routes
router.post("/", notificationController.payment);

module.exports = router