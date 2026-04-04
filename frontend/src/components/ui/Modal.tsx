import React from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
}

const sizeMap = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
}

const Modal = ({ isOpen, onClose, title, children, size = 'md' }: ModalProps) => {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className={`
          bg-white rounded-xl shadow-xl p-6 w-full mx-4
          ${sizeMap[size]}
          transition-all duration-200 opacity-100 scale-100
        `.trim()}
        onClick={(e) => e.stopPropagation()}
      >
        {(title != null) && (
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold font-merriweather text-gray-900">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors text-xl leading-none"
              aria-label="Close modal"
            >
              &times;
            </button>
          </div>
        )}
        {title == null && (
          <div className="flex justify-end mb-2">
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors text-xl leading-none"
              aria-label="Close modal"
            >
              &times;
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  )
}

export default Modal
