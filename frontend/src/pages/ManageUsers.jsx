import { useEffect, useState } from "react";
import {
  Users,
  Plus,
  Trash2,
  Search,
  ShieldCheck,
} from "lucide-react";

import api from "../services/api";

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "STUDENT",
    roll_no: "",
    department: "",
  });

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      setLoading(true);
      const response = await api.get("/auth/users");
      setUsers(response.data);
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
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
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

      setForm({
        name: "",
        email: "",
        password: "",
        role: "STUDENT",
        roll_no: "",
        department: "",
      });

      setShowForm(false);
      loadUsers();
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

      loadUsers();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not delete user."
      );
    }
  }

  const filteredUsers = users.filter((user) => {
    const text = `
      ${user.name || ""}
      ${user.email || ""}
      ${user.role || ""}
      ${user.roll_no || ""}
      ${user.department || ""}
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
            onClick={() =>
              setShowForm(!showForm)
            }
          >
            <Plus size={17} />
            {showForm
              ? "Close Form"
              : "Add User"}
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
                  onChange={change}
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

              <label>
                Roll Number
                <input
                  name="roll_no"
                  value={form.roll_no}
                  onChange={change}
                  placeholder="e.g. ST2026-101"
                />
              </label>

              <label>
                Department
                <input
                  name="department"
                  value={form.department}
                  onChange={change}
                  placeholder="e.g. Computer Science"
                />
              </label>

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
                placeholder="Search users..."
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

                    <span>
                      {user.email}
                    </span>

                    {user.roll_no && (
                      <span>
                        {user.roll_no}
                        {user.department
                          ? ` • ${user.department}`
                          : ""}
                      </span>
                    )}
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
                    onClick={() =>
                      deleteUser(user.id)
                    }
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