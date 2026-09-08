import { useEffect, useMemo, useState } from 'react'
import { Eye, Filter, Plus, RefreshCw, Search } from 'lucide-react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { getDemands } from '../api/demandApi'
import type { Demand, DemandStatus, Priority } from '../types'

const statuses: DemandStatus[] = ['SUBMITTED', 'ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CLOSED']
const priorities: Priority[] = ['P1', 'P2', 'P3', 'P4', 'P5']

const statusLabel = (value: DemandStatus) => value.replaceAll('_', ' ')

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value))

const getDepartmentName = (demand: Demand) =>
  typeof demand.department === 'string' ? demand.department : demand.department?.name || '—'

export default function Demands() {
  const { department } = useOutletContext<{ department: { _id: string; name: string } }>()
  const navigate = useNavigate()
  const [demands, setDemands] = useState<Demand[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [priority, setPriority] = useState('')
  const [overdue, setOverdue] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const result = await getDemands({
        department: department._id,
        search: search || undefined,
        status: (status || undefined) as DemandStatus | undefined,
        priority: (priority || undefined) as Priority | undefined,
        overdue,
        page,
        limit: 10,
      })
      setDemands(result.demands)
      setTotalPages(result.pagination.totalPages || 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load demands.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [department._id, page, status, priority, overdue])

  const filtered = useMemo(() => demands, [demands])

  return (
    <section className="module-page">
      <div className="page-heading-row">
        <div>
          <p className="eyebrow">Demand workspace</p>
          <h2>All Demands</h2>
          <p className="muted">Track every demand raised for {department.name} and monitor its SLA.</p>
        </div>
        <button className="primary-button" type="button" onClick={() => navigate('../demands/new')}>
          <Plus size={17} /> Create Demand
        </button>
      </div>

      <div className="filter-panel">
        <div className="search-box">
          <Search size={17} />
          <input
            value={search}
            placeholder="Search demand number, title, creator or assignee"
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                setPage(1)
                void load()
              }
            }}
          />
        </div>
        <select value={status} onChange={(event) => { setPage(1); setStatus(event.target.value) }}>
          <option value="">All statuses</option>
          {statuses.map((item) => <option key={item} value={item}>{statusLabel(item)}</option>)}
        </select>
        <select value={priority} onChange={(event) => { setPage(1); setPriority(event.target.value) }}>
          <option value="">All priorities</option>
          {priorities.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <label className="toggle-filter">
          <input type="checkbox" checked={overdue} onChange={(event) => { setPage(1); setOverdue(event.target.checked) }} />
          Overdue only
        </label>
        <button className="secondary-button" type="button" onClick={() => { setSearch(''); setStatus(''); setPriority(''); setOverdue(false); setPage(1) }}>
          <Filter size={16} /> Reset
        </button>
        <button className="secondary-button" type="button" onClick={() => void load()} title="Refresh">
          <RefreshCw size={16} />
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="table-card">
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Demand</th>
                <th>Title</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Created</th>
                <th>Due</th>
                <th>Assignee</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="empty-state">Loading demands...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="empty-state">No demands found for the selected filters.</td></tr>
              ) : filtered.map((demand) => (
                <tr key={demand._id}>
                  <td><strong>{demand.demandNumber}</strong></td>
                  <td><div className="table-title">{demand.title}</div><span className="table-subtitle">{getDepartmentName(demand)}</span></td>
                  <td><span className={`priority-badge ${demand.priority.toLowerCase()}`}>{demand.priority}</span></td>
                  <td><span className={`status-badge ${demand.status.toLowerCase()}`}>{statusLabel(demand.status)}</span>{demand.isOverdue && <span className="overdue-tag">Overdue</span>}</td>
                  <td>{formatDate(demand.createdAt)}</td>
                  <td>{formatDate(demand.dueDate)}</td>
                  <td>{demand.assignedTo || 'Unassigned'}</td>
                  <td><button className="icon-table-button" type="button" onClick={() => navigate(`../demands/${demand._id}`)} title="View demand"><Eye size={17} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pagination-row">
          <span>Page {page} of {totalPages}</span>
          <div className="pagination-actions">
            <button className="secondary-button" type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Previous</button>
            <button className="secondary-button" type="button" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)}>Next</button>
          </div>
        </div>
      </div>
    </section>
  )
}
