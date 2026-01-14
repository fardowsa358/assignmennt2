const router = require("express").Router();
const studentController = require("../controllers/student.controller");
const { protect, requireRole } = require("../middlewares/auth");

// Admin can create/list/delete any student
router.post("/", protect, requireRole("admin"), studentController.createStudent);
router.get("/", protect, requireRole("admin"), studentController.listStudents);
router.delete("/:id", protect, requireRole("admin"), studentController.deleteStudent);

// Admin OR owner (student)
router.get("/:id", protect, studentController.getStudent);
router.patch("/:id", protect, studentController.updateStudent);

// Enrollment endpoints (Admin OR owner)
router.post("/:id/enroll", protect, studentController.enrollInCourse);
router.post("/:id/drop", protect, studentController.dropCourse);

module.exports = router;
