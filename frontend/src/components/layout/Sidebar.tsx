import { Link, useLocation } from 'react-router-dom'

type Role = 'general_user' | 'clan_leader' | 'admin'

interface NavItem {
  label: string
  to: string
}

interface SidebarProps {
  role: Role
}

const navItems: Record<Role, NavItem[]> = {
  general_user: [
    { label: 'Dashboard', to: '/dashboard' },
    { label: 'My Clan', to: '/clan' },
    { label: 'Family Tree', to: '/clan/tree' },
    { label: 'Clan Chat', to: '/clan/chat' },
  ],
  clan_leader: [
    { label: 'Dashboard', to: '/clan-leader/dashboard' },
    { label: 'Add Member', to: '/clan-leader/members/add' },
    { label: 'Family Tree', to: '/clan/tree' },
    { label: 'Conflicts', to: '/clan-leader/conflicts' },
    { label: 'Clan Chat', to: '/clan/chat' },
  ],
  admin: [
    { label: 'Dashboard', to: '/admin' },
    { label: 'Users', to: '/admin/users' },
    { label: 'Clan Leaders', to: '/admin/clan-leaders' },
    { label: 'Interest Forms', to: '/admin/interest-forms' },
    { label: 'Audit Logs', to: '/admin/audit-logs' },
  ],
}

const Sidebar = ({ role }: SidebarProps) => {
  const location = useLocation()
  const items = navItems[role]

  return (
    <aside className="fixed left-0 top-0 w-64 bg-white border-r border-gray-100 min-h-screen pt-6">
      <nav className="flex flex-col gap-1">
        {items.map((item) => {
          const isActive = location.pathname === item.to
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`
                flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg mx-2
                font-merriweather transition-colors duration-150
                ${
                  isActive
                    ? 'bg-primary bg-opacity-10 text-primary font-semibold'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-primary'
                }
              `.trim()}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}

export default Sidebar
