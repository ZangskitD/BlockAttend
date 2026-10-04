import { Router } from "express";

import {
  login,
  me,
  listUsers,
  createUser,
  deleteUser,
  listStudents,
  listFaculty,
} from "../controllers/authController.js";

import { auth, allow } from "../middleware/auth.js";

const router = Router();

/* =========================================================
   AUTH
   ========================================================= */

router.post("/login", login);

router.get("/me", auth, me);

/* =========================================================
   STUDENTS
   FACULTY + ADMIN
   ========================================================= */

router.get(
  "/students",
  auth,
  allow("FACULTY", "ADMIN"),
  listStudents
);

/* =========================================================
   FACULTY LIST
   ADMIN ONLY — FOR COURSE ASSIGNMENT
   ========================================================= */

router.get(
  "/faculty",
  auth,
  allow("ADMIN"),
  listFaculty
);

/* =========================================================
   USER MANAGEMENT
   ADMIN ONLY
   ========================================================= */

router.get(
  "/users",
  auth,
  allow("ADMIN"),
  listUsers
);

router.post(
  "/users",
  auth,
  allow("ADMIN"),
  createUser
);

router.delete(
  "/users/:id",
  auth,
  allow("ADMIN"),
  deleteUser
);

export default router;