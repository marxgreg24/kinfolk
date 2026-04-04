import { useState, useRef } from 'react'
import { useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import type { RootState } from '@/store'
import { useAddMember } from '@/hooks/useClanLeader'
import { useGetClanMembers } from '@/hooks/useClan'
import { RELATIONSHIP_TYPES } from '@/utils/relationships'
import Sidebar from '@/components/layout/Sidebar'
import Spinner from '@/components/ui/Spinner'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'

const CLOUDINARY_CLOUD = 'kinfolk'
const CLOUDINARY_PRESET = 'kinfolk_unsigned'
const EMPTY_FORM = { full_name: '', email: '', relationship_to_leader: '' }

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

  const handleChange = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file); fd.append('upload_preset', CLOUDINARY_PRESET)
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, { method: 'POST', body: fd })
      if (!res.ok) throw new Error('Upload failed')
      setProfilePictureUrl(((await res.json()) as { secure_url: string }).secure_url)
    } catch { toast.error('Photo upload failed. Please try again.') }
    finally { setIsUploading(false) }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!user.clan_id || !form.full_name.trim() || !form.relationship_to_leader) return
    addMember(
      { full_name: form.full_name.trim(), email: form.email.trim() || undefined, profile_picture_url: profilePictureUrl || undefined, relationship_to_leader: form.relationship_to_leader },
      { onSuccess: () => { setForm(EMPTY_FORM); setProfilePictureUrl('') } },
    )
  }

  const isDisabled = !user.clan_id || !form.full_name.trim() || !form.relationship_to_leader || isPending || isUploading

  const selectCls = 'w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-merriweather text-gray-900 bg-white hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'

  return (
    <div className="flex min-h-screen" style={{ background: '#fafaf8' }}>
      <Sidebar role={user.role} />
      <div className="flex-1 flex flex-col ml-64">
        <main className="flex-1 p-8">

          <div className="mb-7">
            <p className="text-xs font-merriweather tracking-[0.25em] text-secondary uppercase mb-1">Clan Leader</p>
            <h1 className="text-2xl font-bold text-gray-900 font-merriweather">Add Clan Member</h1>
            <p className="text-gray-400 text-sm mt-1 font-merriweather">Add a new member to your clan and define your relationship to them.</p>
          </div>

          {!user.clan_id && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth={2} className="w-4 h-4">
                  <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p className="text-sm text-amber-800 font-merriweather">You must create a clan before adding members.</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form card */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
              <div className="h-[2px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
              <div className="p-6">
                <h2 className="font-merriweather font-bold text-base text-gray-900 mb-5">Member Details</h2>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <Input label="Full Name" required value={form.full_name} onChange={handleChange('full_name')}
                    placeholder="e.g. Amara Nakato" disabled={!user.clan_id} />
                  <Input label="Email (optional)" type="email" value={form.email} onChange={handleChange('email')}
                    placeholder="member@example.com" disabled={!user.clan_id} />

                  <div>
                    <label className="text-xs font-merriweather font-semibold uppercase tracking-wider text-gray-500 mb-1.5 block">
                      Relationship to You <span className="text-primary">*</span>
                    </label>
                    <select value={form.relationship_to_leader} onChange={handleChange('relationship_to_leader')}
                      disabled={!user.clan_id} required className={selectCls}>
                      <option value="">Select relationship…</option>
                      {RELATIONSHIP_TYPES.map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Photo upload */}
                  <div>
                    <label className="text-xs font-merriweather font-semibold uppercase tracking-wider text-gray-500 mb-1.5 block">
                      Profile Photo <span className="text-gray-300 normal-case tracking-normal font-normal">(optional)</span>
                    </label>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                    {profilePictureUrl ? (
                      <div className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl">
                        <Avatar src={profilePictureUrl} name={form.full_name || 'Member'} size="sm" />
                        <div className="flex-1">
                          <p className="text-xs font-merriweather text-gray-600">Photo uploaded</p>
                          <button type="button" onClick={() => setProfilePictureUrl('')}
                            className="text-xs text-red-400 hover:text-red-600 transition-colors font-merriweather">Remove</button>
                        </div>
                      </div>
                    ) : (
                      <button type="button" onClick={() => fileInputRef.current?.click()} disabled={!user.clan_id}
                        className="w-full border-2 border-dashed border-gray-200 hover:border-primary rounded-xl p-4 text-center transition-colors group disabled:opacity-50">
                        <p className="text-sm text-gray-400 font-merriweather group-hover:text-primary transition-colors">
                          {isUploading ? 'Uploading…' : '+ Upload photo'}
                        </p>
                      </button>
                    )}
                  </div>

                  <Button type="submit" variant="primary" isLoading={isPending} disabled={isDisabled} className="rounded-full py-3 mt-1">
                    Add Member
                  </Button>
                </form>
              </div>
            </div>

            {/* Members list */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
              <div className="h-[2px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
              <div className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-merriweather font-bold text-base text-gray-900">Current Members</h2>
                  <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-merriweather font-medium">{members.length}</span>
                </div>

                {membersLoading && <Spinner />}

                {!membersLoading && members.length === 0 && (
                  <div className="text-center py-10">
                    <p className="text-sm text-gray-400 font-merriweather">No members yet.</p>
                    <p className="text-xs text-gray-300 font-merriweather mt-1">Add your first member using the form.</p>
                  </div>
                )}

                <ul className="flex flex-col gap-2">
                  {members.map((m) => (
                    <li key={m.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                      <Avatar src={m.profile_picture_url} name={m.full_name} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 font-merriweather truncate">{m.full_name}</p>
                        {m.email && <p className="text-xs text-gray-400 font-merriweather truncate">{m.email}</p>}
                      </div>
                      <Badge status="active" label="Member" />
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default AddMemberPage
