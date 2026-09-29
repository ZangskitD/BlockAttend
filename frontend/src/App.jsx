import {
  Routes,
  Route,
  Navigate,
  Link,
  useLocation,
} from "react-router-dom";

import "./styles/app.css";
import { AuthProvider, useAuth } from "./context/AuthContext";

import {
  ShieldCheck,
  LayoutDashboard,
  ClipboardCheck,
  SearchCheck,
  LogOut,
  Users,
  BookOpen,
  Database,
  BarChart3,
} from "lucide-react";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Attendance from "./pages/Attendance";
import Verify from "./pages/Verify";

import ManageUsers from "./pages/ManageUsers";
import ManageCourses from "./pages/ManageCourses";
import AttendanceRecords from "./pages/AttendanceRecords";
import Reports from "./pages/Reports";


function Private({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading BlockAttend…</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}


function Shell({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();

  const firstLetter =
    user?.name?.trim()?.charAt(0)?.toUpperCase() || "U";

  return (
    <div className="app">

      <aside className="sidebar">

        {/* BRAND */}
        <div className="brand">

          <div className="brand-icon">
            <ShieldCheck />
          </div>

          <div>
            <b>BlockAttend</b>
            <span>Trust layer for attendance</span>
          </div>

        </div>


        {/* NAVIGATION */}
        <nav>

          {/* COMMON */}
          <Link
            className={location.pathname === "/" ? "active" : ""}
            to="/"
          >
            <LayoutDashboard />
            Dashboard
          </Link>


          {/* FACULTY + ADMIN */}
          {(user.role === "FACULTY" ||
            user.role === "ADMIN") && (
            <Link
              className={
                location.pathname === "/attendance"
                  ? "active"
                  : ""
              }
              to="/attendance"
            >
              <ClipboardCheck />
              Mark Attendance
            </Link>
          )}


          {/* ADMIN ONLY */}
          {user.role === "ADMIN" && (
            <>
              <Link
                className={
                  location.pathname === "/users"
                    ? "active"
                    : ""
                }
                to="/users"
              >
                <Users />
                Manage Users
              </Link>

              <Link
                className={
                  location.pathname === "/courses"
                    ? "active"
                    : ""
                }
                to="/courses"
              >
                <BookOpen />
                Manage Courses
              </Link>

              <Link
                className={
                  location.pathname === "/records"
                    ? "active"
                    : ""
                }
                to="/records"
              >
                <Database />
                Attendance Records
              </Link>

              <Link
                className={
                  location.pathname === "/reports"
                    ? "active"
                    : ""
                }
                to="/reports"
              >
                <BarChart3 />
                Reports
              </Link>
            </>
          )}


          {/* VERIFY */}
          <Link
            className={
              location.pathname.startsWith("/verify")
                ? "active"
                : ""
            }
            to="/verify"
          >
            <SearchCheck />
            Verify Record
          </Link>

        </nav>


        {/* USER */}
        <div className="side-bottom">

          <div className="user-mini">

            <div className="avatar">
              {firstLetter}
            </div>

            <div>
              <b>{user.name}</b>
              <small>{user.role}</small>
            </div>

          </div>


          <button
            className="ghost"
            onClick={logout}
          >
            <LogOut />
            Sign out
          </button>

        </div>

      </aside>


      <main className="main">
        {children}
      </main>

    </div>
  );
}


function AppRoutes() {
  return (
    <Routes>

      {/* LOGIN */}
      <Route
        path="/login"
        element={<Login />}
      />


      {/* DASHBOARD */}
      <Route
        path="/"
        element={
          <Private>
            <Shell>
              <Dashboard />
            </Shell>
          </Private>
        }
      />


      {/* MARK ATTENDANCE */}
      <Route
        path="/attendance"
        element={
          <Private roles={["FACULTY", "ADMIN"]}>
            <Shell>
              <Attendance />
            </Shell>
          </Private>
        }
      />


      {/* ADMIN - USERS */}
      <Route
        path="/users"
        element={
          <Private roles={["ADMIN"]}>
            <Shell>
              <ManageUsers />
            </Shell>
          </Private>
        }
      />


      {/* ADMIN - COURSES */}
      <Route
        path="/courses"
        element={
          <Private roles={["ADMIN"]}>
            <Shell>
              <ManageCourses />
            </Shell>
          </Private>
        }
      />


      {/* ADMIN - RECORDS */}
      <Route
        path="/records"
        element={
          <Private roles={["ADMIN"]}>
            <Shell>
              <AttendanceRecords />
            </Shell>
          </Private>
        }
      />


      {/* ADMIN - REPORTS */}
      <Route
        path="/reports"
        element={
          <Private roles={["ADMIN"]}>
            <Shell>
              <Reports />
            </Shell>
          </Private>
        }
      />


      {/* VERIFY */}
      <Route
        path="/verify"
        element={
          <Private>
            <Shell>
              <Verify />
            </Shell>
          </Private>
        }
      />


      {/* UNKNOWN */}
      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />

    </Routes>
  );
}


export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}