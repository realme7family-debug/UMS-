const router = require("express").Router();
const ctrl = require("../controllers/faculty.controller");
const { protect, allowRoles } = require("../middleware/auth");
const { uploadProfile } = require("../middleware/upload");

router.use(protect);

// must be above "/:id"
router.get("/me/overview", allowRoles("faculty"), ctrl.getMyOverview);

router.get("/", allowRoles("admin"), ctrl.getFaculty);
router.get("/:id", allowRoles("admin"), ctrl.getFacultyById);
router.post("/", allowRoles("admin"), uploadProfile.single("profileImage"), ctrl.createFaculty);
router.put("/:id", allowRoles("admin"), uploadProfile.single("profileImage"), ctrl.updateFaculty);
router.delete("/:id", allowRoles("admin"), ctrl.deleteFaculty);

module.exports = router;
