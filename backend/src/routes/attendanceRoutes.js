import { Router } from "express";

import {
  markAttendance,
  listStudentAttendance,
  listCourses,
  listFacultyCourses,
  listFacultyAttendance,
  createCourse,
  deleteCourse,
  verifyAttendance,
  listAllAttendance,
  stats,
} from "../controllers/attendanceController.js";

import { auth, allow } from "../middleware/auth.js";

const router = Router();

/* =========================================================
   COURSES
   ========================================================= */

/* View courses */

router.get(
  "/courses",
  auth,
  listCourses
);

/* Create course - ADMIN */

router.post(
  "/courses",
  auth,
  allow("ADMIN"),
  createCourse
);

/* Delete course - ADMIN */

router.delete(
  "/courses/:id",
  auth,
  allow("ADMIN"),
  deleteCourse
);

/* =========================================================
   FACULTY
   ========================================================= */

/* Courses assigned to logged-in faculty */

router.get(
  "/faculty/courses",
  auth,
  allow("FACULTY"),
  listFacultyCourses
);

/* Attendance records recorded by logged-in faculty */

router.get(
  "/faculty",
  auth,
  allow("FACULTY"),
  listFacultyAttendance
);

/* =========================================================
   ATTENDANCE
   ========================================================= */

/* Mark attendance - FACULTY + ADMIN */

router.post(
  "/",
  auth,
  allow("FACULTY", "ADMIN"),
  markAttendance
);

/* Student's attendance */

router.get(
  "/student",
  auth,
  listStudentAttendance
);

/* =========================================================
   VERIFICATION
   ========================================================= */

router.get(
  "/verify/:id",
  auth,
  allow("STUDENT", "FACULTY", "ADMIN"),
  verifyAttendance
);

/* =========================================================
   ADMIN
   ========================================================= */

/* All attendance records */

router.get(
  "/all",
  auth,
  allow("ADMIN"),
  listAllAttendance
);

/* Statistics */

router.get(
  "/stats",
  auth,
  allow("ADMIN"),
  stats
);

export default router;
