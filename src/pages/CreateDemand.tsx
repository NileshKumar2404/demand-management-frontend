import { ArrowLeft, CheckCircle2, Clock, Info, LoaderCircle, Send, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useOutletContext } from 'react-router-dom'
import { createDemand } from '../api/demandApi'
import type { Department, Priority } from '../types'

const PRIORITY_OPTIONS: Array<{
  id: Priority
  label: string
  days: number
  description: string
  colorClass: string
}> = [
  { id: 'P1', label: 'P1 · Critical', days: 3, description: 'Service down, severe business impact', colorClass: 'p1' },
  { id: 'P2', label: 'P2 · High', days: 7, description: 'Major feature blocked, critical deadline', colorClass: 'p2' },
  { id: 'P3', label: 'P3 · Medium', days: 15, description: 'Standard operational or feature demand', colorClass: 'p3' },
  { id: 'P4', label: 'P4 · Low', days: 30, description: 'Minor enhancement or non-urgent request', colorClass: 'p4' },
  { id: 'P5', label: 'P5 · Routine', days: 60, description: 'Scheduled maintenance, long-term review', colorClass: 'p5' },
]

function calculateDueDate(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}

export default function CreateDemand() {
  const navigate = useNavigate()
  const { department } = useOutletContext<{ department: Department | null }>()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<Priority>('P3')
  const [createdBy, setCreatedBy] = useState(() => localStorage.getItem('userDisplayName') || 'Staff Member')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [createdDemand, setCreatedDemand] = useState<{ demandNumber: string; _id: string; dueDate: string } | null>(null)

  const selectedPriorityObj = PRIORITY_OPTIONS.find((p) => p.id === priority) || PRIORITY_OPTIONS[2]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setError('Please enter a demand title.')
      return
    }
    if (!description.trim()) {
      setError('Please enter a description for the demand.')
      return
    }
    if (!department?._id) {
      setError('No department context found. Please select a department.')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      localStorage.setItem('userDisplayName', createdBy.trim())
      const result = await createDemand({
        title: title.trim(),
        description: description.trim(),
        department: department._id,
        priority,
        createdBy: createdBy.trim(),
      })

      setCreatedDemand({
        demandNumber: result.demandNumber,
        _id: result._id,
        dueDate: result.dueDate,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create demand.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReset = () => {
    setTitle('')
    setDescription('')
    setPriority('P3')
    setCreatedDemand(null)
    setError('')
  }

  if (createdDemand) {
    return (
      <div className="demand-success-view">
        <div className="success-card">
          <div className="success-icon-badge">
            <CheckCircle2 size={38} strokeWidth={2.4} />
          </div>
          <span className="success-kicker">Demand Submitted & Broadcast</span>
          <h2>Demand Created Successfully!</h2>
          <p className="success-demand-number">{createdDemand.demandNumber}</p>
          <p className="success-subtext">
            This demand has been registered in the system and automatically broadcast in real time to all devices with notifications enabled.
          </p>

          <div className="success-meta-box">
            <div>
              <span>Department</span>
              <strong>{department?.name}</strong>
            </div>
            <div>
              <span>Priority Level</span>
              <strong className={`priority-tag ${priority.toLowerCase()}`}>{priority}</strong>
            </div>
            <div>
              <span>SLA Target Due Date</span>
              <strong>{new Date(createdDemand.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</strong>
            </div>
          </div>

          <div className="success-actions">
            <Link
              to={`/department/${department?._id}/demands`}
              className="primary-button"
            >
              View in All Demands
            </Link>
            <button
              type="button"
              className="secondary-button"
              onClick={handleReset}
            >
              Create Another Demand
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="create-demand-page">
      <div className="page-heading-row">
        <div>
          <Link to={`/department/${department?._id}/dashboard`} className="back-link">
            <ArrowLeft size={16} /> Back to dashboard
          </Link>
          <h2>Create New Demand</h2>
          <p className="muted">
            Submit a new demand request for <strong>{department?.name}</strong>. Demands automatically track priority SLA deadlines.
          </p>
        </div>
      </div>

      <div className="create-demand-layout">
        <form className="demand-form-card" onSubmit={handleSubmit}>
          {error && (
            <div className="form-error-banner">
              <Info size={18} />
              <span>{error}</span>
            </div>
          )}

          <div className="form-group">
            <div className="form-label-row">
              <label htmlFor="title">Demand Title *</label>
              <span className="char-count">{title.length}/200</span>
            </div>
            <input
              id="title"
              type="text"
              className="form-input"
              maxLength={200}
              placeholder="e.g. Server hardware upgrade for rendering pipeline"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <div className="form-label-row">
              <label htmlFor="description">Detailed Description *</label>
              <span className="char-count">{description.length}/5000</span>
            </div>
            <textarea
              id="description"
              className="form-textarea"
              rows={5}
              maxLength={5000}
              placeholder="Describe the demand details, business requirements, expected outcomes, and any specific constraints..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Select Priority & SLA Target *</label>
            <p className="field-hint">Priority determines the maximum resolution window under our department SLA.</p>
            <div className="priority-picker-grid">
              {PRIORITY_OPTIONS.map((opt) => {
                const isSelected = priority === opt.id
                return (
                  <button
                    key={opt.id}
                    type="button"
                    className={`priority-card ${opt.colorClass} ${isSelected ? 'selected' : ''}`}
                    onClick={() => setPriority(opt.id)}
                  >
                    <div className="priority-header">
                      <span className="priority-chip">{opt.id}</span>
                      <span className="priority-days">{opt.days} Days SLA</span>
                    </div>
                    <span className="priority-desc">{opt.description}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="form-row-two">
            <div className="form-group">
              <label htmlFor="createdBy">Requester / Created By *</label>
              <input
                id="createdBy"
                type="text"
                className="form-input"
                maxLength={100}
                placeholder="Your name or employee ID"
                value={createdBy}
                onChange={(e) => setCreatedBy(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Target Department Context</label>
              <input
                type="text"
                className="form-input readonly"
                value={department?.name || 'Department'}
                readOnly
                disabled
              />
            </div>
          </div>

          <div className="form-footer-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={() => navigate(`/department/${department?._id}/dashboard`)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="primary-button submit-btn"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <LoaderCircle className="spin" size={17} />
                  <span>Submitting demand...</span>
                </>
              ) : (
                <>
                  <Send size={16} />
                  <span>Submit & Broadcast Demand</span>
                </>
              )}
            </button>
          </div>
        </form>

        <aside className="demand-sidebar-card">
          <div className="sidebar-card-header">
            <Sparkles size={18} className="sparkle-icon" />
            <h4>SLA Target Preview</h4>
          </div>

          <div className="sla-preview-box">
            <span className="preview-label">Selected Priority</span>
            <div className="preview-priority-badge">
              <span className={`priority-tag ${selectedPriorityObj.colorClass}`}>
                {selectedPriorityObj.label}
              </span>
            </div>
            <div className="preview-target-row">
              <Clock size={16} />
              <span>Target Completion:</span>
            </div>
            <p className="preview-date">{calculateDueDate(selectedPriorityObj.days)}</p>
            <p className="preview-sla-hint">
              Work must be completed within <strong>{selectedPriorityObj.days} days</strong> to maintain SLA compliance.
            </p>
          </div>

          <div className="realtime-broadcast-note">
            <div className="broadcast-dot" />
            <div>
              <strong>Instant Real-Time Alerts</strong>
              <p>Submitting this demand broadcasts a notification to all devices currently connected to this workspace.</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
