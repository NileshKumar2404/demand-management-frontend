import { Activity, AlertTriangle, CheckCircle2, Clock3, FileText, Plus } from 'lucide-react'
import { Link, useOutletContext } from 'react-router-dom'
import type { Department } from '../types'

export default function Dashboard() {
  const { department } = useOutletContext<{ department: Department | null }>()

  const cards = [
    { label: 'Total Demands', value: '—', icon: FileText },
    { label: 'In Progress', value: '—', icon: Activity },
    { label: 'Completed', value: '—', icon: CheckCircle2 },
    { label: 'Overdue', value: '—', icon: AlertTriangle },
  ]

  return (
    <div className="dashboard-page">
      <div className="page-heading-row">
        <div>
          <p className="eyebrow">Overview</p>
          <h2>{department?.name} dashboard</h2>
          <p className="muted">Monitor demand volume, workflow progress and SLA performance.</p>
        </div>
        <Link className="primary-button" to={`/department/${department?._id}/demands/new`}>
          <Plus size={17} /> New demand
        </Link>
      </div>

      <div className="metric-grid">
        {cards.map(({ label, value, icon: Icon }) => (
          <div className="metric-card" key={label}>
            <div className="metric-icon"><Icon size={19} /></div>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <section className="content-card large-card">
          <div className="card-header">
            <div>
              <h3>Recent demands</h3>
              <p>Latest activity for {department?.name}.</p>
            </div>
            <Link to={`/department/${department?._id}/demands`}>View all</Link>
          </div>
          <div className="empty-dashboard">
            <Clock3 size={24} />
            <strong>Demand data will appear here</strong>
            <span>Connect the running backend and this dashboard will load live demand metrics.</span>
          </div>
        </section>

        <section className="content-card">
          <div className="card-header">
            <div>
              <h3>Priority SLA</h3>
              <p>Target completion windows.</p>
            </div>
          </div>
          <div className="sla-list">
            {[['P1', '3 days'], ['P2', '7 days'], ['P3', '15 days'], ['P4', '30 days'], ['P5', '60 days']].map(([priority, days]) => (
              <div key={priority} className="sla-row">
                <span className={`priority-badge ${priority.toLowerCase()}`}>{priority}</span>
                <span>{days}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
