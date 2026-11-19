
import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [showForm, setShowForm] = useState(false)
const [projectName, setProjectName] = useState('')
const [projectDescription, setProjectDescription] = useState('')
const [saving, setSaving] = useState(false)

const handleCreateProject = async (e) => {
  e.preventDefault()

  if (!projectName.trim()) {
    alert('Please enter a project name.')
    return
  }

  setSaving(true)

  try {
    const response = await fetch('http://localhost:8080/api/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: projectName,
        description: projectDescription,
      }),
    })

    if (!response.ok) {
      throw new Error('Could not create project')
    }

    const newProject = await response.json()

    setProjects((currentProjects) => [...currentProjects, newProject])
    setProjectName('')
    setProjectDescription('')
    setShowForm(false)
  } catch (error) {
    alert(error.message)
  } finally {
    setSaving(false)
  }
}

  useEffect(() => {
    fetch('http://localhost:8080/api/projects')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to load projects')
        }
        return response.json()
      })
      .then((data) => {
        setProjects(data)
        setLoading(false)
      })
      .catch(() => {
        setError('Could not connect to the DevTrack API.')
        setLoading(false)
      })
  }, [])

  return (
    <div className="app">
      <aside className="sidebar">
        <h2 className="logo">DevTrack<span>.</span></h2>

        <p className="menu-label">WORKSPACE</p>
        <nav>
          <a className="active" href="#dashboard">Dashboard</a>
          <a href="#projects">My Projects</a>
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
          <span>Workspace / Dashboard</span>
          <div className="topbar-right">
            <span>November 2026</span>
            <div className="avatar">CS</div>
          </div>
        </header>

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

{showForm && (
  <div className="form-overlay">
    <form className="project-form" onSubmit={handleCreateProject}>
      <h2>Create New Project</h2>
      <p>Add a project to your DevTrack workspace.</p>

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
          onClick={() => setShowForm(false)}
        >
          Cancel
        </button>

        <button type="submit" className="primary-button" disabled={saving}>
          {saving ? 'Saving...' : 'Create Project'}
        </button>
      </div>
    </form>
  </div>
)}

        <section className="projects-section" id="projects">
          <div className="section-heading">
            <div>
              <h2>Recent Projects</h2>
              <p>Keep track of your latest work.</p>
            </div>
            <a href="#projects">View all</a>
          </div>

          {loading && <p>Loading projects...</p>}

          {error && <p>{error}</p>}

          {!loading && !error && projects.length === 0 && (
            <p>No projects yet. Create your first project!</p>
          )}

          {!loading && !error && projects.map((project) => (
            <div className="project-card" key={project.id}>
              <div className="project-icon">D</div>
              <div className="project-info">
                <h3>{project.name}</h3>
                <p>{project.description}</p>
                <span className="status">Active</span>
              </div>
              <span className="project-id">#{project.id}</span>
            </div>
          ))}
        </section>
      </main>
    </div>
  )
}

export default App
