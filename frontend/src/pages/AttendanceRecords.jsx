import { useEffect, useState } from "react";
import {
  Database,
  Search,
  ShieldCheck,
} from "lucide-react";

import api from "../services/api";

export default function AttendanceRecords() {

  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);


  useEffect(() => {

    api
      .get("/attendance/all")
      .then((res) => {
        setRecords(res.data);
      })
      .catch(() => {
        setRecords([]);
      })
      .finally(() => {
        setLoading(false);
      });

  }, []);


  const filtered = records.filter((record) => {

    const value = search.toLowerCase();

    return (
      record.student_name
        ?.toLowerCase()
        .includes(value) ||
      record.roll_no
        ?.toLowerCase()
        .includes(value) ||
      record.course_code
        ?.toLowerCase()
        .includes(value)
    );

  });


  return (
    <section>

      <div className="topbar">

        <div>

          <div className="eyebrow">
            SYSTEM DATA
          </div>

          <h1>Attendance Records</h1>

          <p className="muted">
            View system-wide attendance and blockchain status.
          </p>

        </div>

        <div className="page-icon">
          <Database />
        </div>

      </div>


      <div className="panel">

        <div className="records-toolbar">

          <div>

            <h3>
              All attendance
            </h3>

            <span>
              {records.length} records
            </span>

          </div>


          <div className="admin-search">

            <Search size={17} />

            <input
              placeholder="Search student, roll number or course..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />

          </div>

        </div>


        {loading ? (

          <p className="empty">
            Loading records...
          </p>

        ) : filtered.length === 0 ? (

          <p className="empty">
            No attendance records found.
          </p>

        ) : (

          <div className="table-wrap">

            <table>

              <thead>

                <tr>
                  <th>Student</th>
                  <th>Course</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Blockchain</th>
                </tr>

              </thead>


              <tbody>

                {filtered.map((record) => (

                  <tr key={record.id}>

                    <td>

                      <strong>
                        {record.student_name}
                      </strong>

                      <br />

                      <small>
                        {record.roll_no}
                      </small>

                    </td>


                    <td>

                      <strong>
                        {record.course_code}
                      </strong>

                      <br />

                      <small>
                        {record.course_name}
                      </small>

                    </td>


                    <td>
                      {String(
                        record.attendance_date
                      ).slice(0, 10)}
                    </td>


                    <td>

                      <span
                        className={`badge ${
                          record.status === "PRESENT"
                            ? "green"
                            : "red"
                        }`}
                      >
                        {record.status}
                      </span>

                    </td>


                    <td>

                      {record.blockchain_status ===
                      "CONFIRMED" ? (

                        <span className="proof ok">
                          <ShieldCheck size={12} />
                          ON-CHAIN
                        </span>

                      ) : (

                        <span className="proof">
                          PENDING
                        </span>

                      )}

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </div>

    </section>
  );
}