
import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [projects, setProjects] = useState([])
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [projectDescription, setProjectDescription] = useState('')
  const [saving, setSaving] = useState(false)

  const [editingProject, setEditingProject] = useState(null)

  const API_URL = 'http://localhost:8080/api/projects'

  const loadProjects = async () => {
    try {
      const response = await fetch(API_URL)

      if (!response.ok) {
        throw new Error('Failed to load projects')
      }

      const data = await response.json()
      setProjects(data)
      setError('')
    } catch (error) {
      setError('Could not connect to the DevTrack API.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProjects()
  }, [])

  const handleCreateProject = async (e) => {
    e.preventDefault()

    if (!projectName.trim()) {
      alert('Please enter a project name.')
      return
    }

    setSaving(true)

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: projectName,
          description: projectDescription,
        }),
      })

      if (!response.ok) {
        throw new Error('Could not create project')
      }

      const newProject = await response.json()

      setProjects((current) => [...current, newProject])
      setProjectName('')
      setProjectDescription('')
      setShowForm(false)
    } catch (error) {
      alert(error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleEditProject = async (e) => {
    e.preventDefault()

    if (!projectName.trim()) {
      alert('Please enter a project name.')
      return
    }

    setSaving(true)

    try {
      const response = await fetch(`${API_URL}/${editingProject.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: projectName,
          description: projectDescription,
        }),
      })

      if (!response.ok) {
        throw new Error('Could not update project')
      }

      const updatedProject = await response.json()

      setProjects((current) =>
        current.map((project) =>
          project.id === updatedProject.id ? updatedProject : project
        )
      )

      closeForm()
    } catch (error) {
      alert(error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteProject = async (id) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this project?'
    )

    if (!confirmed) return

    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Could not delete project')
      }

      setProjects((current) =>
        current.filter((project) => project.id !== id)
      )
    } catch (error) {
      alert(error.message)
    }
  }

  const openEditForm = (project) => {
    setEditingProject(project)
    setProjectName(project.name)
    setProjectDescription(project.description || '')
    setShowForm(true)
  }

  const closeForm = () => {
    setShowForm(false)
    setEditingProject(null)
    setProjectName('')
    setProjectDescription('')
  }

  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const ProjectCard = ({ project }) => (
    <div className="project-card" key={project.id}>
      <div className="project-icon">D</div>

      <div className="project-info">
        <h3>{project.name}</h3>
        <p>{project.description || 'No description provided.'}</p>
        <span className="status">Active</span>
      </div>

      <span className="project-id">#{project.id}</span>

      <div className="project-actions">
        <button
          className="edit-button"
          onClick={() => openEditForm(project)}
        >
          Edit
        </button>

        <button
          className="delete-button"
          onClick={() => handleDeleteProject(project.id)}
        >
          Delete
        </button>
      </div>
    </div>
  )

  return (
    <div className="app">
      <aside className="sidebar">
        <h2 className="logo">DevTrack<span>.</span></h2>

        <p className="menu-label">WORKSPACE</p>

        <nav>
          <a
            href="#dashboard"
            className={currentPage === 'dashboard' ? 'active' : ''}
            onClick={() => setCurrentPage('dashboard')}
          >
            Dashboard
          </a>

          <a
            href="#projects"
            className={currentPage === 'projects' ? 'active' : ''}
            onClick={() => setCurrentPage('projects')}
          >
            My Projects
          </a>

          <a href="#tasks">My Tasks</a>
          <a href="#team">Team</a>
        </nav>

        <div className="sidebar-bottom">
          <p className="menu-label">PERSONAL</p>
          <a href="#settings">Settings</a>

          <div className="profile">
            <div className="avatar">CS</div>
            <div>
              <strong>Charles Sarpong</strong>
              <small>Workspace Admin</small>
            </div>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <span>
            Workspace / {currentPage === 'dashboard' ? 'Dashboard' : 'My Projects'}
          </span>

          <div className="topbar-right">
            <span>November 2026</span>
            <div className="avatar">CS</div>
          </div>
        </header>

        {currentPage === 'dashboard' && (
          <>
            <section className="welcome">
              <div>
                <p className="eyebrow">YOUR WORKSPACE</p>
                <h1>Good morning, Charles.</h1>
                <p>Here's what's happening with your projects today.</p>
              </div>

              <button
                className="primary-button"
                onClick={() => setShowForm(true)}
              >
                + New Project
              </button>
            </section>

            <section className="stats">
              <div className="stat-card">
                <p>Total Projects</p>
                <h2>{projects.length}</h2>
                <small>Across your workspace</small>
              </div>

              <div className="stat-card">
                <p>Active Tasks</p>
                <h2>0</h2>
                <small>Tasks currently in progress</small>
              </div>

              <div className="stat-card">
                <p>Completed Tasks</p>
                <h2>0</h2>
                <small>Tasks finished so far</small>
              </div>

              <div className="stat-card">
                <p>Team Members</p>
                <h2>1</h2>
                <small>People in your workspace</small>
              </div>
            </section>

            <section className="projects-section">
              <div className="section-heading">
                <div>
                  <h2>Recent Projects</h2>
                  <p>Keep track of your latest work.</p>
                </div>

                <a
                  href="#projects"
                  onClick={() => setCurrentPage('projects')}
                >
                  View all
                </a>
              </div>

              {loading && <p>Loading projects...</p>}
              {error && <p>{error}</p>}

              {!loading && !error && projects.length === 0 && (
                <p>No projects yet. Create your first project!</p>
              )}

              {!loading && !error &&
                projects.slice(-3).reverse().map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
            </section>
          </>
        )}

        {currentPage === 'projects' && (
          <section className="all-projects">
            <div className="projects-page-header">
              <div>
                <p className="eyebrow">WORKSPACE</p>
                <h1>My Projects</h1>
                <p>Manage and organize all your projects.</p>
              </div>

              <button
                className="primary-button"
                onClick={() => setShowForm(true)}
              >
                + New Project
              </button>
            </div>

            <div className="project-toolbar">
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />

              <span>{filteredProjects.length} Projects</span>
            </div>

            {loading && <p>Loading projects...</p>}
            {error && <p>{error}</p>}

            {!loading && !error && filteredProjects.length === 0 && (
              <div className="empty-projects">
                <h3>No projects found</h3>
                <p>Try another search or create a new project.</p>
              </div>
            )}

            {!loading && !error && filteredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </section>
        )}

        {showForm && (
          <div className="form-overlay">
            <form
              className="project-form"
              onSubmit={editingProject ? handleEditProject : handleCreateProject}
            >
              <h2>{editingProject ? 'Edit Project' : 'Create New Project'}</h2>

              <p>
                {editingProject
                  ? 'Update your project information.'
                  : 'Add a project to your DevTrack workspace.'}
              </p>

              <label>Project Name</label>
              <input
                type="text"
                placeholder="Enter project name"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                required
              />

              <label>Description</label>
              <textarea
                placeholder="Describe your project"
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                rows="4"
              />

              <div className="form-actions">
                <button
                  type="button"
                  className="cancel-button"
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
                    ? 'Saving...'
                    : editingProject
                      ? 'Save Changes'
                      : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
