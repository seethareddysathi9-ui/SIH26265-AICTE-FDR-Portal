export const FDR_STATUS_LABELS: Record<string, string> = {
  submitted: 'Submitted',
  under_review: 'Under Review',
  verified: 'Verified',
  discrepancy_found: 'Discrepancy Found',
  correction_pending: 'Correction Pending',
  active: 'Active',
  approaching_maturity: 'Approaching Maturity',
  matured: 'Matured',
  renewal_pending: 'Renewal Pending',
  renewed: 'Renewed',
  release_requested: 'Release Requested',
  release_approved: 'Release Approved',
  released: 'Released',
  rejected: 'Rejected',
}

export const STATUS_COLORS: Record<string, string> = {
  submitted: 'bg-blue-100 text-blue-800',
  under_review: 'bg-yellow-100 text-yellow-800',
  verified: 'bg-green-100 text-green-800',
  active: 'bg-green-100 text-green-800',
  discrepancy_found: 'bg-red-100 text-red-800',
  correction_pending: 'bg-orange-100 text-orange-800',
  approaching_maturity: 'bg-amber-100 text-amber-800',
  matured: 'bg-indigo-100 text-indigo-800',
  renewal_pending: 'bg-pink-100 text-pink-800',
  renewed: 'bg-emerald-100 text-emerald-800',
  release_requested: 'bg-teal-100 text-teal-800',
  release_approved: 'bg-teal-100 text-teal-800',
  released: 'bg-gray-100 text-gray-700',
  rejected: 'bg-red-100 text-red-900',
}

export const SEVERITY_COLORS: Record<string, string> = {
  high: 'bg-red-100 text-red-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-green-100 text-green-800',
}

export function formatCurrency(amount: number): string {
  if (!amount) return '₹0'
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`
  return `₹${amount.toLocaleString('en-IN')}`
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  })
}

export function daysFromNow(date: string | null | undefined): number | null {
  if (!date) return null
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86400000)
}

export function getPriorityLevel(score: number): { label: string; color: string; border: string } {
  if (score >= 70) return { label: 'Critical', color: 'text-red-700 bg-red-100', border: 'border-l-red-500' }
  if (score >= 50) return { label: 'High', color: 'text-orange-700 bg-orange-100', border: 'border-l-orange-500' }
  if (score >= 30) return { label: 'Medium', color: 'text-amber-700 bg-amber-100', border: 'border-l-amber-500' }
  return { label: 'Low', color: 'text-green-700 bg-green-100', border: 'border-l-green-500' }
}

export const DOC_TYPE_LABELS: Record<string, string> = {
  fdr_certificate: 'FDR Certificate',
  lien_letter: 'Lien Letter',
  release_form: 'Release Request Form',
  compliance_clearance: 'Compliance Clearance',
  bank_statement: 'Bank Statement',
  other: 'Other Document',
}
