import crypto from "crypto";

/**
 * Canonical fields are deliberately small and deterministic.
 * Do not include PII in the on-chain hash payload unless your project
 * specifically requires it.
 */
export function canonicalAttendance({ studentId, courseId, attendanceDate, status }) {
  return JSON.stringify({
    studentId: Number(studentId),
    courseId: Number(courseId),
    attendanceDate: String(attendanceDate),
    status: String(status).toUpperCase()
  });
}

export function sha256Hex(value) {
  return crypto.createHash("sha256").update(value, "utf8").digest("hex");
}
