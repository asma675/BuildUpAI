import { useEffect, useState } from "react";

const AddCoursePage = ({ db, userId }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState(null);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);

  // Form fields
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [level, setLevel] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [success, setSuccess] = useState(null);

  const API_BASE = "http://localhost:4000"; // change if your backend uses another port

  // Load all courses
  const fetchCourses = async () => {
    try {
      setLoading(true);
      setListError(null);
      const res = await fetch(`${API_BASE}/api/courses`);
      const data = await res.json();
      setCourses(data || []);
    } catch (err) {
      setListError("Failed to load courses: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  // Open drawer for ADD
  const handleOpenAdd = () => {
    setEditingCourse(null);
    setTitle("");
    setCategory("");
    setLevel("");
    setDescription("");
    setUrl("");
    setSaveError(null);
    setSuccess(null);
    setIsDrawerOpen(true);
  };

  // Open drawer for EDIT
  const handleOpenEdit = (course) => {
    setEditingCourse(course);
    setTitle(course.title || "");
    setCategory(course.category || "");
    setLevel(course.level || "");
    setDescription(course.description || "");
    setUrl(course.url || "");
    setSaveError(null);
    setSuccess(null);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setEditingCourse(null);
    setSaveError(null);
    setSuccess(null);
  };

  // Save (add or update)
  const handleSave = async () => {
    if (!title || !category || !level) {
      setSaveError("Please fill in all required fields.");
      return;
    }

    setSaving(true);
    setSaveError(null);
    setSuccess(null);

    try {
      const payload = {
        title,
        category,
        level,
        description,
        url,
        createdBy: userId || null,
      };

      let res;
      if (editingCourse) {
        // UPDATE
        res = await fetch(`${API_BASE}/api/courses/${editingCourse.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        // CREATE
        res = await fetch(`${API_BASE}/api/courses`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save course");
      }

      setSuccess(
        editingCourse
          ? "Course updated successfully!"
          : "Course added successfully!"
      );
      await fetchCourses(); // refresh list
      handleCloseDrawer();
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Delete
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this course?"
    );
    if (!confirmDelete) return;

    try {
      const res = await fetch(`${API_BASE}/api/courses/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to delete course");
      }
      // remove from local state without refetch
      setCourses((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      alert("Error deleting course: " + err.message);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 relative">
      {/* LEFT: list + header */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-3xl font-bold text-white">Courses</h2>
          {!isDrawerOpen && (
            <button
              onClick={handleOpenAdd}
              className="bg-gradient-to-r from-cyan-400 to-purple-500 text-white px-4 py-2 rounded-lg font-semibold hover:from-cyan-300 hover:to-purple-400 shadow-glow"
            >
              + Add Course
            </button>
          )}
        </div>

        {listError && (
          <p className="text-red-300 mb-3 bg-red-900/40 p-2 rounded border border-red-500/60">
            {listError}
          </p>
        )}
        {success && (
          <p className="text-emerald-300 mb-3 bg-emerald-900/40 p-2 rounded border border-emerald-500/60">
            {success}
          </p>
        )}

        {loading ? (
          <p className="text-purple-100">Loading courses...</p>
        ) : courses.length === 0 ? (
          <p className="text-purple-200">
            No courses yet. Click “Add Course” to create one.
          </p>
        ) : (
          <div className="space-y-3">
            {courses.map((course) => (
              <div
                key={course.id}
                className="bg-purple-950/70 rounded-xl shadow-lg p-4 flex items-start justify-between gap-4 border border-purple-500/60"
              >
                <div>
                  <h3 className="text-lg font-semibold text-purple-50">
                    {course.title}
                  </h3>
                  <p className="text-sm text-purple-200">
                    <span className="font-semibold">Category:</span>{" "}
                    {course.category || "N/A"}
                  </p>
                  <p className="text-sm text-purple-200">
                    <span className="font-semibold">Level:</span>{" "}
                    {course.level || "N/A"}
                  </p>
                  {course.description && (
                    <p className="text-sm text-purple-100 mt-2">
                      {course.description}
                    </p>
                  )}
                  {course.url && (
                    <a
                      href={course.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-300 text-sm mt-2 inline-block underline"
                    >
                      Open Course
                    </a>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => handleOpenEdit(course)}
                    className="px-3 py-1 text-sm rounded bg-yellow-500 text-black hover:bg-yellow-400"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(course.id)}
                    className="px-3 py-1 text-sm rounded bg-red-600 text-white hover:bg-red-500"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RIGHT: drawer panel */}
      {isDrawerOpen && (
        <div className="fixed inset-y-16 right-0 w-full sm:w-[380px] bg-gradient-to-b from-purple-950 via-indigo-950 to-black shadow-2xl border-l border-purple-500/60 p-6 overflow-y-auto z-20 lg:static lg:h-auto lg:inset-auto lg:w-[380px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white">
              {editingCourse ? "Edit Course" : "Add New Course"}
            </h3>
            <button
              onClick={handleCloseDrawer}
              className="text-purple-200 hover:text-white text-sm"
            >
              ✕
            </button>
          </div>

          {saveError && (
            <p className="text-red-300 mb-3 bg-red-900/40 p-2 rounded border border-red-500/60">
              {saveError}
            </p>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1 text-purple-50">
                Course Title *
              </label>
              <input
                className="w-full p-3 border rounded-lg border-purple-500/60 bg-purple-950/70 text-purple-50 placeholder-purple-300/70 focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Introduction to Cybersecurity"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1 text-purple-50">
                Category *
              </label>
              <input
                className="w-full p-3 border rounded-lg border-purple-500/60 bg-purple-950/70 text-purple-50 placeholder-purple-300/70 focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Ex: IT / Business / Engineering"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1 text-purple-50">
                Level *
              </label>
              <select
                className="w-full p-3 border rounded-lg border-purple-500/60 bg-purple-950/70 text-purple-50 focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
              >
                <option value="">Select...</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1 text-purple-50">
                Short Description
              </label>
              <textarea
                className="w-full p-3 border rounded-lg border-purple-500/60 bg-purple-950/70 text-purple-50 placeholder-purple-300/70 h-24 focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a short summary of the course..."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1 text-purple-50">
                Course URL
              </label>
              <input
                className="w-full p-3 border rounded-lg border-purple-500/60 bg-purple-950/70 text-purple-50 placeholder-purple-300/70 focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/my-course"
              />
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-gradient-to-r from-cyan-400 to-purple-500 text-white font-bold py-3 rounded-lg hover:from-cyan-300 hover:to-purple-400 disabled:opacity-50 shadow-glow"
            >
              {saving
                ? "Saving..."
                : editingCourse
                ? "Update Course"
                : "Save Course"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddCoursePage;
