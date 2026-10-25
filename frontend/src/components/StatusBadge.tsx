import { FDR_STATUS_LABELS, STATUS_COLORS } from '../utils/helpers'

export function StatusBadge({ status }: { status: string }) {
  const label = FDR_STATUS_LABELS[status] ?? status
  const color = STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-700'
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${color}`}>
      {label}
    </span>
  )
}

export function SeverityBadge({ severity }: { severity: string }) {
  const colors: Record<string, string> = {
    high: 'bg-red-100 text-red-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-green-100 text-green-800',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${colors[severity] ?? 'bg-gray-100 text-gray-700'}`}>
      {severity.toUpperCase()}
    </span>
  )
}

export function PriorityBadge({ score }: { score: number }) {
  let label = 'Low', color = 'bg-green-100 text-green-700'
  if (score >= 70) { label = 'Critical'; color = 'bg-red-100 text-red-700' }
  else if (score >= 50) { label = 'High'; color = 'bg-orange-100 text-orange-700' }
  else if (score >= 30) { label = 'Medium'; color = 'bg-amber-100 text-amber-700' }
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold ${color}`}>
      {label} ({score})
    </span>
  )
}
