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
    if (!form.full_name.trim()) next.full_name = 'Full name is required'
    if (!form.clan_name.trim()) next.clan_name = 'Clan name is required'
    if (!form.email.trim()) next.email = 'Email address is required'
    if (!form.phone.trim()) next.phone = 'Phone number is required'
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
    } catch (error: any) {
      const msg = error?.response?.data?.error ?? 'Something went wrong. Please try again.'
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Register Your Clan's Interest" size="lg">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Full Name"
          name="full_name"
          value={form.full_name}
          onChange={set('full_name')}
          error={errors.full_name}
          required
        />
        <Input
          label="Clan Name"
          name="clan_name"
          value={form.clan_name}
          onChange={set('clan_name')}
          error={errors.clan_name}
          required
        />
        <Input
          label="Email Address"
          name="email"
          type="email"
          value={form.email}
          onChange={set('email')}
          error={errors.email}
          required
        />
        <Input
          label="Phone Number"
          name="phone"
          type="tel"
          value={form.phone}
          onChange={set('phone')}
          error={errors.phone}
          required
        />
        <Input
          label="Region / District in Uganda"
          name="region"
          value={form.region}
          onChange={set('region')}
        />
        <Input
          label="Expected Number of Clan Members"
          name="expected_members"
          type="number"
          value={form.expected_members}
          onChange={set('expected_members')}
        />
        <div className="flex flex-col">
          <label
            htmlFor="message"
            className="text-sm font-medium text-gray-700 mb-1 block"
          >
            Why do you want to join Kinfolk?
          </label>
          <textarea
            id="message"
            name="message"
            value={form.message}
            onChange={set('message')}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-merriweather focus:ring-2 focus:ring-primary focus:border-primary outline-none resize-none h-24"
          />
        </div>
        <Button
          type="submit"
          variant="primary"
          isLoading={isSubmitting}
          className="w-full mt-2"
        >
          Submit Interest
        </Button>
      </form>
    </Modal>
  )
}

export default InterestFormModal
