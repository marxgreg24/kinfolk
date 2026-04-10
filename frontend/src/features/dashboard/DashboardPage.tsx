import { useState, useEffect, useRef } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { useClerk } from '@clerk/clerk-react'
import notify from '@/utils/toast'
import type { RootState } from '@/store'
import { useGetMe, useUpdateMe, useDeleteMe, useCompleteProfile } from '@/hooks/useAuth'
import { useGetClan, useExportGEDCOM, useGetClanMembers } from '@/hooks/useClan'
import Sidebar from '@/components/layout/Sidebar'
import Spinner from '@/components/ui/Spinner'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import ClanMemberList from '@/components/clan/ClanMemberList'
import apiClient from '@/api/axios'

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
  const [editPicUrl, setEditPicUrl] = useState('')
  const [editUploading, setEditUploading] = useState(false)
  const [editDragOver, setEditDragOver] = useState(false)
  const editFileRef = useRef<HTMLInputElement>(null)

  // ── Profile completion modal (shown once on first login if incomplete) ─────
  const [welcomeOpen, setWelcomeOpen] = useState(false)
  const [wcBirthYear, setWcBirthYear] = useState('')
  const [wcGender, setWcGender] = useState('')
  const [wcPhone, setWcPhone] = useState('')
  const [wcUploading, setWcUploading] = useState(false)
  const [wcPicUrl, setWcPicUrl] = useState('')
  const wcFileRef = useRef<HTMLInputElement>(null)
  const completeProfile = useCompleteProfile()
  const shownWelcomeKey = `kf_welcome_shown_${user?.id ?? ''}`

  useEffect(() => {
    if (!user) return
    const incomplete = !user.birth_year || !user.gender || !user.phone
    if (!incomplete || sessionStorage.getItem(shownWelcomeKey)) return
    sessionStorage.setItem(shownWelcomeKey, '1')
    setWelcomeOpen(true)
  }, [user?.id, shownWelcomeKey])

  const updateMe = useUpdateMe()
  const deleteMe = useDeleteMe()
  const exportGEDCOM = useExportGEDCOM()
  const { data: clan } = useGetClan(user?.clan_id ?? '')
  const { data: clanMembersData, isLoading: membersLoading } = useGetClanMembers(user?.clan_id ?? '')

  if (!user) return <Spinner fullScreen />

  const profileIncomplete = !user.birth_year || !user.gender || !user.phone
  const openEdit = () => {
    setEditName(user.full_name)
    setEditPhone(user.phone ?? '')
    setEditPicUrl(user.profile_picture_url ?? '')
    setEditDragOver(false)
    setEditOpen(true)
  }

  const uploadPhoto = async (file: File) => {
    if (!file.type.startsWith('image/')) { notify.error('Please select an image file.'); return }
    setEditUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await apiClient.post<{ url: string }>('/api/v1/upload/photo', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setEditPicUrl(res.data.url)
    } catch { notify.error('Photo upload failed. Please try again.') }
    finally { setEditUploading(false) }
  }

  const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) void uploadPhoto(file)
    e.target.value = ''
  }

  const handleEditDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setEditDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) void uploadPhoto(file)
  }

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

          {/* Clan Members List */}
          {user.clan_id && (
            <div className="mt-8">
              <ClanMemberList
                members={clanMembersData?.members ?? []}
                isLoading={membersLoading}
              />
            </div>
          )}

          {/* Edit Modal */}
          <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Edit Profile" size="md">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                updateMe.mutate(
                  { full_name: editName, phone: editPhone, profile_picture_url: editPicUrl || undefined },
                  { onSuccess: () => setEditOpen(false) },
                )
              }}
              className="flex flex-col gap-5"
            >
              {/* Photo upload */}
              <div>
                <p className="text-xs font-merriweather font-semibold uppercase tracking-wider text-gray-500 mb-2">
                  Profile Photo
                </p>
                <input
                  ref={editFileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleEditFileChange}
                />

                {editPicUrl ? (
                  /* Preview state */
                  <div className="flex items-center gap-4 p-4 border border-gray-100 rounded-2xl bg-gray-50">
                    <img src={editPicUrl} alt="Preview" className="w-16 h-16 rounded-full object-cover flex-shrink-0 ring-2 ring-primary/20" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-merriweather text-gray-700 font-medium">Photo ready</p>
                      <div className="flex gap-3 mt-1">
                        <button
                          type="button"
                          onClick={() => editFileRef.current?.click()}
                          className="text-xs text-primary hover:text-primary/80 font-merriweather transition-colors"
                        >
                          Change
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditPicUrl('')}
                          className="text-xs text-red-400 hover:text-red-600 font-merriweather transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Drag-and-drop zone */
                  <div
                    onDragOver={(e) => { e.preventDefault(); setEditDragOver(true) }}
                    onDragLeave={() => setEditDragOver(false)}
                    onDrop={handleEditDrop}
                    onClick={() => editFileRef.current?.click()}
                    className={`
                      w-full border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer
                      transition-all duration-200 select-none
                      ${editDragOver
                        ? 'border-primary bg-primary/5 scale-[1.01]'
                        : 'border-gray-200 hover:border-primary/60 hover:bg-gray-50'
                      }
                    `}
                  >
                    {editUploading ? (
                      <div className="flex flex-col items-center gap-2">
                        <Spinner size="sm" />
                        <p className="text-sm text-gray-400 font-merriweather">Uploading…</p>
                      </div>
                    ) : (
                      <>
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 transition-colors ${editDragOver ? 'bg-primary/15' : 'bg-gray-100'}`}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={`w-5 h-5 transition-colors ${editDragOver ? 'text-primary' : 'text-gray-400'}`}>
                            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                            <polyline points="17 8 12 3 7 8"/>
                            <line x1="12" y1="3" x2="12" y2="15"/>
                          </svg>
                        </div>
                        <p className={`text-sm font-merriweather font-medium transition-colors ${editDragOver ? 'text-primary' : 'text-gray-600'}`}>
                          {editDragOver ? 'Drop to upload' : 'Drag & drop or click to browse'}
                        </p>
                        <p className="text-xs text-gray-400 font-merriweather mt-1">PNG, JPG up to 10 MB</p>
                      </>
                    )}
                  </div>
                )}
              </div>

              <Input label="Full Name" name="full_name" value={editName} onChange={(e) => setEditName(e.target.value)} required />
              <Input label="Phone Number" name="phone" type="tel" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} />

              <div className="flex gap-3 justify-end mt-1">
                <Button type="button" variant="outline" size="sm" onClick={() => setEditOpen(false)}>Cancel</Button>
                <Button type="submit" variant="primary" size="sm" isLoading={updateMe.isPending} disabled={editUploading}>
                  Save Changes
                </Button>
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
                onClick={() => deleteMe.mutate(undefined, { onSuccess: async () => { await signOut(); navigate('/login') } })}>
                Delete Account
              </Button>
            </div>
          </Modal>

          {/* Profile Completion Welcome Modal */}
          <Modal isOpen={welcomeOpen} onClose={() => setWelcomeOpen(false)} title="Complete Your Profile" size="md">
            <p className="text-sm text-gray-500 font-merriweather mb-5 leading-relaxed">
              Your clan leader added you — help us personalise your experience by filling in a few details.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                completeProfile.mutate(
                  {
                    birth_year: parseInt(wcBirthYear, 10),
                    gender: wcGender,
                    phone: wcPhone,
                    profile_picture_url: wcPicUrl,
                  },
                  { onSuccess: () => setWelcomeOpen(false) },
                )
              }}
              className="flex flex-col gap-4"
            >
              <Input
                label="Birth Year"
                name="birth_year"
                type="number"
                placeholder={`e.g. ${new Date().getFullYear() - 30}`}
                value={wcBirthYear}
                onChange={(e) => setWcBirthYear(e.target.value)}
                required
              />
              <div>
                <label className="text-xs font-merriweather font-semibold uppercase tracking-wider text-gray-500 mb-1.5 block">
                  Gender <span className="text-primary">*</span>
                </label>
                <select
                  value={wcGender}
                  onChange={(e) => setWcGender(e.target.value)}
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-merriweather text-gray-900 bg-white hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all duration-200"
                >
                  <option value="">Select gender…</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              <Input
                label="Phone Number"
                name="phone"
                type="tel"
                placeholder="+256 700 000 000"
                value={wcPhone}
                onChange={(e) => setWcPhone(e.target.value)}
                required
              />
              {/* Photo upload */}
              <div>
                <label className="text-xs font-merriweather font-semibold uppercase tracking-wider text-gray-500 mb-1.5 block">
                  Profile Photo <span className="text-gray-300 normal-case tracking-normal font-normal">(optional)</span>
                </label>
                <input
                  ref={wcFileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    setWcUploading(true)
                    try {
                      const fd = new FormData()
                      fd.append('file', file)
                      const res = await apiClient.post<{ url: string }>('/api/v1/upload/photo', fd, {
                        headers: { 'Content-Type': 'multipart/form-data' },
                      })
                      setWcPicUrl(res.data.url)
                    } catch { notify.error('Photo upload failed.') }
                    finally { setWcUploading(false) }
                  }}
                />
                {wcPicUrl ? (
                  <div className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl">
                    <Avatar src={wcPicUrl} name={user.full_name} size="sm" />
                    <div className="flex-1">
                      <p className="text-xs font-merriweather text-gray-600">Photo uploaded</p>
                      <button type="button" onClick={() => setWcPicUrl('')}
                        className="text-xs text-red-400 hover:text-red-600 transition-colors font-merriweather">Remove</button>
                    </div>
                  </div>
                ) : (
                  <button type="button" onClick={() => wcFileRef.current?.click()}
                    className="w-full border-2 border-dashed border-gray-200 hover:border-primary rounded-xl p-4 text-center transition-colors group">
                    <p className="text-sm text-gray-400 font-merriweather group-hover:text-primary transition-colors">
                      {wcUploading ? 'Uploading…' : '+ Upload photo'}
                    </p>
                  </button>
                )}
              </div>
              <div className="flex gap-3 justify-end mt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setWelcomeOpen(false)}>
                  Skip for now
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={completeProfile.isPending}
                  disabled={!wcBirthYear || !wcGender || !wcPhone || completeProfile.isPending}
                >
                  Save Details
                </Button>
              </div>
            </form>
          </Modal>
        </main>
      </div>
    </div>
  )
}

export default DashboardPage
