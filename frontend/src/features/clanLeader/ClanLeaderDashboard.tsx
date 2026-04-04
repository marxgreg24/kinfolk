import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import type { RootState } from '@/store'
import { useGetMe } from '@/hooks/useAuth'
import { useGetClan, useGetClanMembers } from '@/hooks/useClan'
import { useListConflicts } from '@/hooks/useClanLeader'
import Navbar from '@/components/layout/Navbar'
import Sidebar from '@/components/layout/Sidebar'
import Spinner from '@/components/ui/Spinner'
import MatchSuggestionsPanel from './MatchSuggestionsPanel'

const ClanLeaderDashboard = () => {
  const navigate = useNavigate()
  const user = useSelector((s: RootState) => s.auth.user)

  useGetMe()

  const { data: clan } = useGetClan(user?.clan_id ?? '')
  const { data: clanMembersData } = useGetClanMembers(user?.clan_id ?? '')
  const { data: conflicts } = useListConflicts(user?.clan_id ?? '')

  if (!user) return <Spinner fullScreen />

  const openConflicts = conflicts?.length ?? 0
  const memberCount = clanMembersData?.members?.length ?? 0

  const stats = [
    { label: 'Clan Members', value: memberCount, onClick: () => navigate('/clan-leader/members/add') },
    { label: 'Open Conflicts', value: openConflicts, onClick: () => navigate('/clan-leader/conflicts') },
  ]

  const quickActions = [
    { abbr: 'AM', label: 'Add Member', onClick: () => navigate('/clan-leader/members/add') },
    { abbr: 'FT', label: 'Family Tree', onClick: () => navigate('/clan/tree') },
    { abbr: 'CF', label: 'Conflicts', onClick: () => navigate('/clan-leader/conflicts') },
    { abbr: 'GC', label: 'Clan Chat', onClick: () => navigate('/clan/chat') },
  ]

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role={user.role} />

      <div className="flex-1 flex flex-col ml-64">
        <Navbar />

        <main className="flex-1 p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 font-merriweather">
              Clan Leader Dashboard
            </h1>
            {clan && (
              <p className="text-secondary text-sm mt-1">{clan.name} Clan</p>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {stats.map((stat) => (
              <button
                key={stat.label}
                onClick={stat.onClick}
                className="bg-white border border-gray-100 rounded-xl p-6 text-left hover:shadow-md transition-shadow hover:border-primary"
              >
                <p className="text-3xl font-bold text-primary font-merriweather">{stat.value}</p>
                <p className="text-sm text-gray-600 mt-1 font-merriweather">{stat.label}</p>
              </button>
            ))}
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {quickActions.map((action) => (
              <button
                key={action.abbr}
                onClick={action.onClick}
                className="bg-white border border-gray-100 rounded-xl p-6 text-center cursor-pointer hover:shadow-md transition-shadow hover:border-primary"
              >
                <p className="text-3xl text-primary font-bold font-merriweather">{action.abbr}</p>
                <p className="text-sm text-gray-600 mt-2 font-merriweather">{action.label}</p>
              </button>
            ))}
          </div>

          <MatchSuggestionsPanel clanId={user?.clan_id ?? ''} />

          {/* No clan warning */}
          {!user.clan_id && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mt-6">
              <p className="text-sm text-yellow-800 font-merriweather">
                You haven't created a clan yet. Create one to get started.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default ClanLeaderDashboard
