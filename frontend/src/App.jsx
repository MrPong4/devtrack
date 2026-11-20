
import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://localhost:8080/api/projects";
const TASK_API_URL = "http://localhost:8080/api/tasks";
const AUTH_API_URL = "http://localhost:8080/api/auth";

async function apiRequest(url, options = {}) {
  const token = localStorage.getItem("devtrack_token");
  const headers = { ...(options.headers || {}) };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return fetch(url, { ...options, headers });
}

function App() {
  const [token, setToken] = useState(() =>
    localStorage.getItem("devtrack_token")
  );

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("devtrack_user") || "null");
    } catch {
      return null;
    }
  });

  const [authMode, setAuthMode] = useState("login");
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);

  const [currentPage, setCurrentPage] = useState("dashboard");
  const [searchTerm, setSearchTerm] = useState("");
  const [taskSearch, setTaskSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [taskLoading, setTaskLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskPriority, setTaskPriority] = useState("MEDIUM");
  const [taskStatus, setTaskStatus] = useState("TODO");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [taskSaving, setTaskSaving] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const [draggedTask, setDraggedTask] = useState(null);
  const [dragOverStatus, setDragOverStatus] = useState(null);

  useEffect(() => {
    if (token) {
      loadProjects();
      loadTasks();
    } else {
      setProjects([]);
      setTasks([]);
      setLoading(false);
      setTaskLoading(false);
    }
  }, [token]);

  // ========================================
  // AUTHENTICATION
  // ========================================

  async function handleAuthentication(e) {
    e.preventDefault();

    setAuthError("");
    setAuthLoading(true);

    try {
      const endpoint =
        authMode === "register" ? "register" : "login";

      const payload =
        authMode === "register"
          ? {
              name: authName.trim(),
              email: authEmail.trim(),
              password: authPassword,
            }
          : {
              email: authEmail.trim(),
              password: authPassword,
            };

      const response = await fetch(
        `${AUTH_API_URL}/${endpoint}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const responseData = await response.json().catch(() => ({}));

      const data =
        responseData.data && typeof responseData.data === "object"
          ? responseData.data
          : responseData;

      if (!response.ok) {
        throw new Error(
          data.message ||
            data.error ||
            responseData.message ||
            "Authentication failed. Check your details and try again."
        );
      }

      // Accept common authentication token property names.
      const authToken =
        data.token ||
        data.accessToken ||
        data.access_token ||
        data.jwt;

      if (!authToken || typeof authToken !== "string") {
        console.error(
          "Unexpected authentication response:",
          responseData
        );

        throw new Error(
          "Login succeeded, but the server response did not contain a usable token."
        );
      }

      const account = {
        name:
          data.name ||
          data.fullName ||
          payload.name ||
          "DevTrack User",
        email: data.email || payload.email,
      };

      // Save authentication information before loading protected data.
      localStorage.setItem("devtrack_token", authToken);
      localStorage.setItem(
        "devtrack_user",
        JSON.stringify(account)
      );

      setUser(account);
      setToken(authToken);
      setAuthPassword("");
      setAuthError("");
    } catch (err) {
      console.error("Authentication error:", err);

      setAuthError(
        err.message || "Could not connect to the server."
      );
    } finally {
      setAuthLoading(false);
    }
  }

  function handleLogout() {
    localStorage.removeItem("devtrack_token");
    localStorage.removeItem("devtrack_user");

    setToken(null);
    setUser(null);
    setProjects([]);
    setTasks([]);
    setCurrentPage("dashboard");
    setError("");
    setAuthEmail("");
    setAuthPassword("");
  }

  // ========================================
  // LOAD PROJECTS AND TASKS
  // ========================================

  async function loadProjects() {
    try {
      setLoading(true);

      const response = await apiRequest(API_URL);

      if (!response.ok) {
        throw new Error(
          `Could not load projects. Server returned ${response.status}.`
        );
      }

      const data = await response.json();

      setProjects(Array.isArray(data) ? data : []);
      setError("");
    } catch (err) {
      console.error("Project loading error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadTasks() {
    try {
      setTaskLoading(true);

      const response = await apiRequest(TASK_API_URL);

      if (!response.ok) {
        throw new Error(
          `Could not load tasks. Server returned ${response.status}.`
        );
      }

      const data = await response.json();

      setTasks(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Task loading error:", err);
    } finally {
      setTaskLoading(false);
    }
  }

  // ========================================
  // PROJECT FUNCTIONS
  // ========================================

  function openCreateProject() {
    setEditingProject(null);
    setProjectName("");
    setProjectDescription("");
    setShowForm(true);
  }

  function openEditForm(project) {
    setEditingProject(project);
    setProjectName(project.name);
    setProjectDescription(project.description || "");
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingProject(null);
    setProjectName("");
    setProjectDescription("");
  }

  async function handleCreateProject(e) {
    e.preventDefault();

    if (!projectName.trim()) return;

    try {
      setSaving(true);

      const projectData = {
        name: projectName.trim(),
        description: projectDescription.trim(),
      };

      const url = editingProject
        ? `${API_URL}/${editingProject.id}`
        : API_URL;

      const response = await apiRequest(url, {
        method: editingProject ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(projectData),
      });

      if (!response.ok) {
        throw new Error("Could not save project.");
      }

      await loadProjects();
      closeForm();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteProject(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this project?"
    );

    if (!confirmed) return;

    try {
      const response = await apiRequest(`${API_URL}/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Could not delete project.");
      }

      await loadProjects();
      await loadTasks();
    } catch (err) {
      alert(err.message);
    }
  }

  // ========================================
  // TASK FUNCTIONS
  // ========================================

  function openCreateTask() {
    setEditingTask(null);
    setTaskTitle("");
    setTaskDescription("");
    setTaskPriority("MEDIUM");
    setTaskStatus("TODO");
    setTaskDueDate("");
    setSelectedProjectId(
      projects.length > 0 ? String(projects[0].id) : ""
    );
    setShowTaskForm(true);
  }

  function openEditTask(task) {
    setEditingTask(task);
    setTaskTitle(task.title || "");
    setTaskDescription(task.description || "");
    setTaskPriority(task.priority || "MEDIUM");
    setTaskStatus(task.status || "TODO");
    setTaskDueDate(task.dueDate || "");
    setSelectedProjectId(
      task.project?.id ? String(task.project.id) : ""
    );
    setShowTaskForm(true);
  }

  function closeTaskForm() {
    setShowTaskForm(false);
    setEditingTask(null);
    setTaskTitle("");
    setTaskDescription("");
    setTaskPriority("MEDIUM");
    setTaskStatus("TODO");
    setTaskDueDate("");
    setSelectedProjectId("");
  }

  async function handleSaveTask(e) {
    e.preventDefault();

    if (!taskTitle.trim() || !selectedProjectId) {
      alert("Please enter a task title and select a project.");
      return;
    }

    try {
      setTaskSaving(true);

      const taskData = {
        title: taskTitle.trim(),
        description: taskDescription.trim(),
        priority: taskPriority,
        status: taskStatus,
        dueDate: taskDueDate || null,
      };

      const url = editingTask
        ? `${TASK_API_URL}/${editingTask.id}`
        : `${TASK_API_URL}/project/${selectedProjectId}`;

      const response = await apiRequest(url, {
        method: editingTask ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(taskData),
      });

      if (!response.ok) {
        throw new Error("Could not save task.");
      }

      await loadTasks();
      closeTaskForm();
    } catch (err) {
      alert(err.message);
    } finally {
      setTaskSaving(false);
    }
  }

  async function handleDeleteTask(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this task?"
    );

    if (!confirmed) return;

    try {
      const response = await apiRequest(
        `${TASK_API_URL}/${id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Could not delete task.");
      }

      await loadTasks();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleUpdateTaskStatus(task, newStatus) {
    try {
      const updatedTask = {
        title: task.title,
        description: task.description,
        priority: task.priority,
        status: newStatus,
        dueDate: task.dueDate || null,
      };

      const response = await apiRequest(
        `${TASK_API_URL}/${task.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedTask),
        }
      );

      if (!response.ok) {
        throw new Error("Could not update task status.");
      }

      await loadTasks();
    } catch (err) {
      alert(err.message);
    }
  }

  // ========================================
  // DRAG AND DROP
  // ========================================

  function handleDragStart(e, task) {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(task.id));
  }

  function handleDragOver(e, status) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverStatus(status);
  }

  function handleDragLeave() {
    setDragOverStatus(null);
  }

  async function handleDropTask(e, status) {
    e.preventDefault();

    const taskId = Number(
      e.dataTransfer.getData("text/plain")
    );

    const task =
      draggedTask ||
      tasks.find((item) => item.id === taskId);

    setDragOverStatus(null);
    setDraggedTask(null);

    if (!task || task.status === status) return;

    await handleUpdateTaskStatus(task, status);
  }

  function handleDragEnd() {
    setDraggedTask(null);
    setDragOverStatus(null);
  }

  // ========================================
  // FILTERING AND STATISTICS
  // ========================================

  const filteredProjects = projects.filter((project) =>
    `${project.name} ${project.description || ""}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const filteredTasks = tasks.filter((task) =>
    `${task.title} ${task.description || ""}`
      .toLowerCase()
      .includes(taskSearch.toLowerCase())
  );

  const completedTasks = tasks.filter(
    (task) => task.status === "DONE"
  ).length;

  const inProgressTasks = tasks.filter(
    (task) => task.status === "IN_PROGRESS"
  ).length;

  const todoTasks = tasks.filter(
    (task) => task.status === "TODO"
  ).length;

  // ========================================
  // TASK CARD COMPONENT
  // ========================================

  function TaskCard({ task }) {
    const priority = (task.priority || "MEDIUM").toLowerCase();

    return (
      <div
        className={`task-card ${
          draggedTask?.id === task.id ? "dragging" : ""
        }`}
        draggable
        onDragStart={(e) => handleDragStart(e, task)}
        onDragEnd={handleDragEnd}
      >
        <div className="task-card-info">
          <h3>{task.title}</h3>

          <p>{task.description || "No description provided."}</p>

          <div className="task-details">
            <span className={`priority ${priority}`}>
              {task.priority || "MEDIUM"}
            </span>

            {task.project?.name && (
              <span className="task-project">
                {task.project.name}
              </span>
            )}

            {task.dueDate && (
              <span className="task-due-date">
                Due: {task.dueDate}
              </span>
            )}
          </div>
        </div>

        <div className="task-card-actions">
          <select
            value={task.status || "TODO"}
            onChange={(e) =>
              handleUpdateTaskStatus(task, e.target.value)
            }
          >
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="DONE">Done</option>
          </select>

          <button
            className="edit-button"
            onClick={() => openEditTask(task)}
          >
            Edit
          </button>

          <button
            className="delete-button"
            onClick={() => handleDeleteTask(task.id)}
          >
            Delete
          </button>
        </div>
      </div>
    );
  }

  // ========================================
  // KANBAN COLUMN COMPONENT
  // ========================================

  function KanbanColumn({ status, title }) {
    const columnTasks = filteredTasks.filter(
      (task) => (task.status || "TODO") === status
    );

    return (
      <div
        className={`kanban-column ${
          dragOverStatus === status ? "drag-over" : ""
        }`}
        onDragOver={(e) => handleDragOver(e, status)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDropTask(e, status)}
      >
        <div className="kanban-column-header">
          <h3>{title}</h3>
          <span>{columnTasks.length}</span>
        </div>

        {columnTasks.length > 0 ? (
          columnTasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))
        ) : (
          <div className="kanban-empty">
            {draggedTask
              ? "Drop task here"
              : "No tasks in this column"}
          </div>
        )}
      </div>
    );
  }

  // ========================================
  // LOGIN AND REGISTER SCREEN
  // ========================================

  if (!token) {
    return (
      <div className="auth-page">
        <div className="auth-panel">
          <div className="auth-brand">
            <div className="brand-icon">D</div>
            <span>DevTrack</span>
          </div>

          <div className="auth-heading">
            <h1>
              {authMode === "login"
                ? "Welcome back"
                : "Create your account"}
            </h1>

            <p>
              {authMode === "login"
                ? "Sign in to continue managing your projects."
                : "Create an account to start organizing your work."}
            </p>
          </div>

          <div className="auth-tabs">
            <button
              type="button"
              className={authMode === "login" ? "active" : ""}
              onClick={() => {
                setAuthMode("login");
                setAuthError("");
              }}
            >
              Sign In
            </button>

            <button
              type="button"
              className={authMode === "register" ? "active" : ""}
              onClick={() => {
                setAuthMode("register");
                setAuthError("");
              }}
            >
              Create Account
            </button>
          </div>

          {authError && (
            <div className="auth-error" role="alert">
              {authError}
            </div>
          )}

          <form
            className="auth-form"
            onSubmit={handleAuthentication}
          >
            {authMode === "register" && (
              <>
                <label htmlFor="auth-name">Full name</label>

                <input
                  id="auth-name"
                  type="text"
                  placeholder="Your name"
                  value={authName}
                  onChange={(e) => setAuthName(e.target.value)}
                  required
                />
              </>
            )}

            <label htmlFor="auth-email">Email address</label>

            <input
              id="auth-email"
              type="email"
              placeholder="you@example.com"
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
              required
            />

            <label htmlFor="auth-password">Password</label>

            <input
              id="auth-password"
              type="password"
              placeholder="At least 8 characters"
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
              minLength={8}
              required
            />

            <button
              className="primary-button auth-submit"
              type="submit"
              disabled={authLoading}
            >
              {authLoading
                ? "Please wait..."
                : authMode === "login"
                ? "Sign In"
                : "Create Account"}
            </button>
          </form>

          <p className="auth-footnote">
            Your workspace and tasks are protected by your account.
          </p>
        </div>
      </div>
    );
  }

  // ========================================
  // MAIN APPLICATION
  // ========================================

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon">D</div>
          <h2>DevTrack</h2>
        </div>

        <div className="sidebar-section">
          <p className="sidebar-label">WORKSPACE</p>

          <button
            className={`nav-link ${
              currentPage === "dashboard" ? "active" : ""
            }`}
            onClick={() => setCurrentPage("dashboard")}
          >
            <span>▦</span> Dashboard
          </button>

          <button
            className={`nav-link ${
              currentPage === "projects" ? "active" : ""
            }`}
            onClick={() => setCurrentPage("projects")}
          >
            <span>▣</span> My Projects
          </button>

          <button
            className={`nav-link ${
              currentPage === "tasks" ? "active" : ""
            }`}
            onClick={() => setCurrentPage("tasks")}
          >
            <span>☷</span> My Tasks
          </button>
        </div>

        <div className="sidebar-section">
          <p className="sidebar-label">MANAGEMENT</p>

          <button
            className={`nav-link ${
              currentPage === "team" ? "active" : ""
            }`}
            onClick={() => setCurrentPage("team")}
          >
            <span>♧</span> Team
          </button>

          <button
            className={`nav-link ${
              currentPage === "settings" ? "active" : ""
            }`}
            onClick={() => setCurrentPage("settings")}
          >
            <span>⚙</span> Settings
          </button>
        </div>

        <div className="sidebar-bottom">
          <div className="user-profile">
            <div className="user-avatar">
              {(user?.name || "U")
                .split(" ")
                .map((part) => part[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </div>

            <div className="user-profile-info">
              <strong>{user?.name || "DevTrack User"}</strong>
              <span>{user?.email || "Signed in"}</span>

              <button
                className="logout-button"
                onClick={handleLogout}
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <span className="breadcrumb">Workspace / </span>

            <strong>
              {currentPage === "dashboard"
                ? "Dashboard"
                : currentPage === "projects"
                ? "My Projects"
                : currentPage === "tasks"
                ? "My Tasks"
                : currentPage}
            </strong>
          </div>

          <div className="topbar-right">
            <span className="topbar-date">
              {new Date().toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>

            <div className="topbar-avatar">
              {(user?.name || "U")
                .split(" ")
                .map((part) => part[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </div>
          </div>
        </header>

        <div className="page-content">
          {error && (
            <div className="error-message">
              {error}
              <button onClick={loadProjects}>Retry</button>
            </div>
          )}

          {/* DASHBOARD */}

          {currentPage === "dashboard" && (
            <>
              <div className="page-heading">
                <div>
                  <h1>Dashboard</h1>
                  <p>
                    Welcome back! Here's what's happening with
                    your projects.
                  </p>
                </div>

                <button
                  className="primary-button"
                  onClick={openCreateProject}
                >
                  + New Project
                </button>
              </div>

              <div className="stats-grid">
                <div className="stat-card">
                  <span>Total Projects</span>
                  <h2>{projects.length}</h2>
                  <small>Your active workspace projects</small>
                </div>

                <div className="stat-card">
                  <span>Total Tasks</span>
                  <h2>{tasks.length}</h2>
                  <small>Tasks across all projects</small>
                </div>

                <div className="stat-card">
                  <span>In Progress</span>
                  <h2>{inProgressTasks}</h2>
                  <small>Tasks currently being worked on</small>
                </div>

                <div className="stat-card">
                  <span>Completed Tasks</span>
                  <h2>{completedTasks}</h2>
                  <small>Tasks successfully completed</small>
                </div>
              </div>

              <div className="section-heading">
                <div>
                  <h2>Recent Projects</h2>
                  <p>Take a look at your latest projects.</p>
                </div>

                <button
                  className="text-button"
                  onClick={() => setCurrentPage("projects")}
                >
                  View all projects
                </button>
              </div>

              {loading ? (
                <div className="empty-state">
                  <p>Loading projects...</p>
                </div>
              ) : projects.length === 0 ? (
                <div className="empty-state">
                  <h3>No projects yet</h3>
                  <p>
                    Create your first project to get started.
                  </p>

                  <button
                    className="primary-button"
                    onClick={openCreateProject}
                  >
                    Create Project
                  </button>
                </div>
              ) : (
                <div className="projects-grid">
                  {projects.slice(0, 4).map((project) => (
                    <div className="project-card" key={project.id}>
                      <div className="project-card-header">
                        <div className="project-icon">
                          {project.name?.charAt(0).toUpperCase() || "P"}
                        </div>

                        <span className="project-status">
                          Active
                        </span>
                      </div>

                      <h3>{project.name}</h3>

                      <p>
                        {project.description ||
                          "No description provided."}
                      </p>

                      <div className="project-card-footer">
                        <span>
                          {tasks.filter(
                            (task) =>
                              task.project?.id === project.id
                          ).length}{" "}
                          tasks
                        </span>

                        <button
                          className="text-button"
                          onClick={() => setCurrentPage("projects")}
                        >
                          View project
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="section-heading">
                <div>
                  <h2>Recent Tasks</h2>
                  <p>Keep track of the work that needs attention.</p>
                </div>

                <button
                  className="text-button"
                  onClick={() => setCurrentPage("tasks")}
                >
                  View all tasks
                </button>
              </div>

              {taskLoading ? (
                <div className="empty-state">
                  <p>Loading tasks...</p>
                </div>
              ) : tasks.length === 0 ? (
                <div className="empty-state">
                  <h3>No tasks yet</h3>
                  <p>
                    Add tasks to your projects to keep track of your work.
                  </p>
                </div>
              ) : (
                <div className="recent-tasks">
                  {tasks.slice(0, 4).map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              )}
            </>
          )}

          {/* MY PROJECTS */}

          {currentPage === "projects" && (
            <>
              <div className="page-heading">
                <div>
                  <h1>My Projects</h1>
                  <p>
                    Manage, organize, and track all your projects.
                  </p>
                </div>

                <button
                  className="primary-button"
                  onClick={openCreateProject}
                >
                  + New Project
                </button>
              </div>

              <div className="search-container">
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {loading ? (
                <div className="empty-state">
                  <p>Loading projects...</p>
                </div>
              ) : filteredProjects.length === 0 ? (
                <div className="empty-state">
                  <h3>No projects found</h3>
                  <p>
                    Try another search or create a new project.
                  </p>
                </div>
              ) : (
                <div className="projects-grid">
                  {filteredProjects.map((project) => (
                    <div className="project-card" key={project.id}>
                      <div className="project-card-header">
                        <div className="project-icon">
                          {project.name?.charAt(0).toUpperCase() || "P"}
                        </div>

                        <span className="project-status">
                          Active
                        </span>
                      </div>

                      <h3>{project.name}</h3>

                      <p>
                        {project.description ||
                          "No description provided."}
                      </p>

                      <div className="project-card-footer">
                        <span>
                          {tasks.filter(
                            (task) =>
                              task.project?.id === project.id
                          ).length}{" "}
                          tasks
                        </span>

                        <div className="project-actions">
                          <button
                            className="edit-button"
                            onClick={() => openEditForm(project)}
                          >
                            Edit
                          </button>

                          <button
                            className="delete-button"
                            onClick={() =>
                              handleDeleteProject(project.id)
                            }
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* MY TASKS */}

          {currentPage === "tasks" && (
            <>
              <div className="page-heading">
                <div>
                  <h1>My Tasks</h1>
                  <p>
                    Organize your work and track task progress.
                  </p>
                </div>

                <button
                  className="primary-button"
                  onClick={openCreateTask}
                  disabled={projects.length === 0}
                >
                  + New Task
                </button>
              </div>

              {projects.length === 0 && (
                <div className="empty-state">
                  <h3>Create a project first</h3>
                  <p>
                    You need a project before you can add tasks.
                  </p>

                  <button
                    className="primary-button"
                    onClick={() => setCurrentPage("projects")}
                  >
                    Go to Projects
                  </button>
                </div>
              )}

              {projects.length > 0 && (
                <>
                  <div className="search-container">
                    <input
                      type="text"
                      placeholder="Search tasks..."
                      value={taskSearch}
                      onChange={(e) => setTaskSearch(e.target.value)}
                    />
                  </div>

                  <div className="section-heading">
                    <div>
                      <h2>Task Board</h2>
                      <p>
                        Drag tasks between columns to update their status.
                      </p>
                    </div>
                  </div>

                  {taskLoading ? (
                    <div className="empty-state">
                      <p>Loading tasks...</p>
                    </div>
                  ) : (
                    <div className="kanban-board">
                      <KanbanColumn
                        status="TODO"
                        title="To Do"
                      />

                      <KanbanColumn
                        status="IN_PROGRESS"
                        title="In Progress"
                      />

                      <KanbanColumn
                        status="DONE"
                        title="Completed"
                      />
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* TEAM */}

          {currentPage === "team" && (
            <>
              <div className="page-heading">
                <div>
                  <h1>Team</h1>
                  <p>
                    Manage your workspace and team collaboration.
                  </p>
                </div>
              </div>

              <div className="empty-state">
                <h3>Team management coming soon</h3>
                <p>
                  Team collaboration features will be added in a future update.
                </p>
              </div>
            </>
          )}

          {/* SETTINGS */}

          {currentPage === "settings" && (
            <>
              <div className="page-heading">
                <div>
                  <h1>Settings</h1>
                  <p>
                    Manage your DevTrack account.
                  </p>
                </div>
              </div>

              <div className="project-card">
                <h3>Account Information</h3>
                <p>
                  Name: {user?.name || "DevTrack User"}
                </p>
                <p>
                  Email: {user?.email || "Not available"}
                </p>

                <button
                  className="delete-button"
                  style={{ marginTop: "20px" }}
                  onClick={handleLogout}
                >
                  Log Out
                </button>
              </div>
            </>
          )}
        </div>
      </main>

      {/* PROJECT MODAL */}

      {showForm && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeForm();
          }}
        >
          <div className="modal">
            <div className="modal-header">
              <div>
                <h2>
                  {editingProject
                    ? "Edit Project"
                    : "Create New Project"}
                </h2>

                <p>
                  {editingProject
                    ? "Update your project details."
                    : "Enter the details for your new project."}
                </p>
              </div>

              <button
                className="modal-close"
                onClick={closeForm}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateProject}>
              <label htmlFor="project-name">
                Project Name
              </label>

              <input
                id="project-name"
                type="text"
                placeholder="Enter project name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                required
              />

              <label htmlFor="project-description">
                Description
              </label>

              <textarea
                id="project-description"
                rows="4"
                placeholder="Describe your project..."
                value={projectDescription}
                onChange={(e) =>
                  setProjectDescription(e.target.value)
                }
              />

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={closeForm}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingProject
                    ? "Save Changes"
                    : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TASK MODAL */}

      {showTaskForm && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeTaskForm();
          }}
        >
          <div className="modal">
            <div className="modal-header">
              <div>
                <h2>
                  {editingTask ? "Edit Task" : "Create New Task"}
                </h2>

                <p>
                  {editingTask
                    ? "Update your task details."
                    : "Add a task to one of your projects."}
                </p>
              </div>

              <button
                className="modal-close"
                onClick={closeTaskForm}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSaveTask}>
              <label htmlFor="task-title">
                Task Title
              </label>

              <input
                id="task-title"
                type="text"
                placeholder="Enter task title"
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                required
              />

              <label htmlFor="task-description">
                Description
              </label>

              <textarea
                id="task-description"
                rows="3"
                placeholder="Describe the task..."
                value={taskDescription}
                onChange={(e) =>
                  setTaskDescription(e.target.value)
                }
              />

              <label htmlFor="task-project">
                Project
              </label>

              <select
                id="task-project"
                value={selectedProjectId}
                onChange={(e) =>
                  setSelectedProjectId(e.target.value)
                }
                required
                disabled={Boolean(editingTask)}
              >
                <option value="">Select a project</option>

                {projects.map((project) => (
                  <option
                    key={project.id}
                    value={String(project.id)}
                  >
                    {project.name}
                  </option>
                ))}
              </select>

              <div className="form-row">
                <div>
                  <label htmlFor="task-priority">
                    Priority
                  </label>

                  <select
                    id="task-priority"
                    value={taskPriority}
                    onChange={(e) =>
                      setTaskPriority(e.target.value)
                    }
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="task-status">
                    Status
                  </label>

                  <select
                    id="task-status"
                    value={taskStatus}
                    onChange={(e) =>
                      setTaskStatus(e.target.value)
                    }
                  >
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="DONE">Completed</option>
                  </select>
                </div>
              </div>

              <label htmlFor="task-due-date">
                Due Date
              </label>

              <input
                id="task-due-date"
                type="date"
                value={taskDueDate}
                onChange={(e) =>
                  setTaskDueDate(e.target.value)
                }
              />

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={closeTaskForm}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={taskSaving}
                >
                  {taskSaving
                    ? "Saving..."
                    : editingTask
                    ? "Save Changes"
                    : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
