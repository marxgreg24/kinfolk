import { Link } from 'react-router-dom'
import KinfolkWordmark from '@/components/ui/KinfolkWordmark'

const NotFoundPage = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-[#fafaf8] px-6 text-center">
    {/* Decorative top rule */}
    <div className="h-[2px] w-24 bg-gradient-to-r from-transparent via-primary to-transparent mb-10" />

    <KinfolkWordmark uppercase className="font-merriweather font-bold text-2xl tracking-[0.12em] text-gray-900 mb-1" />
    <p className="text-[9px] font-merriweather tracking-[0.3em] text-secondary uppercase mb-12">
      Preserve Your Roots
    </p>

    <p className="text-8xl font-merriweather font-bold text-primary/20 leading-none mb-4">404</p>
    <h1 className="text-2xl font-merriweather font-bold text-gray-900 mb-3">Page not found</h1>
    <p className="text-sm font-merriweather text-gray-400 max-w-sm mb-10">
      The page you're looking for doesn't exist or may have been moved.
    </p>

    <Link
      to="/"
      className="inline-flex items-center gap-2 bg-primary text-white text-sm font-merriweather font-medium px-6 py-3 rounded-full hover:bg-primary/90 transition-colors"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
        <path d="M19 12H5M12 5l-7 7 7 7" />
      </svg>
      Go home
    </Link>

    {/* Decorative bottom rule */}
    <div className="h-[2px] w-24 bg-gradient-to-r from-transparent via-primary/30 to-transparent mt-12" />
  </div>
)

export default NotFoundPage
