import { useState, useRef } from 'react'
import { useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import type { RootState } from '@/store'
import { useAddMember } from '@/hooks/useClanLeader'
import { useGetClanMembers } from '@/hooks/useClan'
import { RELATIONSHIP_TYPES } from '@/utils/relationships'
import Navbar from '@/components/layout/Navbar'
import Sidebar from '@/components/layout/Sidebar'
import Spinner from '@/components/ui/Spinner'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'

const CLOUDINARY_CLOUD = 'kinfolk'
const CLOUDINARY_PRESET = 'kinfolk_unsigned'

const EMPTY_FORM = {
  full_name: '',
  email: '',
  relationship_to_leader: '',
}

const AddMemberPage = () => {
  const user = useSelector((s: RootState) => s.auth.user)
  const { mutate: addMember, isPending } = useAddMember(user?.clan_id ?? '')
  const { data: clanMembersData, isLoading: membersLoading } = useGetClanMembers(user?.clan_id ?? '')
  const members = clanMembersData?.members ?? []

  const [form, setForm] = useState(EMPTY_FORM)
  const [profilePictureUrl, setProfilePictureUrl] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!user) return <Spinner fullScreen />

  const handleChange = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('upload_preset', CLOUDINARY_PRESET)
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`,
        { method: 'POST', body: fd },
      )
      if (!res.ok) throw new Error('Upload failed')
      const data = (await res.json()) as { secure_url: string }
      setProfilePictureUrl(data.secure_url)
    } catch {
      toast.error('Photo upload failed. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!user.clan_id || !form.full_name.trim() || !form.relationship_to_leader) return
    addMember(
      {
        full_name: form.full_name.trim(),
        email: form.email.trim() || undefined,
        profile_picture_url: profilePictureUrl || undefined,
        relationship_to_leader: form.relationship_to_leader,
      },
      {
        onSuccess: () => {
          setForm(EMPTY_FORM)
          setProfilePictureUrl('')
        },
      },
    )
  }

  const isDisabled = !user.clan_id || !form.full_name.trim() || !form.relationship_to_leader || isPending || isUploading

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role={user.role} />

      <div className="flex-1 flex flex-col ml-64">
        <Navbar />

        <main className="flex-1 p-8">
          <h1 className="text-2xl font-bold text-gray-900 font-merriweather mb-6">
            Add Clan Member
          </h1>

          {!user.clan_id && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-yellow-800 font-merriweather">
                You must create a clan before adding members.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Form */}
            <div className="bg-white border border-gray-100 rounded-xl p-6">
              <h2 className="font-semibold text-gray-800 font-merriweather mb-4">Member Details</h2>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <Input
                  label="Full Name"
                  required
                  value={form.full_name}
                  onChange={handleChange('full_name')}
                  placeholder="e.g. Amara Nakato"
                  disabled={!user.clan_id}
                />
                <Input
                  label="Email (optional)"
                  type="email"
                  value={form.email}
                  onChange={handleChange('email')}
                  placeholder="member@example.com"
                  disabled={!user.clan_id}
                />

                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700 font-merriweather">
                    Relationship to You
                  </label>
                  <select
                    value={form.relationship_to_leader}
                    onChange={handleChange('relationship_to_leader')}
                    disabled={!user.clan_id}
                    required
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm font-merriweather focus:ring-2 focus:ring-primary outline-none disabled:opacity-50"
                  >
                    <option value="">Select relationship...</option>
                    {RELATIONSHIP_TYPES.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700 font-merriweather">
                    Profile Photo (optional)
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <div className="flex items-center gap-3">
                    {profilePictureUrl && (
                      <Avatar src={profilePictureUrl} name={form.full_name || 'Member'} size="sm" />
                    )}
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      isLoading={isUploading}
                      disabled={!user.clan_id}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {profilePictureUrl ? 'Change Photo' : 'Upload Photo'}
                    </Button>
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isPending}
                  disabled={isDisabled}
                >
                  Add Member
                </Button>
              </form>
            </div>

            {/* Member list */}
            <div className="bg-white border border-gray-100 rounded-xl p-6">
              <h2 className="font-semibold text-gray-800 font-merriweather mb-4">
                Current Members ({members.length})
              </h2>

              {membersLoading && <Spinner />}

              {!membersLoading && members.length === 0 && (
                <p className="text-sm text-gray-400 font-merriweather">No members yet.</p>
              )}

              <ul className="flex flex-col gap-3">
                {members.map((m) => (
                  <li key={m.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <Avatar src={m.profile_picture_url} name={m.full_name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 font-merriweather">{m.full_name}</p>
                      {m.email && <p className="text-xs text-gray-400">{m.email}</p>}
                    </div>
                    <Badge status="active" label="Member" />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default AddMemberPage
