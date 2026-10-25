import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getNotifications, markNotificationRead } from '../../api/services'
import Layout from '../../components/Layout'
import { PageHeader, LoadingSpinner, EmptyState } from '../../components/ui'
import { Bell, CheckCheck } from 'lucide-react'
import { formatDate } from '../../utils/helpers'

const TYPE_COLORS: Record<string, string> = {
  maturity_alert: 'bg-amber-50 border-amber-200',
  maturity_overdue: 'bg-red-50 border-red-200',
  discrepancy: 'bg-orange-50 border-orange-200',
  officer_alert: 'bg-blue-50 border-blue-200',
  default: 'bg-gray-50 border-gray-200',
}

export default function InstitutionNotifications() {
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

  return (
    <Layout>
      <PageHeader title="Notifications" subtitle={`${notifications.filter(n => !n.is_read).length} unread`} />
      {notifications.length === 0
        ? <EmptyState title="No notifications" subtitle="You're all caught up!" icon={Bell} />
        : (
          <div className="space-y-3">
            {notifications.map(n => (
              <div key={n.id} className={`rounded-xl border p-4 ${TYPE_COLORS[n.type] ?? TYPE_COLORS.default} ${n.is_read ? 'opacity-70' : ''}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-gray-800 text-sm">{n.title}</div>
                    <div className="text-sm text-gray-600 mt-1">{n.message}</div>
                    <div className="text-xs text-gray-400 mt-2">{formatDate(n.created_at)}</div>
                    {n.fdr_id && (
                      <Link to={`/institution/fdr/${n.fdr_id}`} className="text-xs text-blue-600 hover:underline mt-1 inline-block">
                        View FDR →
                      </Link>
                    )}
                  </div>
                  {!n.is_read && (
                    <button onClick={() => markRead(n.id)} className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1">
                      <CheckCheck className="w-3 h-3" /> Mark read
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      }
    </Layout>
  )
}
