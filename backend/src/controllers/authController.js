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
      department,
      center,
    } = req.body;

    /* -------------------------
       Validation
       ------------------------- */

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
       Hash password
       ------------------------- */

    const passwordHash = await bcrypt.hash(password, 10);

    /* -------------------------
       Insert user
       ------------------------- */

    const [result] = await pool.query(
      `INSERT INTO users
       (name, email, password_hash, role, roll_no, department, center)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        email,
        passwordHash,
        role,
        roll_no || null,
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
        roll_no: roll_no || null,
        department: department || null,
        center: center || null,
      },
    });
  } catch (error) {
    console.error("Create user error:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "A user with this email already exists",
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

  /* Prevent Admin from deleting their own account */

  if (userId === Number(req.user.id)) {
    return res.status(400).json({
      message: "You cannot delete your own account",
    });
  }

  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    /* -------------------------
       Find user
       ------------------------- */

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

    /* -------------------------
       Delete user
       -------------------------
       
       Attendance has foreign keys to users.
       Courses may also reference faculty.

       To keep deletion safe, we first remove
       related records that use RESTRICT behavior.
    */

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

    /* -------------------------
       Create audit record
       -------------------------
       
       The user's own audit records were removed,
       so record the deletion using the Admin actor.
    */

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
        roll_no
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