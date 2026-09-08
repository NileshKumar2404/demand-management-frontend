import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Filter,
  LoaderCircle,
  Play,
  Plus,
  RefreshCw,
  Search,
  User,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import {
  acceptDemand,
  closeDemand,
  completeDemand,
  getDemands,
  startDemand,
} from '../api/demandApi'
import type { Demand, DemandStatus, Department, Priority } from '../types'

const STATUS_FILTERS: Array<{ id: DemandStatus | 'ALL'; label: string }> = [
  { id: 'ALL', label: 'All Demands' },
  { id: 'SUBMITTED', label: 'Submitted' },
  { id: 'ASSIGNED', label: 'Assigned' },
  { id: 'ACCEPTED', label: 'Accepted' },
  { id: 'IN_PROGRESS', label: 'In Progress' },
  { id: 'ON_HOLD', label: 'On Hold' },
  { id: 'COMPLETED', label: 'Completed' },
  { id: 'CLOSED', label: 'Closed' },
]

export default function DemandsList() {
  const { department } = useOutletContext<{ department: Department | null }>()

  const [demands, setDemands] = useState<Demand[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<DemandStatus | 'ALL'>('ALL')
  const [selectedPriority, setSelectedPriority] = useState<Priority | 'ALL'>('ALL')
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

  const fetchDemands = async () => {
    if (!department?._id) return
    setLoading(true)
    setError('')
    try {
      const data = await getDemands({
        department: department._id,
        status: selectedStatus === 'ALL' ? undefined : selectedStatus,
        priority: selectedPriority === 'ALL' ? undefined : selectedPriority,
        search: searchQuery.trim() || undefined,
      })
      const list = Array.isArray(data) ? data : data?.demands || []
      setDemands(list)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load demands.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchDemands()
  }, [department?._id, selectedStatus, selectedPriority])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    void fetchDemands()
  }

  const handleStatusTransition = async (demandId: string, action: 'accept' | 'start' | 'complete' | 'close') => {
    setActionLoadingId(demandId)
    try {
      const performer = localStorage.getItem('userDisplayName') || 'Staff Member'
      if (action === 'accept') {
        await acceptDemand(demandId, performer)
      } else if (action === 'start') {
        await startDemand(demandId, performer)
      } else if (action === 'complete') {
        await completeDemand(demandId, performer)
      } else if (action === 'close') {
        await closeDemand(demandId, performer)
      }
      await fetchDemands()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Action failed.')
    } finally {
      setActionLoadingId(null)
    }
  }

  return (
    <div className="demands-list-page">
      <div className="page-heading-row">
        <div>
          <p className="eyebrow">Operational Workflows</p>
          <h2>All Demands · {department?.name}</h2>
          <p className="muted">Track, triage, and progress demands with SLA target deadlines.</p>
        </div>
        <div className="heading-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => void fetchDemands()}
            title="Refresh demands"
          >
            <RefreshCw size={15} /> Refresh
          </button>
          <Link to={`/department/${department?._id}/demands/new`} className="primary-button">
            <Plus size={16} /> New demand
          </Link>
        </div>
      </div>

      <div className="filters-bar">
        <form className="search-box" onSubmit={handleSearchSubmit}>
          <Search size={17} className="search-icon" />
          <input
            type="text"
            placeholder="Search by title, demand number, or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button type="button" className="clear-search" onClick={() => { setSearchQuery(''); setTimeout(fetchDemands, 0) }}>
              ×
            </button>
          )}
        </form>

        <div className="priority-filter-select">
          <Filter size={14} />
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value as Priority | 'ALL')}
            aria-label="Filter by priority"
          >
            <option value="ALL">All Priorities</option>
            <option value="P1">P1 (3 Days)</option>
            <option value="P2">P2 (7 Days)</option>
            <option value="P3">P3 (15 Days)</option>
            <option value="P4">P4 (30 Days)</option>
            <option value="P5">P5 (60 Days)</option>
          </select>
        </div>
      </div>

      <div className="status-pills-row">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            className={`status-filter-pill ${selectedStatus === f.id ? 'active' : ''}`}
            onClick={() => setSelectedStatus(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading-state-card">
          <LoaderCircle className="spin" size={28} />
          <span>Loading demands...</span>
        </div>
      ) : error ? (
        <div className="error-card">
          <AlertTriangle size={24} />
          <div>
            <strong>Error loading demands</strong>
            <p>{error}</p>
          </div>
          <button type="button" className="retry-button" onClick={() => void fetchDemands()}>
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      ) : demands.length === 0 ? (
        <div className="empty-demands-card">
          <Clock size={36} />
          <h3>No demands found</h3>
          <p>There are no demands matching your current filters in {department?.name}.</p>
          <Link to={`/department/${department?._id}/demands/new`} className="primary-button">
            <Plus size={16} /> Create First Demand
          </Link>
        </div>
      ) : (
        <div className="demands-grid">
          {demands.map((demand) => {
            const isActionLoading = actionLoadingId === demand._id
            const isOverdue = demand.isOverdue

            return (
              <div key={demand._id} className={`demand-item-card ${isOverdue ? 'overdue-border' : ''}`}>
                <div className="demand-item-top">
                  <div className="demand-id-group">
                    <span className="demand-code">{demand.demandNumber}</span>
                    <span className={`priority-tag ${demand.priority?.toLowerCase()}`}>
                      {demand.priority}
                    </span>
                    <span className={`status-badge ${demand.status?.toLowerCase().replace('_', '-')}`}>
                      {demand.status?.replace('_', ' ')}
                    </span>
                    {isOverdue && (
                      <span className="overdue-badge">
                        <AlertTriangle size={12} /> OVERDUE
                      </span>
                    )}
                  </div>
                  <span className="demand-date">
                    <Calendar size={13} />
                    {new Date(demand.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                </div>

                <h3 className="demand-title">{demand.title}</h3>
                <p className="demand-description">{demand.description}</p>

                <div className="demand-meta-footer">
                  <div className="meta-left">
                    <span className="meta-item">
                      <User size={13} />
                      <span>{demand.createdBy}</span>
                    </span>
                    <span className="meta-item">
                      <Clock size={13} />
                      <span>Due: {new Date(demand.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </span>
                  </div>

                  <div className="demand-quick-actions">
                    {demand.status === 'SUBMITTED' && (
                      <button
                        type="button"
                        className="action-btn start-btn"
                        disabled={isActionLoading}
                        onClick={() => void handleStatusTransition(demand._id, 'accept')}
                      >
                        <CheckCircle2 size={13} /> Accept
                      </button>
                    )}
                    {demand.status === 'ACCEPTED' && (
                      <button
                        type="button"
                        className="action-btn start-btn"
                        disabled={isActionLoading}
                        onClick={() => void handleStatusTransition(demand._id, 'start')}
                      >
                        <Play size={13} /> Start
                      </button>
                    )}
                    {demand.status === 'IN_PROGRESS' && (
                      <button
                        type="button"
                        className="action-btn complete-btn"
                        disabled={isActionLoading}
                        onClick={() => void handleStatusTransition(demand._id, 'complete')}
                      >
                        <CheckCircle2 size={13} /> Complete
                      </button>
                    )}
                    {demand.status === 'COMPLETED' && (
                      <button
                        type="button"
                        className="action-btn close-btn"
                        disabled={isActionLoading}
                        onClick={() => void handleStatusTransition(demand._id, 'close')}
                      >
                        Close
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
