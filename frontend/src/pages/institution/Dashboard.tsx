import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getDashboardStats, getFDRs, getNotifications } from '../../api/services'
import { useAuth } from '../../context/AuthContext'
import Layout from '../../components/Layout'
import { LoadingSpinner } from '../../components/ui'
import { StatusBadge } from '../../components/StatusBadge'
import { formatCurrency, formatDate, daysFromNow } from '../../utils/helpers'
import {
  FileText, AlertTriangle, Clock, CheckCircle,
  PlusCircle, Bell, ChevronRight, TrendingUp, Info
} from 'lucide-react'

// ── Stat card ─────────────────────────────────────────────────────────────────
interface StatCardProps {
  title: string
  value: number | string
  icon: React.ReactNode
  accent: string   // Tailwind bg + text classes for icon bubble
  border: string   // Tailwind border-l colour
  note?: string
}
function StatCard({ title, value, icon, accent, border, note }: StatCardProps) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 border-l-4 ${border} shadow-sm p-5 flex items-start justify-between hover:shadow-md transition-shadow`}>
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{title}</p>
        <p className="text-3xl font-bold text-gray-800 mt-1 leading-none">{value}</p>
        {note && <p className="text-xs text-gray-400 mt-1.5">{note}</p>}
      </div>
      <div className={`p-3 rounded-xl ${accent}`}>
        {icon}
      </div>
    </div>
  )
}

// ── Main dashboard ─────────────────────────────────────────────────────────────
export default function InstitutionDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<any>(null)
  const [fdrs, setFdrs] = useState<any[]>([])
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getDashboardStats(), getFDRs({ limit: 6 }), getNotifications()])
      .then(([s, f, n]) => {
        setStats(s.data)
        setFdrs(f.data)
        setNotifications(n.data.filter((x: any) => !x.is_read).slice(0, 4))
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Layout><LoadingSpinner text="Loading your dashboard…" /></Layout>

  return (
    <Layout>
      {/* ── Demo banner ── */}
      <div className="mb-5 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 text-xs text-amber-800">
        <Info className="w-4 h-4 flex-shrink-0 text-amber-500" />
        <span><strong>Demo Data:</strong> All records are synthetic test data for prototype demonstration only. Not real AICTE data.</span>
      </div>

      {/* ── Page header ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Institution Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Welcome back, <span className="font-medium text-gray-700">{user?.full_name}</span>
          </p>
        </div>
        <Link
          to="/institution/submit"
          className="inline-flex items-center gap-2 bg-[#003366] hover:bg-blue-900 text-white px-5 py-2.5 rounded-lg text-sm font-semibold shadow-sm transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          Submit FDR
        </Link>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        <StatCard
          title="Total FDRs"
          value={stats?.total_fdrs ?? 0}
          icon={<FileText className="w-5 h-5" />}
          accent="bg-blue-50 text-blue-600"
          border="border-l-blue-500"
          note="All submitted instruments"
        />
        <StatCard
          title="Active FDRs"
          value={stats?.active_fdrs ?? 0}
          icon={<CheckCircle className="w-5 h-5" />}
          accent="bg-green-50 text-green-600"
          border="border-l-green-500"
          note="Verified and in-force"
        />
        <StatCard
          title="Discrepancies"
          value={stats?.discrepancy_fdrs ?? 0}
          icon={<AlertTriangle className="w-5 h-5" />}
          accent="bg-red-50 text-red-600"
          border="border-l-red-500"
          note="Require your attention"
        />
        <StatCard
          title="Approaching Maturity"
          value={stats?.approaching_maturity ?? 0}
          icon={<Clock className="w-5 h-5" />}
          accent="bg-amber-50 text-amber-600"
          border="border-l-amber-500"
          note="Within next 90 days"
        />
      </div>

      {/* ── Two-column lower section ── */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* Recent FDRs — 2/3 width */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <h2 className="font-semibold text-gray-700 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                Recent FDRs
              </h2>
              <Link to="/institution/fdrs" className="text-xs font-medium text-blue-600 hover:text-blue-800 flex items-center gap-0.5">
                View all <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {fdrs.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">No FDRs submitted yet.</p>
                <Link to="/institution/submit" className="mt-3 inline-block text-sm text-blue-600 font-medium hover:underline">
                  Submit your first FDR →
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {fdrs.map(fdr => {
                  const days = daysFromNow(fdr.maturity_date)
                  const isOverdue = days !== null && days < 0
                  const isUrgent = days !== null && days >= 0 && days <= 30

                  return (
                    <Link
                      key={fdr.id}
                      to={`/institution/fdr/${fdr.id}`}
                      className="flex items-center justify-between px-5 py-3.5 hover:bg-blue-50/40 transition-colors group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          isOverdue ? 'bg-red-500' :
                          isUrgent ? 'bg-amber-500' :
                          fdr.status === 'discrepancy_found' ? 'bg-red-400' :
                          fdr.status === 'active' || fdr.status === 'verified' ? 'bg-green-500' :
                          'bg-blue-400'
                        }`} />
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-gray-800 truncate group-hover:text-blue-700 transition-colors">
                            {fdr.fdr_number}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {fdr.bank_name} &nbsp;·&nbsp; {formatCurrency(fdr.amount)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                        <div className="text-right hidden sm:block">
                          {days !== null && (
                            <span className={`text-xs font-medium ${
                              isOverdue ? 'text-red-600' :
                              isUrgent ? 'text-amber-600' :
                              'text-gray-400'
                            }`}>
                              {isOverdue
                                ? `${Math.abs(days)}d overdue`
                                : days <= 90
                                ? `${days}d left`
                                : formatDate(fdr.maturity_date)}
                            </span>
                          )}
                        </div>
                        <StatusBadge status={fdr.status} />
                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-400 transition-colors" />
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          {/* Summary totals strip */}
          {stats && (
            <div className="bg-gradient-to-r from-[#003366] to-[#1e4d8c] rounded-xl p-4 text-white flex flex-wrap gap-6 items-center">
              <div>
                <p className="text-blue-300 text-xs font-medium">Total FDR Value</p>
                <p className="text-xl font-bold mt-0.5">{formatCurrency(stats.total_amount ?? 0)}</p>
              </div>
              <div className="w-px h-8 bg-white/20 hidden sm:block" />
              <div>
                <p className="text-blue-300 text-xs font-medium">Pending Review</p>
                <p className="text-xl font-bold mt-0.5">{(stats.submitted_fdrs ?? 0) + (stats.under_review_fdrs ?? 0)}</p>
              </div>
              <div className="w-px h-8 bg-white/20 hidden sm:block" />
              <div>
                <p className="text-blue-300 text-xs font-medium">Released</p>
                <p className="text-xl font-bold mt-0.5">{stats.released_fdrs ?? 0}</p>
              </div>
              <div className="ml-auto text-right hidden sm:block">
                <p className="text-blue-300 text-xs italic">⚠ Synthetic demo data</p>
              </div>
            </div>
          )}
        </div>

        {/* Right column — Notifications + Quick Actions */}
        <div className="flex flex-col gap-5">

          {/* Notifications */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
              <h2 className="font-semibold text-gray-700 flex items-center gap-2">
                <Bell className="w-4 h-4 text-blue-600" />
                Notifications
              </h2>
              {notifications.length > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {notifications.length}
                </span>
              )}
            </div>

            {notifications.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <Bell className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No new notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {notifications.map(n => {
                  const typeColor = n.type === 'discrepancy' ? 'bg-red-50 border-l-red-400' :
                    n.type?.includes('overdue') ? 'bg-red-50 border-l-red-400' :
                    n.type?.includes('maturity') ? 'bg-amber-50 border-l-amber-400' :
                    'bg-blue-50 border-l-blue-400'
                  return (
                    <div key={n.id} className={`px-4 py-3 border-l-2 ${typeColor}`}>
                      <p className="font-medium text-xs text-gray-800 leading-snug">{n.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-xs text-gray-300 mt-1">{formatDate(n.created_at)}</p>
                    </div>
                  )
                })}
              </div>
            )}

            <div className="px-5 py-3 border-t border-gray-100">
              <Link to="/institution/notifications" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                View all notifications <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Link
                to="/institution/submit"
                className="flex items-center gap-3 w-full px-4 py-3 bg-[#003366] hover:bg-blue-900 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <PlusCircle className="w-4 h-4 flex-shrink-0" />
                Submit New FDR
              </Link>
              <Link
                to="/institution/fdrs"
                className="flex items-center gap-3 w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-sm font-medium border border-gray-200 transition-colors"
              >
                <FileText className="w-4 h-4 flex-shrink-0 text-blue-600" />
                View All FDRs
              </Link>
              <Link
                to="/institution/notifications"
                className="flex items-center gap-3 w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-sm font-medium border border-gray-200 transition-colors"
              >
                <Bell className="w-4 h-4 flex-shrink-0 text-blue-600" />
                Notifications
                {notifications.length > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                    {notifications.length}
                  </span>
                )}
              </Link>
            </div>
          </div>

          {/* Status legend */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Status Guide</h3>
            <div className="space-y-2 text-xs text-gray-600">
              {[
                { dot: 'bg-blue-400', label: 'Submitted — awaiting officer review' },
                { dot: 'bg-green-500', label: 'Active / Verified — in force' },
                { dot: 'bg-amber-500', label: 'Approaching maturity' },
                { dot: 'bg-red-500', label: 'Discrepancy or overdue' },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${s.dot}`} />
                  {s.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
