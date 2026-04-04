import { useSelector } from 'react-redux'
import type { RootState } from '@/store'
import { useGetMe } from '@/hooks/useAuth'
import { useGetClanMembers, useGetClanRelationships } from '@/hooks/useClan'
import type { Relationship } from '@/types/relationship'
import Navbar from '@/components/layout/Navbar'
import Sidebar from '@/components/layout/Sidebar'
import Spinner from '@/components/ui/Spinner'
import Avatar from '@/components/ui/Avatar'
import RelationshipSelector from './RelationshipSelector'

const ClanPage = () => {
  const user = useSelector((state: RootState) => state.auth.user)
  useGetMe()

  const clanId = user?.clan_id ?? ''
  const { data: clanMembersData, isLoading: membersLoading } = useGetClanMembers(clanId)
  const members = clanMembersData?.members ?? []
  const clan = clanMembersData?.clan
  const { data: relationships } = useGetClanRelationships(clanId)

  if (!user) return <Spinner fullScreen />

  const otherMembers = (members ?? []).filter((m) => m.user_id !== user.id)

  const relMap = (relationships ?? []).reduce<Record<string, Relationship>>((acc, r) => {
    acc[r.to_member_id] = r
    return acc
  }, {})

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role={user.role} />

      <div className="flex-1 flex flex-col ml-64">
        <Navbar />

        <main className="flex-1 p-8">
          <h1 className="text-2xl font-bold font-merriweather text-gray-900 mb-1">
            My Clan{clan ? ` — ${clan.name}` : ''}
          </h1>
          <p className="text-gray-500 text-sm mb-6">
            Define your relationship to each member below.
          </p>

          {membersLoading && (
            <div className="flex justify-center py-16">
              <Spinner />
            </div>
          )}

          {!membersLoading && otherMembers.length === 0 && (
            <div className="text-center py-16 text-gray-400 text-sm font-merriweather">
              No other clan members yet. Your clan leader will add members soon.
            </div>
          )}

          {!membersLoading &&
            otherMembers.map((member) => (
              <div
                key={member.id}
                className="bg-white border border-gray-100 rounded-xl p-4 mb-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <Avatar
                    src={member.profile_picture_url}
                    name={member.full_name}
                    size="md"
                  />
                  <div>
                    <p className="font-medium text-gray-900 font-merriweather">
                      {member.full_name}
                    </p>
                    {member.email && (
                      <p className="text-sm text-gray-500">{member.email}</p>
                    )}
                  </div>
                </div>

                <RelationshipSelector
                  memberId={member.id}
                  clanId={clanId}
                  existingRelationship={relMap[member.id]}
                />
              </div>
            ))}
        </main>
      </div>
    </div>
  )
}

export default ClanPage
