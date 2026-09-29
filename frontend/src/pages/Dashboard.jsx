import { useEffect, useState } from "react";
import {
  ShieldCheck,
  Database,
  Blocks,
  CheckCircle2,
  Users,
  BookOpen,
  ClipboardCheck,
  SearchCheck,
  BarChart3,
} from "lucide-react";

import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

export default function Dashboard() {
  const { user } = useAuth();

  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadDashboard();
  }, [user]);

  async function loadDashboard() {
    try {
      if (user.role === "STUDENT") {
        const r = await api.get("/attendance/student");
        setRows(r.data);
      }

      if (user.role === "ADMIN") {
        const r = await api.get("/attendance/stats");
        setStats(r.data);
      }
    } catch (error) {
      console.error("Dashboard loading error:", error);
    }
  }

  const firstName =
    user?.name?.trim()?.split(" ")[0] || "User";

  /* --------------------------------------------------
     STUDENT DATA
  -------------------------------------------------- */

  const present = rows.filter(
    (r) => r.status === "PRESENT"
  ).length;

  const total = rows.length;

  const attendanceRate = total
    ? Math.round((present / total) * 100)
    : 0;

  const blockchainConfirmed = rows.filter(
    (r) => r.blockchain_status === "CONFIRMED"
  ).length;

  /* --------------------------------------------------
     ADMIN DATA
     Flexible property names so your backend can use
     slightly different names.
  -------------------------------------------------- */

  const totalStudents =
    stats?.students ??
    stats?.totalStudents ??
    stats?.studentCount ??
    "—";

  const totalFaculty =
    stats?.faculty ??
    stats?.totalFaculty ??
    stats?.facultyCount ??
    "—";

  const totalCourses =
    stats?.courses ??
    stats?.totalCourses ??
    stats?.courseCount ??
    "—";

  const totalAttendance =
    stats?.attendance ??
    stats?.totalAttendance ??
    stats?.attendanceCount ??
    "—";

  const verifiedRecords =
    stats?.verified ??
    stats?.verifiedRecords ??
    stats?.confirmed ??
    0;

  const pendingRecords =
    stats?.pending ??
    stats?.pendingRecords ??
    stats?.unverified ??
    0;

  return (
    <section>

      {/* =================================================
          STUDENT DASHBOARD
      ================================================= */}

      {user.role === "STUDENT" && (
        <>
          <div className="topbar">
            <div>
              <div className="eyebrow">
                OVERVIEW
              </div>

              <h1>
                Good to see you, {firstName}.
              </h1>

              <p className="muted">
                Your attendance integrity dashboard.
              </p>
            </div>

            <div className="role-chip">
              STUDENT
            </div>
          </div>

          <div className="hero-card">
            <div>
              <span className="status-dot" />

              Blockchain verification layer

              <h2>
                Your records have a cryptographic trail.
              </h2>

              <p>
                Each committed attendance record gets a
                SHA-256 fingerprint. The fingerprint is
                anchored to an Ethereum-compatible blockchain.
              </p>
            </div>

            <div className="big-shield">
              <ShieldCheck />
            </div>
          </div>

          <div className="stat-grid">

            <Stat
              icon={<CheckCircle2 />}
              label="Attendance rate"
              value={`${attendanceRate}%`}
            />

            <Stat
              icon={<Database />}
              label="My records"
              value={total}
            />

            <Stat
              icon={<Blocks />}
              label="Confirmed on-chain"
              value={blockchainConfirmed}
            />

            <Stat
              icon={<ShieldCheck />}
              label="Verification model"
              value="SHA-256"
            />

          </div>

          <div className="panel">

            <div className="panel-head">
              <h3>Recent attendance</h3>

              <span>
                Blockchain proof status
              </span>
            </div>

            {rows.length === 0 ? (
              <p className="empty">
                No attendance records yet.
              </p>
            ) : (
              <div className="table-wrap">
                <table>

                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Course</th>
                      <th>Status</th>
                      <th>Proof</th>
                    </tr>
                  </thead>

                  <tbody>
                    {rows.slice(0, 8).map((r) => (
                      <tr key={r.id}>

                        <td>
                          {String(
                            r.attendance_date
                          ).slice(0, 10)}
                        </td>

                        <td>
                          <b>{r.course_code}</b>
                          <br />
                          <small>
                            {r.course_name}
                          </small>
                        </td>

                        <td>
                          <span
                            className={`badge ${
                              r.status === "PRESENT"
                                ? "green"
                                : "red"
                            }`}
                          >
                            {r.status}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`proof ${
                              r.blockchain_status ===
                              "CONFIRMED"
                                ? "ok"
                                : ""
                            }`}
                          >
                            {r.blockchain_status ===
                            "CONFIRMED"
                              ? "ON-CHAIN"
                              : "PENDING"}
                          </span>
                        </td>

                      </tr>
                    ))}
                  </tbody>

                </table>
              </div>
            )}

          </div>
        </>
      )}

      {/* =================================================
          FACULTY DASHBOARD
      ================================================= */}

      {user.role === "FACULTY" && (
        <>
          <div className="topbar">
            <div>
              <div className="eyebrow">
                FACULTY WORKSPACE
              </div>

              <h1>
                Welcome back, {firstName}.
              </h1>

              <p className="muted">
                Manage attendance and verify its
                blockchain-backed integrity.
              </p>
            </div>

            <div className="role-chip">
              FACULTY
            </div>
          </div>

          <div className="hero-card">
            <div>
              <span className="status-dot" />

              Blockchain verification layer

              <h2>
                Attendance records have a cryptographic trail.
              </h2>

              <p>
                Attendance submitted by faculty is protected
                with a SHA-256 fingerprint and can be verified
                against its blockchain proof.
              </p>
            </div>

            <div className="big-shield">
              <ShieldCheck />
            </div>
          </div>

          <div className="stat-grid">

            <Stat
              icon={<ClipboardCheck />}
              label="Attendance"
              value="Mark"
            />

            <Stat
              icon={<SearchCheck />}
              label="Record verification"
              value="Verify"
            />

            <Stat
              icon={<Blocks />}
              label="Blockchain"
              value="Active"
            />

            <Stat
              icon={<ShieldCheck />}
              label="Verification model"
              value="SHA-256"
            />

          </div>

          <div className="info-grid">

            <Link
              to="/attendance"
              className="panel info"
              style={{
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <ClipboardCheck size={24} />

              <h3>
                Mark Attendance
              </h3>

              <p>
                Record student attendance and create
                its cryptographic proof.
              </p>
            </Link>

            <Link
              to="/verify"
              className="panel info"
              style={{
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <SearchCheck size={24} />

              <h3>
                Verify Records
              </h3>

              <p>
                Recalculate attendance hashes and
                verify blockchain-backed records.
              </p>
            </Link>

            <div className="panel info">
              <Blocks size={24} />

              <h3>
                Blockchain Integrity
              </h3>

              <p>
                Attendance proofs are anchored to an
                Ethereum-compatible blockchain.
              </p>
            </div>

          </div>
        </>
      )}

      {/* =================================================
          ADMIN DASHBOARD
      ================================================= */}

      {user.role === "ADMIN" && (
        <>
          <div className="topbar">
            <div>
              <div className="eyebrow">
                SYSTEM ADMINISTRATION
              </div>

              <h1>
                Welcome to BlockAttend.
              </h1>

              <p className="muted">
                Monitor users, attendance activity and
                blockchain verification across the system.
              </p>
            </div>

            <div className="role-chip">
              ADMIN
            </div>
          </div>

          <div className="hero-card">
            <div>
              <span className="status-dot" />

              System integrity layer

              <h2>
                Your attendance system has a verifiable trail.
              </h2>

              <p>
                BlockAttend uses cryptographic fingerprints
                and blockchain anchoring to provide a
                tamper-evident attendance record system.
              </p>
            </div>

            <div className="big-shield">
              <ShieldCheck />
            </div>
          </div>

          {/* ADMIN STATISTICS */}

          <div className="stat-grid">

            <Stat
              icon={<Users />}
              label="Total students"
              value={totalStudents}
            />

            <Stat
              icon={<Users />}
              label="Total faculty"
              value={totalFaculty}
            />

            <Stat
              icon={<BookOpen />}
              label="Total courses"
              value={totalCourses}
            />

            <Stat
              icon={<Database />}
              label="Attendance records"
              value={totalAttendance}
            />

          </div>

          {/* BLOCKCHAIN STATUS */}

          <div className="info-grid">

            <div className="panel info">
              <CheckCircle2 size={24} />

              <h3>
                Verified Records
              </h3>

              <p>
                Attendance records successfully
                verified against their blockchain proof.
              </p>

              <strong
                style={{
                  display: "block",
                  fontSize: "24px",
                  marginTop: "10px",
                }}
              >
                {verifiedRecords}
              </strong>
            </div>

            <div className="panel info">
              <Blocks size={24} />

              <h3>
                Blockchain Status
              </h3>

              <p>
                Records currently confirmed on the
                blockchain verification layer.
              </p>

              <strong
                style={{
                  display: "block",
                  fontSize: "14px",
                  marginTop: "10px",
                  color: "#16866a",
                }}
              >
                NETWORK ACTIVE
              </strong>
            </div>

            <div className="panel info">
              <BarChart3 size={24} />

              <h3>
                Pending Records
              </h3>

              <p>
                Attendance records waiting for
                blockchain confirmation.
              </p>

              <strong
                style={{
                  display: "block",
                  fontSize: "24px",
                  marginTop: "10px",
                }}
              >
                {pendingRecords}
              </strong>
            </div>

          </div>

          {/* ADMIN QUICK ACTIONS */}

          <div className="panel" style={{ marginTop: "18px" }}>

            <div className="panel-head">
              <h3>
                Administration
              </h3>

              <span>
                System management
              </span>
            </div>

            <div className="info-grid">

              <Link
                to="/users"
                className="panel info"
                style={{
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <Users size={24} />

                <h3>
                  Manage Users
                </h3>

                <p>
                  Manage students, faculty and
                  administrator accounts.
                </p>
              </Link>

              <Link
                to="/courses"
                className="panel info"
                style={{
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <BookOpen size={24} />

                <h3>
                  Manage Courses
                </h3>

                <p>
                  Create and manage courses used
                  by the attendance system.
                </p>
              </Link>

              <Link
                to="/verify"
                className="panel info"
                style={{
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <SearchCheck size={24} />

                <h3>
                  Verify Records
                </h3>

                <p>
                  Review attendance records and
                  verify their blockchain integrity.
                </p>
              </Link>

            </div>

          </div>
        </>
      )}

    </section>
  );
}


/* =====================================================
   REUSABLE STAT CARD
===================================================== */

function Stat({ icon, label, value }) {
  return (
    <div className="stat">

      <div className="stat-icon">
        {icon}
      </div>

      <small>
        {label}
      </small>

      <strong>
        {value}
      </strong>

    </div>
  );
}