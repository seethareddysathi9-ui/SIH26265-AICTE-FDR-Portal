import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getFDRs } from '../../api/services'
import Layout from '../../components/Layout'
import { PageHeader, LoadingSpinner, EmptyState, DemoWarning } from '../../components/ui'
import { StatusBadge, PriorityBadge } from '../../components/StatusBadge'
import { formatCurrency, formatDate, daysFromNow } from '../../utils/helpers'
import { FileText, Search, Filter, PlusCircle } from 'lucide-react'

export default function MyFDRs() {
  const [fdrs, setFdrs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    getFDRs().then(r => setFdrs(r.data)).finally(() => setLoading(false))
  }, [])

  const filtered = fdrs.filter(f => {
    const matchSearch = !search || f.fdr_number.toLowerCase().includes(search.toLowerCase()) || f.bank_name.toLowerCase().includes(search.toLowerCase())
    const matchStatus = !statusFilter || f.status === statusFilter
    return matchSearch && matchStatus
  })

  if (loading) return <Layout><LoadingSpinner /></Layout>

  return (
    <Layout>
      <PageHeader title="My FDRs" subtitle="All FDRs submitted by your institution">
        <Link to="/institution/submit" className="flex items-center gap-2 bg-[#003366] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-900">
          <PlusCircle className="w-4 h-4" /> Submit FDR
        </Link>
      </PageHeader>

      <div className="mb-4"><DemoWarning /></div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-48">
          <Search className="w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            className="flex-1 text-sm outline-none" placeholder="Search FDR number, bank..." />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Statuses</option>
          {['submitted','under_review','verified','active','discrepancy_found','approaching_maturity','matured','release_requested','released'].map(s => (
            <option key={s} value={s}>{s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['FDR Number', 'Bank', 'Amount', 'Issue Date', 'Maturity Date', 'Status', 'Action'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr><td colSpan={7}>
                <EmptyState title="No FDRs found" subtitle="Submit your first FDR to get started" icon={FileText} />
              </td></tr>
            ) : filtered.map(fdr => {
              const days = daysFromNow(fdr.maturity_date)
              return (
                <tr key={fdr.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-800">{fdr.fdr_number}</div>
                    {fdr.discrepancy_count > 0 && (
                      <div className="text-xs text-red-600 mt-0.5">⚠ {fdr.discrepancy_count} discrepancy</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{fdr.bank_name}</td>
                  <td className="px-4 py-3 font-medium">{formatCurrency(fdr.amount)}</td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(fdr.issue_date)}</td>
                  <td className="px-4 py-3">
                    <div className={days !== null && days < 0 ? 'text-red-600 font-semibold' : days !== null && days <= 30 ? 'text-orange-600 font-semibold' : 'text-gray-500'}>
                      {formatDate(fdr.maturity_date)}
                    </div>
                    {days !== null && days <= 90 && (
                      <div className="text-xs text-gray-400">{days < 0 ? `${Math.abs(days)}d overdue` : `in ${days}d`}</div>
                    )}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={fdr.status} /></td>
                  <td className="px-4 py-3">
                    <Link to={`/institution/fdr/${fdr.id}`} className="text-blue-600 hover:underline text-xs font-medium">View →</Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
          Showing {filtered.length} of {fdrs.length} FDRs
        </div>
      </div>
    </Layout>
  )
}
