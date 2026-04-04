interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  fullScreen?: boolean
}

const sizeMap = {
  sm: 'w-4 h-4',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
}

const Spinner = ({ size = 'md', fullScreen = false }: SpinnerProps) => {
  const spinner = (
    <div
      className={`${sizeMap[size]} border-4 border-primary border-t-transparent rounded-full animate-spin`}
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
