import { useState } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { useClerk } from '@clerk/clerk-react'
import toast from 'react-hot-toast'
import type { RootState } from '@/store'
import { useGetMe, useUpdateMe, useDeleteMe } from '@/hooks/useAuth'
import { useGetClan, useExportGEDCOM } from '@/hooks/useClan'
import Navbar from '@/components/layout/Navbar'
import Sidebar from '@/components/layout/Sidebar'
import Spinner from '@/components/ui/Spinner'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'

const DashboardPage = () => {
  const navigate = useNavigate()
  const { signOut } = useClerk()
  const user = useSelector((state: RootState) => state.auth.user)

  // Populate Redux if not already there
  useGetMe()

  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editName, setEditName] = useState('')
  const [editPhone, setEditPhone] = useState('')

  const updateMe = useUpdateMe()
  const deleteMe = useDeleteMe()
  const exportGEDCOM = useExportGEDCOM()

  const { data: clan } = useGetClan(user?.clan_id ?? '')

  if (!user) {
    return <Spinner fullScreen />
  }

  const openEdit = () => {
    setEditName(user.full_name)
    setEditPhone(user.phone ?? '')
    setEditOpen(true)
  }

  const profileIncomplete = !user.birth_year || !user.gender || !user.phone

  const quickActions = [
    {
      abbr: 'FT',
      label: 'View Family Tree',
      onClick: () => navigate('/clan/tree'),
      isPending: false,
    },
    {
      abbr: 'GC',
      label: 'Group Clan Chat',
      onClick: () => navigate('/clan/chat'),
      isPending: false,
    },
    {
      abbr: 'MC',
      label: 'View Clan Members',
      onClick: () => navigate('/clan'),
      isPending: false,
    },
    {
      abbr: 'GE',
      label: 'Export GEDCOM',
      onClick: () => {
        if (!user?.clan_id) {
          toast.error('You must be part of a clan to export.')
          return
        }
        exportGEDCOM.mutate(user.clan_id)
      },
      isPending: exportGEDCOM.isPending,
    },
  ]

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role={user.role} />

      <div className="flex-1 flex flex-col ml-64">
        <Navbar />

        <main className="flex-1 p-8">
          {/* Welcome header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 font-merriweather">
              Welcome back, {user.full_name}
            </h1>
            {clan && (
              <p className="text-secondary text-sm mt-1">{clan.name} Clan</p>
            )}
          </div>

          {/* Profile incomplete banner */}
          {profileIncomplete && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 flex items-center justify-between gap-4">
              <p className="text-sm text-yellow-800 font-merriweather">
                Your profile is incomplete. Add your birth year, gender, and phone number.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/complete-profile')}
              >
                Complete Profile
              </Button>
            </div>
          )}

          {/* Quick action cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {quickActions.map((action) => (
              <button
                key={action.abbr}
                onClick={action.onClick}
                disabled={action.isPending}
                className="bg-white border border-gray-100 rounded-xl p-6 text-center cursor-pointer hover:shadow-md transition-shadow hover:border-primary disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {action.isPending ? (
                  <div className="flex justify-center mb-1">
                    <Spinner size="sm" />
                  </div>
                ) : (
                  <p className="text-3xl text-primary font-bold font-merriweather">
                    {action.abbr}
                  </p>
                )}
                <p className="text-sm text-gray-600 mt-2 font-merriweather">{action.label}</p>
              </button>
            ))}
          </div>

          {/* User info card */}
          <div className="bg-white border border-gray-100 rounded-xl p-6">
            <div className="flex items-center gap-4">
              <Avatar
                src={user.profile_picture_url}
                name={user.full_name}
                size="lg"
              />
              <div className="flex flex-col gap-1 flex-1">
                <p className="font-semibold text-gray-900 font-merriweather text-lg">
                  {user.full_name}
                </p>
                <p className="text-sm text-gray-500">{user.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge status={user.role} label={user.role.replace('_', ' ')} />
                  {clan && (
                    <span className="text-xs text-gray-400">{clan.name}</span>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-2 ml-auto">
                <Button variant="outline" size="sm" onClick={openEdit}>
                  Edit Profile
                </Button>
                <Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)}>
                  Delete Account
                </Button>
              </div>
            </div>
          </div>

          {/* Edit Profile Modal */}
          <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Edit Profile" size="md">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                updateMe.mutate(
                  { full_name: editName, phone: editPhone },
                  { onSuccess: () => setEditOpen(false) },
                )
              }}
              className="flex flex-col gap-4"
            >
              <Input
                label="Full Name"
                name="full_name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
              />
              <Input
                label="Phone Number"
                name="phone"
                type="tel"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
              />
              <div className="flex gap-3 justify-end mt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setEditOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" isLoading={updateMe.isPending}>
                  Save Changes
                </Button>
              </div>
            </form>
          </Modal>

          {/* Delete Account Confirmation Modal */}
          <Modal isOpen={deleteOpen} onClose={() => setDeleteOpen(false)} title="Delete Account" size="sm">
            <p className="text-sm text-gray-700 font-merriweather mb-6">
              Are you sure you want to delete your account? This cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" size="sm" onClick={() => setDeleteOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                isLoading={deleteMe.isPending}
                onClick={() =>
                  deleteMe.mutate(undefined, {
                    onSuccess: async () => {
                      await signOut()
                      navigate('/')
                    },
                  })
                }
              >
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
