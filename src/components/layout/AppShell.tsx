import { Bell, ClipboardList, LayoutDashboard, Menu, Plus, Settings2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { getNotifications } from '../../api/notificationApi'
import type { Department } from '../../types'

interface AppShellProps {
  department: Department | null
}

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: 'dashboard' },
  { label: 'All Demands', icon: ClipboardList, path: 'demands' },
  { label: 'Create Demand', icon: Plus, path: 'demands/new' },
  { label: 'Notifications', icon: Bell, path: 'notifications' },
]

export default function AppShell({ department }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const navigate = useNavigate()
  const location = useLocation()

  const basePath = department ? `/department/${department._id}` : '/select-department'

  useEffect(() => {
    if (!department) return
    let cancelled = false
    const loadUnread = async () => {
      try {
        const result = await getNotifications({ department: department._id, limit: 1 })
        if (!cancelled) setUnreadCount(result.unreadCount)
      } catch {
        if (!cancelled) setUnreadCount(0)
      }
    }
    void loadUnread()
    return () => { cancelled = true }
  }, [department?._id, location.pathname])

  return (
    <div className="app-shell">
      <button className="mobile-menu-button" type="button" aria-label="Open navigation" onClick={() => setMobileOpen(true)}><Menu size={20} /></button>
      {mobileOpen && <button className="mobile-overlay" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}

      <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-mark">D</div>
          <div><strong>DemandFlow</strong><span>Management Portal</span></div>
          <button className="sidebar-close" type="button" onClick={() => setMobileOpen(false)} aria-label="Close navigation"><X size={19} /></button>
        </div>

        <div className="department-context">
          <span>Department context</span>
          <button type="button" onClick={() => navigate('/select-department')}><span>{department?.name || 'Select department'}</span><Settings2 size={15} /></button>
        </div>

        <nav className="sidebar-nav" aria-label="Main navigation">
          <span className="nav-label">Workspace</span>
          {navItems.map(({ label, icon: Icon, path }) => (
            <NavLink key={path} to={`${basePath}/${path}`} onClick={() => setMobileOpen(false)} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Icon size={18} strokeWidth={1.9} /><span>{label}</span>{path === 'notifications' && unreadCount > 0 && <span className="nav-count">{unreadCount > 99 ? '99+' : unreadCount}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer"><div className="sla-note"><span className="sla-dot" /><div><strong>SLA tracking active</strong><span>Priority-based due dates</span></div></div><span className="version">Demand Management · V1</span></div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div><p className="eyebrow">Demand Management</p><h1>{department?.name || 'Workspace'}</h1></div>
          <div className="topbar-actions">
            <button className="icon-button" type="button" title="Notifications" onClick={() => navigate(`${basePath}/notifications`)}><Bell size={19} />{unreadCount > 0 && <span className="notification-dot" />}</button>
            <div className="user-placeholder"><div className="avatar">U</div><div><strong>Staff Member</strong><span>V1 workspace</span></div></div>
          </div>
        </header>
        <div className="page-content"><Outlet context={{ department, location }} /></div>
      </main>
    </div>
  )
}
