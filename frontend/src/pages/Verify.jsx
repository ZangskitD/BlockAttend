import { useEffect, useState } from "react";
import {
  SearchCheck,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import api from "../services/api";

export default function Verify() {
  const { user } = useAuth();

  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadRecords();
    }
  }, [user]);

  /* =========================================================
     DATE DISPLAY
     Keeps YYYY-MM-DD exactly as received from MySQL/API
     without timezone conversion.
     ========================================================= */

  function formatAttendanceDate(value) {
    if (!value) return "—";

    const text = String(value);

    // If backend gives YYYY-MM-DD, use it directly.
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
      const [year, month, day] = text.split("-");

      return `${day}-${month}-${year}`;
    }

    // If backend gives a timestamp containing YYYY-MM-DD,
    // take only the date portion.
    const match = text.match(/^(\d{4}-\d{2}-\d{2})/);

    if (match) {
      const [year, month, day] = match[1].split("-");

      return `${day}-${month}-${year}`;
    }

    return text;
  }

  async function loadRecords() {
    setLoading(true);

    try {
      let endpoint = "/attendance/student";

      // Student → own attendance
      if (user.role === "STUDENT") {
        endpoint = "/attendance/student";
      }

      // Faculty
      else if (user.role === "FACULTY") {
        endpoint = "/attendance/faculty";
      }

      // Admin → all attendance records
      else if (user.role === "ADMIN") {
        endpoint = "/attendance/all";
      }

      const r = await api.get(endpoint);

      setRows(Array.isArray(r.data) ? r.data : []);
    } catch (e) {
      console.error(
        "Could not load attendance records:",
        e
      );

      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  async function verify(id) {
    setSelected(id);
    setResult(null);

    try {
      const r = await api.get(
        `/attendance/verify/${id}`
      );

      setResult(r.data);
    } catch (e) {
      setResult({
        error:
          e.response?.data?.message ||
          "Verification failed",
      });
    }
  }

  return (
    <section className="verify-page">

      {/* HEADER */}

      <div className="topbar">

        <div>

          <div className="eyebrow">
            INTEGRITY CHECK
          </div>

          <h1>Verify a record</h1>

          <p className="muted">
            Recalculate the hash and compare it with
            the blockchain proof.
          </p>

        </div>

        <div className="page-icon">
          <SearchCheck />
        </div>

      </div>


      {/* CONTENT */}

      <div className="verify-layout">

        {/* RECORD LIST */}

        <div className="panel">

          <div className="panel-head">

            <div>

              <h3>
                Attendance history
              </h3>

              <span>
                {user.role === "STUDENT"
                  ? "Your attendance records"
                  : user.role === "FACULTY"
                  ? "Records handled by you"
                  : "All system attendance records"}
              </span>

            </div>

            <span>
              {rows.length} records
            </span>

          </div>


          {loading ? (

            <p className="empty">
              Loading attendance records...
            </p>

          ) : rows.length === 0 ? (

            <p className="empty">
              No attendance records available.
            </p>

          ) : (

            rows.map((r) => (

              <button
                key={r.id}
                className={`record-row ${
                  String(selected) === String(r.id)
                    ? "selected"
                    : ""
                }`}
                onClick={() => verify(r.id)}
              >

                <div>

                  <b>
                    {r.course_code}
                  </b>

                  <span>
                    {formatAttendanceDate(
                      r.attendance_date
                    )}

                    {" • "}

                    {r.status}
                  </span>


                  {user.role !== "STUDENT" && (

                    <small>

                      Student:{" "}

                      {r.student_name ||
                        r.student_roll_no ||
                        r.roll_no ||
                        "Unknown"}

                    </small>

                  )}

                </div>


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
                    ? "COMMITTED"
                    : "PENDING"}

                </span>

              </button>

            ))

          )}

        </div>


        {/* VERIFICATION RESULT */}

        <div>

          {result && !result.error && (

            <div
              className={`verification-card ${
                result.verified
                  ? "verified"
                  : "tampered"
              }`}
            >

              <div className="verify-icon">

                {result.verified ? (
                  <ShieldCheck />
                ) : (
                  <AlertTriangle />
                )}

              </div>


              <div className="eyebrow">

                {result.verified
                  ? "CRYPTOGRAPHIC MATCH"
                  : "INTEGRITY FAILURE"}

              </div>


              <h2>
                {result.status}
              </h2>


              <p>

                {result.verified
                  ? "The database record matches its stored SHA-256 fingerprint and the fingerprint exists on the blockchain."
                  : "The recalculated proof does not satisfy all verification checks."}

              </p>


              <div className="hash-box">

                <small>
                  Calculated SHA-256
                </small>

                <code>
                  {result.calculatedHash}
                </code>


                <small>
                  Stored SHA-256
                </small>

                <code>
                  {result.storedHash}
                </code>

              </div>


              <div className="chain-meta">

                <span>

                  On-chain:{" "}

                  <b>

                    {result.blockchain?.exists
                      ? "YES"
                      : "NO"}

                  </b>

                </span>


                <span>

                  Committer:{" "}

                  <b>

                    {result.blockchain
                      ?.committedBy
                      ? `${result.blockchain.committedBy.slice(
                          0,
                          10
                        )}…`
                      : "N/A"}

                  </b>

                </span>

              </div>

            </div>

          )}


          {result?.error && (

            <div className="error">
              {result.error}
            </div>

          )}


          {!result && !loading && (

            <div className="verification-empty">

              <SearchCheck size={36} />

              <h3>
                Select an attendance record
              </h3>

              <p>
                Select a record from the list to
                verify its cryptographic and
                blockchain proof.
              </p>

            </div>

          )}

        </div>

      </div>

    </section>
  );
}
