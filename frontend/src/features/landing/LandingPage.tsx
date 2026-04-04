import { useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import Button from '@/components/ui/Button'
import InterestFormModal from './InterestFormModal'

const heroBg = {
  background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2010 50%, #1a1a1a 100%)',
}

const features = [
  {
    abbr: 'FT',
    title: 'Interactive Family Tree',
    desc: 'Visualise your entire clan in a dynamic, pannable, zoomable D3-powered tree — all in your browser.',
  },
  {
    abbr: 'GC',
    title: 'Group Clan Chat',
    desc: 'Every clan gets a private group chat powered by Stream Chat. Stay connected across generations.',
  },
  {
    abbr: 'GE',
    title: 'GEDCOM Export',
    desc: 'Export your full clan tree as a GEDCOM file — compatible with all major genealogy software.',
  },
  {
    abbr: 'RM',
    title: 'Relationship Mapping',
    desc: 'Define and discover how every member connects. Direct relationships and inferred ones are both shown.',
  },
  {
    abbr: 'CR',
    title: 'Conflict Resolution',
    desc: 'When two members define different relationships, your clan leader reviews and resolves it fairly.',
  },
  {
    abbr: 'CH',
    title: 'Clan History Preservation',
    desc: 'Your genealogy data is preserved securely and can be passed down to future generations.',
  },
]

const steps = [
  {
    n: '1',
    title: 'Register Your Interest',
    desc: 'Submit a simple form and tell us about your clan. Our admin team will review and set you up.',
  },
  {
    n: '2',
    title: 'Clan Leader Sets Up',
    desc: 'Your appointed clan leader creates the clan, adds members, and sends invitations to join.',
  },
  {
    n: '3',
    title: 'Family Joins and Connects',
    desc: 'Members sign up, define relationships, explore the interactive family tree, and chat as a clan.',
  },
]

const testimonials = [
  {
    quote:
      'We had relatives scattered across Kampala, Jinja, and London who had never met. Kinfolk helped us build our full Buganda clan tree in just two weeks.',
    name: 'Nalwoga Sarah',
    role: 'Clan Leader, Buganda Clan',
  },
  {
    quote:
      'I never knew I had cousins in Gulu until we joined Kinfolk. The family tree feature made everything so clear and visual.',
    name: 'Kato Emmanuel',
    role: 'Member, Nkima Clan',
  },
]

const SectionHeading = ({ children }: { children: React.ReactNode }) => (
  <div className="text-center">
    <h2 className="text-3xl font-bold text-gray-900 font-merriweather">{children}</h2>
    <div className="bg-primary h-1 w-16 mx-auto mt-3 mb-16" />
  </div>
)

const LandingPage = () => {
  const [isInterestModalOpen, setIsInterestModalOpen] = useState(false)

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* SECTION 1 — Hero */}
      <section style={heroBg} className="w-full">
        <div className="max-w-4xl mx-auto px-6 py-32 text-center">
          <h1 className="font-merriweather font-bold text-white leading-tight text-3xl md:text-5xl">
            Preserve Your Roots. Reconnect With Your Clan.
          </h1>
          <div className="bg-primary h-1 w-24 mx-auto mt-6" />
          <p className="text-gray-300 text-xl text-center mt-6 max-w-2xl mx-auto font-merriweather">
            Kinfolk helps Ugandan families build, explore, and share their clan genealogies — for
            generations to come.
          </p>
          <div className="flex flex-wrap gap-4 justify-center mt-10">
            <Link to="/signup">
              <Button variant="primary" size="lg">
                Join Your Clan
              </Button>
            </Link>
            <Button
              variant="outline"
              size="lg"
              onClick={() => setIsInterestModalOpen(true)}
              className="border-2 border-white text-white hover:bg-white hover:text-gray-900"
            >
              Register Your Clan&apos;s Interest
            </Button>
          </div>
        </div>
      </section>

      {/* SECTION 2 — How It Works */}
      <section className="bg-white py-24">
        <SectionHeading>How It Works</SectionHeading>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto px-6">
          {steps.map((step) => (
            <div
              key={step.n}
              className="bg-gray-50 rounded-2xl p-8 text-center border border-gray-100"
            >
              <div className="w-12 h-12 rounded-full bg-primary text-white text-xl font-bold flex items-center justify-center mx-auto mb-4">
                {step.n}
              </div>
              <h3 className="font-merriweather font-bold text-gray-900 text-lg mb-3">
                {step.title}
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 3 — Features */}
      <section className="bg-gray-50 py-24">
        <SectionHeading>Everything Your Clan Needs</SectionHeading>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto px-6 mt-16">
          {features.map((f) => (
            <div
              key={f.abbr}
              className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-10 h-10 rounded-lg bg-primary bg-opacity-10 flex items-center justify-center mb-4">
                <span className="text-primary font-bold text-sm">{f.abbr}</span>
              </div>
              <h3 className="font-merriweather font-bold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 4 — Testimonials */}
      <section className="bg-white py-24">
        <SectionHeading>Families Already Connecting</SectionHeading>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto px-6 mt-16">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="bg-gray-50 rounded-2xl p-8 border-l-4 border-primary"
            >
              <p className="text-gray-600 italic text-base leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
              <p className="font-bold text-gray-900 mt-4">{t.name}</p>
              <p className="text-secondary text-sm">{t.role}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 5 — Final CTA Banner */}
      <section style={heroBg} className="py-24 text-center">
        <h2 className="text-4xl font-bold text-white font-merriweather">
          Ready to find your roots?
        </h2>
        <p className="text-gray-300 text-lg mt-4 font-merriweather">
          Join thousands of Ugandan families preserving their heritage on Kinfolk.
        </p>
        <div className="mt-8">
          <Button
            variant="outline"
            size="lg"
            onClick={() => setIsInterestModalOpen(true)}
            className="border-2 border-white text-white hover:bg-white hover:text-gray-900"
          >
            Register Your Clan&apos;s Interest
          </Button>
        </div>
      </section>

      {/* SECTION 6 — Footer */}
      <Footer />

      <InterestFormModal
        isOpen={isInterestModalOpen}
        onClose={() => setIsInterestModalOpen(false)}
      />
    </div>
  )
}

export default LandingPage
