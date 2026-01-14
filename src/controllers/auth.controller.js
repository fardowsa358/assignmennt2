const User = require("../models/User");
const Student = require("../models/Student");
const { signToken } = require("../middlewares/auth");

/**
 * POST /api/auth/register
 * Body: { name, email, password, role? }
 * Note: creating a Student profile is optional; if role=student we create it automatically.
 */
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    const user = await User.create({ name, email, password, role: role || "student" });

    // If student role -> create Student record
    if (user.role === "student") {
      const studentId = `STU${String(Date.now()).slice(-6)}`;
      await Student.create({ user: user._id, studentId });
    }

    const token = signToken(user);
    res.status(201).json({
      message: "Registered successfully",
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const token = signToken(user);
    res.json({
      message: "Logged in",
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/auth/me
 */
exports.me = async (req, res, next) => {
  try {
    res.json({ user: req.user });
  } catch (err) {
    next(err);
  }
};
