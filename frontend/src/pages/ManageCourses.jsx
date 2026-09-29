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
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    code: "",
    name: "",
    faculty_id: "",
  });

  const [message, setMessage] = useState("");


  async function loadCourses() {

    try {

      const res =
        await api.get("/attendance/courses");

      setCourses(res.data);

    } catch (err) {

      setCourses([]);

    }
  }


  useEffect(() => {
    loadCourses();
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

    try {

      await api.post("/attendance/courses", form);

      setMessage(
        "Course created successfully."
      );

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

      await api.delete(
        `/attendance/courses/${id}`
      );

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
              Faculty ID

              <input
                name="faculty_id"
                value={form.faculty_id}
                onChange={change}
                placeholder="Faculty user ID"
              />
            </label>


            <button
              className="primary full"
              type="submit"
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

