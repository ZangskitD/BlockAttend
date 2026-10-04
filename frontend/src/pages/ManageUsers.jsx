import { useEffect, useState } from "react";
import {
  Users,
  Plus,
  Trash2,
  Search,
  ShieldCheck,
} from "lucide-react";

import api from "../services/api";

const emptyForm = {
  name: "",
  email: "",
  password: "",
  role: "STUDENT",

  // Student details
  roll_no: "",
  semester: "",
  class_name: "",

  // Faculty details
  employee_id: "",
  designation: "",

  // Common detail
  department: "",
};

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({ ...emptyForm });

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      setLoading(true);

      const response = await api.get("/auth/users");

      setUsers(response.data);
      setError("");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not load users."
      );
    } finally {
      setLoading(false);
    }
  }

  function change(e) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleRoleChange(e) {
    const role = e.target.value;

    setForm((prev) => ({
      ...emptyForm,
      name: prev.name,
      email: prev.email,
      password: prev.password,
      role,
    }));
  }

  async function createUser(e) {
    e.preventDefault();

    setMessage("");
    setError("");

    try {
      const response = await api.post("/auth/users", form);

      setMessage(
        response.data?.message ||
          "User created successfully."
      );

      setForm({ ...emptyForm });
      setShowForm(false);

      await loadUsers();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not create user."
      );
    }
  }

  async function deleteUser(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this user?"
    );

    if (!confirmed) return;

    setMessage("");
    setError("");

    try {
      const response = await api.delete(
        `/auth/users/${id}`
      );

      setMessage(
        response.data?.message ||
          "User deleted successfully."
      );

      await loadUsers();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not delete user."
      );
    }
  }

  const filteredUsers = users.filter((user) => {
    const text = `
      ${user.id || ""}
      ${user.name || ""}
      ${user.email || ""}
      ${user.role || ""}
      ${user.roll_no || ""}
      ${user.department || ""}
      ${user.semester || ""}
      ${user.class_name || ""}
      ${user.employee_id || ""}
    `.toLowerCase();

    return text.includes(search.toLowerCase());
  });

  function initials(name) {
    return (
      name
        ?.trim()
        ?.split(" ")
        ?.map((word) => word[0])
        ?.join("")
        ?.slice(0, 2)
        ?.toUpperCase() || "U"
    );
  }

  return (
    <section className="admin-page">
      {/* HEADER */}
      <div className="admin-header">
        <div>
          <div className="eyebrow">
            ADMINISTRATION
          </div>

          <h1>Manage Users</h1>

          <p>
            Create, view and manage BlockAttend users.
          </p>
        </div>

        <div className="admin-header-action">
          <button
            className="primary"
            onClick={() => {
              setShowForm(!showForm);
              setError("");
              setMessage("");
            }}
          >
            <Plus size={17} />
            {showForm ? "Close Form" : "Add User"}
          </button>
        </div>
      </div>

      {/* MESSAGES */}
      {message && (
        <div
          className="result-box"
          style={{ marginBottom: "15px" }}
        >
          ✓ {message}
        </div>
      )}

      {error && (
        <div
          className="error"
          style={{ marginBottom: "15px" }}
        >
          {error}
        </div>
      )}

      <div
        className={
          showForm
            ? "admin-grid"
            : "admin-grid single"
        }
      >
        {/* CREATE USER */}
        {showForm && (
          <div className="admin-form">
            <h3>Create User</h3>

            <p className="admin-form-subtitle">
              Add a new student, faculty member or
              administrator.
            </p>

            <form onSubmit={createUser}>
              {/* BASIC DETAILS */}
              <div className="form-section-title">
                Basic Details
              </div>

              <label>
                Full Name
                <input
                  name="name"
                  value={form.name}
                  onChange={change}
                  placeholder="Enter full name"
                  required
                />
              </label>

              <label>
                Email
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={change}
                  placeholder="user@university.edu"
                  required
                />
              </label>

              <label>
                Password
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={change}
                  placeholder="Enter password"
                  required
                />
              </label>

              <label>
                Role
                <select
                  name="role"
                  value={form.role}
                  onChange={handleRoleChange}
                  required
                >
                  <option value="STUDENT">
                    Student
                  </option>

                  <option value="FACULTY">
                    Faculty
                  </option>

                  <option value="ADMIN">
                    Admin
                  </option>
                </select>
              </label>

              {/* STUDENT DETAILS */}
              {form.role === "STUDENT" && (
                <>
                  <div className="form-section-title">
                    Student Details
                  </div>

                  <label>
                    Roll Number
                    <input
                      name="roll_no"
                      value={form.roll_no}
                      onChange={change}
                      placeholder="Enter student roll number"
                      required
                    />
                  </label>

                  <label>
                    Semester
                    <select
                      name="semester"
                      value={form.semester}
                      onChange={change}
                      required
                    >
                      <option value="">
                        Select semester
                      </option>

                      {[1, 2, 3, 4, 5, 6, 7, 8].map(
                        (sem) => (
                          <option
                            key={sem}
                            value={sem}
                          >
                            Semester {sem}
                          </option>
                        )
                      )}
                    </select>
                  </label>

                  <label>
                    Class / Section
                    <input
                      name="class_name"
                      value={form.class_name}
                      onChange={change}
                      placeholder="e.g. MCA-A"
                      required
                    />
                  </label>

                  <label>
                    Department
                    <input
                      name="department"
                      value={form.department}
                      onChange={change}
                      placeholder="e.g. Computer Science"
                      required
                    />
                  </label>
                </>
              )}

              {/* FACULTY DETAILS */}
              {form.role === "FACULTY" && (
                <>
                  <div className="form-section-title">
                    Faculty Details
                  </div>

                  <label>
                    Employee ID
                    <input
                      name="employee_id"
                      value={form.employee_id}
                      onChange={change}
                      placeholder="Enter employee ID"
                      required
                    />
                  </label>

                  <label>
                    Designation
                    <select
                      name="designation"
                      value={form.designation}
                      onChange={change}
                      required
                    >
                      <option value="">
                        Select designation
                      </option>

                      <option value="Assistant Professor">
                        Assistant Professor
                      </option>

                      <option value="Associate Professor">
                        Associate Professor
                      </option>

                      <option value="Professor">
                        Professor
                      </option>

                      <option value="Guest Faculty">
                        Guest Faculty
                      </option>

                      <option value="Lecturer">
                        Lecturer
                      </option>
                    </select>
                  </label>

                  <label>
                    Department
                    <input
                      name="department"
                      value={form.department}
                      onChange={change}
                      placeholder="e.g. Computer Science"
                      required
                    />
                  </label>
                </>
              )}

              {/* ADMIN DETAILS */}
              {form.role === "ADMIN" && (
                <>
                  <div className="form-section-title">
                    Admin Details
                  </div>

                  <label>
                    Department
                    <input
                      name="department"
                      value={form.department}
                      onChange={change}
                      placeholder="Enter department"
                    />
                  </label>
                </>
              )}

              <div className="admin-form-actions">
                <button
                  type="submit"
                  className="primary full"
                >
                  <Plus size={16} />
                  Create User
                </button>
              </div>
            </form>

            <div className="admin-security-note">
              <ShieldCheck />

              <p>
                User accounts are managed by the
                administrator. Credentials should be
                kept secure.
              </p>
            </div>
          </div>
        )}

        {/* USER LIST */}
        <div className="admin-list">
          <div className="admin-list-header">
            <div>
              <h3>Registered Users</h3>
            </div>

            <span>
              {filteredUsers.length} users
            </span>
          </div>

          {/* SEARCH */}
          <div
            style={{
              padding: "15px 20px 5px",
            }}
          >
            <div className="admin-search">
              <Search />

              <input
                type="text"
                placeholder="Search by name, email, ID or role..."
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
              />
            </div>
          </div>

          {/* LIST */}
          {loading ? (
            <div className="admin-empty">
              <Users />

              <h3>Loading users...</h3>

              <p>
                Please wait while user records are
                loaded.
              </p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="admin-empty">
              <Users />

              <h3>No users found</h3>

              <p>
                Try another search or create a new
                user.
              </p>
            </div>
          ) : (
            filteredUsers.map((user) => (
              <div
                className="admin-user-row"
                key={user.id}
              >
                <div className="admin-user-info">
                  <div className="admin-user-avatar">
                    {initials(user.name)}
                  </div>

                  <div className="admin-user-text">
                    <b>{user.name}</b>

                    <span>{user.email}</span>

                    <span>
                      ID: {user.id}
                      {user.role === "STUDENT" &&
                      user.roll_no
                        ? ` • Roll No: ${user.roll_no}`
                        : ""}
                      {user.role === "STUDENT" &&
                      user.semester
                        ? ` • Semester: ${user.semester}`
                        : ""}
                      {user.role === "STUDENT" &&
                      user.class_name
                        ? ` • Class: ${user.class_name}`
                        : ""}
                      {user.role === "FACULTY" &&
                      user.employee_id
                        ? ` • Employee ID: ${user.employee_id}`
                        : ""}
                      {user.department
                        ? ` • ${user.department}`
                        : ""}
                    </span>
                  </div>
                </div>

                <div className="admin-user-meta">
                  <span
                    className={`admin-role ${
                      user.role?.toLowerCase() || ""
                    }`}
                  >
                    {user.role}
                  </span>

                  <button
                    className="delete-button"
                    title="Delete user"
                    onClick={() => deleteUser(user.id)}
                  >
                    <Trash2 />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}