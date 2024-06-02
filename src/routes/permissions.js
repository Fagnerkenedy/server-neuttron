const express = require("express");
const router = express.Router();
const cors = require("cors");
const permissionsController = require("../controllers/permissions")
const authMiddleware = require('../middleware/auth')

router.use(express.urlencoded({ extended: false }));
router.use(express.json());
router.use(cors());

router.get('/', (req, res) => {res.status(200).json( {success: true, message: "You're Lost, There's Nothing Here!"})})

// permissionss Routes
// router.post("/:org/create", authMiddleware.auth, permissionsController.create);
router.get("/:org/:userId", authMiddleware.auth, permissionsController.read);
router.get("/:org/profile/:profileId", authMiddleware.auth, permissionsController.readPermissions);
router.put("/:org", authMiddleware.auth, permissionsController.createPermissions);
router.put("/:org/profile_permission", authMiddleware.auth, permissionsController.createProfilesPermissions);
router.delete("/:org/:id_profile/:id_permission", authMiddleware.auth, permissionsController.deleteProfilesPermissions);

module.exports = router