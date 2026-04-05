import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import KinfolkWordmark from '@/components/ui/KinfolkWordmark'

interface LandingHeaderProps {
  onRegisterInterest: () => void
}

const LEFT_LINKS = [
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Features', href: '#features' },
]

const RIGHT_LINKS = [
  { label: 'Testimonials', href: '#testimonials' },
]

const LandingHeader = ({ onRegisterInterest }: LandingHeaderProps) => {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 1024) setMenuOpen(false) }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const handleNavClick = (href: string) => {
    setMenuOpen(false)
    setTimeout(() => {
      const el = document.querySelector(href)
      if (el) {
        const top = el.getBoundingClientRect().top + window.scrollY - 72
        window.scrollTo({ top, behavior: 'smooth' })
      }
    }, menuOpen ? 320 : 0)
  }

  return (
    <>
      {/* ── Main header ───────────────────────────────────────── */}
      <header
        className={`
          fixed top-0 left-0 right-0 z-40 transition-all duration-500
          ${scrolled
            ? 'bg-white border-b border-gray-100 shadow-[0_2px_20px_rgba(0,0,0,0.08)]'
            : 'bg-transparent border-b border-white/10'
          }
        `}
      >
        {/* ── Desktop: split nav ────────────────────────────────── */}
        <div className="hidden lg:block">
          {/* Top row — full-width split nav */}
          <div className="max-w-7xl mx-auto px-8 xl:px-12">
            <div className="flex items-stretch">

              {/* Left nav */}
              <nav className="flex items-center gap-0 flex-1" aria-label="Left navigation">
                {LEFT_LINKS.map((link, i) => (
                  <button
                    key={link.href}
                    onClick={() => handleNavClick(link.href)}
                    className={`group relative px-5 py-5 text-sm font-merriweather transition-colors duration-200 flex items-center gap-2 ${scrolled ? 'text-gray-500 hover:text-primary' : 'text-white/80 hover:text-white'}`}
                  >
                    {i > 0 && (
                      <span className={`select-none ${scrolled ? 'text-gray-200' : 'text-white/25'}`} aria-hidden="true">◆</span>
                    )}
                    {link.label}
                    <span className="absolute bottom-0 left-5 right-5 h-[2px] bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left" />
                  </button>
                ))}
              </nav>

              {/* Center — wordmark */}
              <div className={`flex flex-col items-center justify-center px-10 py-3 flex-shrink-0 border-x transition-colors duration-500 ${scrolled ? 'border-gray-100' : 'border-white/10'}`}>
                <Link to="/" aria-label="Kinfolk home" className="group flex flex-col items-center">
                  <KinfolkWordmark
                    uppercase
                    className={`font-merriweather font-bold text-2xl tracking-[0.12em] transition-colors duration-300 ${scrolled ? 'text-gray-900 group-hover:text-primary' : 'text-white group-hover:text-primary'}`}
                  />
                  <span className={`text-[9px] font-merriweather tracking-[0.35em] uppercase mt-0.5 transition-colors duration-300 ${scrolled ? 'text-secondary' : 'text-primary/70'}`}>
                    Preserve Your Roots
                  </span>
                </Link>
              </div>

              {/* Right nav + CTAs */}
              <nav className="flex items-center gap-0 flex-1 justify-end" aria-label="Right navigation">
                {RIGHT_LINKS.map((link) => (
                  <button
                    key={link.href}
                    onClick={() => handleNavClick(link.href)}
                    className={`group relative px-5 py-5 text-sm font-merriweather transition-colors duration-200 ${scrolled ? 'text-gray-500 hover:text-primary' : 'text-white/80 hover:text-white'}`}
                  >
                    {link.label}
                    <span className="absolute bottom-0 left-5 right-5 h-[2px] bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left" />
                  </button>
                ))}

                {/* Thin separator */}
                <span className={`mx-3 h-5 w-px ${scrolled ? 'bg-gray-200' : 'bg-white/20'}`} aria-hidden="true" />

                <Link
                  to="/login"
                  className={`px-4 py-5 text-sm font-merriweather transition-colors duration-200 ${scrolled ? 'text-gray-500 hover:text-primary' : 'text-white/80 hover:text-white'}`}
                >
                  Sign In
                </Link>

                <div className="pl-3 py-3">
                  <Link to="/signup">
                    <span className="inline-flex items-center gap-1.5 bg-primary hover:bg-yellow-500 text-white text-sm font-merriweather font-medium px-5 py-2 rounded-full transition-colors duration-200 shadow-sm">
                      Join Your Clan
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                        <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  </Link>
                </div>
              </nav>
            </div>
          </div>
        </div>

        {/* ── Mobile / tablet: compact bar ─────────────────────── */}
        <div className="lg:hidden">
          <div className="flex items-center justify-between px-4 sm:px-6 h-14">

            {/* Mobile logo — centered wordmark style */}
            <Link to="/" aria-label="Kinfolk home">
              <KinfolkWordmark
                uppercase
                className={`font-merriweather font-bold text-lg tracking-[0.08em] transition-colors duration-300 ${scrolled ? 'text-gray-900' : 'text-white'}`}
              />
            </Link>

            {/* Mobile right cluster */}
            <div className="flex items-center gap-3">
              <Link
                to="/signup"
                className="hidden sm:inline-flex items-center gap-1 bg-primary text-white text-xs font-merriweather font-medium px-4 py-2 rounded-full hover:bg-yellow-500 transition-colors"
              >
                Join
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>

              {/* Menu toggle */}
              <button
                onClick={() => setMenuOpen((o) => !o)}
                aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={menuOpen}
                className="flex flex-col items-end gap-[5px] w-8 h-8 justify-center"
              >
                <span
                  className={`block h-[1.5px] rounded-full transition-all duration-300 ${scrolled || menuOpen ? 'bg-gray-800' : 'bg-white'} ${menuOpen ? 'w-5 rotate-45 translate-y-[6.5px]' : 'w-5'}`}
                />
                <span
                  className={`block h-[1.5px] rounded-full transition-all duration-300 ${scrolled || menuOpen ? 'bg-gray-800' : 'bg-white'} ${menuOpen ? 'w-5 opacity-0' : 'w-3.5'}`}
                />
                <span
                  className={`block h-[1.5px] rounded-full transition-all duration-300 ${scrolled || menuOpen ? 'bg-gray-800' : 'bg-white'} ${menuOpen ? 'w-5 -rotate-45 -translate-y-[6.5px]' : 'w-4'}`}
                />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Mobile full-screen menu overlay ───────────────────── */}
      <div
        className={`
          fixed inset-0 z-30 lg:hidden transition-all duration-300
          ${menuOpen ? 'pointer-events-auto' : 'pointer-events-none'}
        `}
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300 ${menuOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />

        {/* Panel — slides down from header */}
        <div
          className={`
            absolute top-0 left-0 right-0 bg-white
            transition-transform duration-300 ease-in-out
            ${menuOpen ? 'translate-y-0' : '-translate-y-full'}
          `}
          style={{ paddingTop: '56px' }}
        >
          {/* Decorative gold top strip */}
          <div className="h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent" />

          <div className="px-6 py-8 flex flex-col">
            {/* Wordmark inside menu */}
            <div className="flex flex-col items-center mb-8">
              <KinfolkWordmark
                uppercase
                className="font-merriweather font-bold text-xl tracking-[0.15em] text-gray-900"
              />
              <span className="text-[8px] font-merriweather tracking-[0.35em] text-secondary uppercase mt-0.5">
                Preserve Your Roots
              </span>
            </div>

            {/* Nav links */}
            <nav className="flex flex-col gap-1 mb-6">
              {[...LEFT_LINKS, ...RIGHT_LINKS].map((link) => (
                <button
                  key={link.href}
                  onClick={() => handleNavClick(link.href)}
                  className="flex items-center justify-between px-4 py-3.5 rounded-xl text-gray-700 hover:bg-primary/5 hover:text-primary transition-colors duration-150 group"
                >
                  <span className="font-merriweather text-base">{link.label}</span>
                  <svg
                    width="14" height="14" viewBox="0 0 12 12" fill="none"
                    className="text-gray-300 group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-150"
                    aria-hidden="true"
                  >
                    <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              ))}
            </nav>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-6">
              <span className="flex-1 h-px bg-gray-100" />
              <span className="text-primary text-[9px]">◆</span>
              <span className="flex-1 h-px bg-gray-100" />
            </div>

            {/* CTAs */}
            <div className="flex flex-col gap-3">
              <Link
                to="/signup"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-center gap-2 bg-primary hover:bg-yellow-500 text-white font-merriweather font-medium text-sm py-3.5 rounded-full transition-colors duration-200 shadow-sm"
              >
                Join Your Clan
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <button
                onClick={() => { setMenuOpen(false); onRegisterInterest() }}
                className="flex items-center justify-center font-merriweather text-sm text-secondary border-2 border-secondary hover:bg-secondary hover:text-white py-3.5 rounded-full transition-colors duration-200"
              >
                Register Your Clan&apos;s Interest
              </button>
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="text-center font-merriweather text-sm text-gray-400 hover:text-primary py-2 transition-colors duration-150"
              >
                Already have an account? Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>

    </>
  )
}

export default LandingHeader
