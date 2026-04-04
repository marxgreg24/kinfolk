interface BadgeProps {
  status: 'active' | 'suspended' | 'pending' | 'conflicted' | 'approved' | 'rejected' | string
  label?: string
}

const colorMap: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  approved: 'bg-green-100 text-green-800',
  suspended: 'bg-red-100 text-red-800',
  rejected: 'bg-red-100 text-red-800',
  pending: 'bg-yellow-100 text-yellow-800',
  conflicted: 'bg-orange-100 text-orange-800',
}

const Badge = ({ status, label }: BadgeProps) => {
  const colorClass = colorMap[status] ?? 'bg-gray-100 text-gray-800'
  const displayText = label ?? status.charAt(0).toUpperCase() + status.slice(1)

  return (
    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${colorClass}`}>
      {displayText}
    </span>
  )
}

export default Badge
