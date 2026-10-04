import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../config/db.js";
import dotenv from "dotenv";

dotenv.config();

/* =========================================================
   LOGIN
   ========================================================= */

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    const [rows] = await pool.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    const user = rows[0];

    if (
      !user ||
      !(await bcrypt.compare(password || "", user.password_hash))
    ) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        role: user.role,
        email: user.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "8h",
      }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        email: user.email,
        rollNo: user.roll_no,
        semester: user.semester,
        className: user.class_name,
        employeeId: user.employee_id,
        designation: user.designation,
        department: user.department,
        center: user.center,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
}

/* =========================================================
   CURRENT USER
   ========================================================= */

export async function me(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT
        id,
        name,
        email,
        role,
        roll_no,
        semester,
        class_name,
        employee_id,
        designation,
        department,
        center
       FROM users
       WHERE id = ?`,
      [req.user.id]
    );

    if (!rows[0]) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error("Me error:", error);

    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
}

/* =========================================================
   LIST ALL USERS
   ADMIN ONLY
   ========================================================= */

export async function listUsers(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT
        id,
        name,
        email,
        role,
        roll_no,
        semester,
        class_name,
        employee_id,
        designation,
        department,
        center,
        created_at
       FROM users
       ORDER BY created_at DESC`
    );

    res.json(rows);
  } catch (error) {
    console.error("List users error:", error);

    res.status(500).json({
      message: "Unable to load users",
      error: error.message,
    });
  }
}

/* =========================================================
   CREATE USER
   ADMIN ONLY
   ========================================================= */

export async function createUser(req, res) {
  try {
    const {
      name,
      email,
      password,
      role,
      roll_no,
      semester,
      class_name,
      employee_id,
      designation,
      department,
      center,
    } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        message: "Name, email, password and role are required",
      });
    }

    if (!["ADMIN", "FACULTY", "STUDENT"].includes(role)) {
      return res.status(400).json({
        message: "Invalid role",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    /* -------------------------
       Validate role-specific details
       ------------------------- */

    if (role === "STUDENT") {
      if (!roll_no || !semester || !class_name || !department) {
        return res.status(400).json({
          message:
            "Student roll number, semester, class and department are required",
        });
      }
    }

    if (role === "FACULTY") {
      if (!employee_id || !designation || !department) {
        return res.status(400).json({
          message:
            "Faculty employee ID, designation and department are required",
        });
      }
    }

    /* -------------------------
       Check duplicate email
       ------------------------- */

    const [existing] = await pool.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        message: "A user with this email already exists",
      });
    }

    /* -------------------------
       Check duplicate student roll number
       ------------------------- */

    if (role === "STUDENT") {
      const [existingRoll] = await pool.query(
        `SELECT id
         FROM users
         WHERE roll_no = ? AND role = 'STUDENT'`,
        [roll_no]
      );

      if (existingRoll.length > 0) {
        return res.status(409).json({
          message: "This student roll number already exists",
        });
      }
    }

    /* -------------------------
       Check duplicate faculty employee ID
       ------------------------- */

    if (role === "FACULTY") {
      const [existingEmployee] = await pool.query(
        `SELECT id
         FROM users
         WHERE employee_id = ? AND role = 'FACULTY'`,
        [employee_id]
      );

      if (existingEmployee.length > 0) {
        return res.status(409).json({
          message: "This faculty employee ID already exists",
        });
      }
    }

    /* -------------------------
       Hash password
       ------------------------- */

    const passwordHash = await bcrypt.hash(password, 10);

    /* -------------------------
       Prepare role-specific values
       ------------------------- */

    const studentRollNo =
      role === "STUDENT" ? roll_no : null;

    const studentSemester =
      role === "STUDENT" ? semester : null;

    const studentClass =
      role === "STUDENT" ? class_name : null;

    const facultyEmployeeId =
      role === "FACULTY" ? employee_id : null;

    const facultyDesignation =
      role === "FACULTY" ? designation : null;

    /* -------------------------
       Insert user
       ------------------------- */

    const [result] = await pool.query(
      `INSERT INTO users
       (
         name,
         email,
         password_hash,
         role,
         roll_no,
         semester,
         class_name,
         employee_id,
         designation,
         department,
         center
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        email,
        passwordHash,
        role,
        studentRollNo || null,
        studentSemester || null,
        studentClass || null,
        facultyEmployeeId || null,
        facultyDesignation || null,
        department || null,
        center || null,
      ]
    );

    /* -------------------------
       Audit log
       ------------------------- */

    await pool.query(
      `INSERT INTO audit_logs
       (actor_id, action, entity_type, entity_id, details)
       VALUES (?, ?, ?, ?, ?)`,
      [
        req.user.id,
        "USER_CREATED",
        "user",
        result.insertId,
        JSON.stringify({
          name,
          email,
          role,
          roll_no: studentRollNo || null,
          semester: studentSemester || null,
          class_name: studentClass || null,
          employee_id: facultyEmployeeId || null,
          designation: facultyDesignation || null,
          department: department || null,
        }),
      ]
    );

    res.status(201).json({
      message: "User created successfully",
      user: {
        id: result.insertId,
        name,
        email,
        role,
        roll_no: studentRollNo || null,
        semester: studentSemester || null,
        class_name: studentClass || null,
        employee_id: facultyEmployeeId || null,
        designation: facultyDesignation || null,
        department: department || null,
        center: center || null,
      },
    });
  } catch (error) {
    console.error("Create user error:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "A user with this email or ID already exists",
      });
    }

    res.status(500).json({
      message: "Unable to create user",
      error: error.message,
    });
  }
}

/* =========================================================
   DELETE USER
   ADMIN ONLY
   ========================================================= */

export async function deleteUser(req, res) {
  const userId = Number(req.params.id);

  if (!userId) {
    return res.status(400).json({
      message: "Valid user ID is required",
    });
  }

  if (userId === Number(req.user.id)) {
    return res.status(400).json({
      message: "You cannot delete your own account",
    });
  }

  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const [users] = await conn.query(
      `SELECT id, name, email, role
       FROM users
       WHERE id = ?`,
      [userId]
    );

    const user = users[0];

    if (!user) {
      await conn.rollback();

      return res.status(404).json({
        message: "User not found",
      });
    }

    await conn.query(
      "DELETE FROM audit_logs WHERE actor_id = ?",
      [userId]
    );

    await conn.query(
      "DELETE FROM attendance WHERE recorded_by = ?",
      [userId]
    );

    await conn.query(
      "DELETE FROM courses WHERE faculty_id = ?",
      [userId]
    );

    await conn.query(
      "DELETE FROM users WHERE id = ?",
      [userId]
    );

    await conn.query(
      `INSERT INTO audit_logs
       (actor_id, action, entity_type, entity_id, details)
       VALUES (?, ?, ?, ?, ?)`,
      [
        req.user.id,
        "USER_DELETED",
        "user",
        userId,
        JSON.stringify({
          name: user.name,
          email: user.email,
          role: user.role,
        }),
      ]
    );

    await conn.commit();

    res.json({
      message: "User deleted successfully",
    });
  } catch (error) {
    await conn.rollback();

    console.error("Delete user error:", error);

    res.status(500).json({
      message: "Unable to delete user",
      error: error.message,
    });
  } finally {
    conn.release();
  }
}

/* =========================================================
   LIST STUDENTS
   FACULTY + ADMIN
   ========================================================= */

export async function listStudents(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT
        id,
        name,
        roll_no,
        semester,
        class_name,
        department
       FROM users
       WHERE role = 'STUDENT'
       ORDER BY name`
    );

    res.json(rows);
  } catch (error) {
    console.error("List students error:", error);

    res.status(500).json({
      message: "Unable to load students",
      error: error.message,
    });
  }
}

/* =========================================================
   LIST FACULTY
   ADMIN ONLY — FOR COURSE ASSIGNMENT
   ========================================================= */

export async function listFaculty(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT
        id,
        name,
        email,
        employee_id,
        designation,
        department
       FROM users
       WHERE role = 'FACULTY'
       ORDER BY name`
    );

    res.json(rows);
  } catch (error) {
    console.error("List faculty error:", error);

    res.status(500).json({
      message: "Unable to load faculty",
      error: error.message,
    });
  }
}