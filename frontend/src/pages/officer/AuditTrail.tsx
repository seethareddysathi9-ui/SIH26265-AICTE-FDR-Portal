import { useEffect, useState } from 'react'
import { getAuditLogs } from '../../api/services'
import Layout from '../../components/Layout'
import { PageHeader, LoadingSpinner, EmptyState, DemoWarning } from '../../components/ui'
import { formatDate } from '../../utils/helpers'
import { Activity, Shield } from 'lucide-react'

const ACTION_COLORS: Record<string, string> = {
  FDR_SUBMITTED: 'bg-blue-100 text-blue-700',
  STATUS_UPDATED: 'bg-amber-100 text-amber-700',
  SCRUTINY_ADDED: 'bg-purple-100 text-purple-700',
  DISCREPANCY_DETECTED: 'bg-red-100 text-red-700',
  RELEASE_REQUESTED: 'bg-teal-100 text-teal-700',
  DOCUMENT_UPLOADED: 'bg-green-100 text-green-700',
}

export default function AuditTrail() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [fdrFilter, setFdrFilter] = useState('')

  useEffect(() => {
    getAuditLogs({ limit: 100 }).then(r => setLogs(r.data)).finally(() => setLoading(false))
  }, [])

  const filtered = fdrFilter ? logs.filter(l => l.fdr_id == fdrFilter) : logs

  if (loading) return <Layout><LoadingSpinner /></Layout>

  return (
    <Layout>
      <PageHeader title="Audit Trail" subtitle="Immutable history of all system actions" />
      <div className="mb-4"><DemoWarning /></div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-4 text-sm text-amber-800 flex items-start gap-2">
        <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <p>The audit trail records all important actions. In a production system, this log would be cryptographically signed and tamper-evident. This prototype shows a simplified version for demonstration.</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex gap-3 items-center">
        <label className="text-sm text-gray-600">Filter by FDR ID:</label>
        <input type="number" value={fdrFilter} onChange={e => setFdrFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="FDR ID" />
        {fdrFilter && <button onClick={() => setFdrFilter('')} className="text-xs text-gray-400 hover:text-gray-600">Clear</button>}
        <span className="text-xs text-gray-400 ml-auto">{filtered.length} records</span>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['#', 'Timestamp', 'Action', 'FDR ID', 'User ID', 'Details'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 font-mono text-xs">
            {filtered.length === 0
              ? <tr><td colSpan={6}><EmptyState title="No audit logs" icon={Activity} /></td></tr>
              : filtered.map((log, i) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 text-gray-400">{log.id}</td>
                  <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap">{formatDate(log.created_at)}</td>
                  <td className="px-4 py-2.5">
                    <span className={`px-2 py-0.5 rounded font-semibold text-xs ${ACTION_COLORS[log.action] ?? 'bg-gray-100 text-gray-600'}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-gray-600">{log.fdr_id ?? '—'}</td>
                  <td className="px-4 py-2.5 text-gray-600">{log.user_id ?? 'system'}</td>
                  <td className="px-4 py-2.5 text-gray-500 max-w-xs truncate font-sans">{log.details || '—'}</td>
                </tr>
              ))}
          </tbody>
        </table>
        <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
          {filtered.length} audit records displayed · Real system would use immutable append-only storage
        </div>
      </div>
    </Layout>
  )
}
