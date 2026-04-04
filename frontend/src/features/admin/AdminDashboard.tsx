import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import type { RootState } from '@/store'
import { useGetMe } from '@/hooks/useAuth'
import { useListUsers, useListInterestForms } from '@/hooks/useAdmin'
import Sidebar from '@/components/layout/Sidebar'
import Spinner from '@/components/ui/Spinner'
import ApiStatusBadge from '@/components/ui/ApiStatusBadge'

const UsersIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
  </svg>
)
const CrownIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M2 20h20M4 20l2-8 6 4 6-4 2 8"/><circle cx="12" cy="8" r="2"/>
  </svg>
)
const DocIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
  </svg>
)
const LogIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
)
const AlertIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
)

const AdminDashboard = () => {
  const navigate = useNavigate()
  const user = useSelector((s: RootState) => s.auth.user)
  useGetMe()

  const { data: users } = useListUsers()
  const { data: forms } = useListInterestForms()

  if (!user) return <Spinner fullScreen />

  const clanLeaders = users?.filter((u) => u.role === 'clan_leader').length ?? 0
  const generalUsers = users?.filter((u) => u.role === 'general_user').length ?? 0
  const pendingForms = forms?.filter((f) => f.status === 'pending').length ?? 0
  const suspended = users?.filter((u) => u.is_suspended).length ?? 0

  const stats = [
    { label: 'General Users', value: generalUsers, sub: 'registered', color: 'text-primary', onClick: () => navigate('/admin/users') },
    { label: 'Clan Leaders', value: clanLeaders, sub: 'active', color: 'text-secondary', onClick: () => navigate('/admin/clan-leaders') },
    { label: 'Pending Forms', value: pendingForms, sub: 'awaiting review', color: pendingForms > 0 ? 'text-amber-500' : 'text-emerald-500', onClick: () => navigate('/admin/interest-forms') },
    { label: 'Suspended', value: suspended, sub: 'accounts', color: suspended > 0 ? 'text-red-500' : 'text-gray-400', onClick: () => navigate('/admin/users') },
  ]

  const quickActions = [
    { icon: <UsersIcon />, label: 'Manage Users', desc: 'View, suspend or delete', onClick: () => navigate('/admin/users') },
    { icon: <CrownIcon />, label: 'Clan Leaders', desc: 'Create & manage leaders', onClick: () => navigate('/admin/clan-leaders') },
    { icon: <DocIcon />, label: 'Interest Forms', desc: 'Approve new clan requests', onClick: () => navigate('/admin/interest-forms') },
    { icon: <LogIcon />, label: 'Audit Logs', desc: 'Platform activity history', onClick: () => navigate('/admin/audit-logs') },
  ]

  return (
    <div className="flex min-h-screen" style={{ background: '#fafaf8' }}>
      <Sidebar role={user.role} />
      <div className="flex-1 flex flex-col ml-64">
        <main className="flex-1 p-8">

          {/* Header */}
          <div className="flex items-start justify-between mb-7">
            <div>
              <p className="text-xs font-merriweather tracking-[0.25em] text-secondary uppercase mb-1">Admin</p>
              <h1 className="text-2xl font-bold text-gray-900 font-merriweather">Platform Dashboard</h1>
              <p className="text-gray-400 text-sm mt-1 font-merriweather">Overview of all Kinfolk activity</p>
            </div>
            <ApiStatusBadge />
          </div>

          {/* Pending alert */}
          {pendingForms > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 text-amber-600">
                <AlertIcon />
              </div>
              <p className="text-sm text-amber-800 font-merriweather flex-1">
                You have <strong>{pendingForms}</strong> interest form{pendingForms > 1 ? 's' : ''} awaiting review.
              </p>
              <button onClick={() => navigate('/admin/interest-forms')}
                className="text-xs font-merriweather text-amber-700 hover:text-amber-900 font-medium transition-colors underline underline-offset-2">
                Review now
              </button>
            </div>
          )}

          {/* Stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {stats.map((stat) => (
              <button key={stat.label} onClick={stat.onClick}
                className="bg-white border border-gray-100 rounded-2xl p-6 text-left hover:shadow-md hover:border-primary/30 transition-all duration-200 group">
                <p className={`text-4xl font-bold font-merriweather ${stat.color} mb-1`}>{stat.value}</p>
                <p className="text-xs text-gray-400 font-merriweather uppercase tracking-wider">{stat.sub}</p>
                <p className="text-sm text-gray-600 font-merriweather font-medium mt-2">{stat.label}</p>
                <span className="text-primary text-xs font-merriweather opacity-0 group-hover:opacity-100 transition-opacity mt-1 block">View →</span>
              </button>
            ))}
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <button key={action.label} onClick={action.onClick}
                className="bg-white border border-gray-100 rounded-2xl p-5 text-left hover:shadow-md hover:border-primary/30 transition-all duration-200 group">
                <div className="w-10 h-10 rounded-xl bg-primary/10 group-hover:bg-primary/15 flex items-center justify-center text-primary mb-3 transition-colors">
                  {action.icon}
                </div>
                <p className="text-sm font-semibold text-gray-800 font-merriweather">{action.label}</p>
                <p className="text-xs text-gray-400 font-merriweather mt-0.5">{action.desc}</p>
              </button>
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}

export default AdminDashboard
