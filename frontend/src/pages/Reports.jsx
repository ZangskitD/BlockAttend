import { useEffect, useState } from "react";
import {
  BarChart3,
  Users,
  ClipboardCheck,
  ShieldCheck,
  Database,
} from "lucide-react";

import api from "../services/api";


export default function Reports() {

  const [stats, setStats] = useState(null);


  useEffect(() => {

    api
      .get("/attendance/stats")
      .then((res) => {
        setStats(res.data);
      })
      .catch(() => {
        setStats(null);
      });

  }, []);


  return (
    <section>

      <div className="topbar">

        <div>

          <div className="eyebrow">
            SYSTEM ANALYTICS
          </div>

          <h1>Reports</h1>

          <p className="muted">
            Attendance and blockchain verification overview.
          </p>

        </div>

        <div className="page-icon">
          <BarChart3 />
        </div>

      </div>


      <div className="report-grid">

        <div className="report-card">

          <div className="report-icon blue">
            <Users />
          </div>

          <span>Total students</span>

          <strong>
            {stats?.students ?? "—"}
          </strong>

        </div>


        <div className="report-card">

          <div className="report-icon green">
            <ClipboardCheck />
          </div>

          <span>Attendance records</span>

          <strong>
            {stats?.total ?? "—"}
          </strong>

        </div>


        <div className="report-card">

          <div className="report-icon green">
            <ShieldCheck />
          </div>

          <span>Blockchain verified</span>

          <strong>
            {stats?.verified ?? "—"}
          </strong>

        </div>


        <div className="report-card">

          <div className="report-icon blue">
            <Database />
          </div>

          <span>Verification rate</span>

          <strong>
            {stats?.total
              ? `${Math.round(
                  (stats.verified /
                    stats.total) *
                    100
                )}%`
              : "—"}
          </strong>

        </div>

      </div>


      <div className="panel report-summary">

        <div className="panel-head">

          <div>

            <h3>
              Blockchain integrity
            </h3>

            <span>
              Attendance verification status
            </span>

          </div>

        </div>


        <div className="integrity-bar">

          <div
            className="integrity-progress"
            style={{
              width: stats?.total
                ? `${Math.round(
                    (stats.verified /
                      stats.total) *
                      100
                  )}%`
                : "0%",
            }}
          />

        </div>


        <div className="integrity-label">

          <span>
            Verified records
          </span>

          <strong>
            {stats?.verified ?? 0}
            {" / "}
            {stats?.total ?? 0}
          </strong>

        </div>

      </div>

    </section>
  );
}