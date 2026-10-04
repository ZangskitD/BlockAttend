import { pool } from "../config/db.js";

import {
  canonicalAttendance,
  sha256Hex,
} from "../utils/hash.js";

import {
  commitAttendanceHash,
  verifyAttendanceHash,
} from "../utils/blockchain.js";

/* =========================================================
   MARK ATTENDANCE
   FACULTY + ADMIN
   ========================================================= */

export async function markAttendance(req, res) {
  const {
    studentId,
    courseId,
    attendanceDate,
    status,
  } = req.body;

  if (
    !studentId ||
    !courseId ||
    !attendanceDate ||
    !["PRESENT", "ABSENT"].includes(status)
  ) {
    return res.status(400).json({
      message:
        "studentId, courseId, attendanceDate and status are required",
    });
  }

  const canonical = canonicalAttendance({
    studentId,
    courseId,
    attendanceDate,
    status,
  });

  const attendanceHash = sha256Hex(canonical);

  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    /* -------------------------
       Check student
       ------------------------- */

    const [students] = await conn.query(
      `SELECT id
       FROM users
       WHERE id = ? AND role = 'STUDENT'`,
      [studentId]
    );

    if (!students.length) {
      await conn.rollback();

      return res.status(400).json({
        message: "Invalid student",
      });
    }

    /* -------------------------
       Check course and assigned faculty
       ------------------------- */

    const [courses] = await conn.query(
      `SELECT id, faculty_id
       FROM courses
       WHERE id = ?`,
      [courseId]
    );

    const course = courses[0];

    if (!course) {
      await conn.rollback();

      return res.status(400).json({
        message: "Invalid course",
      });
    }

    // Faculty can mark attendance only for their assigned courses.
    // Admin can mark attendance for any course.
    if (
      req.user.role === "FACULTY" &&
      Number(course.faculty_id) !== Number(req.user.id)
    ) {
      await conn.rollback();

      return res.status(403).json({
        message: "You are not assigned to this course",
      });
    }

    /* -------------------------
       Insert attendance
       ------------------------- */

    const [result] = await conn.query(
      `INSERT INTO attendance
       (
         student_id,
         course_id,
         attendance_date,
         status,
         recorded_by,
         attendance_hash,
         blockchain_status
       )
       VALUES (?, ?, ?, ?, ?, ?, 'PENDING')`,
      [
        studentId,
        courseId,
        attendanceDate,
        status,
        req.user.id,
        attendanceHash,
      ]
    );

    const attendanceId = result.insertId;

    /* -------------------------
       Audit log
       ------------------------- */

    await conn.query(
      `INSERT INTO audit_logs
       (
         actor_id,
         action,
         entity_type,
         entity_id,
         details
       )
       VALUES (?, ?, ?, ?, ?)`,
      [
        req.user.id,
        "ATTENDANCE_CREATED",
        "attendance",
        attendanceId,
        JSON.stringify({
          attendanceHash,
          studentId,
          courseId,
          attendanceDate,
          status,
        }),
      ]
    );

    await conn.commit();

    /* -------------------------
       Blockchain commit
       ------------------------- */

    try {
      const txHash = await commitAttendanceHash(
        attendanceHash
      );

      await pool.query(
        `UPDATE attendance
         SET
           blockchain_tx_hash = ?,
           blockchain_status = 'CONFIRMED'
         WHERE id = ?`,
        [txHash, attendanceId]
      );

      return res.status(201).json({
        message:
          "Attendance recorded and committed",
        attendanceId,
        attendanceHash,
        txHash,
      });
    } catch (blockchainError) {
      await pool.query(
        `UPDATE attendance
         SET blockchain_status = 'FAILED'
         WHERE id = ?`,
        [attendanceId]
      );

      return res.status(201).json({
        message:
          "Attendance saved, but blockchain commit failed",
        attendanceId,
        attendanceHash,
        blockchainError:
          blockchainError.message,
      });
    }
  } catch (error) {
    await conn.rollback();

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message:
          "Attendance already exists for this student/course/date",
      });
    }

    console.error("Mark attendance error:", error);

    res.status(500).json({
      message: "Unable to record attendance",
      error: error.message,
    });
  } finally {
    conn.release();
  }
}

/* =========================================================
   LIST STUDENT ATTENDANCE
   ========================================================= */

export async function listStudentAttendance(req, res) {
  const studentId =
    req.user.role === "STUDENT"
      ? req.user.id
      : Number(req.query.studentId || 0);

  if (!studentId) {
    return res.status(400).json({
      message: "studentId required",
    });
  }

  try {
    const [rows] = await pool.query(
      `SELECT
        a.id,
        a.student_id,
        a.course_id,
        DATE_FORMAT(a.attendance_date, '%Y-%m-%d') AS attendance_date,
        a.status,
        a.recorded_by,
        a.recorded_at,
        a.attendance_hash,
        a.blockchain_tx_hash,
        a.blockchain_status,
        c.code AS course_code,
        c.name AS course_name
       FROM attendance a
       JOIN courses c ON c.id = a.course_id
       WHERE a.student_id = ?
       ORDER BY
         a.attendance_date DESC,
         a.id DESC`,
      [studentId]
    );

    res.json(rows);
  } catch (error) {
    console.error(
      "List student attendance error:",
      error
    );

    res.status(500).json({
      message: "Unable to load attendance",
      error: error.message,
    });
  }
}

/* =========================================================
   LIST COURSES
   ALL AUTHENTICATED USERS
   ========================================================= */

export async function listCourses(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT
        c.*,
        u.name AS faculty_name
       FROM courses c
       LEFT JOIN users u
         ON u.id = c.faculty_id
       ORDER BY c.code`
    );

    res.json(rows);
  } catch (error) {
    console.error("List courses error:", error);

    res.status(500).json({
      message: "Unable to load courses",
      error: error.message,
    });
  }
}

/* =========================================================
   CREATE COURSE
   ADMIN ONLY
   ========================================================= */

export async function createCourse(req, res) {
  try {
    const {
      code,
      name,
      faculty_id,
    } = req.body;

    if (!code || !name) {
      return res.status(400).json({
        message: "Course code and course name are required",
      });
    }

    /* -------------------------
       Validate faculty
       ------------------------- */

    let facultyId = null;

    if (faculty_id) {
      facultyId = Number(faculty_id);

      const [faculty] = await pool.query(
        `SELECT id
         FROM users
         WHERE id = ?
         AND role = 'FACULTY'`,
        [facultyId]
      );

      if (!faculty.length) {
        return res.status(400).json({
          message: "Invalid faculty selected",
        });
      }
    }

    /* -------------------------
       Check duplicate code
       ------------------------- */

    const [existing] = await pool.query(
      "SELECT id FROM courses WHERE code = ?",
      [code]
    );

    if (existing.length) {
      return res.status(409).json({
        message:
          "A course with this code already exists",
      });
    }

    /* -------------------------
       Create course
       ------------------------- */

    const [result] = await pool.query(
      `INSERT INTO courses
       (code, name, faculty_id)
       VALUES (?, ?, ?)`,
      [
        code,
        name,
        facultyId,
      ]
    );

    /* -------------------------
       Audit
       ------------------------- */

    await pool.query(
      `INSERT INTO audit_logs
       (
         actor_id,
         action,
         entity_type,
         entity_id,
         details
       )
       VALUES (?, ?, ?, ?, ?)`,
      [
        req.user.id,
        "COURSE_CREATED",
        "course",
        result.insertId,
        JSON.stringify({
          code,
          name,
          faculty_id: facultyId,
        }),
      ]
    );

    res.status(201).json({
      message: "Course created successfully",
      course: {
        id: result.insertId,
        code,
        name,
        faculty_id: facultyId,
      },
    });
  } catch (error) {
    console.error("Create course error:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message:
          "A course with this code already exists",
      });
    }

    res.status(500).json({
      message: "Unable to create course",
      error: error.message,
    });
  }
}

/* =========================================================
   DELETE COURSE
   ADMIN ONLY
   ========================================================= */

export async function deleteCourse(req, res) {
  const courseId = Number(req.params.id);

  if (!courseId) {
    return res.status(400).json({
      message: "Valid course ID is required",
    });
  }

  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    /* -------------------------
       Find course
       ------------------------- */

    const [courses] = await conn.query(
      `SELECT id, code, name
       FROM courses
       WHERE id = ?`,
      [courseId]
    );

    const course = courses[0];

    if (!course) {
      await conn.rollback();

      return res.status(404).json({
        message: "Course not found",
      });
    }

    /* -------------------------
       Delete attendance
       ------------------------- */

    await conn.query(
      "DELETE FROM attendance WHERE course_id = ?",
      [courseId]
    );

    /* -------------------------
       Delete enrollments
       ------------------------- */

    await conn.query(
      "DELETE FROM enrollments WHERE course_id = ?",
      [courseId]
    );

    /* -------------------------
       Delete course
       ------------------------- */

    await conn.query(
      "DELETE FROM courses WHERE id = ?",
      [courseId]
    );

    /* -------------------------
       Audit log
       ------------------------- */

    await conn.query(
      `INSERT INTO audit_logs
       (
         actor_id,
         action,
         entity_type,
         entity_id,
         details
       )
       VALUES (?, ?, ?, ?, ?)`,
      [
        req.user.id,
        "COURSE_DELETED",
        "course",
        courseId,
        JSON.stringify({
          code: course.code,
          name: course.name,
        }),
      ]
    );

    await conn.commit();

    res.json({
      message: "Course deleted successfully",
    });
  } catch (error) {
    await conn.rollback();

    console.error("Delete course error:", error);

    res.status(500).json({
      message: "Unable to delete course",
      error: error.message,
    });
  } finally {
    conn.release();
  }
}

/* =========================================================
   VERIFY ATTENDANCE
   ========================================================= */

export async function verifyAttendance(req, res) {
  const { id } = req.params;

  try {
    const [rows] = await pool.query(
      `SELECT
        a.id,
        a.student_id,
        a.course_id,
        DATE_FORMAT(a.attendance_date, '%Y-%m-%d') AS attendance_date,
        a.status,
        a.recorded_by,
        a.recorded_at,
        a.attendance_hash,
        a.blockchain_tx_hash,
        a.blockchain_status,
        u.name AS student_name,
        u.roll_no,
        c.code AS course_code,
        c.name AS course_name,
        c.faculty_id
       FROM attendance a
       JOIN users u
         ON u.id = a.student_id
       JOIN courses c
         ON c.id = a.course_id
       WHERE a.id = ?`,
      [id]
    );

    const row = rows[0];

    if (!row) {
      return res.status(404).json({
        message: "Attendance not found",
      });
    }

    // Faculty can verify records only for their assigned courses.
    // Admin can verify any record.
    if (
      req.user.role === "FACULTY" &&
      Number(row.faculty_id) !== Number(req.user.id)
    ) {
      return res.status(403).json({
        message: "You are not assigned to this course",
      });
    }

    /* -------------------------
       Recalculate hash
       ------------------------- */

    const recalculated = sha256Hex(
      canonicalAttendance({
        studentId: row.student_id,
        courseId: row.course_id,
        attendanceDate: row.attendance_date,
        status: row.status,
      })
    );

    /* -------------------------
       Verify blockchain
       ------------------------- */

    let chain = {
      exists: false,
    };

    try {
      chain = await verifyAttendanceHash(
        recalculated
      );
    } catch (error) {
      return res.status(503).json({
        message:
          "Record found, but blockchain could not be queried",
        calculatedHash: recalculated,
        storedHash: row.attendance_hash,
        error: error.message,
      });
    }

    const hashMatchesDB =
      recalculated === row.attendance_hash;

    const verified =
      hashMatchesDB &&
      chain.exists &&
      row.blockchain_status === "CONFIRMED";

    res.json({
      verified,

      status: verified
        ? "VERIFIED"
        : "TAMPER DETECTED",

      record: row,

      calculatedHash: recalculated,

      storedHash: row.attendance_hash,

      blockchain: chain,
    });
  } catch (error) {
    console.error(
      "Verify attendance error:",
      error
    );

    res.status(500).json({
      message: "Unable to verify attendance",
      error: error.message,
    });
  }
}

/* =========================================================
   LIST ALL ATTENDANCE RECORDS
   ADMIN ONLY
   ========================================================= */

export async function listAllAttendance(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT
        a.id,
        a.student_id,
        a.course_id,
        DATE_FORMAT(a.attendance_date, '%Y-%m-%d') AS attendance_date,
        a.status,
        a.recorded_by,
        a.recorded_at,
        a.attendance_hash,
        a.blockchain_tx_hash,
        a.blockchain_status,

        s.name AS student_name,
        s.roll_no,

        c.code AS course_code,
        c.name AS course_name,

        f.name AS faculty_name,
        recorder.name AS recorded_by_name

       FROM attendance a

       JOIN users s
         ON s.id = a.student_id

       JOIN courses c
         ON c.id = a.course_id

       LEFT JOIN users f
         ON f.id = c.faculty_id

       LEFT JOIN users recorder
         ON recorder.id = a.recorded_by

       ORDER BY
         a.attendance_date DESC,
         a.id DESC`
    );

    res.json(rows);
  } catch (error) {
    console.error(
      "List all attendance error:",
      error
    );

    res.status(500).json({
      message:
        "Unable to load attendance records",
      error: error.message,
    });
  }
}

/* =========================================================
   ADMIN STATISTICS
   ========================================================= */

export async function stats(req, res) {
  try {
    const [[users]] = await pool.query(
      "SELECT COUNT(*) AS count FROM users"
    );

    const [[courses]] = await pool.query(
      "SELECT COUNT(*) AS count FROM courses"
    );

    const [[attendance]] = await pool.query(
      "SELECT COUNT(*) AS count FROM attendance"
    );

    const [[verified]] = await pool.query(
      `SELECT COUNT(*) AS count
       FROM attendance
       WHERE blockchain_status = 'CONFIRMED'`
    );

    const [[present]] = await pool.query(
      `SELECT COUNT(*) AS count
       FROM attendance
       WHERE status = 'PRESENT'`
    );

    const [[absent]] = await pool.query(
      `SELECT COUNT(*) AS count
       FROM attendance
       WHERE status = 'ABSENT'`
    );

    res.json({
      users: Number(users.count),
      courses: Number(courses.count),
      attendance: Number(attendance.count),
      verified: Number(verified.count),
      present: Number(present.count),
      absent: Number(absent.count),
    });
  } catch (error) {
    console.error("Stats error:", error);

    res.status(500).json({
      message: "Unable to load statistics",
      error: error.message,
    });
  }
}

/* =========================================================
   FACULTY COURSES
   ========================================================= */

export async function listFacultyCourses(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT
        c.id,
        c.code,
        c.name,
        c.faculty_id,
        u.name AS faculty_name
       FROM courses c
       LEFT JOIN users u ON u.id = c.faculty_id
       WHERE c.faculty_id = ?
       ORDER BY c.code`,
      [req.user.id]
    );

    res.json(rows);
  } catch (error) {
    console.error("List faculty courses error:", error);

    res.status(500).json({
      message: "Unable to load faculty courses",
      error: error.message,
    });
  }
}

/* =========================================================
   FACULTY ATTENDANCE
   Shows records for courses assigned to this faculty,
   including records entered by Admin.
   ========================================================= */

export async function listFacultyAttendance(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT
        a.id,
        a.student_id,
        a.course_id,
        DATE_FORMAT(a.attendance_date, '%Y-%m-%d') AS attendance_date,
        a.status,
        a.recorded_by,
        a.recorded_at,
        a.attendance_hash,
        a.blockchain_tx_hash,
        a.blockchain_status,
        s.name AS student_name,
        s.roll_no,
        c.code AS course_code,
        c.name AS course_name
       FROM attendance a
       JOIN users s ON s.id = a.student_id
       JOIN courses c ON c.id = a.course_id
       WHERE c.faculty_id = ?
       ORDER BY a.attendance_date DESC, a.id DESC`,
      [req.user.id]
    );

    res.json(rows);
  } catch (error) {
    console.error("List faculty attendance error:", error);

    res.status(500).json({
      message: "Unable to load faculty attendance",
      error: error.message,
    });
  }
}