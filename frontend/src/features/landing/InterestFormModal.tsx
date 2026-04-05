import { useState } from 'react'
import notify from '@/utils/toast'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { submitInterestForm } from '@/api/interestForms'

interface InterestFormModalProps {
  isOpen: boolean
  onClose: () => void
}

interface FormState {
  full_name: string
  clan_name: string
  email: string
  phone: string
  region: string
  expected_members: string
  message: string
}

interface FormErrors {
  full_name?: string
  clan_name?: string
  email?: string
  phone?: string
}

const empty: FormState = {
  full_name: '',
  clan_name: '',
  email: '',
  phone: '',
  region: '',
  expected_members: '',
  message: '',
}

const STEPS = [
  { n: 1, label: 'Your Details',  desc: 'How we can reach you'      },
  { n: 2, label: 'Your Clan',     desc: 'Tell us about your family'  },
]

const InterestFormModal = ({ isOpen, onClose }: InterestFormModalProps) => {
  const [step, setStep]           = useState(1)
  const [form, setForm]           = useState<FormState>(empty)
  const [errors, setErrors]       = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const set = (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const validateStep1 = (): boolean => {
    const next: FormErrors = {}
    if (!form.full_name.trim()) next.full_name = 'Required'
    if (!form.email.trim()) next.email = 'Required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'Invalid email'
    if (!form.phone.trim()) next.phone = 'Required'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const validateStep2 = (): boolean => {
    const next: FormErrors = {}
    if (!form.clan_name.trim()) next.clan_name = 'Required'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (step === 1) {
      if (validateStep1()) { setErrors({}); setStep(2) }
      return
    }
    if (!validateStep2()) return
    setIsSubmitting(true)
    try {
      await submitInterestForm({
        full_name: form.full_name,
        clan_name: form.clan_name,
        email: form.email,
        phone: form.phone,
        region: form.region || undefined,
        expected_members: form.expected_members ? parseInt(String(form.expected_members)) : undefined,
        message: form.message || undefined,
      })
      notify.success('Your interest has been submitted.', { detail: 'We will be in touch soon.' })
      handleClose()
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } }
      notify.error(err?.response?.data?.error ?? 'Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setStep(1)
    setForm(empty)
    setErrors({})
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="2xl" noPadding>
      <div className="flex overflow-hidden rounded-2xl">

        {/* ── Left panel — desktop only ── */}
        <div
          className="hidden md:flex flex-col w-56 flex-shrink-0 relative overflow-hidden"
          style={{ background: 'linear-gradient(155deg, #141414 0%, #1c1406 60%, #111 100%)' }}
        >
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent" />

          <div className="flex flex-col flex-1 p-7 pt-8">
            {/* Wordmark badge */}
            <div className="flex items-center gap-2 mb-4" aria-hidden="true">
              <span className="h-px w-4 bg-primary/50" />
              <span className="text-primary text-[8px]">◆</span>
              <span className="h-px w-4 bg-primary/50" />
            </div>
            <p className="font-merriweather font-bold text-white text-[15px] leading-snug tracking-wide mb-2">
              Register Your Clan&apos;s Interest
            </p>
            <p className="text-white/35 text-[11px] font-merriweather leading-relaxed mb-8">
              Join Ugandan families preserving their heritage on Kinfolk.
            </p>

            {/* Animated step progress */}
            <div className="flex flex-col">
              {STEPS.map((s, i) => {
                const isActive = step === s.n
                const isDone   = step > s.n
                return (
                  <div key={s.n} className="flex gap-3">
                    {/* Track */}
                    <div className="flex flex-col items-center">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-all duration-300 ${
                        isDone   ? 'bg-primary border-primary' :
                        isActive ? 'border-primary bg-transparent' :
                                   'border-white/15 bg-transparent'
                      }`}>
                        {isDone ? (
                          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        ) : (
                          <span className={`text-[10px] font-merriweather font-bold transition-colors duration-300 ${isActive ? 'text-primary' : 'text-white/20'}`}>
                            {s.n}
                          </span>
                        )}
                      </div>
                      {i < STEPS.length - 1 && (
                        <div className={`w-px my-1.5 transition-all duration-300 ${isDone ? 'bg-primary/40' : 'bg-white/10'}`} style={{ minHeight: '28px' }} />
                      )}
                    </div>
                    {/* Labels */}
                    <div className="pb-7">
                      <p className={`text-xs font-merriweather font-bold transition-colors duration-300 leading-none ${isActive || isDone ? 'text-white/80' : 'text-white/22'}`}>
                        {s.label}
                      </p>
                      <p className={`text-[10px] font-merriweather mt-1 transition-colors duration-300 ${isActive ? 'text-primary/70' : isDone ? 'text-white/25' : 'text-white/15'}`}>
                        {s.desc}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Decorative tree */}
          <svg viewBox="0 0 120 80" className="mx-6 mb-7 opacity-[0.06]" aria-hidden="true">
            <line x1="60" y1="10" x2="30" y2="40" stroke="#CDB53F" strokeWidth="1.5"/>
            <line x1="60" y1="10" x2="90" y2="40" stroke="#CDB53F" strokeWidth="1.5"/>
            <line x1="30" y1="40" x2="15" y2="70" stroke="#CDB53F" strokeWidth="1"/>
            <line x1="30" y1="40" x2="45" y2="70" stroke="#CDB53F" strokeWidth="1"/>
            <line x1="90" y1="40" x2="75" y2="70" stroke="#CDB53F" strokeWidth="1"/>
            <line x1="90" y1="40" x2="105" y2="70" stroke="#CDB53F" strokeWidth="1"/>
            <circle cx="60" cy="10" r="4" fill="#CDB53F"/>
            <circle cx="30" cy="40" r="3" fill="#CDB53F"/>
            <circle cx="90" cy="40" r="3" fill="#CDB53F"/>
            <circle cx="15" cy="70" r="2.5" fill="#CDB53F"/>
            <circle cx="45" cy="70" r="2.5" fill="#CDB53F"/>
            <circle cx="75" cy="70" r="2.5" fill="#CDB53F"/>
            <circle cx="105" cy="70" r="2.5" fill="#CDB53F"/>
          </svg>
        </div>

        {/* ── Right: form ── */}
        <form onSubmit={handleFormSubmit} className="flex-1 flex flex-col min-h-0">

          {/* Header */}
          <div className="flex items-start justify-between px-7 pt-6 pb-5 border-b border-gray-100">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="h-px w-4 bg-primary/40" />
                <span className="text-[9px] font-merriweather tracking-[0.3em] text-secondary uppercase">Kinfolk</span>
              </div>
              <h2 className="font-merriweather font-bold text-gray-900 text-[17px] leading-snug">
                Register Your Clan&apos;s Interest
              </h2>
              {/* Mobile progress pills */}
              <div className="flex items-center gap-2 mt-2 md:hidden">
                <div className={`h-1 rounded-full transition-all duration-300 ${step >= 1 ? 'w-10 bg-primary' : 'w-6 bg-gray-200'}`} />
                <div className={`h-1 rounded-full transition-all duration-300 ${step >= 2 ? 'w-10 bg-primary' : 'w-6 bg-gray-200'}`} />
                <span className="text-[10px] text-gray-400 font-merriweather ml-1">Step {step} of 2</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors focus:outline-none flex-shrink-0 mt-0.5"
              aria-label="Close modal"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          {/* Body — switches between steps */}
          <div className="flex-1 px-7 py-6">
            {step === 1 ? (
              <div className="flex flex-col gap-4">
                <div className="mb-1">
                  <p className="font-merriweather font-semibold text-sm text-gray-800">Your Details</p>
                  <p className="text-[11px] text-gray-400 font-merriweather mt-0.5">So we know how to reach you when your clan is approved.</p>
                </div>
                <Input
                  label="Full Name" name="full_name" value={form.full_name}
                  onChange={set('full_name')} error={errors.full_name} required
                  placeholder="e.g. Nakato Sarah"
                />
                <Input
                  label="Email Address" name="email" type="email" value={form.email}
                  onChange={set('email')} error={errors.email} required
                  placeholder="you@example.com"
                />
                <Input
                  label="Phone Number" name="phone" type="tel" value={form.phone}
                  onChange={set('phone')} error={errors.phone} required
                  placeholder="+256 700 000 000"
                />
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="mb-1">
                  <p className="font-merriweather font-semibold text-sm text-gray-800">Your Clan</p>
                  <p className="text-[11px] text-gray-400 font-merriweather mt-0.5">Tell us about the clan you&apos;d like to register on Kinfolk.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Clan Name" name="clan_name" value={form.clan_name}
                    onChange={set('clan_name')} error={errors.clan_name} required
                    placeholder="e.g. Baganda"
                  />
                  <Input
                    label="Region / District" name="region" value={form.region}
                    onChange={set('region')} placeholder="e.g. Kampala"
                  />
                </div>
                <Input
                  label="Expected Number of Members" name="expected_members" type="number"
                  value={form.expected_members} onChange={set('expected_members')} placeholder="e.g. 50"
                />
                <div>
                  <label
                    htmlFor="message"
                    className="block text-xs font-merriweather font-semibold uppercase tracking-wider text-gray-500 mb-1.5"
                  >
                    Why do you want to join Kinfolk?{' '}
                    <span className="text-gray-300 normal-case tracking-normal font-normal">(optional)</span>
                  </label>
                  <textarea
                    id="message" name="message" value={form.message} onChange={set('message')}
                    placeholder="Tell us about your clan and what you hope to achieve…"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-merriweather text-gray-900 placeholder:text-gray-400 bg-white hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all duration-200 resize-none h-[68px]"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-7 pb-6 pt-1 flex flex-col gap-2">
            {step === 1 ? (
              <Button type="submit" variant="primary" className="w-full rounded-full py-3 flex items-center justify-center gap-2">
                Continue
                <svg width="14" height="14" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Button>
            ) : (
              <>
                <Button type="submit" variant="primary" isLoading={isSubmitting} className="w-full rounded-full py-3">
                  Submit Interest
                </Button>
                <button
                  type="button"
                  onClick={() => { setErrors({}); setStep(1) }}
                  className="w-full text-sm font-merriweather text-gray-400 hover:text-gray-700 py-1.5 transition-colors"
                >
                  ← Back
                </button>
              </>
            )}
          </div>
        </form>

      </div>
    </Modal>
  )
}

export default InterestFormModal
