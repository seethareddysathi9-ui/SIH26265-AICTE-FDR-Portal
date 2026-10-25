import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getFDR, uploadDocument, getReleaseReadiness } from '../../api/services'
import Layout from '../../components/Layout'
import { LoadingSpinner, Card, DemoWarning } from '../../components/ui'
import { StatusBadge, SeverityBadge, PriorityBadge } from '../../components/StatusBadge'
import { formatCurrency, formatDate, daysFromNow, DOC_TYPE_LABELS } from '../../utils/helpers'
import toast from 'react-hot-toast'
import { FileText, Upload, CheckCircle, AlertTriangle, Clock, ArrowLeft, Info } from 'lucide-react'

export default function InstitutionFDRDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [fdr, setFdr] = useState<any>(null)
  const [readiness, setReadiness] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [docType, setDocType] = useState('fdr_certificate')
  const [file, setFile] = useState<File | null>(null)

  const loadData = () => {
    Promise.all([getFDR(Number(id)), getReleaseReadiness(Number(id))])
      .then(([f, r]) => { setFdr(f.data); setReadiness(r.data) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadData() }, [id])

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    try {
      await uploadDocument(Number(id), docType, file)
      toast.success('Document uploaded successfully')
      setFile(null)
      loadData()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  if (loading) return <Layout><LoadingSpinner /></Layout>
  if (!fdr) return <Layout><div className="text-center py-16 text-gray-500">FDR not found</div></Layout>

  const days = daysFromNow(fdr.maturity_date)

  return (
    <Layout>
      <div className="mb-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <DemoWarning />
      </div>

      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-800">{fdr.fdr_number}</h1>
            <p className="text-sm text-gray-500 mt-1">{fdr.bank_name} — {fdr.bank_branch}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              <StatusBadge status={fdr.status} />
              <PriorityBadge score={fdr.priority_score} />
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-800">{formatCurrency(fdr.amount)}</div>
            <div className="text-sm text-gray-500 mt-1">Matures: {formatDate(fdr.maturity_date)}</div>
            {days !== null && (
              <div className={`text-sm font-semibold mt-1 ${days < 0 ? 'text-red-600' : days <= 30 ? 'text-orange-600' : 'text-gray-400'}`}>
                {days < 0 ? `${Math.abs(days)} days overdue` : `${days} days remaining`}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {/* Left: Details + Discrepancies */}
        <div className="md:col-span-2 space-y-5">
          {/* FDR Details */}
          <Card>
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-700">FDR Details</h2>
            </div>
            <div className="px-5 py-4 grid grid-cols-2 gap-4 text-sm">
              {[
                ['FDR Number', fdr.fdr_number],
                ['Bank', fdr.bank_name],
                ['Branch', fdr.bank_branch],
                ['IFSC', fdr.bank_ifsc || '—'],
                ['Account No.', fdr.account_number || '—'],
                ['Amount', formatCurrency(fdr.amount)],
                ['Issue Date', formatDate(fdr.issue_date)],
                ['Maturity Date', formatDate(fdr.maturity_date)],
                ['Purpose', fdr.purpose || '—'],
                ['Submitted', formatDate(fdr.created_at)],
              ].map(([label, value]) => (
                <div key={label}>
                  <div className="text-xs text-gray-400 font-medium">{label}</div>
                  <div className="text-gray-800 mt-0.5">{value}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* Priority Reasons */}
          {fdr.priority_reasons?.length > 0 && (
            <Card>
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-700 flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-500" /> Priority Reasons
                </h2>
              </div>
              <div className="px-5 py-4 space-y-2">
                {fdr.priority_reasons.map((r: string, i: number) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-orange-500 mt-0.5">•</span> {r}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Discrepancies */}
          {fdr.discrepancies?.length > 0 && (
            <Card>
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <h2 className="font-semibold text-gray-700">Discrepancies Found ({fdr.discrepancies.length})</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {fdr.discrepancies.map((d: any) => (
                  <div key={d.id} className={`px-5 py-4 ${d.is_resolved ? 'opacity-60' : ''}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <SeverityBadge severity={d.severity} />
                      <span className="text-sm font-medium text-gray-700">{d.type?.replace(/_/g, ' ')}</span>
                      {d.is_resolved && <span className="text-xs text-green-600 font-medium">✓ Resolved</span>}
                    </div>
                    <p className="text-sm text-gray-600">{d.description}</p>
                    {d.submitted_value && (
                      <div className="mt-2 text-xs text-gray-500 flex gap-4">
                        <span>Submitted: <strong className="text-gray-700">{d.submitted_value}</strong></span>
                        {d.expected_value && <span>Expected: <strong className="text-gray-700">{d.expected_value}</strong></span>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Scrutiny History */}
          {fdr.scrutiny_records?.length > 0 && (
            <Card>
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-700">Officer Review History</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {fdr.scrutiny_records.map((s: any) => (
                  <div key={s.id} className="px-5 py-3">
                    <div className="text-sm font-medium text-gray-700">{s.action}</div>
                    <div className="text-sm text-gray-600 mt-1">{s.observations}</div>
                    <div className="text-xs text-gray-400 mt-1">{formatDate(s.created_at)}</div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Right: Upload + Readiness */}
        <div className="space-y-5">
          {/* Upload Document */}
          <Card>
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-700 flex items-center gap-2">
                <Upload className="w-4 h-4" /> Upload Document
              </h2>
            </div>
            <div className="px-5 py-4 space-y-3">
              <select value={docType} onChange={e => setDocType(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {Object.entries(DOC_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <input type="file" accept=".pdf,.jpg,.jpeg,.png"
                onChange={e => setFile(e.target.files?.[0] || null)}
                className="w-full text-sm text-gray-600 file:mr-3 file:py-1 file:px-3 file:border file:border-gray-300 file:rounded file:text-xs file:text-gray-600 file:bg-gray-50" />
              <button onClick={handleUpload} disabled={!file || uploading}
                className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>

            {/* Existing docs */}
            {fdr.documents?.length > 0 && (
              <div className="px-5 pb-4">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Uploaded Documents</p>
                {fdr.documents.map((d: any) => (
                  <div key={d.id} className="flex items-center justify-between py-1.5 text-sm">
                    <span className="text-gray-700 truncate">{DOC_TYPE_LABELS[d.doc_type] || d.doc_type}</span>
                    {d.is_verified
                      ? <span className="text-green-600 text-xs font-medium">✓ Verified</span>
                      : <span className="text-gray-400 text-xs">Pending</span>}
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Release Readiness */}
          {readiness && (
            <Card>
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-700 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-500" /> Release Readiness
                </h2>
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{readiness.completed_items}/{readiness.total_items} items</span>
                    <span>{Math.round(readiness.completed_items / readiness.total_items * 100)}%</span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${readiness.completed_items / readiness.total_items * 100}%` }} />
                  </div>
                </div>
              </div>
              <div className="px-5 py-4 space-y-2">
                {readiness.checklist?.map((item: any, i: number) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <span className={`mt-0.5 ${item.status ? 'text-green-500' : 'text-gray-300'}`}>
                      {item.status ? '✓' : '○'}
                    </span>
                    <div>
                      <span className={item.status ? 'text-gray-700' : 'text-gray-500'}>{item.item}</span>
                      {item.required && !item.status && <span className="text-red-500 text-xs ml-1">*required</span>}
                      {item.note && <p className="text-xs text-gray-400 italic mt-0.5">{item.note}</p>}
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-5 pb-4 text-xs text-gray-400 italic border-t border-gray-100 pt-3">
                {readiness.disclaimer}
              </div>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  )
}
