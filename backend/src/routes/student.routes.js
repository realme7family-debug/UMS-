const router = require("express").Router();
const ctrl = require("../controllers/student.controller");
const { protect, allowRoles } = require("../middleware/auth");
const { uploadProfile } = require("../middleware/upload");

router.use(protect);

// faculty can search / view students, only admin can modify
router.get("/", allowRoles("admin", "faculty"), ctrl.getStudents);
router.get("/:id", allowRoles("admin", "faculty"), ctrl.getStudent);
router.post("/", allowRoles("admin"), uploadProfile.single("profileImage"), ctrl.createStudent);
router.put("/:id", allowRoles("admin"), uploadProfile.single("profileImage"), ctrl.updateStudent);
router.delete("/:id", allowRoles("admin"), ctrl.deleteStudent);

module.exports = router;
