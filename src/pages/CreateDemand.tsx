import { useEffect, useState } from 'react'
import { ArrowLeft, Save } from 'lucide-react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { createDemand } from '../api/demandApi'
import { getDepartments } from '../api/departmentApi'
import type { Department, Priority } from '../types'

const priorities: { value: Priority; label: string; days: number }[] = [
  { value: 'P1', label: 'P1 · Critical', days: 3 },
  { value: 'P2', label: 'P2 · High', days: 7 },
  { value: 'P3', label: 'P3 · Medium', days: 15 },
  { value: 'P4', label: 'P4 · Low', days: 30 },
  { value: 'P5', label: 'P5 · Planned', days: 60 },
]

export default function CreateDemand() {
  const { department } = useOutletContext<{ department: Department }>()
  const navigate = useNavigate()
  const [departments, setDepartments] = useState<Department[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [targetDepartment, setTargetDepartment] = useState(department._id)
  const [priority, setPriority] = useState<Priority>('P3')
  const [createdBy, setCreatedBy] = useState(() => localStorage.getItem('performerName') || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    void getDepartments().then(setDepartments).catch((err) => setError(err instanceof Error ? err.message : 'Unable to load departments.'))
  }, [])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      localStorage.setItem('performerName', createdBy.trim())
      const demand = await createDemand({
        title: title.trim(),
        description: description.trim(),
        department: targetDepartment,
        priority,
        createdBy: createdBy.trim(),
      })
      setSuccess(`${demand.demandNumber} created successfully.`)
      setTitle('')
      setDescription('')
      window.setTimeout(() => navigate(`../demands/${demand._id}`), 700)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create demand.')
    } finally {
      setLoading(false)
    }
  }

  const selected = priorities.find((item) => item.value === priority)!

  return (
    <section className="module-page narrow-module">
      <div className="page-heading-row">
        <div>
          <button className="back-link" type="button" onClick={() => navigate('../demands')}><ArrowLeft size={16} /> Back to demands</button>
          <p className="eyebrow">New work request</p>
          <h2>Create Demand</h2>
          <p className="muted">Create a demand for any department. The backend will generate the demand number and SLA due date automatically.</p>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {success && <div className="success-banner">{success}</div>}

      <form className="form-card" onSubmit={handleSubmit}>
        <div className="form-grid">
          <label className="form-field full-width"><span>Demand title *</span><input required maxLength={200} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Setup faculty onboarding access" /></label>
          <label className="form-field full-width"><span>Description *</span><textarea required maxLength={5000} rows={6} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Describe the requirement, expected outcome and relevant details..." /></label>
          <label className="form-field"><span>Target department *</span><select required value={targetDepartment} onChange={(event) => setTargetDepartment(event.target.value)}>{departments.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}</select></label>
          <label className="form-field"><span>Priority *</span><select required value={priority} onChange={(event) => setPriority(event.target.value as Priority)}>{priorities.map((item) => <option key={item.value} value={item.value}>{item.label} · {item.days} days SLA</option>)}</select></label>
          <label className="form-field full-width"><span>Created by *</span><input required maxLength={100} value={createdBy} onChange={(event) => setCreatedBy(event.target.value)} placeholder="Enter your name" /></label>
        </div>

        <div className="sla-preview">
          <div><strong>{priority}</strong><span>{selected.days}-day SLA</span></div>
          <p>Due date will be calculated automatically from the creation timestamp.</p>
        </div>

        <div className="form-actions"><button className="secondary-button" type="button" onClick={() => navigate('../demands')}>Cancel</button><button className="primary-button" type="submit" disabled={loading}><Save size={17} /> {loading ? 'Creating...' : 'Create Demand'}</button></div>
      </form>
    </section>
  )
}
