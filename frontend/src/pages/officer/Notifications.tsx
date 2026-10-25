import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getNotifications, markNotificationRead } from '../../api/services'
import Layout from '../../components/Layout'
import { PageHeader, LoadingSpinner, EmptyState } from '../../components/ui'
import { Bell, CheckCheck } from 'lucide-react'
import { formatDate } from '../../utils/helpers'

const TYPE_STYLES: Record<string, { bg: string; icon: string }> = {
  maturity_alert: { bg: 'bg-amber-50 border-amber-200', icon: '⏰' },
  maturity_overdue: { bg: 'bg-red-50 border-red-200', icon: '🚨' },
  discrepancy: { bg: 'bg-orange-50 border-orange-200', icon: '⚠️' },
  officer_alert: { bg: 'bg-blue-50 border-blue-200', icon: '🔔' },
  default: { bg: 'bg-gray-50 border-gray-200', icon: '📢' },
}

export default function OfficerNotifications() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getNotifications().then(r => setNotifications(r.data)).finally(() => setLoading(false))
  }, [])

  const markRead = async (id: number) => {
    await markNotificationRead(id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  if (loading) return <Layout><LoadingSpinner /></Layout>

  const unread = notifications.filter(n => !n.is_read).length

  return (
    <Layout>
      <PageHeader title="Notifications" subtitle={`${unread} unread notification${unread !== 1 ? 's' : ''}`} />
      {notifications.length === 0
        ? <EmptyState title="No notifications" subtitle="All caught up!" icon={Bell} />
        : (
          <div className="space-y-3">
            {notifications.map(n => {
              const style = TYPE_STYLES[n.type] ?? TYPE_STYLES.default
              return (
                <div key={n.id} className={`rounded-xl border p-4 ${style.bg} ${n.is_read ? 'opacity-60' : ''}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className="text-xl">{style.icon}</span>
                      <div>
                        <div className="font-semibold text-gray-800 text-sm">{n.title}</div>
                        <div className="text-sm text-gray-600 mt-1">{n.message}</div>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs text-gray-400">{formatDate(n.created_at)}</span>
                          {n.fdr_id && (
                            <Link to={`/officer/fdr/${n.fdr_id}`} className="text-xs text-blue-600 hover:underline">
                              View FDR #{n.fdr_id} →
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                    {!n.is_read && (
                      <button onClick={() => markRead(n.id)} className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1 flex-shrink-0">
                        <CheckCheck className="w-3 h-3" /> Mark read
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )
      }
    </Layout>
  )
}
