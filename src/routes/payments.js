const express = require("express");
const router = express.Router();
const cors = require("cors");
const paymentController = require("../controllers/payment")
const authMiddleware = require('../middleware/auth')

router.use(express.urlencoded({ extended: false }));
router.use(express.json());
router.use(cors());

router.get('/', (req, res) => {res.status(200).json( {success: true, message: "You're Lost, There's Nothing Here!"})})

// Pyments Routes
router.post('/create_preference', paymentController.createPreference)
router.post('/feedback', paymentController.getFeedback)

module.exports = router