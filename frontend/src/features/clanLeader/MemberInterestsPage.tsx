import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import type { RootState } from '@/store'
import { useListClanMemberInterests, useArchiveClanMemberInterest } from '@/hooks/useClanMemberInterests'
import type { ClanMemberInterest } from '@/types/clanMemberInterest'
import Sidebar from '@/components/layout/Sidebar'
import Spinner from '@/components/ui/Spinner'
import Button from '@/components/ui/Button'

const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8 19.79 19.79 0 01.5 1.18 2 2 0 012.5 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.08 6.08l1.27-.84a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 15.5v1.42z"/>
  </svg>
)

const AddUserIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
  </svg>
)

const ArchiveIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/>
  </svg>
)

interface InterestCardProps {
  interest: ClanMemberInterest
  onAddToSystem: (interest: ClanMemberInterest) => void
  onArchive: (id: string) => void
  isArchiving: boolean
}

const InterestCard = ({ interest, onAddToSystem, onArchive, isArchiving }: InterestCardProps) => (
  <div className="bg-white border border-gray-100 rounded-2xl p-5 hover:shadow-sm transition-shadow">
    <div className="flex items-start justify-between gap-4">
      {/* Avatar + details */}
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <span className="font-merriweather font-bold text-primary text-sm">
            {interest.full_name.charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          <p className="font-merriweather font-bold text-gray-900 text-sm">{interest.full_name}</p>
          <p className="text-xs text-gray-400 font-merriweather mt-0.5">{interest.email}</p>
          <div className="flex items-center gap-1 mt-2">
            <PhoneIcon />
            <a
              href={`tel:${interest.phone}`}
              className="text-xs font-merriweather text-primary hover:underline"
            >
              {interest.phone}
            </a>
          </div>
          <p className="text-[10px] text-gray-300 font-merriweather mt-2 uppercase tracking-widest">
            {new Date(interest.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 flex-shrink-0">
        <Button
          variant="primary"
          size="sm"
          onClick={() => onAddToSystem(interest)}
          className="flex items-center gap-1.5 rounded-full text-xs"
        >
          <AddUserIcon />
          Add to Clan
        </Button>
        <Button
          variant="outline"
          size="sm"
          isLoading={isArchiving}
          onClick={() => onArchive(interest.id)}
          className="flex items-center gap-1.5 rounded-full text-xs"
        >
          <ArchiveIcon />
          Archive
        </Button>
      </div>
    </div>
  </div>
)

const MemberInterestsPage = () => {
  const navigate = useNavigate()
  const user = useSelector((s: RootState) => s.auth.user)
  const { data: interests = [], isLoading } = useListClanMemberInterests()
  const { mutate: archive, isPending: archiving } = useArchiveClanMemberInterest()
  const [archivingId, setArchivingId] = useState<string | null>(null)

  const handleArchive = (id: string) => {
    setArchivingId(id)
    archive(id, { onSettled: () => setArchivingId(null) })
  }

  const handleAddToSystem = (interest: ClanMemberInterest) => {
    // Navigate to add-member page with pre-filled state via query params
    const params = new URLSearchParams({
      full_name: interest.full_name,
      email: interest.email,
      phone: interest.phone,
      interest_id: interest.id,
    })
    navigate(`/clan-leader/members/add?${params.toString()}`)
  }

  if (!user) return <Spinner fullScreen />

  return (
    <div className="flex min-h-screen" style={{ background: '#fafaf8' }}>
      <Sidebar role={user.role} />
      <div className="flex-1 flex flex-col ml-64">
        <main className="flex-1 p-8">
          <div className="mb-7">
            <p className="text-xs font-merriweather tracking-[0.25em] text-secondary uppercase mb-1">Clan Leader</p>
            <h1 className="text-2xl font-bold text-gray-900 font-merriweather">Member Interests</h1>
            <p className="text-gray-400 text-sm mt-1 font-merriweather">
              People who expressed interest in joining your clan. Call them to verify, then add them to the system.
            </p>
          </div>

          {isLoading && (
            <div className="flex justify-center py-20"><Spinner /></div>
          )}

          {!isLoading && interests.length === 0 && (
            <div className="bg-white border border-gray-100 rounded-2xl p-16 text-center shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
                <svg viewBox="0 0 24 24" fill="none" stroke="#CDB53F" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
                </svg>
              </div>
              <p className="text-gray-500 font-merriweather text-sm">No pending interest forms.</p>
              <p className="text-gray-400 font-merriweather text-xs mt-1">
                When someone expresses interest in joining your clan from the landing page, they will appear here.
              </p>
            </div>
          )}

          {!isLoading && interests.length > 0 && (
            <>
              {/* Info banner */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth={2} className="w-4 h-4">
                    <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p className="text-sm text-amber-800 font-merriweather leading-relaxed">
                  <strong>Before adding anyone:</strong> Call them using the phone number provided and ask questions to confirm they are genuinely part of your clan. Only add them once you are satisfied.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                {interests.map((interest) => (
                  <InterestCard
                    key={interest.id}
                    interest={interest}
                    onAddToSystem={handleAddToSystem}
                    onArchive={handleArchive}
                    isArchiving={archivingId === interest.id && archiving}
                  />
                ))}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}

export default MemberInterestsPage
