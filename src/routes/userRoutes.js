const express = require("express");
const router = express.Router();

const authController = require("../controllers/auth/authController")

const authForUserApis = require("../middleware/authForUserApis")

router.get('/', (req, res) => {res.status(200).json( {success: true, message: "You're Lost, There's Nothing Here!"})})

// User Routes
router.post('/register', authForUserApis, authController.registerOrg)
router.post('/register/:module', authForUserApis, authController.registerUser)
router.post('/login', authForUserApis, authController.login)
router.put('/update/:uuid', authForUserApis, authController.update)
router.put('/:org/updateDarkMode', authForUserApis, authController.updateDarkMode)

// router.post('/checksitename', authController.checkSiteName)
// router.post('/checkemail', authController.checkEmail)
// router.post('/mailconfirmation', authController.sendMailConfirmation)
// router.post('/confirmation', authController.confirmation)
// router.get('/myaccount/:uuid', authController.getUser)

module.exports = router