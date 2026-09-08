import { Activity, AlertTriangle, BarChart3, CheckCircle2, Clock3, FileText, Plus, TimerReset, TrendingUp } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { getDashboard, type DashboardData } from '../api/demandApi'
import type { Department, Demand } from '../types'

const formatDate = (value: string) => new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value))
const formatDuration = (ms: number) => {
  if (!ms) return '—'
  const days = Math.floor(ms / 86400000)
  const hours = Math.floor((ms % 86400000) / 3600000)
  return days ? `${days}d ${hours}h` : `${hours}h`
}

export default function Dashboard() {
  const { department } = useOutletContext<{ department: Department | null }>()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!department) return
    setLoading(true)
    void getDashboard(department._id)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Unable to load dashboard.'))
      .finally(() => setLoading(false))
  }, [department?._id])

  const counts = data?.counts
  const cards = [
    { label: 'Total Demands', value: counts?.total, icon: FileText },
    { label: 'In Progress', value: counts?.inProgress, icon: Activity },
    { label: 'Completed', value: counts?.completed, icon: CheckCircle2 },
    { label: 'Overdue', value: counts?.overdue, icon: AlertTriangle },
    { label: 'Submitted', value: counts?.submitted, icon: TimerReset },
    { label: 'On Hold', value: counts?.onHold, icon: Clock3 },
  ]

  return (
    <div className="dashboard-page">
      <div className="page-heading-row">
        <div><p className="eyebrow">Overview</p><h2>{department?.name} dashboard</h2><p className="muted">Monitor demand volume, workflow progress and SLA performance.</p></div>
        <Link className="primary-button" to={`/department/${department?._id}/demands/new`}><Plus size={17} /> New demand</Link>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="metric-grid metric-grid-six">
        {cards.map(({ label, value, icon: Icon }) => <div className="metric-card" key={label}><div className="metric-icon"><Icon size={19} /></div><span>{label}</span><strong>{loading ? '—' : value ?? 0}</strong></div>)}
      </div>

      <div className="dashboard-grid">
        <section className="content-card large-card">
          <div className="card-header"><div><h3>Recent demands</h3><p>Latest activity for {department?.name}.</p></div><Link to={`/department/${department?._id}/demands`}>View all</Link></div>
          {loading ? <div className="empty-dashboard"><Clock3 size={24} /><strong>Loading dashboard...</strong></div> : data?.recentDemands.length ? <div className="recent-list">{data.recentDemands.map((demand: Demand) => <Link className="recent-demand-row" key={demand._id} to={`/department/${department?._id}/demands/${demand._id}`}><div><strong>{demand.demandNumber}</strong><span>{demand.title}</span></div><div><span className={`priority-badge ${demand.priority.toLowerCase()}`}>{demand.priority}</span><span className={`status-badge ${demand.status.toLowerCase()}`}>{demand.status.replaceAll('_', ' ')}</span><small>{formatDate(demand.createdAt)}</small></div></Link>)}</div> : <div className="empty-dashboard"><Clock3 size={24} /><strong>No demands yet</strong><span>Create the first demand for this department.</span></div>}
        </section>

        <section className="content-card">
          <div className="card-header"><div><h3>Priority SLA</h3><p>Target completion windows.</p></div></div>
          <div className="sla-list">{(['P1', 'P2', 'P3', 'P4', 'P5'] as const).map((priority) => <div key={priority} className="sla-row"><span className={`priority-badge ${priority.toLowerCase()}`}>{priority}</span><span>{priority === 'P1' ? '3 days' : priority === 'P2' ? '7 days' : priority === 'P3' ? '15 days' : priority === 'P4' ? '30 days' : '60 days'}</span><strong>{data?.priorityCounts?.[priority] ?? 0}</strong></div>)}</div>
        </section>

        <section className="content-card">
          <div className="card-header"><div><h3>SLA performance</h3><p>Resolved demand compliance.</p></div><TrendingUp size={19} /></div>
          <div className="sla-score"><strong>{loading ? '—' : `${data?.sla.compliancePercentage ?? 100}%`}</strong><span>within SLA</span></div>
          <div className="mini-stat-grid"><div><span>Within SLA</span><strong>{data?.sla.completedWithinSla ?? 0}</strong></div><div><span>Breached</span><strong>{data?.sla.completedAfterSla ?? 0}</strong></div><div><span>Avg. resolution</span><strong>{formatDuration(data?.averageResolutionMs || 0)}</strong></div></div>
        </section>

        <section className="content-card">
          <div className="card-header"><div><h3>Workflow</h3><p>Current demand distribution.</p></div><BarChart3 size={19} /></div>
          <div className="workflow-bars">{[['Submitted', counts?.submitted], ['Assigned', counts?.assigned], ['Accepted', counts?.accepted], ['In progress', counts?.inProgress], ['On hold', counts?.onHold], ['Completed', counts?.completed], ['Closed', counts?.closed]].map(([label, value]) => { const max = Math.max(1, counts?.total || 1); const numeric = Number(value || 0); return <div className="workflow-row" key={String(label)}><div><span>{label}</span><strong>{numeric}</strong></div><div className="bar-track"><div className="bar-fill" style={{ width: `${Math.min(100, (numeric / max) * 100)}%` }} /></div></div> })}</div>
        </section>
      </div>
    </div>
  )
}
