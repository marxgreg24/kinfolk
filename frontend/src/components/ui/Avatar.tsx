interface AvatarProps {
  src?: string
  name: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizeMap = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-12 h-12 text-sm',
  lg: 'w-16 h-16 text-base',
  xl: 'w-24 h-24 text-xl',
}

const getInitials = (name: string): string => {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('')
}

const Avatar = ({ src, name, size = 'md', className = '' }: AvatarProps) => {
  const sizeClass = sizeMap[size]
  const base = `rounded-full object-cover ${sizeClass} ${className}`

  if (src && src.trim() !== '') {
    return (
      <img
        src={src}
        alt={name}
        className={base}
      />
    )
  }

  return (
    <div
      className={`${base} bg-primary text-white font-bold flex items-center justify-center flex-shrink-0`}
      aria-label={name}
    >
      {getInitials(name)}
    </div>
  )
}

export default Avatar
