const router = require("express").Router();
const ctrl = require("../controllers/admin.controller");
const { protect, allowRoles } = require("../middleware/auth");

router.use(protect, allowRoles("admin"));

router.get("/dashboard", ctrl.getDashboard);
router.post("/reset-password", ctrl.resetUserPassword);

router.route("/admins").get(ctrl.listAdmins).post(ctrl.createAdmin);
router.route("/admins/:id").put(ctrl.updateAdmin).delete(ctrl.deleteAdmin);

module.exports = router;
