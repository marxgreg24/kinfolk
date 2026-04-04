import React from 'react'
import Spinner from './Spinner'

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  disabled?: boolean
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  children: React.ReactNode
  className?: string
}

const variantMap = {
  primary:   'bg-primary text-white hover:bg-yellow-500 shadow-sm hover:shadow-md',
  secondary: 'bg-secondary text-white hover:bg-amber-700 shadow-sm hover:shadow-md',
  outline:   'border border-gray-200 text-gray-700 bg-white hover:border-primary hover:text-primary hover:bg-primary/5',
  danger:    'bg-red-600 text-white hover:bg-red-700 shadow-sm',
  ghost:     'text-gray-500 hover:text-primary hover:bg-primary/5',
}

const sizeMap = {
  sm: 'py-1.5 px-3.5 text-sm',
  md: 'py-2.5 px-5 text-sm',
  lg: 'py-3.5 px-7 text-base',
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
        rounded-xl font-merriweather font-medium
        transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-1
        disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none
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
