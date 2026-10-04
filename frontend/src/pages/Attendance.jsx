import { useEffect, useState } from "react";
import {
  ClipboardCheck,
  Hash,
  Send,
  ShieldCheck,
  CalendarDays,
  UserRound,
  BookOpen,
  CheckCircle2,
  Link2,
} from "lucide-react";

import api from "../services/api";
import "./Attendance.css";

export default function Attendance() {
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);

  const [form, setForm] = useState({
    studentId: "",
    courseId: "",
    attendanceDate: new Date().toISOString().slice(0, 10),
    status: "PRESENT",
  });

  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  // Load courses assigned to the logged-in faculty
  useEffect(() => {
    api
      .get("/attendance/courses")
      .then((r) => setCourses(r.data))
      .catch(() => setCourses([]));
  }, []);

  // Load registered students
  useEffect(() => {
    api
      .get("/auth/students")
      .then((r) => setStudents(r.data))
      .catch(() => setStudents([]));
  }, []);

  // Handle form changes
  const change = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // Submit attendance
  async function submit(e) {
    e.preventDefault();

    setBusy(true);
    setMessage("");

    try {
      const r = await api.post("/attendance", form);

      setMessage(
        `✓ ${r.data.message}. SHA-256: ${r.data.attendanceHash}${
          r.data.txHash ? ` • Tx: ${r.data.txHash}` : ""
        }`
      );
    } catch (e) {
      setMessage(
        e.response?.data?.message ||
          "Could not record attendance"
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="attendance-page">

      {/* ================= HEADER ================= */}

      <div className="attendance-header">

        <div>
          <div className="eyebrow">
            FACULTY WORKSPACE
          </div>

          <h1>Record attendance</h1>

          <p className="muted">
            Record student attendance and securely anchor
            its cryptographic proof on the blockchain.
          </p>
        </div>

        <div className="attendance-header-icon">
          <ClipboardCheck size={30} />
        </div>

      </div>


      {/* ================= MAIN GRID ================= */}

      <div className="attendance-grid">

        {/* ================= FORM CARD ================= */}

        <div className="panel attendance-form-card">

          {/* Card Header */}

          <div className="card-heading">

            <div className="heading-icon">
              <ClipboardCheck size={20} />
            </div>

            <div>
              <h3>Attendance details</h3>

              <p>
                Enter the details of the attendance
                record.
              </p>
            </div>

          </div>


          {/* Form */}

          <form onSubmit={submit}>

            {/* Student */}

            <label className="field">

              <span className="field-label">
                <UserRound size={15} />
                Student
              </span>

              <select
                name="studentId"
                value={form.studentId}
                onChange={change}
                required
              >
                <option value="">
                  Select student
                </option>

                {students.map((s) => (
                  <option
                    key={s.id}
                    value={s.id}
                  >
                    {s.roll_no || s.rollNo} —{" "}
                    {s.name}
                  </option>
                ))}
              </select>

            </label>


            {/* Course */}

            <label className="field">

              <span className="field-label">
                <BookOpen size={15} />
                Course
              </span>

              <select
                name="courseId"
                value={form.courseId}
                onChange={change}
                required
              >
                <option value="">
                  Select course
                </option>

                {courses.map((c) => (
                  <option
                    key={c.id}
                    value={c.id}
                  >
                    {c.code} — {c.name}
                  </option>
                ))}
              </select>

            </label>


            {/* Date + Status */}

            <div className="two attendance-two">

              <label className="field">

                <span className="field-label">
                  <CalendarDays size={15} />
                  Date
                </span>

                <input
                  name="attendanceDate"
                  type="date"
                  value={form.attendanceDate}
                  onChange={change}
                />

              </label>


              <label className="field">

                <span className="field-label">
                  <CheckCircle2 size={15} />
                  Status
                </span>

                <select
                  name="status"
                  value={form.status}
                  onChange={change}
                >
                  <option value="PRESENT">
                    PRESENT
                  </option>

                  <option value="ABSENT">
                    ABSENT
                  </option>
                </select>

              </label>

            </div>


            {/* Submit Button */}

            <button
              className="attendance-submit"
              disabled={busy}
            >
              <Send size={18} />

              <span>
                {busy
                  ? "Committing..."
                  : "Record & Commit Proof"}
              </span>

              {!busy && (
                <Link2 size={16} />
              )}
            </button>


            {/* Result */}

            {message && (
              <div
                className={`attendance-result ${
                  message.startsWith("✓")
                    ? "success"
                    : "error"
                }`}
              >

                <ShieldCheck size={20} />

                <div>

                  <strong>
                    {message.startsWith("✓")
                      ? "Attendance recorded"
                      : "Unable to record attendance"}
                  </strong>

                  <p>{message}</p>

                </div>

              </div>
            )}

          </form>

        </div>


        {/* ================= PROCESS CARD ================= */}

        <div className="panel process-card">

          {/* Card Header */}

          <div className="card-heading">

            <div className="heading-icon">
              <ShieldCheck size={20} />
            </div>

            <div>

              <h3>What happens next?</h3>

              <p>
                Your attendance record passes through
                four verification stages.
              </p>

            </div>

          </div>


          {/* Steps */}

          <div className="steps">

            <Step
              n="01"
              title="Canonicalize"
              text="Student, course, date and status are converted into a deterministic record."
            />

            <Step
              n="02"
              title="SHA-256"
              text="The backend generates a unique 64-character cryptographic fingerprint."
            />

            <Step
              n="03"
              title="Commit"
              text="The hash is submitted to the Ethereum-compatible AttendanceRegistry contract."
            />

            <Step
              n="04"
              title="Verify"
              text="Authorized users can recalculate the fingerprint and compare it with the stored proof."
            />

          </div>


          {/* Hash Preview */}

          <div className="hash-preview">

            <div className="hash-icon">
              <Hash size={19} />
            </div>

            <div className="hash-content">

              <span>
                CRYPTOGRAPHIC PROOF
              </span>

              <code>
                9e107d9d372bb6826bd81d3542a419d6…
              </code>

            </div>

            <ShieldCheck
              className="hash-check"
              size={19}
            />

          </div>

        </div>

      </div>

    </section>
  );
}


/* ================= STEP COMPONENT ================= */

function Step({ n, title, text }) {
  return (
    <div className="attendance-step">

      <div className="step-number">
        {n}
      </div>

      <div className="step-line" />

      <div className="step-content">

        <strong>
          {title}
        </strong>

        <p>
          {text}
        </p>

      </div>

    </div>
  );
}