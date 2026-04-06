import { useState } from 'react'
import { Link } from 'react-router-dom'
import LandingHeader from '@/components/layout/LandingHeader'
import Footer from '@/components/layout/Footer'
import InterestFormModal from './InterestFormModal'
import ClanInterestModal from './ClanInterestModal'
import { useListPublicClans } from '@/hooks/useClan'
import type { Clan } from '@/types/clan'

// ── Data ─────────────────────────────────────────────────────────────────────

const stats = [
  { value: '500+', label: 'Families' },
  { value: '20+', label: 'Active Clans' },
  { value: '10k+', label: 'Members Connected' },
]

const steps = [
  {
    n: '01',
    title: 'Register Your Interest',
    desc: 'Submit a simple form and tell us about your clan. Our admin team will review and set you up.',
    detail: 'Takes less than 2 minutes',
  },
  {
    n: '02',
    title: 'Clan Leader Sets Up',
    desc: 'Your appointed clan leader creates the clan, adds members, and prepares the foundation.',
    detail: 'Full leader dashboard provided',
  },
  {
    n: '03',
    title: 'Family Joins & Connects',
    desc: 'Members sign up, define relationships, explore the family tree, and chat as a clan.',
    detail: 'All devices supported',
  },
]

const features = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={1.5}>
        <circle cx="12" cy="5" r="2" /><circle cx="5" cy="19" r="2" /><circle cx="19" cy="19" r="2" />
        <path d="M12 7v4M12 11l-5 6M12 11l5 6" strokeLinecap="round" />
      </svg>
    ),
    title: 'Interactive Family Tree',
    desc: 'Visualise your entire clan in a dynamic, pannable, zoomable D3-powered tree — all in your browser.',
    tag: 'Visualisation',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={1.5}>
        <path d="M8 12h8M8 16h5M3 5h18v14H3z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: 'Group Clan Chat',
    desc: 'Every clan gets a private group chat powered by Stream Chat. Stay connected across generations.',
    tag: 'Communication',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={1.5}>
        <path d="M12 3v12m0 0l-3-3m3 3l3-3M5 21h14" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: 'GEDCOM Export',
    desc: 'Export your full clan tree as a GEDCOM file — compatible with all major genealogy software.',
    tag: 'Export',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={1.5}>
        <path d="M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87m6-4a4 4 0 11-8 0 4 4 0 018 0z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: 'Relationship Mapping',
    desc: 'Define and discover how every member connects. Direct relationships and inferred ones are both shown.',
    tag: 'Connections',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={1.5}>
        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: 'Conflict Resolution',
    desc: 'When two members define different relationships, your clan leader reviews and resolves it fairly.',
    tag: 'Governance',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth={1.5}>
        <path d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: 'Clan History Preservation',
    desc: 'Your genealogy data is preserved securely and can be passed down to future generations.',
    tag: 'Heritage',
  },
]

const testimonials = [
  {
    quote:
      'We had relatives scattered across Kampala, Jinja, and London who had never met. Kinfolk helped us build our full Buganda clan tree in just two weeks.',
    name: 'Nalwoga Sarah',
    role: 'Clan Leader, Buganda Clan',
    initials: 'NS',
  },
  {
    quote:
      'I never knew I had cousins in Gulu until we joined Kinfolk. The family tree feature made everything so clear and visual.',
    name: 'Kato Emmanuel',
    role: 'Member, Nkima Clan',
    initials: 'KE',
  },
]

// ── Sub-components ────────────────────────────────────────────────────────────

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center gap-3 justify-center mb-4">
    <span className="h-px w-8 bg-primary/40" />
    <span className="text-xs font-merriweather tracking-[0.3em] text-secondary uppercase">{children}</span>
    <span className="h-px w-8 bg-primary/40" />
  </div>
)

// ── Page ─────────────────────────────────────────────────────────────────────

const LandingPage = () => {
  const [isInterestModalOpen, setIsInterestModalOpen] = useState(false)
  const [selectedClan, setSelectedClan] = useState<Clan | null>(null)
  const { data: publicClans = [], isLoading: clansLoading } = useListPublicClans()

  return (
    <div className="min-h-screen flex flex-col">
      <LandingHeader onRegisterInterest={() => setIsInterestModalOpen(true)} />

      {/* SECTION 1 — Hero */}
      <section
        id="hero"
        className="relative w-full min-h-[75vh] sm:min-h-screen flex flex-col overflow-hidden"
      >
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('https://res.cloudinary.com/df3lhzzy7/image/upload/v1775387495/kinfolk_background_image_rcjrzv.jpg')" }}
          aria-hidden="true"
        />
        {/* Dark overlay — top-to-bottom gradient for depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/80" aria-hidden="true" />
        {/* Subtle gold centre glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 70% 55% at 50% 62%, rgba(205,181,63,0.10) 0%, transparent 70%)' }}
          aria-hidden="true"
        />

        {/* Main content — vertically centred */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-10 sm:py-36">

          {/* Trust badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 mb-8">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse flex-shrink-0" />
            <span className="text-sm font-merriweather font-medium text-white/90 tracking-wide">
              Trusted by Ugandan Families
            </span>
          </div>

          {/* Headline */}
          <h1 className="font-merriweather font-bold text-white leading-tight text-4xl sm:text-5xl lg:text-6xl xl:text-[3.75rem] max-w-3xl">
            Preserve Your{' '}
            <span className="relative inline-block">
              <span className="relative z-10 text-primary">Roots.</span>
              <span className="absolute bottom-0.5 left-0 right-0 h-[3px] rounded-full bg-primary/40" aria-hidden="true" />
            </span>
            <br className="hidden sm:block" />
            {' '}Reconnect With{' '}
            <span className="text-primary/90">Your Clan.</span>
          </h1>

          {/* Gold divider */}
          <div className="w-16 h-[3px] rounded-full bg-primary mt-7 mb-7" />

          {/* Subtext */}
          <p className="text-white/70 text-lg leading-relaxed font-merriweather max-w-xl mx-auto">
            Kinfolk helps Ugandan families build, explore, and share their clan
            genealogies — for generations to come.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mt-10 justify-center items-center">
            <Link to="/signup">
              <span className="inline-flex items-center gap-2 bg-primary hover:bg-yellow-500 text-white font-merriweather font-medium text-base px-7 py-3.5 rounded-full transition-all duration-200 shadow-lg shadow-primary/25">
                Join Your Clan
                <svg width="14" height="14" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </Link>
            <button
              onClick={() => setIsInterestModalOpen(true)}
              className="inline-flex items-center font-merriweather font-medium text-base px-7 py-3.5 rounded-full border-2 border-white/40 text-white hover:bg-white/10 hover:border-white/60 backdrop-blur-sm transition-all duration-200"
            >
              Register Your Clan&apos;s Interest
            </button>
          </div>

          {/* Stats row */}
          <div className="hidden sm:flex flex-wrap items-center justify-center gap-8 sm:gap-12 mt-12">
            {stats.map((s, i) => (
              <div key={s.label} className="flex items-center gap-8 sm:gap-12">
                <div className="text-center">
                  <p className="font-merriweather font-bold text-3xl sm:text-4xl text-white">{s.value}</p>
                  <p className="text-xs text-white/50 font-merriweather uppercase tracking-widest mt-1">{s.label}</p>
                </div>
                {i < stats.length - 1 && <div className="h-10 w-px bg-white/15 hidden sm:block" />}
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="relative z-10 hidden sm:flex flex-col items-center pb-10 gap-1.5" aria-hidden="true">
          <span className="text-white/30 text-[10px] font-merriweather tracking-[0.25em] uppercase">Scroll</span>
          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-white/30 animate-bounce" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {/* Wave transition into next section */}
        <div className="absolute bottom-0 left-0 right-0" aria-hidden="true">
          <svg viewBox="0 0 1440 56" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-10 sm:h-14 block">
            <path d="M0,28 C360,56 1080,0 1440,28 L1440,56 L0,56 Z" fill="#f9fafb" />
          </svg>
        </div>
      </section>

      {/* ── SECTION 2 — How It Works ─────────────────────────────────────────── */}
      <section id="how-it-works" className="bg-gray-50 py-28 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <SectionLabel>The Process</SectionLabel>
          <h2 className="text-center font-merriweather font-bold text-3xl sm:text-4xl text-gray-900 mb-20">
            Three steps to your clan&apos;s story
          </h2>

          {/* Timeline */}
          <div className="relative flex flex-col md:flex-row gap-0">
            {/* Connecting line — desktop */}
            <div className="hidden md:block absolute top-10 left-[calc(16.667%-1px)] right-[calc(16.667%-1px)] h-px bg-primary/20" aria-hidden="true" />

            {steps.map((step, i) => (
              <div key={step.n} className="flex-1 flex flex-col items-center text-center relative px-6 pb-10 md:pb-0">
                {/* Mobile connector */}
                {i < steps.length - 1 && (
                  <div className="md:hidden w-px h-10 bg-primary/20 mt-1 mb-1" aria-hidden="true" />
                )}

                {/* Step circle */}
                <div className="relative mb-6 z-10">
                  <div className="w-20 h-20 rounded-full bg-white border-2 border-primary/30 flex flex-col items-center justify-center shadow-sm">
                    <span className="text-[10px] font-merriweather tracking-[0.2em] text-primary/60 uppercase">Step</span>
                    <span className="font-merriweather font-bold text-2xl text-primary leading-none">{step.n}</span>
                  </div>
                </div>

                <h3 className="font-merriweather font-bold text-gray-900 text-lg mb-3">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed max-w-[220px] mx-auto mb-4">{step.desc}</p>

                {/* Detail pill */}
                <span className="inline-flex items-center gap-1.5 text-[11px] font-merriweather text-secondary bg-secondary/8 border border-secondary/20 px-3 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary/60 flex-shrink-0" />
                  {step.detail}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 2b — Clan Browser ────────────────────────────────────────── */}
      <section id="clans" className="bg-white py-28 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <SectionLabel>Active Clans</SectionLabel>
          <h2 className="text-center font-merriweather font-bold text-3xl sm:text-4xl text-gray-900 mb-4">
            Find your clan
          </h2>
          <p className="text-center text-gray-400 font-merriweather text-base max-w-md mx-auto mb-12">
            Browse the clans already on Kinfolk. If you believe you belong to one, express your interest and the clan leader will be in touch.
          </p>

          {clansLoading && (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          )}

          {!clansLoading && publicClans.length === 0 && (
            <p className="text-center text-gray-400 font-merriweather text-sm py-10">
              No clans have been set up yet — be the first to register your clan&apos;s interest.
            </p>
          )}

          {!clansLoading && publicClans.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {publicClans.map((clan) => (
                <div
                  key={clan.id}
                  className="group bg-white border border-gray-100 rounded-2xl p-6 hover:border-primary/30 hover:shadow-[0_8px_32px_rgba(205,181,63,0.10)] transition-all duration-300"
                >
                  {/* Clan initial avatar */}
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <span className="font-merriweather font-bold text-primary text-lg">
                      {clan.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <p className="font-merriweather font-bold text-gray-900 text-base mb-1">{clan.name}</p>
                  <p className="font-merriweather text-xs text-gray-400 mb-4 uppercase tracking-widest">Clan</p>
                  <button
                    onClick={() => setSelectedClan(clan)}
                    className="inline-flex items-center gap-1.5 text-xs font-merriweather font-medium text-primary border border-primary/30 rounded-full px-4 py-1.5 hover:bg-primary/5 transition-colors"
                  >
                    Express Interest
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                      <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── SECTION 3 — Features ─────────────────────────────────────────────── */}
      <section id="features" className="bg-white py-28 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <SectionLabel>Capabilities</SectionLabel>
          <h2 className="text-center font-merriweather font-bold text-3xl sm:text-4xl text-gray-900 mb-4">
            Everything your clan needs
          </h2>
          <p className="text-center text-gray-400 font-merriweather text-base max-w-lg mx-auto mb-16">
            Built for Ugandan families — from the eldest elder to the newest member.
          </p>

          {/* Bento-style grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <div
                key={f.title}
                className={`
                  group relative bg-white rounded-2xl border border-gray-100 p-7
                  hover:border-primary/30 hover:shadow-[0_8px_32px_rgba(205,181,63,0.10)]
                  transition-all duration-300 overflow-hidden
                  ${i === 0 ? 'sm:col-span-2 lg:col-span-1' : ''}
                `}
              >
                {/* Hover glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" aria-hidden="true" />

                {/* Tag */}
                <span className="inline-block text-[10px] font-merriweather tracking-[0.25em] text-primary/70 uppercase mb-4 border border-primary/20 rounded-full px-2.5 py-0.5">
                  {f.tag}
                </span>

                {/* Icon */}
                <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-secondary mb-4 group-hover:bg-primary/5 group-hover:border-primary/20 group-hover:text-primary transition-colors duration-300">
                  {f.icon}
                </div>

                <h3 className="font-merriweather font-bold text-gray-900 text-base mb-2">{f.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>

                {/* Arrow on hover */}
                <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <svg width="16" height="16" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                    <path d="M2 6h8M7 3l3 3-3 3" stroke="#CDB53F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 4 — Testimonials ─────────────────────────────────────────── */}
      <section
        id="testimonials"
        className="py-28 px-4 sm:px-6"
        style={{ background: 'linear-gradient(180deg, #fafaf8 0%, #ffffff 100%)' }}
      >
        <div className="max-w-5xl mx-auto">
          <SectionLabel>Voices</SectionLabel>
          <h2 className="text-center font-merriweather font-bold text-3xl sm:text-4xl text-gray-900 mb-4">
            Families already connecting
          </h2>
          <p className="text-center text-gray-400 font-merriweather text-base max-w-md mx-auto mb-16">
            Real stories from real clans across Uganda and the diaspora.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="relative bg-white rounded-2xl border border-gray-100 p-8 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col gap-5"
              >
                {/* Large decorative quote mark */}
                <span
                  className="absolute top-6 right-8 font-merriweather text-[72px] leading-none text-primary/10 select-none pointer-events-none"
                  aria-hidden="true"
                >
                  &ldquo;
                </span>

                {/* Gold top rule */}
                <div className="w-10 h-[3px] rounded-full bg-primary" />

                <p className="text-gray-600 font-merriweather text-base leading-relaxed relative z-10">
                  {t.quote}
                </p>

                <div className="flex items-center gap-3 pt-2 border-t border-gray-50">
                  {/* Avatar initials */}
                  <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-merriweather font-bold text-primary">{t.initials}</span>
                  </div>
                  <div>
                    <p className="font-merriweather font-bold text-gray-900 text-sm">{t.name}</p>
                    <p className="text-secondary text-xs font-merriweather">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 5 — Final CTA ────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-28 px-4 sm:px-6">
        {/* Dark textured background */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(135deg, #141414 0%, #2a1c0c 45%, #141414 100%)' }}
          aria-hidden="true"
        />
        {/* Subtle radial glow */}
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 60% 70% at 50% 50%, rgba(205,181,63,0.09) 0%, transparent 70%)' }}
          aria-hidden="true"
        />
        {/* Top gold rule */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent" aria-hidden="true" />

        <div className="relative max-w-2xl mx-auto text-center">
          {/* Ornament */}
          <div className="flex items-center justify-center gap-3 mb-6" aria-hidden="true">
            <span className="h-px w-12 bg-primary/40" />
            <span className="text-primary text-sm">◆</span>
            <span className="h-px w-12 bg-primary/40" />
          </div>

          <h2 className="font-merriweather font-bold text-white text-3xl sm:text-4xl lg:text-5xl leading-tight mb-6">
            Ready to find your
            {' '}<span className="text-primary">roots?</span>
          </h2>

          <p className="font-merriweather text-white/60 text-base sm:text-lg leading-relaxed mb-10 max-w-lg mx-auto">
            Your clan&apos;s history deserves to be preserved. Join thousands of Ugandan families
            reconnecting with their heritage on Kinfolk.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setIsInterestModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-yellow-500 text-white font-merriweather font-medium text-base px-8 py-4 rounded-full transition-colors duration-200 shadow-lg shadow-primary/20"
            >
              Register Your Clan&apos;s Interest
              <svg width="14" height="14" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <Link
              to="/signup"
              className="inline-flex items-center justify-center font-merriweather font-medium text-base px-8 py-4 rounded-full border border-white/20 text-white/80 hover:border-white/50 hover:text-white transition-all duration-200"
            >
              Join as a Member
            </Link>
          </div>

          {/* Bottom ornament */}
          <div className="flex items-center justify-center gap-3 mt-12" aria-hidden="true">
            <span className="h-px w-6 bg-primary/30" />
            <span className="text-primary/40 text-[10px]">◆</span>
            <span className="h-px w-6 bg-primary/30" />
          </div>
        </div>
      </section>

      {/* SECTION 6 — Footer */}
      <Footer />

      <InterestFormModal
        isOpen={isInterestModalOpen}
        onClose={() => setIsInterestModalOpen(false)}
      />

      {selectedClan && (
        <ClanInterestModal
          clan={selectedClan}
          onClose={() => setSelectedClan(null)}
        />
      )}
    </div>
  )
}

export default LandingPage
