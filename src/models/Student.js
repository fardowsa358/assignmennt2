const mongoose = require("mongoose");

const enrollmentSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    status: { type: String, enum: ["enrolled", "dropped"], default: "enrolled" },
    enrolledAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const studentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    studentId: { type: String, required: true, unique: true, trim: true }, // e.g. STU0001
    phone: { type: String, trim: true, default: "" },
    dob: { type: Date },
    address: { type: String, trim: true, default: "" },
    enrollments: { type: [enrollmentSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Student", studentSchema);
