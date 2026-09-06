import { ArrowRight, Building2, Check, LoaderCircle, RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDepartments } from '../api/departmentApi'
import type { Department } from '../types'

export default function DepartmentSelection() {
  const navigate = useNavigate()
  const [departments, setDepartments] = useState<Department[]>([])
  const [selected, setSelected] = useState<string>(() => localStorage.getItem('selectedDepartmentId') || '')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadDepartments = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getDepartments()
      setDepartments(data)
      if (!selected && data.length === 1) setSelected(data[0]._id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load departments.')
    } finally {
      setLoading(false)
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
        <div className="selection-logo">D</div>
        <p className="selection-kicker">Demand Management Portal</p>
        <h1>Select your workspace</h1>
        <p className="selection-description">
          Choose a department to view its demands, SLA performance and activity. This selection only controls your dashboard context.
        </p>

        {loading ? (
          <div className="selection-state">
            <LoaderCircle className="spin" size={22} />
            <span>Loading departments...</span>
          </div>
        ) : error ? (
          <div className="selection-error">
            <div>
              <strong>Couldn&apos;t load departments</strong>
              <span>{error}</span>
            </div>
            <button type="button" onClick={() => void loadDepartments()}>
              <RefreshCw size={16} /> Retry
            </button>
          </div>
        ) : departments.length === 0 ? (
          <div className="selection-state">
            <Building2 size={22} />
            <span>No active departments are available.</span>
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
                    <span className="department-icon"><Building2 size={21} /></span>
                    <span className="department-copy">
                      <strong>{department.name}</strong>
                      <span>View {department.name} demands</span>
                    </span>
                    <span className="selection-check">{isSelected && <Check size={16} />}</span>
                  </button>
                )
              })}
            </div>

            <button className="primary-button selection-continue" type="button" disabled={!selected} onClick={continueToWorkspace}>
              Continue to workspace
              <ArrowRight size={18} />
            </button>
          </>
        )}

        <p className="selection-footer">No login required · Internal staff workspace</p>
      </section>
    </main>
  )
}
