import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getFDR, addScrutiny, updateFDRStatus, getReleaseReadiness } from '../../api/services'
import Layout from '../../components/Layout'
import { LoadingSpinner, Card, DemoWarning } from '../../components/ui'
import { StatusBadge, SeverityBadge, PriorityBadge } from '../../components/StatusBadge'
import { formatCurrency, formatDate, daysFromNow, DOC_TYPE_LABELS, FDR_STATUS_LABELS } from '../../utils/helpers'
import toast from 'react-hot-toast'
import { ArrowLeft, AlertTriangle, CheckCircle, Info, Shield, FileText, Clock } from 'lucide-react'

const STATUS_TRANSITIONS: Record<string, string[]> = {
  submitted: ['under_review', 'discrepancy_found'],
  under_review: ['verified', 'discrepancy_found', 'active'],
  verified: ['active', 'discrepancy_found'],
  discrepancy_found: ['correction_pending', 'under_review'],
  correction_pending: ['under_review'],
  active: ['approaching_maturity', 'matured'],
  approaching_maturity: ['matured', 'renewal_pending'],
  matured: ['renewal_pending', 'release_requested'],
  renewal_pending: ['renewed'],
  release_requested: ['release_approved', 'rejected'],
  release_approved: ['released'],
}

export default function OfficerFDRDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [fdr, setFdr] = useState<any>(null)
  const [readiness, setReadiness] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [scrutinyForm, setScrutinyForm] = useState({ action: '', observations: '', new_status: '' })
  const [submitting, setSubmitting] = useState(false)
  const [tab, setTab] = useState<'details'|'discrepancies'|'scrutiny'|'readiness'>('details')

  const loadData = () => {
    Promise.all([getFDR(Number(id)), getReleaseReadiness(Number(id))])
      .then(([f, r]) => { setFdr(f.data); setReadiness(r.data) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadData() }, [id])

  const handleScrutiny = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await addScrutiny(Number(id), scrutinyForm)
      toast.success('Scrutiny record added')
      setScrutinyForm({ action: '', observations: '', new_status: '' })
      loadData()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to add scrutiny')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <Layout><LoadingSpinner /></Layout>
  if (!fdr) return <Layout><div className="py-16 text-center text-gray-500">FDR not found</div></Layout>

  const days = daysFromNow(fdr.maturity_date)
  const transitions = STATUS_TRANSITIONS[fdr.status?.value ?? fdr.status] ?? []

  const tabs = [
    { id: 'details', label: 'Details' },
    { id: 'discrepancies', label: `Discrepancies (${fdr.discrepancies?.length ?? 0})` },
    { id: 'scrutiny', label: 'Scrutiny' },
    { id: 'readiness', label: 'Release Readiness' },
  ]

  return (
    <Layout>
      <div className="mb-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Queue
        </button>
        <DemoWarning />
      </div>

      {/* Header card */}
      <div className={`bg-white rounded-xl border-l-4 border border-gray-200 p-5 mb-5 ${fdr.priority_score >= 70 ? 'border-l-red-500' : fdr.priority_score >= 50 ? 'border-l-orange-500' : 'border-l-blue-400'}`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-5 h-5 text-blue-700" />
              <h1 className="text-xl font-bold text-gray-800">{fdr.fdr_number}</h1>
            </div>
            <p className="text-sm text-gray-500">{fdr.bank_name} — {fdr.bank_branch}</p>
            {fdr.institution && (
              <p className="text-sm text-gray-600 mt-1">
                🏛️ {fdr.institution.name} &nbsp;·&nbsp; {fdr.institution.state}
              </p>
            )}
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

        {/* Priority reasons */}
        {fdr.priority_reasons?.length > 0 && (
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
            <p className="text-xs font-semibold text-amber-800 mb-1">WHY THIS IS PRIORITY:</p>
            {fdr.priority_reasons.map((r: string, i: number) => (
              <div key={i} className="text-xs text-amber-700 flex items-start gap-1.5">
                <span>▸</span> {r}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-5">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === t.id ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        <div className="md:col-span-2">
          {/* Details Tab */}
          {tab === 'details' && (
            <Card>
              <div className="px-5 py-4 border-b border-gray-100"><h2 className="font-semibold text-gray-700">FDR Information</h2></div>
              <div className="px-5 py-4 grid grid-cols-2 gap-4 text-sm">
                {[
                  ['FDR Number', fdr.fdr_number],
                  ['Institution', fdr.institution?.name ?? '—'],
                  ['AICTE ID', fdr.institution?.aicte_id ?? '—'],
                  ['State', fdr.institution?.state ?? '—'],
                  ['Bank', fdr.bank_name],
                  ['Branch', fdr.bank_branch],
                  ['IFSC', fdr.bank_ifsc || '—'],
                  ['Account No.', fdr.account_number || '—'],
                  ['Amount', formatCurrency(fdr.amount)],
                  ['Issue Date', formatDate(fdr.issue_date)],
                  ['Maturity Date', formatDate(fdr.maturity_date)],
                  ['Purpose', fdr.purpose || '—'],
                  ['Parent FDR', fdr.parent_fdr_id ? `FDR #${fdr.parent_fdr_id}` : '—'],
                  ['Renewal Type', fdr.renewal_type || '—'],
                  ['Documents', `${fdr.document_count} uploaded`],
                  ['Submitted', formatDate(fdr.created_at)],
                ].map(([label, value]) => (
                  <div key={label}>
                    <div className="text-xs text-gray-400 font-medium">{label}</div>
                    <div className="text-gray-800 mt-0.5">{value}</div>
                  </div>
                ))}
              </div>
              {/* Documents list */}
              {fdr.documents?.length > 0 && (
                <div className="px-5 pb-5 border-t border-gray-100 pt-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Uploaded Documents</p>
                  <div className="space-y-2">
                    {fdr.documents.map((d: any) => (
                      <div key={d.id} className="flex items-center justify-between text-sm bg-gray-50 px-3 py-2 rounded-lg">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="text-gray-700">{DOC_TYPE_LABELS[d.doc_type] || d.doc_type}</div>
                            <div className="text-xs text-gray-400">{d.original_filename}</div>
                          </div>
                        </div>
                        <span className={`text-xs font-medium ${d.is_verified ? 'text-green-600' : 'text-gray-400'}`}>
                          {d.is_verified ? '✓ Verified' : 'Pending'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Discrepancies Tab */}
          {tab === 'discrepancies' && (
            <Card>
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" /> Discrepancies
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  A discrepancy is a reason for investigation, not proof of fraud. Officer review required.
                </p>
              </div>
              {fdr.discrepancies?.length === 0
                ? <div className="px-5 py-8 text-center text-sm text-gray-400">✅ No discrepancies detected</div>
                : (
                  <div className="divide-y divide-gray-100">
                    {fdr.discrepancies.map((d: any) => (
                      <div key={d.id} className={`px-5 py-4 ${d.is_resolved ? 'bg-green-50/40' : ''}`}>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <SeverityBadge severity={d.severity} />
                            <span className="text-sm font-semibold text-gray-700">{d.type?.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}</span>
                          </div>
                          {d.is_resolved && <span className="text-xs text-green-600 font-medium bg-green-100 px-2 py-0.5 rounded">✓ Resolved</span>}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{d.description}</p>
                        <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 rounded-lg p-3">
                          <div>
                            <span className="text-gray-400">Institution Submitted:</span>
                            <div className="font-medium text-gray-700 mt-0.5">{d.submitted_value || '—'}</div>
                          </div>
                          <div>
                            <span className="text-gray-400">Expected / Extracted:</span>
                            <div className="font-medium text-gray-700 mt-0.5">{d.expected_value || '—'}</div>
                          </div>
                        </div>
                        <div className="text-xs text-gray-400 mt-2">
                          Detected by: <strong>{d.detected_by}</strong>
                          {d.is_resolved && d.resolution_notes && <> &nbsp;·&nbsp; Resolution: {d.resolution_notes}</>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
            </Card>
          )}

          {/* Scrutiny Tab */}
          {tab === 'scrutiny' && (
            <div className="space-y-5">
              <Card>
                <div className="px-5 py-4 border-b border-gray-100">
                  <h2 className="font-semibold text-gray-700">Add Scrutiny Record</h2>
                </div>
                <form onSubmit={handleScrutiny} className="px-5 py-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Action Taken *</label>
                    <select required value={scrutinyForm.action} onChange={e => setScrutinyForm(p => ({ ...p, action: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Select action</option>
                      {['Document Review', 'OCR Verification', 'Bank Details Check', 'Amount Verification', 'Date Verification', 'Discrepancy Investigation', 'Lien Confirmation', 'Release Check', 'Compliance Verification'].map(a => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Observations *</label>
                    <textarea required value={scrutinyForm.observations} onChange={e => setScrutinyForm(p => ({ ...p, observations: e.target.value }))}
                      rows={4} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Record your observations, findings, and next steps..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Update Status</label>
                    <select value={scrutinyForm.new_status} onChange={e => setScrutinyForm(p => ({ ...p, new_status: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Keep current status</option>
                      {transitions.map(s => (
                        <option key={s} value={s}>{FDR_STATUS_LABELS[s] || s}</option>
                      ))}
                    </select>
                  </div>
                  <button type="submit" disabled={submitting}
                    className="flex items-center gap-2 bg-[#003366] text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-blue-900 disabled:opacity-60">
                    {submitting ? 'Saving...' : '💾 Save Scrutiny Record'}
                  </button>
                </form>
              </Card>

              {/* Scrutiny history */}
              <Card>
                <div className="px-5 py-4 border-b border-gray-100">
                  <h2 className="font-semibold text-gray-700">Review History</h2>
                </div>
                {fdr.scrutiny_records?.length === 0
                  ? <div className="px-5 py-6 text-center text-sm text-gray-400">No scrutiny records yet</div>
                  : (
                    <div className="divide-y divide-gray-100">
                      {fdr.scrutiny_records.map((s: any) => (
                        <div key={s.id} className="px-5 py-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-semibold text-gray-700 bg-blue-50 px-2 py-0.5 rounded">{s.action}</span>
                            <span className="text-xs text-gray-400">{formatDate(s.created_at)}</span>
                          </div>
                          <p className="text-sm text-gray-600">{s.observations}</p>
                        </div>
                      ))}
                    </div>
                  )}
              </Card>
            </div>
          )}

          {/* Release Readiness Tab */}
          {tab === 'readiness' && readiness && (
            <Card>
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-700 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-500" /> Release Readiness Checklist
                </h2>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex-1">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>{readiness.required_completed}/{readiness.required_total} required items complete</span>
                      <span className={readiness.is_ready_for_review ? 'text-green-600 font-semibold' : 'text-red-500'}>
                        {readiness.is_ready_for_review ? '✓ READY FOR REVIEW' : '✗ NOT READY'}
                      </span>
                    </div>
                    <div className="bg-gray-200 rounded-full h-2">
                      <div className={`h-2 rounded-full transition-all ${readiness.is_ready_for_review ? 'bg-green-500' : 'bg-amber-500'}`}
                        style={{ width: `${readiness.required_completed / readiness.required_total * 100}%` }} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-5 py-4 space-y-3">
                {readiness.checklist?.map((item: any, i: number) => (
                  <div key={i} className={`flex items-start gap-3 p-3 rounded-lg ${item.status ? 'bg-green-50' : item.required ? 'bg-red-50' : 'bg-gray-50'}`}>
                    <span className={`text-lg mt-0.5 ${item.status ? 'text-green-500' : 'text-gray-300'}`}>
                      {item.status ? '✓' : '○'}
                    </span>
                    <div className="flex-1">
                      <div className={`text-sm font-medium ${item.status ? 'text-green-700' : item.required ? 'text-red-700' : 'text-gray-600'}`}>
                        {item.item}
                        {item.required && <span className="text-xs ml-2 bg-red-100 text-red-600 px-1.5 py-0.5 rounded">Required</span>}
                      </div>
                      {item.note && <p className="text-xs text-gray-400 italic mt-0.5">{item.note}</p>}
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-5 pb-5 bg-amber-50 border-t border-amber-100 p-4 rounded-b-xl">
                <p className="text-xs text-amber-700 italic">{readiness.disclaimer}</p>
              </div>
            </Card>
          )}
        </div>

        {/* Right sidebar — quick actions */}
        <div className="space-y-4">
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick Status Update</h3>
            {transitions.length > 0 ? transitions.map(s => (
              <button key={s} onClick={async () => {
                try {
                  await updateFDRStatus(Number(id), { status: s })
                  toast.success(`Status updated to ${FDR_STATUS_LABELS[s] || s}`)
                  loadData()
                } catch { toast.error('Update failed') }
              }}
                className="w-full mb-2 text-left text-sm px-3 py-2 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 text-gray-700 transition-colors">
                → {FDR_STATUS_LABELS[s] || s}
              </button>
            )) : <p className="text-xs text-gray-400">No transitions available from current status</p>}
          </Card>

          <Card className="p-4 bg-blue-50/50">
            <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-blue-500" /> Data Trust Levels
            </h3>
            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" /> Institution-submitted (unverified)</div>
              <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" /> OCR-extracted (simulated)</div>
              <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" /> Officer-verified</div>
              <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-gray-300 flex-shrink-0" /> Bank-confirmed (mock/simulated)</div>
            </div>
            <p className="text-xs text-amber-600 mt-3 italic">⚠ OCR cannot prove FDR genuineness. Bank confirmation is simulated in this prototype.</p>
          </Card>
        </div>
      </div>
    </Layout>
  )
}
