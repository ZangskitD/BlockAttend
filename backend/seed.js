import bcrypt from "bcryptjs";
import { pool } from "./src/config/db.js";

const password = async p => bcrypt.hash(p, 10);

try {
  const accounts = [
    ["BlockAttend Admin","admin@blockattend.local","Admin@123","ADMIN",null,"Administration","Main Center"],
    ["Demo Faculty","faculty@blockattend.local","Faculty@123","FACULTY",null,"Computer Science","Main Center"],
    ["Demo Student","student@blockattend.local","Student@123","STUDENT","ST2026-101","Computer Science","Main Center"]
  ];

  for (const [name,email,p,role,roll,dept,center] of accounts) {
    const hash = await password(p);
    await pool.query(
      `INSERT INTO users(name,email,password_hash,role,roll_no,department,center)
       VALUES(?,?,?,?,?,?,?)
       ON DUPLICATE KEY UPDATE password_hash=VALUES(password_hash), role=VALUES(role)`,
      [name,email,hash,role,roll,dept,center]
    );
  }

  const [[faculty]] = await pool.query("SELECT id FROM users WHERE email='faculty@blockattend.local'");
  const [[student]] = await pool.query("SELECT id FROM users WHERE email='student@blockattend.local'");

  await pool.query(
    `INSERT INTO courses(code,name,faculty_id) VALUES('MCA301','Advanced Computer Networks',?)
     ON DUPLICATE KEY UPDATE name=VALUES(name), faculty_id=VALUES(faculty_id)`,
    [faculty.id]
  );
  const [[course]] = await pool.query("SELECT id FROM courses WHERE code='MCA301'");
  await pool.query(
    `INSERT IGNORE INTO enrollments(student_id,course_id) VALUES(?,?)`,
    [student.id,course.id]
  );

  console.log("Seed complete.");
} finally {
  await pool.end();
}
