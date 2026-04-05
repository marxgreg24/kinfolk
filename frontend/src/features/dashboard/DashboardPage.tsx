import { useState } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { useClerk } from '@clerk/clerk-react'
import notify from '@/utils/toast'
import type { RootState } from '@/store'
import { useGetMe, useUpdateMe, useDeleteMe } from '@/hooks/useAuth'
import { useGetClan, useExportGEDCOM } from '@/hooks/useClan'
import Sidebar from '@/components/layout/Sidebar'
import Spinner from '@/components/ui/Spinner'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'

// ── Icons ─────────────────────────────────────────────────────────────────────
const TreeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <circle cx="12" cy="4" r="2"/><circle cx="6" cy="14" r="2"/><circle cx="18" cy="14" r="2"/>
    <path d="M12 6v4M12 10l-4 2M12 10l4 2"/>
    <circle cx="12" cy="20" r="2"/><path d="M12 16v2"/>
  </svg>
)
const ChatIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
  </svg>
)
const UsersIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
  </svg>
)
const DownloadIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
)

const DashboardPage = () => {
  const navigate = useNavigate()
  const { signOut } = useClerk()
  const user = useSelector((state: RootState) => state.auth.user)

  useGetMe()

  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editName, setEditName] = useState('')
  const [editPhone, setEditPhone] = useState('')

  const updateMe = useUpdateMe()
  const deleteMe = useDeleteMe()
  const exportGEDCOM = useExportGEDCOM()
  const { data: clan } = useGetClan(user?.clan_id ?? '')

  if (!user) return <Spinner fullScreen />

  const openEdit = () => { setEditName(user.full_name); setEditPhone(user.phone ?? ''); setEditOpen(true) }
  const profileIncomplete = !user.birth_year || !user.gender || !user.phone

  const quickActions = [
    { icon: <TreeIcon />, label: 'Family Tree', desc: 'View your clan tree', onClick: () => navigate('/clan/tree'), isPending: false },
    { icon: <ChatIcon />, label: 'Clan Chat', desc: 'Message your clan', onClick: () => navigate('/clan/chat'), isPending: false },
    { icon: <UsersIcon />, label: 'Clan Members', desc: 'See all members', onClick: () => navigate('/clan'), isPending: false },
    {
      icon: <DownloadIcon />, label: 'Export GEDCOM', desc: 'Download genealogy file',
      onClick: () => {
        if (!user?.clan_id) { notify.error('You must be part of a clan to export.'); return }
        exportGEDCOM.mutate(user.clan_id)
      },
      isPending: exportGEDCOM.isPending,
    },
  ]

  return (
    <div className="flex min-h-screen" style={{ background: '#fafaf8' }}>
      <Sidebar role={user.role} />
      <div className="flex-1 flex flex-col ml-64">
        <main className="flex-1 p-8">

          {/* Header */}
          <div className="mb-7">

            <h1 className="text-2xl font-bold text-gray-900 font-merriweather">
              Welcome back, <span className="text-primary">{user.full_name.split(' ')[0]}</span>
            </h1>
            {clan && <p className="text-gray-400 text-sm mt-1 font-merriweather">{clan.name} Clan</p>}
          </div>

          {/* Profile incomplete banner */}
          {profileIncomplete && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth={2} className="w-4 h-4">
                    <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p className="text-sm text-amber-800 font-merriweather">Your profile is incomplete — add your birth year, gender and phone number.</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate('/complete-profile')} className="flex-shrink-0">
                Complete Profile
              </Button>
            </div>
          )}

          {/* Quick action cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={action.onClick}
                disabled={action.isPending}
                className="bg-white border border-gray-100 rounded-2xl p-5 text-left hover:shadow-md hover:border-primary/30 transition-all duration-200 group disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 group-hover:bg-primary/15 flex items-center justify-center text-primary mb-3 transition-colors">
                  {action.isPending ? <Spinner size="sm" /> : action.icon}
                </div>
                <p className="text-sm font-semibold text-gray-800 font-merriweather">{action.label}</p>
                <p className="text-xs text-gray-400 font-merriweather mt-0.5">{action.desc}</p>
              </button>
            ))}
          </div>

          {/* Profile card */}
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
            <div className="h-[3px] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
            <div className="p-6 flex items-center gap-5">
              <Avatar src={user.profile_picture_url} name={user.full_name} size="lg" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 font-merriweather text-lg leading-tight">{user.full_name}</p>
                <p className="text-sm text-gray-400 font-merriweather mt-0.5">{user.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge status={user.role} label={user.role.replace('_', ' ')} />
                  {clan && <span className="text-xs text-gray-400 font-merriweather">{clan.name}</span>}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Button variant="outline" size="sm" onClick={openEdit}>Edit Profile</Button>
                <Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)}>Delete Account</Button>
              </div>
            </div>
            {/* Info grid */}
            <div className="border-t border-gray-50 grid grid-cols-3 divide-x divide-gray-50">
              {[
                { label: 'Birth Year', value: user.birth_year ?? '—' },
                { label: 'Gender', value: user.gender ? user.gender.charAt(0).toUpperCase() + user.gender.slice(1) : '—' },
                { label: 'Phone', value: user.phone ?? '—' },
              ].map((item) => (
                <div key={item.label} className="px-6 py-4">
                  <p className="text-[10px] font-merriweather uppercase tracking-widest text-gray-400 mb-0.5">{item.label}</p>
                  <p className="text-sm font-merriweather text-gray-700 font-medium">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Edit Modal */}
          <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Edit Profile" size="md">
            <form onSubmit={(e) => { e.preventDefault(); updateMe.mutate({ full_name: editName, phone: editPhone }, { onSuccess: () => setEditOpen(false) }) }} className="flex flex-col gap-4">
              <Input label="Full Name" name="full_name" value={editName} onChange={(e) => setEditName(e.target.value)} required />
              <Input label="Phone Number" name="phone" type="tel" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />
              <div className="flex gap-3 justify-end mt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setEditOpen(false)}>Cancel</Button>
                <Button type="submit" variant="primary" size="sm" isLoading={updateMe.isPending}>Save Changes</Button>
              </div>
            </form>
          </Modal>

          {/* Delete Modal */}
          <Modal isOpen={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete Account" size="sm">
            <p className="text-sm text-gray-600 font-merriweather mb-6 leading-relaxed">
              Are you sure you want to permanently delete your account? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" size="sm" onClick={() => setDeleteOpen(false)}>Cancel</Button>
              <Button variant="danger" size="sm" isLoading={deleteMe.isPending}
                onClick={() => deleteMe.mutate(undefined, { onSuccess: async () => { await signOut(); navigate('/') } })}>
                Delete Account
              </Button>
            </div>
          </Modal>
        </main>
      </div>
    </div>
  )
}

export default DashboardPage
