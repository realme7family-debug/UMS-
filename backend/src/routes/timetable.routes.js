const router = require("express").Router();
const ctrl = require("../controllers/timetable.controller");
const { protect, allowRoles } = require("../middleware/auth");

router.use(protect);

router.get("/classes", ctrl.getClasses);
router.get("/", ctrl.getTimetable);
router.put("/", allowRoles("admin", "faculty"), ctrl.saveTimetable);

module.exports = router;
