const Student = require("../models/Student");
const User = require("../models/User");
const Course = require("../models/Course");

/**
 * Admin: Create a student (creates user + student profile)
 * POST /api/students
 * Body: { name, email, password, studentId?, phone?, dob?, address? }
 */
exports.createStudent = async (req, res, next) => {
  try {
    const { name, email, password, studentId, phone, dob, address } = req.body;

    const user = await User.create({ name, email, password, role: "student" });
    const sid = studentId || `STU${String(Date.now()).slice(-6)}`;

    const student = await Student.create({
      user: user._id,
      studentId: sid,
      phone: phone || "",
      dob,
      address: address || "",
    });

    res.status(201).json({
      student,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Admin: List students (with user basic info)
 * GET /api/students
 */
exports.listStudents = async (req, res, next) => {
  try {
    const students = await Student.find()
      .populate("user", "name email role")
      .populate("enrollments.course", "code title credits")
      .sort({ createdAt: -1 });

    res.json(students);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/students/:id
 * Admin OR owner (student)
 */
exports.getStudent = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate("user", "name email role")
      .populate("enrollments.course", "code title credits");

    if (!student) return res.status(404).json({ message: "Student not found" });

    // If student role, only allow access to own profile
    if (req.user.role === "student" && student.user._id.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: "Forbidden" });
    }

    res.json(student);
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/students/:id
 * Admin OR owner (student) can update limited fields
 */
exports.updateStudent = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found" });

    if (req.user.role === "student" && student.user.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const allowed = ["phone", "dob", "address"];
    // Admin can also update studentId
    if (req.user.role === "admin") allowed.push("studentId");

    for (const k of allowed) {
      if (req.body[k] !== undefined) student[k] = req.body[k];
    }

    await student.save();
    res.json(student);
  } catch (err) {
    next(err);
  }
};

/**
 * Admin: Delete student (also deletes user)
 * DELETE /api/students/:id
 */
exports.deleteStudent = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found" });

    await User.findByIdAndDelete(student.user);
    await student.deleteOne();

    res.json({ message: "Student deleted" });
  } catch (err) {
    next(err);
  }
};

/**
 * Register a student for a course
 * POST /api/students/:id/enroll
 * Body: { courseId }
 * Admin OR owner
 */
exports.enrollInCourse = async (req, res, next) => {
  try {
    const { courseId } = req.body;

    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found" });

    if (req.user.role === "student" && student.user.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });
    if (!course.isActive) return res.status(400).json({ message: "Course is inactive" });

    const already = student.enrollments.find(e => e.course.toString() === courseId && e.status === "enrolled");
    if (already) return res.status(409).json({ message: "Already enrolled" });

    // capacity check (counts enrolled students)
    const enrolledCount = await Student.countDocuments({ "enrollments.course": course._id, "enrollments.status": "enrolled" });
    if (enrolledCount >= course.capacity) return res.status(400).json({ message: "Course is full" });

    // If exists but dropped -> re-enroll
    const dropped = student.enrollments.find(e => e.course.toString() === courseId && e.status === "dropped");
    if (dropped) {
      dropped.status = "enrolled";
      dropped.enrolledAt = new Date();
    } else {
      student.enrollments.push({ course: course._id, status: "enrolled" });
    }

    await student.save();
    const populated = await Student.findById(student._id).populate("enrollments.course", "code title credits");
    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
};

/**
 * Drop a course
 * POST /api/students/:id/drop
 * Body: { courseId }
 * Admin OR owner
 */
exports.dropCourse = async (req, res, next) => {
  try {
    const { courseId } = req.body;

    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found" });

    if (req.user.role === "student" && student.user.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const enrollment = student.enrollments.find(e => e.course.toString() === courseId && e.status === "enrolled");
    if (!enrollment) return res.status(404).json({ message: "Enrollment not found" });

    enrollment.status = "dropped";
    await student.save();

    const populated = await Student.findById(student._id).populate("enrollments.course", "code title credits");
    res.json(populated);
  } catch (err) {
    next(err);
  }
};
