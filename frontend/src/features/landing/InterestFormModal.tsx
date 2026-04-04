import { useState } from 'react'
import toast from 'react-hot-toast'
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

const InterestFormModal = ({ isOpen, onClose }: InterestFormModalProps) => {
  const [form, setForm] = useState<FormState>(empty)
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const set = (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const validate = (): boolean => {
    const next: FormErrors = {}
    if (!form.full_name.trim()) next.full_name = 'Required'
    if (!form.clan_name.trim()) next.clan_name = 'Required'
    if (!form.email.trim()) next.email = 'Required'
    if (!form.phone.trim()) next.phone = 'Required'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
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
      toast.success('Your interest has been submitted! We will be in touch soon.')
      setForm(empty)
      setErrors({})
      onClose()
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } }
      toast.error(err?.response?.data?.error ?? 'Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" noPadding>
      <div className="flex gap-0 rounded-2xl overflow-hidden">

        {/* ── Left decorative panel ── */}
        <div
          className="hidden md:flex flex-col justify-between w-52 flex-shrink-0 rounded-xl overflow-hidden p-6 relative"
          style={{ background: 'linear-gradient(155deg, #141414 0%, #1c1406 60%, #111 100%)' }}
        >
          {/* Gold top rule */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent" />

          <div>
            <div className="flex items-center gap-2 mb-3" aria-hidden="true">
              <span className="h-px w-4 bg-primary/50" />
              <span className="text-primary text-[8px]">◆</span>
              <span className="h-px w-4 bg-primary/50" />
            </div>
            <p className="font-merriweather font-bold text-white text-base leading-snug tracking-wide">
              Register Your Clan&apos;s Interest
            </p>
            <p className="text-white/40 text-xs font-merriweather mt-3 leading-relaxed">
              Tell us about your clan and we&apos;ll get you set up on Kinfolk.
            </p>
          </div>

          {/* Steps */}
          <div className="flex flex-col gap-4 my-6">
            {[
              { n: '01', t: 'Submit this form' },
              { n: '02', t: 'Admin reviews & approves' },
              { n: '03', t: 'Clan Leader gets access' },
            ].map((s) => (
              <div key={s.n} className="flex gap-2.5 items-start">
                <span className="text-primary font-merriweather font-bold text-[10px] opacity-70 mt-0.5 flex-shrink-0">{s.n}</span>
                <p className="text-white/50 text-xs font-merriweather leading-snug">{s.t}</p>
              </div>
            ))}
          </div>

          {/* Decorative tree */}
          <svg viewBox="0 0 120 80" className="w-full opacity-[0.06]" aria-hidden="true">
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

        {/* ── Form panel ── */}
        <div className="flex-1 p-6 overflow-y-auto">
          {/* Title row + close */}
          <div className="flex items-start justify-between mb-5">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="h-px w-4 bg-primary/40" />
                <span className="text-[9px] font-merriweather tracking-[0.3em] text-secondary uppercase">Kinfolk</span>
              </div>
              <p className="font-merriweather font-bold text-gray-900 text-base">Register Your Clan&apos;s Interest</p>
            </div>
            <button onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors focus:outline-none flex-shrink-0"
              aria-label="Close modal">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Row 1: Full Name + Clan Name */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <Input label="Full Name" name="full_name" value={form.full_name}
                onChange={set('full_name')} error={errors.full_name} required
                placeholder="e.g. Nakato Sarah" />
              <Input label="Clan Name" name="clan_name" value={form.clan_name}
                onChange={set('clan_name')} error={errors.clan_name} required
                placeholder="e.g. Baganda" />
            </div>

            {/* Row 2: Email + Phone */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <Input label="Email Address" name="email" type="email" value={form.email}
                onChange={set('email')} error={errors.email} required
                placeholder="you@example.com" />
              <Input label="Phone Number" name="phone" type="tel" value={form.phone}
                onChange={set('phone')} error={errors.phone} required
                placeholder="+256 700 000 000" />
            </div>

            {/* Row 3: Region + Expected Members */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <Input label="Region / District in Uganda" name="region" value={form.region}
                onChange={set('region')} placeholder="e.g. Kampala" />
              <Input label="Expected Number of Members" name="expected_members" type="number"
                value={form.expected_members} onChange={set('expected_members')} placeholder="e.g. 50" />
            </div>

            {/* Row 4: Message (full width) */}
            <div className="mb-4">
              <label htmlFor="message"
                className="text-xs font-merriweather font-semibold uppercase tracking-wider text-gray-500 mb-1.5 block">
                Why do you want to join Kinfolk?
              </label>
              <textarea
                id="message" name="message" value={form.message} onChange={set('message')}
                placeholder="Tell us a bit about your clan and what you hope to achieve…"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-merriweather text-gray-900 placeholder:text-gray-400 bg-white hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all duration-200 resize-none h-20"
              />
            </div>

            <Button type="submit" variant="primary" isLoading={isSubmitting} className="w-full rounded-full py-3">
              Submit Interest
            </Button>
          </form>
        </div>
      </div>
    </Modal>
  )
}

export default InterestFormModal
