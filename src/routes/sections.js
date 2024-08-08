const express = require("express");
const router = express.Router();
const cors = require("cors");
const sectionsController = require("../controllers/sections")
const authMiddleware = require('../middleware/auth')

router.use(express.urlencoded({ extended: false }));
router.use(express.json());
router.use(cors());

router.get('/', (req, res) => {res.status(200).json( {success: true, message: "You're Lost, There's Nothing Here!"})})

// permissionss Routes
router.post("/:org/:module", authMiddleware.auth, sectionsController.create);
router.get("/:org/:module", authMiddleware.auth, sectionsController.read);
router.delete("/:org/:module", authMiddleware.auth, sectionsController.delete);
// router.get("/:org/profile/:profileId", authMiddleware.auth, permissionsController.readPermissions);
// router.put("/:org", authMiddleware.auth, permissionsController.createPermissions);
// router.put("/:org/profile_permission", authMiddleware.auth, permissionsController.createProfilesPermissions);

module.exports = router