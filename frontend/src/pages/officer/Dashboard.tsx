import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getDashboardStats, getFDRs, getNotifications } from '../../api/services'
import Layout from '../../components/Layout'
import { StatCard, LoadingSpinner, DemoWarning, Card } from '../../components/ui'
import { StatusBadge, PriorityBadge } from '../../components/StatusBadge'
import { formatCurrency, formatDate, daysFromNow } from '../../utils/helpers'
import { FileText, AlertTriangle, Clock, CheckCircle, TrendingUp, Bell, Users, BarChart3, Layers } from 'lucide-react'

export default function OfficerDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [highPriority, setHighPriority] = useState<any[]>([])
  const [urgent, setUrgent] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getDashboardStats(),
      getFDRs({ priority_min: 50, limit: 5 }),
      getFDRs({ expiring_days: 30, limit: 5 }),
    ]).then(([s, hp, u]) => {
      setStats(s.data)
      setHighPriority(hp.data)
      setUrgent(u.data)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <Layout><LoadingSpinner /></Layout>

  return (
    <Layout>
      <div className="mb-5"><DemoWarning /></div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Officer Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">AICTE FDR Regulation Bureau — Overview</p>
        </div>
        <Link to="/officer/queue" className="flex items-center gap-2 bg-[#003366] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-900">
          <Layers className="w-4 h-4" /> Case Queue
        </Link>
      </div>

      {/* Stats row 1 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <StatCard title="Total FDRs" value={stats?.total_fdrs ?? 0} icon={FileText} color="blue" />
        <StatCard title="Active FDRs" value={stats?.active_fdrs ?? 0} icon={CheckCircle} color="green" />
        <StatCard title="Pending Review" value={(stats?.submitted_fdrs ?? 0) + (stats?.under_review_fdrs ?? 0)} icon={Clock} color="amber" />
        <StatCard title="High Priority" value={stats?.high_priority_count ?? 0} icon={AlertTriangle} color="red" />
      </div>

      {/* Stats row 2 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard title="Discrepancies" value={stats?.discrepancy_fdrs ?? 0} icon={AlertTriangle} color="orange" />
        <StatCard title="Approaching Maturity" value={stats?.approaching_maturity ?? 0} icon={Clock} color="amber" />
        <StatCard title="Matured (Action Needed)" value={stats?.matured_fdrs ?? 0} icon={TrendingUp} color="indigo" />
        <StatCard title="Pending Release" value={stats?.pending_release ?? 0} icon={Layers} color="teal" />
      </div>

      {/* Total amount */}
      <div className="bg-gradient-to-r from-[#003366] to-[#1e3a5f] rounded-xl p-5 text-white mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-300 text-sm">Total FDR Value Under Management</p>
            <p className="text-3xl font-bold mt-1">{formatCurrency(stats?.total_amount ?? 0)}</p>
            <p className="text-blue-300 text-xs mt-1">⚠ Synthetic demo data — not real AICTE figures</p>
          </div>
          <BarChart3 className="w-12 h-12 text-blue-400 opacity-50" />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* High priority cases */}
        <Card>
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" /> High Priority Cases
            </h2>
            <Link to="/officer/queue?priority=50" className="text-xs text-blue-600 hover:underline">View all →</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {highPriority.length === 0
              ? <div className="px-5 py-6 text-center text-sm text-gray-400">No high priority cases</div>
              : highPriority.map(fdr => (
                <Link key={fdr.id} to={`/officer/fdr/${fdr.id}`}
                  className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors">
                  <div>
                    <div className="font-medium text-sm text-gray-800">{fdr.fdr_number}</div>
                    <div className="text-xs text-gray-500">{fdr.institution_id ? `Inst. #${fdr.institution_id}` : ''} · {fdr.bank_name}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <PriorityBadge score={fdr.priority_score} />
                    <StatusBadge status={fdr.status} />
                  </div>
                </Link>
              ))}
          </div>
        </Card>

        {/* Expiring soon */}
        <Card>
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-700 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" /> Expiring Within 30 Days
            </h2>
            <Link to="/officer/analytics" className="text-xs text-blue-600 hover:underline">Timeline →</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {urgent.length === 0
              ? <div className="px-5 py-6 text-center text-sm text-gray-400">No FDRs expiring within 30 days</div>
              : urgent.map(fdr => {
                const days = daysFromNow(fdr.maturity_date)
                return (
                  <Link key={fdr.id} to={`/officer/fdr/${fdr.id}`}
                    className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors">
                    <div>
                      <div className="font-medium text-sm text-gray-800">{fdr.fdr_number}</div>
                      <div className="text-xs text-gray-500">{formatCurrency(fdr.amount)}</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-bold ${days !== null && days < 0 ? 'text-red-600' : days !== null && days <= 7 ? 'text-red-500' : 'text-orange-500'}`}>
                        {days !== null && days < 0 ? `${Math.abs(days)}d overdue` : `${days}d left`}
                      </div>
                      <div className="text-xs text-gray-400">{formatDate(fdr.maturity_date)}</div>
                    </div>
                  </Link>
                )
              })}
          </div>
        </Card>
      </div>
    </Layout>
  )
}
