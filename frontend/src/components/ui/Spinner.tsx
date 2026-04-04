interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  fullScreen?: boolean
}

const sizeMap = {
  sm: 'w-6 h-6',
  md: 'w-10 h-10',
  lg: 'w-16 h-16',
}

const Spinner = ({ size = 'md', fullScreen = false }: SpinnerProps) => {
  const spinner = (
    <img
      src="/logo.png"
      alt="Loading…"
      className={`${sizeMap[size]} object-contain animate-pulse`}
    />
  )

  if (fullScreen) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        {spinner}
      </div>
    )
  }

  return spinner
}

export default Spinner
