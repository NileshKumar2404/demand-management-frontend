import { Bell, CheckCheck, ExternalLink } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '../api/notificationApi'
import type { Department, Notification } from '../types'

const formatDateTime = (value: string) => new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))

export default function Notifications() {
  const { department } = useOutletContext<{ department: Department }>()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const result = await getNotifications({ department: department._id, limit: 100 })
      setNotifications(result.notifications)
      setUnreadCount(result.unreadCount)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load notifications.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [department._id])

  const markRead = async (notification: Notification) => {
    if (notification.isRead) return
    try {
      const updated = await markNotificationRead(notification._id)
      setNotifications((current) => current.map((item) => item._id === notification._id ? updated : item))
      setUnreadCount((current) => Math.max(0, current - 1))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to mark notification as read.')
    }
  }

  const markAll = async () => {
    try {
      await markAllNotificationsRead(department._id)
      setNotifications((current) => current.map((item) => ({ ...item, isRead: true })))
      setUnreadCount(0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to mark notifications as read.')
    }
  }

  return (
    <section className="module-page">
      <div className="page-heading-row">
        <div><p className="eyebrow">Activity feed</p><h2>Notifications</h2><p className="muted">Shared notifications for the {department.name} workspace.</p></div>
        <button className="secondary-button" type="button" disabled={!unreadCount} onClick={() => void markAll()}><CheckCheck size={16} /> Mark all read</button>
      </div>

      {error && <div className="error-banner">{error}</div>}
      <div className="notification-summary"><Bell size={17} /><strong>{unreadCount}</strong> unread notifications</div>

      <div className="notification-list">
        {loading ? <div className="loading-card">Loading notifications...</div> : notifications.length === 0 ? <div className="empty-dashboard"><Bell size={24} /><strong>No notifications</strong><span>New demand activity will appear here.</span></div> : notifications.map((notification) => (
          <article key={notification._id} className={`notification-card ${notification.isRead ? 'read' : 'unread'}`} onClick={() => void markRead(notification)}>
            <div className="notification-icon"><Bell size={17} /></div>
            <div className="notification-body"><div className="notification-title-row"><strong>{notification.title}</strong><span>{formatDateTime(notification.createdAt)}</span></div><p>{notification.message}</p><div className="notification-meta"><span>{notification.type.replaceAll('_', ' ')}</span>{typeof notification.demand !== 'string' && notification.demand?.demandNumber && <button type="button" onClick={(event) => { event.stopPropagation(); const id = typeof notification.demand === 'string' ? notification.demand : notification.demand?._id; if (id) navigate(`../demands/${id}`) }}><ExternalLink size={14} /> {notification.demand.demandNumber}</button>}</div></div>
            {!notification.isRead && <span className="unread-dot" />}
          </article>
        ))}
      </div>
    </section>
  )
}
