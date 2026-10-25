import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getFDRs } from '../../api/services'
import Layout from '../../components/Layout'
import { PageHeader, LoadingSpinner, EmptyState, DemoWarning } from '../../components/ui'
import { StatusBadge, PriorityBadge } from '../../components/StatusBadge'
import { formatCurrency, formatDate, daysFromNow } from '../../utils/helpers'
import { Search, Filter, FileText, AlertTriangle } from 'lucide-react'

const STATUSES = ['submitted','under_review','discrepancy_found','correction_pending','approaching_maturity','matured','release_requested','renewal_pending']

export default function CaseQueue() {
  const [fdrs, setFdrs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const params: any = {}
    if (searchParams.get('priority')) params.priority_min = searchParams.get('priority')
    getFDRs(params).then(r => setFdrs(r.data)).finally(() => setLoading(false))
  }, [])

  const filtered = fdrs.filter(f => {
    const matchSearch = !search ||
      f.fdr_number.toLowerCase().includes(search.toLowerCase()) ||
      f.bank_name?.toLowerCase().includes(search.toLowerCase())
    const matchStatus = !statusFilter || f.status === statusFilter
    return matchSearch && matchStatus
  })

  if (loading) return <Layout><LoadingSpinner /></Layout>

  return (
    <Layout>
      <PageHeader title="Case Queue" subtitle={`${filtered.length} cases — sorted by priority`} />
      <div className="mb-4"><DemoWarning /></div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2 flex-1 min-w-48 border border-gray-200 rounded-lg px-3 py-2">
          <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            className="flex-1 text-sm outline-none" placeholder="Search FDR number, bank..." />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Statuses</option>
          {STATUSES.map(s => (
            <option key={s} value={s}>{s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
          ))}
        </select>
        <span className="text-xs text-gray-400 flex items-center gap-1">
          <Filter className="w-3 h-3" /> Sorted by priority score
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Priority', 'FDR Number', 'Bank', 'Amount', 'Maturity', 'Status', 'Action'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr><td colSpan={7}>
                <EmptyState title="No cases in queue" subtitle="All cases are processed or no FDRs match your filters" icon={FileText} />
              </td></tr>
            ) : filtered.map(fdr => {
              const days = daysFromNow(fdr.maturity_date)
              return (
                <tr key={fdr.id} className={`hover:bg-gray-50 transition-colors ${fdr.priority_score >= 70 ? 'bg-red-50/30' : fdr.priority_score >= 50 ? 'bg-orange-50/30' : ''}`}>
                  <td className="px-4 py-3">
                    <PriorityBadge score={fdr.priority_score} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800">{fdr.fdr_number}</div>
                    {fdr.discrepancy_count > 0 && (
                      <div className="flex items-center gap-1 text-xs text-red-600 mt-0.5">
                        <AlertTriangle className="w-3 h-3" /> {fdr.discrepancy_count} discrepancy
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{fdr.bank_name}</td>
                  <td className="px-4 py-3 font-medium">{formatCurrency(fdr.amount)}</td>
                  <td className="px-4 py-3">
                    <div className={days !== null && days < 0 ? 'text-red-600 font-semibold' : days !== null && days <= 30 ? 'text-orange-600 font-semibold' : 'text-gray-500'}>
                      {formatDate(fdr.maturity_date)}
                    </div>
                    {days !== null && days <= 90 && (
                      <div className="text-xs text-gray-400">{days < 0 ? `${Math.abs(days)}d overdue` : `${days}d`}</div>
                    )}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={fdr.status} /></td>
                  <td className="px-4 py-3">
                    <Link to={`/officer/fdr/${fdr.id}`} className="text-blue-600 hover:underline text-xs font-medium">Review →</Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
          Showing {filtered.length} of {fdrs.length} cases
        </div>
      </div>
    </Layout>
  )
}
