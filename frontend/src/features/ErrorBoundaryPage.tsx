interface ErrorBoundaryPageProps {
  error?: Error
  onReset?: () => void
}

const ErrorBoundaryPage = ({ error, onReset }: ErrorBoundaryPageProps) => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-[#fafaf8] px-6 text-center">
    {/* Decorative top rule */}
    <div className="h-[2px] w-24 bg-gradient-to-r from-transparent via-primary to-transparent mb-10" />

    {/* Icon */}
    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8 text-primary">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    </div>

    <h1 className="text-2xl font-merriweather font-bold text-gray-900 mb-3">
      Something went wrong
    </h1>
    <p className="text-sm font-merriweather text-gray-400 max-w-sm mb-3">
      An unexpected error occurred. You can try refreshing the page or return to the homepage.
    </p>

    {error?.message && (
      <p className="text-xs font-mono text-gray-300 bg-gray-50 border border-gray-100 rounded-lg px-4 py-2 max-w-md mb-8 break-all">
        {error.message}
      </p>
    )}

    {!error?.message && <div className="mb-8" />}

    <div className="flex items-center gap-3">
      {onReset && (
        <button
          onClick={onReset}
          className="inline-flex items-center gap-2 border border-gray-200 text-gray-600 text-sm font-merriweather font-medium px-6 py-3 rounded-full hover:bg-gray-50 transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <polyline points="1 4 1 10 7 10" />
            <path d="M3.51 15a9 9 0 1 0 .49-4.58" />
          </svg>
          Try again
        </button>
      )}
      <a
        href="/"
        className="inline-flex items-center gap-2 bg-primary text-white text-sm font-merriweather font-medium px-6 py-3 rounded-full hover:bg-primary/90 transition-colors"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
        Go home
      </a>
    </div>

    {/* Decorative bottom rule */}
    <div className="h-[2px] w-24 bg-gradient-to-r from-transparent via-primary/30 to-transparent mt-12" />
  </div>
)

export default ErrorBoundaryPage
