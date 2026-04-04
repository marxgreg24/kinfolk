import { Link } from 'react-router-dom'
import KinfolkWordmark from '@/components/ui/KinfolkWordmark'

const NAV_LINKS = [
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Features', href: '#features' },
  { label: 'Testimonials', href: '#testimonials' },
]

const ACCOUNT_LINKS = [
  { label: 'Sign In', to: '/login' },
  { label: 'Create Account', to: '/signup' },
]

const Footer = () => (
  <footer className="bg-[#0f0f0f] text-white">
    {/* Top gold rule */}
    <div className="h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent" />

    <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 pt-14 pb-10">
      {/* Main grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 mb-12">

        {/* Brand column */}
        <div className="sm:col-span-1">
          <KinfolkWordmark
            uppercase
            className="font-merriweather font-bold text-xl tracking-[0.14em] text-white mb-1"
          />
          <p className="text-[9px] font-merriweather tracking-[0.35em] text-primary/80 uppercase mb-4">
            Preserve Your Roots
          </p>
          <p className="text-sm text-white/50 font-merriweather leading-relaxed max-w-[220px]">
            Connecting Ugandan families and preserving clan heritage across the world.
          </p>
        </div>

        {/* Explore */}
        <div>
          <p className="text-[10px] font-merriweather tracking-[0.25em] text-primary uppercase mb-4">
            Explore
          </p>
          <ul className="flex flex-col gap-2.5">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="text-sm font-merriweather text-white/50 hover:text-primary transition-colors duration-200"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Account */}
        <div>
          <p className="text-[10px] font-merriweather tracking-[0.25em] text-primary uppercase mb-4">
            Account
          </p>
          <ul className="flex flex-col gap-2.5">
            {ACCOUNT_LINKS.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className="text-sm font-merriweather text-white/50 hover:text-primary transition-colors duration-200"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-4 mb-6">
        <span className="flex-1 h-px bg-white/[0.06]" />
        <span className="text-primary/40 text-[8px]">◆</span>
        <span className="flex-1 h-px bg-white/[0.06]" />
      </div>

      {/* Bottom row */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-merriweather text-white/30">
        <p>&copy; {new Date().getFullYear()} Kinfolk. All rights reserved.</p>
        <p>Built for Ugandan families, everywhere.</p>
      </div>
    </div>
  </footer>
)

export default Footer
