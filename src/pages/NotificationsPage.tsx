import {
  Bell,
  BellRing,
  Check,
  CheckCheck,
  Clock,
  ExternalLink,
  Info,
  LoaderCircle,
  RefreshCw,
  Sparkles,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../api/notificationApi'
import type { Department, Notification } from '../types'
import {
  getNotificationPermission,
  requestNotificationPermission,
  sendDesktopNotification,
} from '../utils/notifications'

export default function NotificationsPage() {
  const { department } = useOutletContext<{ department: Department | null }>()

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [permission, setPermission] = useState(getNotificationPermission)
  const [markingAll, setMarkingAll] = useState(false)

  const loadNotifications = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getNotifications()
      const list = Array.isArray(data) ? data : (data as unknown as { notifications?: Notification[] })?.notifications || []
      setNotifications(list)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load notifications.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadNotifications()
    setPermission(getNotificationPermission())
  }, [])

  const handleEnableNotifications = async () => {
    const res = await requestNotificationPermission()
    setPermission(res)
    if (res === 'granted') {
      sendDesktopNotification('Notifications Enabled!', {
        body: 'You will now receive automatic alerts on this device whenever any demand is created.',
      })
    }
  }

  const handleTestNotification = () => {
    sendDesktopNotification('DemandFlow Test Alert', {
      body: 'This is a test notification verifying that cross-device desktop alerts are working on your device!',
    })
  }

  const handleMarkAsRead = async (id: string) => {
    try {
      await markNotificationRead(id)
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      )
    } catch (err) {
      console.error(err)
    }
  }

  const handleMarkAllRead = async () => {
    setMarkingAll(true)
    try {
      await markAllNotificationsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    } catch (err) {
      console.error(err)
    } finally {
      setMarkingAll(false)
    }
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length

  return (
    <div className="notifications-page">
      <div className="page-heading-row">
        <div>
          <p className="eyebrow">Real-Time Activity</p>
          <h2>Notifications Center</h2>
          <p className="muted">Live updates and broadcast alerts across all department workspaces.</p>
        </div>
        <div className="heading-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => void loadNotifications()}
            title="Refresh"
          >
            <RefreshCw size={15} /> Refresh
          </button>
          {unreadCount > 0 && (
            <button
              type="button"
              className="secondary-button"
              disabled={markingAll}
              onClick={() => void handleMarkAllRead()}
            >
              <CheckCheck size={16} /> Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Device Notification Status Card */}
      <div className="permission-status-card">
        <div className="permission-info">
          <div className="permission-icon-wrap">
            <BellRing size={22} />
          </div>
          <div>
            <strong>Cross-Device Notifications</strong>
            <p>
              {permission === 'granted'
                ? 'Desktop notifications are ACTIVE on this device. You will receive an instant OS alert whenever any demand is submitted.'
                : permission === 'denied'
                ? 'Browser notifications are currently blocked in your browser settings. To receive alerts on this device, please allow notifications for this site.'
                : 'Allow notifications on this device to receive instant system alerts when new demands are registered.'}
            </p>
          </div>
        </div>

        <div className="permission-actions">
          {permission === 'granted' ? (
            <button
              type="button"
              className="secondary-button test-btn"
              onClick={handleTestNotification}
            >
              <Sparkles size={15} /> Send Test Alert
            </button>
          ) : (
            <button
              type="button"
              className="primary-button enable-btn"
              onClick={() => void handleEnableNotifications()}
            >
              <Bell size={16} /> Allow Notifications
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="loading-state-card">
          <LoaderCircle className="spin" size={28} />
          <span>Loading notifications...</span>
        </div>
      ) : error ? (
        <div className="error-card">
          <Info size={22} />
          <div>
            <strong>Error loading notifications</strong>
            <p>{error}</p>
          </div>
        </div>
      ) : notifications.length === 0 ? (
        <div className="empty-notifications-card">
          <Bell size={38} />
          <h3>No notifications yet</h3>
          <p>When demands are created or updated, real-time activity will show here.</p>
        </div>
      ) : (
        <div className="notification-list">
          {notifications.map((item) => (
            <div
              key={item._id}
              className={`notification-item ${item.isRead ? 'read' : 'unread'}`}
              onClick={() => {
                if (!item.isRead) void handleMarkAsRead(item._id)
              }}
            >
              <div className="notif-indicator">
                {!item.isRead && <span className="unread-dot" />}
              </div>
              <div className="notif-icon-box">
                <Bell size={16} />
              </div>
              <div className="notif-content">
                <div className="notif-header">
                  <strong>{item.title}</strong>
                  <span className="notif-time">
                    <Clock size={12} />
                    {new Date(item.createdAt).toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="notif-body">{item.message}</p>
                {item.demand && (
                  <Link
                    to={`/department/${department?._id}/demands`}
                    className="notif-link"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span>View Demand</span>
                    <ExternalLink size={12} />
                  </Link>
                )}
              </div>
              {!item.isRead && (
                <button
                  type="button"
                  className="mark-read-btn"
                  title="Mark as read"
                  onClick={(e) => {
                    e.stopPropagation()
                    void handleMarkAsRead(item._id)
                  }}
                >
                  <Check size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
