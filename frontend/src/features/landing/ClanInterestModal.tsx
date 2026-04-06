import { useState } from 'react'
import type { Clan } from '@/types/clan'
import notify from '@/utils/toast'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { useSubmitClanMemberInterest } from '@/hooks/useClanMemberInterests'

interface Props {
  clan: Clan
  onClose: () => void
}

const ClanInterestModal = ({ clan, onClose }: Props) => {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [done, setDone] = useState(false)
  const { mutate, isPending } = useSubmitClanMemberInterest()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutate(
      { clan_id: clan.id, full_name: fullName, email, phone },
      {
        onSuccess: () => setDone(true),
        onError: (err: any) => {
          const msg = err?.response?.data?.error
          if (msg) notify.error(msg)
        },
      },
    )
  }

  const handleClose = () => {
    setFullName(''); setEmail(''); setPhone(''); setDone(false)
    onClose()
  }

  return (
    <Modal isOpen onClose={handleClose} title={`Join the ${clan.name} Clan`} size="sm">
      {done ? (
        <div className="text-center py-4">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <svg viewBox="0 0 24 24" fill="none" stroke="#CDB53F" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <p className="font-merriweather font-bold text-gray-900 text-base mb-2">Interest submitted!</p>
          <p className="text-sm text-gray-500 font-merriweather leading-relaxed mb-6">
            The clan leader of <strong>{clan.name}</strong> will review your details and be in touch soon.
            Check your email for a confirmation.
          </p>
          <Button variant="primary" size="sm" onClick={handleClose} className="rounded-full px-6">
            Done
          </Button>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 font-merriweather mb-5 leading-relaxed">
            Fill in your details and the clan leader will reach out to verify your connection to the <strong>{clan.name}</strong> clan.
          </p>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Nakato Sarah"
              required
            />
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
            <Input
              label="Phone Number"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+256 700 000 000"
              required
            />
            <div className="flex gap-3 justify-end mt-1">
              <Button type="button" variant="outline" size="sm" onClick={handleClose}>Cancel</Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isPending}
                disabled={!fullName.trim() || !email.trim() || !phone.trim()}
                className="rounded-full"
              >
                Submit Interest
              </Button>
            </div>
          </form>
        </>
      )}
    </Modal>
  )
}

export default ClanInterestModal
