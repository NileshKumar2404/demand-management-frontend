import { ArrowRight, Building2, Check, LoaderCircle, RefreshCw, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDepartments, seedDepartments } from '../api/departmentApi'
import type { Department } from '../types'

export default function DepartmentSelection() {
  const navigate = useNavigate()
  const [departments, setDepartments] = useState<Department[]>([])
  const [selected, setSelected] = useState<string>(() => localStorage.getItem('selectedDepartmentId') || '')
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)
  const [error, setError] = useState('')

  const loadDepartments = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getDepartments()
      setDepartments(data)
      if (data.length > 0) {
        // If current selection is invalid or empty, pick the first one
        const validCurrent = data.find((d) => d._id === selected)
        if (!validCurrent) {
          setSelected(data[0]._id)
        }
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? `${err.message} (Ensure backend is running at ${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'})`
          : 'Unable to load departments.'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleSeedDefaults = async () => {
    setSeeding(true)
    setError('')
    try {
      const data = await seedDepartments()
      setDepartments(data)
      if (data.length > 0) {
        setSelected(data[0]._id)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to seed default departments.')
    } finally {
      setSeeding(false)
    }
  }

  useEffect(() => {
    void loadDepartments()
  }, [])

  const continueToWorkspace = () => {
    const department = departments.find((item) => item._id === selected)
    if (!department) return
    localStorage.setItem('selectedDepartmentId', department._id)
    localStorage.setItem('selectedDepartmentName', department.name)
    navigate(`/department/${department._id}/dashboard`)
  }

  return (
    <main className="selection-page">
      <div className="selection-glow selection-glow-one" />
      <div className="selection-glow selection-glow-two" />

      <section className="selection-card">
        <div className="selection-badge-row">
          <div className="selection-logo">D</div>
          <span className="selection-status-pill">
            <span className="status-indicator-dot" />
            DemandFlow System
          </span>
        </div>
        <p className="selection-kicker">Demand Management Portal</p>
        <h1>Select your workspace</h1>
        <p className="selection-description">
          Choose a department to view its demands, SLA performance, and activity. This selection configures your department context.
        </p>

        {loading ? (
          <div className="selection-state">
            <LoaderCircle className="spin" size={26} />
            <span>Loading departments...</span>
          </div>
        ) : error ? (
          <div className="selection-error">
            <div>
              <strong>Couldn&apos;t load departments</strong>
              <span>{error}</span>
            </div>
            <div className="selection-error-actions">
              <button type="button" className="retry-button" onClick={() => void loadDepartments()}>
                <RefreshCw size={15} /> Retry
              </button>
            </div>
          </div>
        ) : departments.length === 0 ? (
          <div className="selection-empty-state">
            <div className="empty-state-icon">
              <Building2 size={28} />
            </div>
            <h3>No active departments found</h3>
            <p>Your database is ready but has no departments yet. Initialize the default departments to get started immediately.</p>
            <button
              type="button"
              className="primary-button seed-button"
              disabled={seeding}
              onClick={() => void handleSeedDefaults()}
            >
              {seeding ? (
                <>
                  <LoaderCircle className="spin" size={16} />
                  <span>Seeding departments...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Initialize Default Departments</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <>
            <div className="department-grid">
              {departments.map((department) => {
                const isSelected = selected === department._id
                return (
                  <button
                    key={department._id}
                    type="button"
                    className={`department-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelected(department._id)}
                  >
                    <span className="department-icon">
                      <Building2 size={20} />
                    </span>
                    <span className="department-copy">
                      <strong>{department.name}</strong>
                      <span>Demands & SLA Dashboard</span>
                    </span>
                    <span className="selection-check">
                      {isSelected && <Check size={14} strokeWidth={3} />}
                    </span>
                  </button>
                )
              })}
            </div>

            <button
              className="primary-button selection-continue"
              type="button"
              disabled={!selected}
              onClick={continueToWorkspace}
            >
              <span>Continue to workspace</span>
              <ArrowRight size={18} />
            </button>
          </>
        )}

        <div className="selection-footer-row">
          <span>No login required · Internal staff workspace</span>
          <span className="footer-dot">•</span>
          <span>SLA Tracking V1</span>
        </div>
      </section>
    </main>
  )
}
