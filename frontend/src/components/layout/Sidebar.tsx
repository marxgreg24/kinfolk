import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { useSelector } from 'react-redux'
import type { RootState } from '@/store'
import KinfolkWordmark from '@/components/ui/KinfolkWordmark'
import Avatar from '@/components/ui/Avatar'

type Role = 'general_user' | 'clan_leader' | 'admin'

interface NavItem {
  label: string
  to: string
  icon: React.ReactNode
}

interface SidebarProps {
  role: Role
}

const Icon = ({ path, viewBox = '0 0 24 24' }: { path: React.ReactNode; viewBox?: string }) => (
  <svg viewBox={viewBox} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 flex-shrink-0">
    {path}
  </svg>
)

const navItems: Record<Role, NavItem[]> = {
  general_user: [
    { label: 'Dashboard', to: '/dashboard', icon: <Icon path={<><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></>} /> },
    { label: 'My Clan', to: '/clan', icon: <Icon path={<><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></>} /> },
    { label: 'Family Tree', to: '/clan/tree', icon: <Icon path={<><circle cx="12" cy="4" r="2"/><circle cx="6" cy="14" r="2"/><circle cx="18" cy="14" r="2"/><path d="M12 6v4M12 10l-4 2M12 10l4 2"/><circle cx="12" cy="20" r="2"/><path d="M12 16v2"/></>} /> },
    { label: 'Clan Chat', to: '/clan/chat', icon: <Icon path={<path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>} /> },
  ],
  clan_leader: [
    { label: 'Dashboard', to: '/clan-leader/dashboard', icon: <Icon path={<><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></>} /> },
    { label: 'My Clan', to: '/clan-leader/my-clan', icon: <Icon path={<><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></>} /> },
    { label: 'Add Member', to: '/clan-leader/members/add', icon: <Icon path={<><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></>} /> },
    { label: 'Member Interests', to: '/clan-leader/member-interests', icon: <Icon path={<><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></>} /> },
    { label: 'Family Tree', to: '/clan/tree', icon: <Icon path={<><circle cx="12" cy="4" r="2"/><circle cx="6" cy="14" r="2"/><circle cx="18" cy="14" r="2"/><path d="M12 6v4M12 10l-4 2M12 10l4 2"/><circle cx="12" cy="20" r="2"/><path d="M12 16v2"/></>} /> },
    { label: 'Conflicts', to: '/clan-leader/conflicts', icon: <Icon path={<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>} /> },
    { label: 'Clan Chat', to: '/clan/chat', icon: <Icon path={<path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>} /> },
  ],
  admin: [
    { label: 'Dashboard', to: '/admin', icon: <Icon path={<><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></>} /> },
    { label: 'Users', to: '/admin/users', icon: <Icon path={<><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></>} /> },
    { label: 'Clan Leaders', to: '/admin/clan-leaders', icon: <Icon path={<><path d="M2 20h20M4 20l2-8 6 4 6-4 2 8"/><circle cx="12" cy="8" r="2"/></>} /> },
    { label: 'Interest Forms', to: '/admin/interest-forms', icon: <Icon path={<><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></>} /> },
    { label: 'Audit Logs', to: '/admin/audit-logs', icon: <Icon path={<><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>} /> },
  ],
}

const Sidebar = ({ role }: SidebarProps) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { signOut } = useAuth()
  const user = useSelector((s: RootState) => s.auth.user)
  const items = navItems[role]

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <aside className="fixed left-0 top-0 w-64 min-h-screen flex flex-col bg-white border-r border-gray-100 shadow-sm z-30">
      {/* Logo */}
      <div className="flex flex-col items-center px-6 py-6 border-b border-gray-50">
        <KinfolkWordmark
          uppercase
          className="font-merriweather font-bold text-xl tracking-[0.12em] text-gray-900"
        />
        <span className="text-[8px] font-merriweather tracking-[0.3em] text-secondary uppercase mt-0.5">
          Preserve Your Roots
        </span>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-0.5 p-3 flex-1">
        {items.map((item) => {
          const isActive = location.pathname === item.to
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-merriweather font-medium
                transition-all duration-150
                ${isActive
                  ? 'bg-primary/10 text-primary border border-primary/15'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800 border border-transparent'
                }
              `.trim()}
            >
              <span className={isActive ? 'text-primary' : 'text-gray-400'}>{item.icon}</span>
              {item.label}
              {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />}
            </Link>
          )
        })}
      </nav>

      {/* User profile + sign out */}
      <div className="border-t border-gray-100 p-4">
        <div className="flex items-center gap-3 mb-3 min-w-0">
          <Avatar
            src={user?.profile_picture_url}
            name={user?.full_name ?? 'User'}
            size="sm"
          />
          <div className="flex flex-col min-w-0">
            <p className="text-sm font-merriweather font-medium text-gray-900 truncate">{user?.full_name ?? 'User'}</p>
            <p className="text-[11px] text-gray-400 truncate">{user?.email ?? ''}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-merriweather font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all duration-150 border border-transparent hover:border-red-100"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 flex-shrink-0">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
          </svg>
          Sign Out
        </button>
      </div>

      {/* Bottom gold rule */}
      <div className="h-[2px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
    </aside>
  )
}

export default Sidebar
