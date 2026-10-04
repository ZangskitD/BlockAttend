import { useEffect, useState } from "react";
import {
  BookOpen,
  Plus,
  Trash2,
  Search,
} from "lucide-react";

import api from "../services/api";

export default function ManageCourses() {
  const [courses, setCourses] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    code: "",
    name: "",
    faculty_id: "",
  });

  const [message, setMessage] = useState("");
  const [facultyLoading, setFacultyLoading] = useState(true);

  async function loadCourses() {
    try {
      const res = await api.get("/attendance/courses");
      setCourses(res.data);
    } catch (err) {
      setCourses([]);
    }
  }

  async function loadFaculties() {
    setFacultyLoading(true);

    try {
      // This endpoint should return registered Faculty users
      // with their existing id, name and email.
      const res = await api.get("/auth/faculty");

      setFaculties(
        Array.isArray(res.data) ? res.data : []
      );
    } catch (err) {
      setFaculties([]);
      setMessage(
        err.response?.data?.message ||
          "Could not load faculty. Please check the faculty API."
      );
    } finally {
      setFacultyLoading(false);
    }
  }

  useEffect(() => {
    loadCourses();
    loadFaculties();
  }, []);

  function change(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  async function addCourse(e) {
    e.preventDefault();
    setMessage("");

    if (!form.faculty_id) {
      setMessage("Please select a faculty member.");
      return;
    }

    try {
      await api.post("/attendance/courses", {
        ...form,
        faculty_id: Number(form.faculty_id),
      });

      setMessage("Course created and assigned successfully.");

      setForm({
        code: "",
        name: "",
        faculty_id: "",
      });

      loadCourses();
    } catch (err) {
      setMessage(
        err.response?.data?.message ||
          "Could not create course."
      );
    }
  }

  async function deleteCourse(id) {
    if (!window.confirm("Delete this course?")) {
      return;
    }

    try {
      await api.delete(`/attendance/courses/${id}`);
      loadCourses();
    } catch (err) {
      alert(
        err.response?.data?.message ||
          "Could not delete course."
      );
    }
  }

  const filteredCourses = courses.filter(
    (course) =>
      course.code
        ?.toLowerCase()
        .includes(search.toLowerCase()) ||
      course.name
        ?.toLowerCase()
        .includes(search.toLowerCase())
  );

  return (
    <section>
      <div className="topbar">
        <div>
          <div className="eyebrow">
            ACADEMIC MANAGEMENT
          </div>

          <h1>Manage Courses</h1>

          <p className="muted">
            Create and maintain courses used for attendance.
          </p>
        </div>

        <div className="page-icon">
          <BookOpen />
        </div>
      </div>

      <div className="admin-grid">
        {/* CREATE COURSE */}

        <div className="panel">
          <div className="panel-head">
            <h3>
              <Plus size={17} />
              Add course
            </h3>
          </div>

          <form
            className="admin-form"
            onSubmit={addCourse}
          >
            <label>
              Course code

              <input
                name="code"
                value={form.code}
                onChange={change}
                placeholder="e.g. MCA-DAA"
                required
              />
            </label>

            <label>
              Course name

              <input
                name="name"
                value={form.name}
                onChange={change}
                placeholder="Design and Analysis of Algorithms"
                required
              />
            </label>

            <label>
              Assign Faculty

              <select
                name="faculty_id"
                value={form.faculty_id}
                onChange={change}
                required
                disabled={facultyLoading || faculties.length === 0}
              >
                <option value="">
                  {facultyLoading
                    ? "Loading faculty..."
                    : faculties.length === 0
                    ? "No faculty available"
                    : "Select faculty"}
                </option>

                {faculties.map((faculty) => (
                  <option
                    key={faculty.id}
                    value={faculty.id}
                  >
                    {faculty.name} — ID: {faculty.id}
                  </option>
                ))}
              </select>
            </label>

            <button
              className="primary full"
              type="submit"
              disabled={
                facultyLoading ||
                faculties.length === 0
              }
            >
              <Plus size={17} />
              Create Course
            </button>

            {message && (
              <div className="result-box">
                {message}
              </div>
            )}
          </form>
        </div>

        {/* COURSE LIST */}

        <div className="panel">
          <div className="panel-head">
            <div>
              <h3>Courses</h3>

              <span>
                {courses.length} courses
              </span>
            </div>
          </div>

          <div className="admin-search">
            <Search size={17} />

            <input
              placeholder="Search courses..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />
          </div>

          <div className="admin-list">
            {filteredCourses.length === 0 ? (
              <p className="empty">
                No courses found.
              </p>
            ) : (
              filteredCourses.map((course) => (
                <div
                  className="course-row"
                  key={course.id}
                >
                  <div className="course-icon">
                    <BookOpen size={17} />
                  </div>

                  <div className="course-info">
                    <strong>
                      {course.code}
                    </strong>

                    <span>
                      {course.name}
                    </span>

                    {course.faculty_id && (
                      <small>
                        Faculty ID: {course.faculty_id}
                      </small>
                    )}
                  </div>

                  <button
                    className="delete-button"
                    onClick={() =>
                      deleteCourse(course.id)
                    }
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}