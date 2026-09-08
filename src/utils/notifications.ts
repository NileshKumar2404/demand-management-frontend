// Web Notification & Real-Time SSE Service

export type NotificationPermissionStatus = 'granted' | 'denied' | 'default' | 'unsupported'

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

export function getNotificationPermission(): NotificationPermissionStatus {
  if (!isNotificationSupported()) return 'unsupported'
  return Notification.permission
}

export async function requestNotificationPermission(): Promise<NotificationPermissionStatus> {
  if (!isNotificationSupported()) return 'unsupported'
  try {
    const permission = await Notification.requestPermission()
    return permission
  } catch (error) {
    console.error('Error requesting notification permission:', error)
    return 'denied'
  }
}

// Gentle pleasant audio chime using Web Audio API (no external asset required)
export function playNotificationChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioContextClass) return
    const ctx = new AudioContextClass()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    // Two-tone chime: 587Hz (D5) then 880Hz (A5)
    osc.frequency.setValueAtTime(587.33, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12)

    gain.gain.setValueAtTime(0.15, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start()
    osc.stop(ctx.currentTime + 0.42)
  } catch {
    // Audio may be blocked by autoplay policies until first user interaction
  }
}

export function sendDesktopNotification(
  title: string,
  options?: {
    body?: string
    icon?: string
    tag?: string
    data?: unknown
    onClick?: () => void
  }
) {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return null
  }

  try {
    const notification = new Notification(title, {
      body: options?.body,
      icon: options?.icon || '/favicon.svg',
      badge: '/favicon.svg',
      tag: options?.tag,
    })

    notification.onclick = () => {
      window.focus()
      if (options?.onClick) {
        options.onClick()
      }
      notification.close()
    }

    playNotificationChime()
    return notification
  } catch (error) {
    console.warn('Could not display desktop notification:', error)
    return null
  }
}

export interface RealtimeNotificationPayload {
  _id: string
  title: string
  message: string
  type: string
  demand?: string | { _id: string; demandNumber: string }
  department?: string | { _id: string; name: string }
  createdAt: string
  isRead: boolean
}

export function subscribeToRealtimeNotifications(
  onNotification: (payload: RealtimeNotificationPayload) => void
): () => void {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
  const streamUrl = `${baseUrl}/notifications/stream`

  let eventSource: EventSource | null = null
  let isClosed = false

  const connect = () => {
    if (isClosed) return

    eventSource = new EventSource(streamUrl)

    eventSource.addEventListener('notification', (event) => {
      try {
        const data: RealtimeNotificationPayload = JSON.parse(event.data)
        // Show desktop notification on all devices that have granted permission
        sendDesktopNotification(data.title, {
          body: data.message,
          tag: data._id,
        })
        // Trigger in-app callback
        onNotification(data)
      } catch (err) {
        console.error('Error parsing notification event:', err)
      }
    })

    eventSource.onerror = () => {
      if (eventSource) {
        eventSource.close()
      }
      // Retry connection after 5 seconds if not explicitly closed
      if (!isClosed) {
        setTimeout(connect, 5000)
      }
    }
  }

  connect()

  return () => {
    isClosed = true
    if (eventSource) {
      eventSource.close()
    }
  }
}
