const express = require("express");
const router = express.Router();
const cors = require("cors");
const chartController = require("../controllers/charts")
const authMiddleware = require('../middleware/auth')

router.use(express.urlencoded({ extended: false }));
router.use(express.json());
router.use(cors());

router.get('/', (req, res) => {res.status(200).json( {success: true, message: "You're Lost, There's Nothing Here!"})})

// Charts Routes
router.post("/:org/create", authMiddleware, chartController.create);
router.get("/:org", authMiddleware, chartController.read);

module.exports = router