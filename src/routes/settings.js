const express = require("express");
const router = express.Router();
const cors = require("cors");
const settingsController = require("../controllers/settings")
const authMiddleware = require('../middleware/auth')

router.use(express.urlencoded({ extended: false }));
router.use(express.json());
router.use(cors());

router.get('/', (req, res) => {res.status(200).json( {success: true, message: "You're Lost, There's Nothing Here!"})})

// Settings Routes
router.post("/:org/create", authMiddleware.auth, settingsController.create);
router.get("/:org/:module", authMiddleware.auth, settingsController.read);

module.exports = router