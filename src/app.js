const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const authRoutes = require("./routes/auth.routes");
const studentRoutes = require("./routes/student.routes");
const courseRoutes = require("./routes/course.routes");
const { notFound, errorHandler } = require("./middlewares/error");

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.json({
    name: "Student Registration System API",
    status: "ok",
    docs: {
      auth: "/api/auth",
      students: "/api/students",
      courses: "/api/courses",
    },
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/courses", courseRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
