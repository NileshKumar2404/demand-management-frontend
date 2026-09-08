import { useEffect, useState } from 'react'
import { ArrowLeft, CheckCircle2, CirclePause, Play, UserRound, XCircle } from 'lucide-react'
import {
  acceptDemand,
  assignDemand,
  closeDemand,
  completeDemand,
  getDemandById,
  holdDemand,
  startDemand,
} from '../api/demandApi'
import type { Demand, DemandStatus } from '../types'

interface Props {
  demandId: string
  departmentId: string
  onBack: () => void
}

const statusLabel = (value: DemandStatus) => value.replaceAll('_', ' ')
const formatDateTime = (value?: string) => value ? new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—'

export default function DemandDetails({ demandId, onBack }: Props) {
  const [demand, setDemand] = useState<Demand | null>(null)
  const [history, setHistory] = useState<Awaited<ReturnType<typeof getDemandById>>['history']>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [performer, setPerformer] = useState(() => localStorage.getItem('performerName') || '')
  const [assignee, setAssignee] = useState('')
  const [reason, setReason] = useState('')
  const [delayReason, setDelayReason] = useState('')
  const [delayDescription, setDelayDescription] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const result = await getDemandById(demandId)
      setDemand(result.demand)
      setHistory(result.history)
      setAssignee(result.demand.assignedTo || '')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load demand.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [demandId])

  const runAction = async (action: () => Promise<Demand>) => {
    if (!performer.trim()) {
      setError('Please enter the performer name before changing a demand.')
      return
    }
    setBusy(true)
    setError('')
    try {
      localStorage.setItem('performerName', performer.trim())
      const updated = await action()
      setDemand(updated)
      const fresh = await getDemandById(demandId)
      setHistory(fresh.history)
      setReason('')
      setDelayReason('')
      setDelayDescription('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed.')
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <div className="module-page"><div className="loading-card">Loading demand...</div></div>
  if (!demand) return <div className="module-page"><div className="error-banner">Demand could not be loaded. {error}</div></div>

  const departmentName = typeof demand.department === 'string' ? demand.department : demand.department?.name
  const needsDelayReason = demand.status === 'IN_PROGRESS' || demand.status === 'ON_HOLD'

  return (
    <section className="module-page">
      <div className="page-heading-row">
        <div>
          <button className="back-link" type="button" onClick={onBack}><ArrowLeft size={16} /> Back to demands</button>
          <div className="demand-title-line"><span className="eyebrow">{demand.demandNumber}</span><span className={`status-badge ${demand.status.toLowerCase()}`}>{statusLabel(demand.status)}</span>{demand.isOverdue && <span className="overdue-tag">Overdue</span>}</div>
          <h2>{demand.title}</h2>
          <p className="muted">{departmentName} · Created {formatDateTime(demand.createdAt)}</p>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="details-grid">
        <div className="detail-main">
          <div className="detail-card">
            <div className="card-heading"><div><p className="eyebrow">Requirement</p><h3>Demand description</h3></div></div>
            <p className="description-text">{demand.description}</p>
          </div>

          <div className="detail-card">
            <div className="card-heading"><div><p className="eyebrow">Activity</p><h3>Demand timeline</h3></div></div>
            <div className="timeline">
              {history.map((item) => (
                <div className="timeline-item" key={item._id}>
                  <div className="timeline-dot" />
                  <div className="timeline-content"><div className="timeline-top"><strong>{item.action.replaceAll('_', ' ')}</strong><span>{formatDateTime(item.createdAt)}</span></div><p>By {item.performedBy}</p>{item.reason && <p className="timeline-reason">Reason: {item.reason}</p>}{item.notes && <p className="timeline-reason">{item.notes}</p>}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <aside className="detail-side">
          <div className="detail-card">
            <div className="card-heading"><div><p className="eyebrow">SLA</p><h3>Tracking</h3></div></div>
            <div className="info-list"><div><span>Priority</span><strong className={`priority-badge ${demand.priority.toLowerCase()}`}>{demand.priority}</strong></div><div><span>Due date</span><strong>{formatDateTime(demand.dueDate)}</strong></div><div><span>Assigned to</span><strong>{demand.assignedTo || 'Unassigned'}</strong></div><div><span>Created by</span><strong>{demand.createdBy}</strong></div></div>
          </div>

          <div className="detail-card action-card">
            <div className="card-heading"><div><p className="eyebrow">Actions</p><h3>Update demand</h3></div></div>
            <label className="form-field"><span>Performer name *</span><input value={performer} onChange={(event) => setPerformer(event.target.value)} placeholder="Who is performing this action?" /></label>

            {(demand.status === 'SUBMITTED' || demand.status === 'ASSIGNED') && <>
              <label className="form-field"><span>Assign to</span><input value={assignee} onChange={(event) => setAssignee(event.target.value)} placeholder="Staff member name" /></label>
              <button className="primary-button full-button" disabled={busy} type="button" onClick={() => void runAction(() => assignDemand(demand._id, assignee, performer))}><UserRound size={16} /> Assign</button>
            </>}

            {demand.status === 'ASSIGNED' && <button className="secondary-button full-button" disabled={busy} type="button" onClick={() => void runAction(() => acceptDemand(demand._id, performer))}><CheckCircle2 size={16} /> Accept</button>}
            {demand.status === 'ACCEPTED' && <button className="primary-button full-button" disabled={busy} type="button" onClick={() => void runAction(() => startDemand(demand._id, performer))}><Play size={16} /> Start work</button>}
            {demand.status === 'ON_HOLD' && <button className="primary-button full-button" disabled={busy} type="button" onClick={() => void runAction(() => startDemand(demand._id, performer))}><Play size={16} /> Resume work</button>}

            {demand.status === 'IN_PROGRESS' && <>
              <label className="form-field"><span>On-hold reason *</span><textarea rows={3} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Why is this demand being paused?" /></label>
              <button className="secondary-button full-button" disabled={busy || !reason.trim()} type="button" onClick={() => void runAction(() => holdDemand(demand._id, performer, reason))}><CirclePause size={16} /> Put on hold</button>
            </>}

            {needsDelayReason && <>
              <label className="form-field"><span>Delay reason (required only after SLA breach)</span><input value={delayReason} onChange={(event) => setDelayReason(event.target.value)} placeholder="e.g. Dependency from another team" /></label>
              <label className="form-field"><span>Delay description</span><textarea rows={2} value={delayDescription} onChange={(event) => setDelayDescription(event.target.value)} placeholder="Additional delay context" /></label>
              <button className="primary-button full-button" disabled={busy} type="button" onClick={() => void runAction(() => completeDemand(demand._id, performer, { delayReason: delayReason || undefined, delayDescription: delayDescription || undefined }))}><CheckCircle2 size={16} /> Complete demand</button>
            </>}

            {demand.status === 'COMPLETED' && <button className="primary-button full-button" disabled={busy} type="button" onClick={() => void runAction(() => closeDemand(demand._id, performer))}><XCircle size={16} /> Close demand</button>}
          </div>
        </aside>
      </div>
    </section>
  )
}
