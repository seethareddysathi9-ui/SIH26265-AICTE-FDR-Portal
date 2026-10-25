import { useEffect, useState } from 'react'
import { getAnalyticsOverview, getMaturityTimeline } from '../../api/services'
import Layout from '../../components/Layout'
import { PageHeader, LoadingSpinner, DemoWarning, Card } from '../../components/ui'
import { formatCurrency, formatDate, FDR_STATUS_LABELS } from '../../utils/helpers'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts'
import { AlertTriangle, Clock, TrendingUp, BarChart3 } from 'lucide-react'

const COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316','#84cc16']

export default function Analytics() {
  const [overview, setOverview] = useState<any>(null)
  const [timeline, setTimeline] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getAnalyticsOverview(), getMaturityTimeline()])
      .then(([o, t]) => { setOverview(o.data); setTimeline(t.data) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Layout><LoadingSpinner /></Layout>

  const statusChartData = overview ? Object.entries(overview.by_status).map(([k, v]) => ({
    name: FDR_STATUS_LABELS[k] || k, value: v as number
  })) : []

  const stateChartData = overview ? Object.entries(overview.by_state).slice(0, 8).map(([k, v]) => ({
    name: k, count: v as number
  })) : []

  const bankChartData = overview ? Object.entries(overview.by_bank).slice(0, 6).map(([k, v]) => ({
    name: k.replace('Bank', 'Bk').replace('State ', 'SBI').replace('of India', ''), count: v as number
  })) : []

  return (
    <Layout>
      <PageHeader title="Analytics & Reports" subtitle="Portfolio overview of FDR management" />
      <div className="mb-4"><DemoWarning /></div>

      {/* Top metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total FDRs', value: overview?.total_fdrs, color: 'bg-blue-600' },
          { label: 'Total Value', value: formatCurrency(overview?.total_amount), color: 'bg-green-600' },
          { label: 'Expiring 30d', value: overview?.approaching_maturity_30d, color: 'bg-amber-600' },
          { label: 'Overdue', value: overview?.overdue_count, color: 'bg-red-600' },
        ].map(m => (
          <div key={m.label} className={`${m.color} text-white rounded-xl p-4`}>
            <div className="text-2xl font-bold">{m.value}</div>
            <div className="text-sm opacity-80 mt-1">{m.label}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Status distribution */}
        <Card className="p-5">
          <h2 className="font-semibold text-gray-700 mb-4">FDR Status Distribution</h2>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={statusChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {statusChartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Monthly submissions */}
        <Card className="p-5">
          <h2 className="font-semibold text-gray-700 mb-4">Monthly FDR Submissions</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={overview?.monthly_submissions ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="FDRs Submitted" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* By state */}
        <Card className="p-5">
          <h2 className="font-semibold text-gray-700 mb-4">FDRs by State (Top 8)</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={stateChartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={90} />
              <Tooltip />
              <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} name="FDRs" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* By bank */}
        <Card className="p-5">
          <h2 className="font-semibold text-gray-700 mb-4">FDRs by Bank</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={bankChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="FDRs" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Maturity timeline */}
      <Card>
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-700 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" /> Maturity Timeline
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">FDRs maturing in next 180 days or overdue within 30 days</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['FDR Number', 'Institution', 'Amount', 'Maturity Date', 'Status', 'Days'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {timeline.slice(0, 15).map((item: any) => (
                <tr key={item.fdr_id} className={`${item.is_overdue ? 'bg-red-50/30' : item.days_to_maturity <= 30 ? 'bg-amber-50/30' : ''}`}>
                  <td className="px-4 py-2.5 font-medium text-gray-800">{item.fdr_number}</td>
                  <td className="px-4 py-2.5 text-gray-600">{item.institution}</td>
                  <td className="px-4 py-2.5 font-medium">{formatCurrency(item.amount)}</td>
                  <td className="px-4 py-2.5 text-gray-500">{formatDate(item.maturity_date)}</td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${item.status === 'matured' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className={`px-4 py-2.5 font-bold ${item.is_overdue ? 'text-red-600' : item.days_to_maturity <= 30 ? 'text-orange-600' : 'text-gray-500'}`}>
                    {item.is_overdue ? `${Math.abs(item.days_to_maturity)}d overdue` : `${item.days_to_maturity}d`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </Layout>
  )
}
