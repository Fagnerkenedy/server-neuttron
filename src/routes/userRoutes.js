const express = require("express");
const router = express.Router();

const authController = require("../controllers/auth/authController")

const authForUserApis = require("../middleware/authForUserApis")

router.get('/', (req, res) => {res.status(200).json( {success: true, message: "You're Lost, There's Nothing Here!"})})

// User Routes
router.post('/register', authForUserApis, authController.registerOrg)
router.put('/:org/registerPassword/:id', authForUserApis, authController.registerPassword)
router.post('/register/:orgId', authForUserApis, authController.registerUser)
router.post('/login', authForUserApis, authController.login)
router.put('/update/:uuid', authForUserApis, authController.update)
router.put('/:org/updateDarkMode', authForUserApis, authController.updateDarkMode)
router.get('/:org/tour/:userId', authForUserApis, authController.getOpenTour)
router.put('/:org/tour/:userId', authForUserApis, authController.updateOpenTour)
router.get('/:org/modulesTour/:userId', authForUserApis, authController.getModulesTour)
router.put('/:org/modulesTour/:userId', authForUserApis, authController.updateModulesTour)

router.post('/checkemail', authForUserApis, authController.checkEmail)
router.post('/mailconfirmation', authForUserApis, authController.sendMailConfirmation)
router.post('/confirmation', authForUserApis, authController.confirmation)

// router.post('/checksitename', authController.checkSiteName)
// router.get('/myaccount/:uuid', authController.getUser)

router.post('/deleteaccount', authForUserApis, authController.deleteAccount)

module.exports = router