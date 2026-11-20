const router = require("express").Router();
const ctrl = require("../controllers/notice.controller");
const { protect, allowRoles } = require("../middleware/auth");

router.get("/public", ctrl.getPublicNotices);

router.use(protect);

router.get("/", ctrl.getNotices);
router.post("/", allowRoles("admin", "faculty"), ctrl.createNotice);
router.put("/:id", allowRoles("admin", "faculty"), ctrl.updateNotice);
router.delete("/:id", allowRoles("admin", "faculty"), ctrl.deleteNotice);

module.exports = router;
