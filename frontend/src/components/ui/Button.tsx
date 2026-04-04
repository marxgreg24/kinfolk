import React from 'react'
import Spinner from './Spinner'

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  disabled?: boolean
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  children: React.ReactNode
  className?: string
}

const variantMap = {
  primary: 'bg-primary text-white hover:bg-yellow-600',
  secondary: 'bg-secondary text-white hover:bg-amber-800',
  outline: 'border-2 border-primary text-primary hover:bg-primary hover:text-white',
  danger: 'bg-red-600 text-white hover:bg-red-700',
}

const sizeMap = {
  sm: 'py-1 px-3 text-sm',
  md: 'py-2 px-4 text-base',
  lg: 'py-3 px-6 text-lg',
}

const Button = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  onClick,
  type = 'button',
  children,
  className = '',
}: ButtonProps) => {
  const isDisabled = disabled || isLoading

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`
        inline-flex items-center justify-center gap-2
        rounded-lg font-merriweather transition-colors duration-200
        focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
        disabled:opacity-60 disabled:cursor-not-allowed
        ${variantMap[variant]}
        ${sizeMap[size]}
        ${className}
      `.trim()}
    >
      {isLoading && <Spinner size="sm" />}
      {children}
    </button>
  )
}

export default Button
