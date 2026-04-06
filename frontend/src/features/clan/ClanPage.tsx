import { useSelector } from 'react-redux'
import type { RootState } from '@/store'
import { useGetMe } from '@/hooks/useAuth'
import { useGetClanMembers, useGetClanRelationships } from '@/hooks/useClan'
import type { Relationship } from '@/types/relationship'
import Sidebar from '@/components/layout/Sidebar'
import Spinner from '@/components/ui/Spinner'
import Avatar from '@/components/ui/Avatar'
import RelationshipSelector from './RelationshipSelector'

const ClanPage = () => {
  const user = useSelector((state: RootState) => state.auth.user)
  useGetMe()

  const clanId = user?.clan_id ?? ''
  const { data: clanMembersData, isLoading: membersLoading } = useGetClanMembers(clanId)
  const allMembers = clanMembersData?.members ?? []
  const clan = clanMembersData?.clan
  const { data: relationships } = useGetClanRelationships(clanId)

  if (!user) return <Spinner fullScreen />

  // Find the current user's own member record to determine their family
  const myMemberRecord = allMembers.find((m) => m.user_id === user.id)
  const myFamilyId = myMemberRecord?.family_id

  // Only show members from the same family (excluding self)
  const familyMembers = myFamilyId
    ? allMembers.filter((m) => m.family_id === myFamilyId && m.user_id !== user.id)
    : []

  const relMap = (relationships ?? []).reduce<Record<string, Relationship>>((acc, r) => {
    if (r.from_user_id !== user.id || r.is_inferred || r.status !== 'active') {
      return acc
    }

    acc[r.to_member_id] = r
    return acc
  }, {})

  return (
    <div className="flex min-h-screen" style={{ background: '#fafaf8' }}>
      <Sidebar role={user.role} />
      <div className="flex-1 flex flex-col ml-64">
        <main className="flex-1 p-8">

          {/* Header */}
          <div className="mb-7">
            <p className="text-xs font-merriweather tracking-[0.25em] text-secondary uppercase mb-1">My Family</p>
            <h1 className="text-2xl font-bold font-merriweather text-gray-900">
              {clan ? clan.name : 'My Clan'}
            </h1>
            <p className="text-gray-400 text-sm mt-1 font-merriweather">
              Define your relationship to each member of your family.
            </p>
          </div>

          {/* Stats strip */}
          {!membersLoading && familyMembers.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-2xl px-6 py-4 mb-6 flex items-center gap-6 shadow-sm">
              <div>
                <p className="text-2xl font-bold text-primary font-merriweather">{familyMembers.length}</p>
                <p className="text-xs text-gray-400 font-merriweather uppercase tracking-wider mt-0.5">Family Members</p>
              </div>
              <div className="h-8 w-px bg-gray-100" />
              <div>
                <p className="text-2xl font-bold text-secondary font-merriweather">
                  {familyMembers.filter((m) => !!relMap[m.id]).length}
                </p>
                <p className="text-xs text-gray-400 font-merriweather uppercase tracking-wider mt-0.5">Relationships Mapped</p>
              </div>
            </div>
          )}

          {membersLoading && (
            <div className="flex justify-center py-20"><Spinner /></div>
          )}

          {!membersLoading && !myFamilyId && (
            <div className="bg-white border border-gray-100 rounded-2xl p-16 text-center shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
                <svg viewBox="0 0 24 24" fill="none" stroke="#CDB53F" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
                </svg>
              </div>
              <p className="text-gray-500 font-merriweather text-sm">You are not assigned to a family yet.</p>
              <p className="text-gray-400 font-merriweather text-xs mt-1">Your clan leader will assign you to a family soon.</p>
            </div>
          )}

          {!membersLoading && myFamilyId && familyMembers.length === 0 && (
            <div className="bg-white border border-gray-100 rounded-2xl p-16 text-center shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
                <svg viewBox="0 0 24 24" fill="none" stroke="#CDB53F" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
                </svg>
              </div>
              <p className="text-gray-500 font-merriweather text-sm">No other family members yet.</p>
              <p className="text-gray-400 font-merriweather text-xs mt-1">Your clan leader will add more members to your family soon.</p>
            </div>
          )}

          {!membersLoading && familyMembers.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
              <div className="h-[2px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
              {familyMembers.map((member, i) => (
                <div
                  key={member.id}
                  className={`flex items-center justify-between px-6 py-4 gap-4 hover:bg-gray-50/70 transition-colors ${i < familyMembers.length - 1 ? 'border-b border-gray-50' : ''}`}
                >
                  <div className="flex items-center gap-4">
                    <Avatar src={member.profile_picture_url} name={member.full_name} size="md" />
                    <div>
                      <p className="font-semibold text-gray-900 font-merriweather text-sm">{member.full_name}</p>
                      {member.email && <p className="text-xs text-gray-400 font-merriweather mt-0.5">{member.email}</p>}
                    </div>
                  </div>
                  <RelationshipSelector
                    memberId={member.id}
                    clanId={clanId}
                    existingRelationship={relMap[member.id]}
                    memberName={member.full_name}
                  />
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default ClanPage
