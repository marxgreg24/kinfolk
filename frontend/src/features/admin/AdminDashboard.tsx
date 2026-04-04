import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import type { RootState } from '@/store'
import { useGetMe } from '@/hooks/useAuth'
import { useListUsers, useListInterestForms } from '@/hooks/useAdmin'
import Navbar from '@/components/layout/Navbar'
import Sidebar from '@/components/layout/Sidebar'
import Spinner from '@/components/ui/Spinner'
import ApiStatusBadge from '@/components/ui/ApiStatusBadge'

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
    { label: 'General Users', value: generalUsers, onClick: () => navigate('/admin/users') },
    { label: 'Clan Leaders', value: clanLeaders, onClick: () => navigate('/admin/clan-leaders') },
    { label: 'Pending Forms', value: pendingForms, onClick: () => navigate('/admin/interest-forms') },
    { label: 'Suspended', value: suspended, onClick: () => navigate('/admin/users') },
  ]

  const quickActions = [
    { abbr: 'US', label: 'Manage Users', onClick: () => navigate('/admin/users') },
    { abbr: 'CL', label: 'Clan Leaders', onClick: () => navigate('/admin/clan-leaders') },
    { abbr: 'IF', label: 'Interest Forms', onClick: () => navigate('/admin/interest-forms') },
    { abbr: 'AL', label: 'Audit Logs', onClick: () => navigate('/admin/audit-logs') },
  ]

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role={user.role} />

      <div className="flex-1 flex flex-col ml-64">
        <Navbar />

        <main className="flex-1 p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 font-merriweather">
                Admin Dashboard
              </h1>
              <p className="text-secondary text-sm mt-1">Platform overview</p>
            </div>
            <ApiStatusBadge />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
        </main>
      </div>
    </div>
  )
}

export default AdminDashboard
