import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createFDR, getMyProfile, createProfile } from '../../api/services'
import Layout from '../../components/Layout'
import { PageHeader, Card, DemoWarning } from '../../components/ui'
import toast from 'react-hot-toast'
import { FileText, Building2, Send } from 'lucide-react'

export default function SubmitFDR() {
  const navigate = useNavigate()
  const [step, setStep] = useState<'profile'|'fdr'>('fdr')
  const [loading, setLoading] = useState(false)

  const [fdrData, setFdrData] = useState({
    fdr_number: '', bank_name: '', bank_branch: '', bank_ifsc: '',
    account_number: '', amount: '', issue_date: '', maturity_date: '',
    purpose: 'Security deposit for AICTE program approval', notes: ''
  })

  const [profileData] = useState({
    name: '', aicte_id: '', state: '', district: '',
    institution_type: 'Engineering College', contact_person: ''
  })

  const handleFDRSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      // Ensure profile exists
      try {
        await getMyProfile()
      } catch {
        toast.error('Please complete your institution profile first. Contact admin or use a demo account.')
        setLoading(false)
        return
      }

      const payload = {
        ...fdrData,
        amount: parseFloat(fdrData.amount),
        issue_date: new Date(fdrData.issue_date).toISOString(),
        maturity_date: new Date(fdrData.maturity_date).toISOString(),
      }
      const res = await createFDR(payload)
      toast.success('FDR submitted successfully! Discrepancy checks are running.')
      navigate(`/institution/fdr/${res.data.id}`)
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Submission failed')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
  const labelClass = "block text-sm font-medium text-gray-700 mb-1"

  const BANKS = ['State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Punjab National Bank', 'Bank of Baroda', 'Canara Bank', 'Axis Bank', 'Union Bank of India', 'Bank of India', 'Central Bank of India']

  return (
    <Layout>
      <PageHeader title="Submit FDR" subtitle="Submit a Fixed Deposit Receipt for AICTE verification" />
      <div className="mb-4"><DemoWarning /></div>

      <Card className="max-w-3xl">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg"><FileText className="w-5 h-5 text-blue-600" /></div>
          <div>
            <h2 className="font-semibold text-gray-800">FDR Details</h2>
            <p className="text-xs text-gray-500">Enter the details exactly as shown on the FDR document</p>
          </div>
        </div>

        <form onSubmit={handleFDRSubmit} className="px-6 py-5 space-y-5">
          {/* FDR Info */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>FDR Number *</label>
              <input required value={fdrData.fdr_number} onChange={e => setFdrData(p => ({ ...p, fdr_number: e.target.value }))}
                className={inputClass} placeholder="e.g. FDR-SBI-2024-001" />
            </div>
            <div>
              <label className={labelClass}>Bank Name *</label>
              <select required value={fdrData.bank_name} onChange={e => setFdrData(p => ({ ...p, bank_name: e.target.value }))}
                className={inputClass}>
                <option value="">Select bank</option>
                {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Bank Branch *</label>
              <input required value={fdrData.bank_branch} onChange={e => setFdrData(p => ({ ...p, bank_branch: e.target.value }))}
                className={inputClass} placeholder="e.g. Main Branch, Hyderabad" />
            </div>
            <div>
              <label className={labelClass}>IFSC Code</label>
              <input value={fdrData.bank_ifsc} onChange={e => setFdrData(p => ({ ...p, bank_ifsc: e.target.value }))}
                className={inputClass} placeholder="e.g. SBIN0000500" />
            </div>
            <div>
              <label className={labelClass}>Account Number</label>
              <input value={fdrData.account_number} onChange={e => setFdrData(p => ({ ...p, account_number: e.target.value }))}
                className={inputClass} placeholder="FDR account number" />
            </div>
            <div>
              <label className={labelClass}>Amount (₹) *</label>
              <input required type="number" min="1" value={fdrData.amount} onChange={e => setFdrData(p => ({ ...p, amount: e.target.value }))}
                className={inputClass} placeholder="e.g. 1000000" />
              {fdrData.amount && <p className="text-xs text-gray-400 mt-0.5">
                ₹{Number(fdrData.amount).toLocaleString('en-IN')}
              </p>}
            </div>
            <div>
              <label className={labelClass}>Issue Date *</label>
              <input required type="date" value={fdrData.issue_date} onChange={e => setFdrData(p => ({ ...p, issue_date: e.target.value }))}
                className={inputClass} max={new Date().toISOString().split('T')[0]} />
            </div>
            <div>
              <label className={labelClass}>Maturity Date *</label>
              <input required type="date" value={fdrData.maturity_date} onChange={e => setFdrData(p => ({ ...p, maturity_date: e.target.value }))}
                className={inputClass} />
            </div>
          </div>

          <div>
            <label className={labelClass}>Purpose</label>
            <input value={fdrData.purpose} onChange={e => setFdrData(p => ({ ...p, purpose: e.target.value }))}
              className={inputClass} placeholder="Purpose of the security deposit" />
          </div>
          <div>
            <label className={labelClass}>Notes (Optional)</label>
            <textarea value={fdrData.notes} onChange={e => setFdrData(p => ({ ...p, notes: e.target.value }))}
              className={inputClass} rows={3} placeholder="Any additional information..." />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-xs text-blue-800">
            <strong>📋 What happens next:</strong>
            <ul className="mt-2 space-y-1 list-disc list-inside">
              <li>System will automatically check for duplicate FDR numbers</li>
              <li>OCR analysis will be triggered when you upload the FDR document</li>
              <li>An AICTE officer will be assigned for verification</li>
              <li>You will be notified of any discrepancies found</li>
            </ul>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading}
              className="flex items-center gap-2 bg-[#003366] text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-900 disabled:opacity-60 transition-colors">
              <Send className="w-4 h-4" />
              {loading ? 'Submitting...' : 'Submit FDR'}
            </button>
            <button type="button" onClick={() => navigate(-1)}
              className="px-4 py-2.5 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </form>
      </Card>
    </Layout>
  )
}
