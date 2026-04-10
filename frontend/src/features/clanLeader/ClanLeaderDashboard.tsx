import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import type { RootState } from '@/store'
import { useGetMe } from '@/hooks/useAuth'
import { useGetClan, useGetClanMembers } from '@/hooks/useClan'
import { useListConflicts } from '@/hooks/useClanLeader'
import Sidebar from '@/components/layout/Sidebar'
import Spinner from '@/components/ui/Spinner'
import MatchSuggestionsPanel from './MatchSuggestionsPanel'
import ClanMemberList from '@/components/clan/ClanMemberList'

const AddMemberIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
  </svg>
)
const TreeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <circle cx="12" cy="4" r="2"/><circle cx="6" cy="14" r="2"/><circle cx="18" cy="14" r="2"/>
    <path d="M12 6v4M12 10l-4 2M12 10l4 2"/><circle cx="12" cy="20" r="2"/><path d="M12 16v2"/>
  </svg>
)
const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
)
const ChatIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
  </svg>
)

const ClanLeaderDashboard = () => {
  const navigate = useNavigate()
  const user = useSelector((s: RootState) => s.auth.user)
  useGetMe()

  const { data: clan } = useGetClan(user?.clan_id ?? '')
  const { data: clanMembersData, isLoading: membersLoading } = useGetClanMembers(user?.clan_id ?? '')
  const { data: conflicts } = useListConflicts(user?.clan_id ?? '')

  if (!user) return <Spinner fullScreen />

  const openConflicts = conflicts?.length ?? 0
  const memberCount = clanMembersData?.members?.length ?? 0

  const stats = [
    { label: 'Clan Members', value: memberCount, sub: 'registered', onClick: () => navigate('/clan-leader/members/add'), color: 'text-primary' },
    { label: 'Open Conflicts', value: openConflicts, sub: 'need review', onClick: () => navigate('/clan-leader/conflicts'), color: openConflicts > 0 ? 'text-red-500' : 'text-emerald-500' },
  ]

  const quickActions = [
    { icon: <AddMemberIcon />, label: 'Add Member', desc: 'Invite someone to the clan', onClick: () => navigate('/clan-leader/members/add') },
    { icon: <TreeIcon />, label: 'Family Tree', desc: 'View the clan tree', onClick: () => navigate('/clan/tree') },
    { icon: <ShieldIcon />, label: 'Conflicts', desc: 'Review relationship disputes', onClick: () => navigate('/clan-leader/conflicts') },
    { icon: <ChatIcon />, label: 'Clan Chat', desc: 'Message your clan', onClick: () => navigate('/clan/chat') },
  ]

  return (
    <div className="flex min-h-screen" style={{ background: '#fafaf8' }}>
      <Sidebar role={user.role} />
      <div className="flex-1 flex flex-col ml-64">
        <main className="flex-1 p-8">

          {/* Header */}
          <div className="mb-7">
            <p className="text-xs font-merriweather tracking-[0.25em] text-secondary uppercase mb-1">Clan Leader Dashboard</p>
            <h1 className="text-2xl font-bold text-gray-900 font-merriweather">
              {clan ? clan.name : 'Your Clan'}
            </h1>
            <p className="text-gray-400 text-sm mt-1 font-merriweather">Manage your clan's members, relationships, and more.</p>
          </div>

          {/* No clan warning */}
          {!user.clan_id && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth={2} className="w-4 h-4">
                  <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p className="text-sm text-amber-800 font-merriweather">You haven't created a clan yet. Create one to get started.</p>
            </div>
          )}

          {/* Stat cards */}
          <div className="grid grid-cols-2 gap-4 mb-8 max-w-lg">
            {stats.map((stat) => (
              <button
                key={stat.label}
                onClick={stat.onClick}
                className="bg-white border border-gray-100 rounded-2xl p-6 text-left hover:shadow-md hover:border-primary/30 transition-all duration-200 group"
              >
                <p className={`text-4xl font-bold font-merriweather ${stat.color} mb-1`}>{stat.value}</p>
                <p className="text-xs text-gray-400 font-merriweather uppercase tracking-wider">{stat.sub}</p>
                <p className="text-sm text-gray-600 font-merriweather font-medium mt-2">{stat.label}</p>
                <span className="text-primary text-xs font-merriweather opacity-0 group-hover:opacity-100 transition-opacity mt-1 block">View →</span>
              </button>
            ))}
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={action.onClick}
                className="bg-white border border-gray-100 rounded-2xl p-5 text-left hover:shadow-md hover:border-primary/30 transition-all duration-200 group"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 group-hover:bg-primary/15 flex items-center justify-center text-primary mb-3 transition-colors">
                  {action.icon}
                </div>
                <p className="text-sm font-semibold text-gray-800 font-merriweather">{action.label}</p>
                <p className="text-xs text-gray-400 font-merriweather mt-0.5">{action.desc}</p>
              </button>
            ))}
          </div>

          <MatchSuggestionsPanel clanId={user?.clan_id ?? ''} />

          {/* Clan Members List */}
          <div className="mt-8">
            <ClanMemberList
              members={clanMembersData?.members ?? []}
              isLoading={membersLoading}
              showContact
            />
          </div>
        </main>
      </div>
    </div>
  )
}

export default ClanLeaderDashboard
