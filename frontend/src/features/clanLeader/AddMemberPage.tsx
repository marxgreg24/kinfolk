import { useState, useRef } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate, useSearchParams } from 'react-router-dom'
import notify from '@/utils/toast'
import type { RootState } from '@/store'
import { useAddMember } from '@/hooks/useClanLeader'
import { useGetClanMembers } from '@/hooks/useClan'
import { useListFamilies, useCreateFamily } from '@/hooks/useFamilies'
import { useArchiveClanMemberInterest } from '@/hooks/useClanMemberInterests'
import { RELATIONSHIP_TYPES } from '@/utils/relationships'
import Sidebar from '@/components/layout/Sidebar'
import Spinner from '@/components/ui/Spinner'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Avatar from '@/components/ui/Avatar'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import apiClient from '@/api/axios'

const EMPTY_FORM = { full_name: '', email: '', relationship_type: '', family_id: '' }

const AddMemberPage = () => {
  const navigate = useNavigate()
  const user = useSelector((s: RootState) => s.auth.user)
  const [searchParams] = useSearchParams()

  // Pre-fill from query params when navigated from MemberInterestsPage
  const prefillName = searchParams.get('full_name') ?? ''
  const prefillEmail = searchParams.get('email') ?? ''
  const interestId = searchParams.get('interest_id')

  const { mutate: addMember, isPending } = useAddMember(user?.clan_id ?? '')
  const { data: clanMembersData, isLoading: membersLoading } = useGetClanMembers(user?.clan_id ?? '')
  const members = clanMembersData?.members ?? []

  const { data: families = [], isLoading: familiesLoading } = useListFamilies()
  const { mutate: archiveInterest } = useArchiveClanMemberInterest()

  const [form, setForm] = useState({ ...EMPTY_FORM, full_name: prefillName, email: prefillEmail })
  const [profilePictureUrl, setProfilePictureUrl] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Inline family creation modal
  const [createFamilyOpen, setCreateFamilyOpen] = useState(false)
  const [newFamilyName, setNewFamilyName] = useState('')
  const { mutate: createFamily, isPending: isCreatingFamily } = useCreateFamily(() => {
    setCreateFamilyOpen(false)
    setNewFamilyName('')
  })

  if (!user) return <Spinner fullScreen />

  const handleChange = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await apiClient.post<{ url: string }>('/api/v1/upload/photo', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setProfilePictureUrl(res.data.url)
    } catch { notify.error('Photo upload failed. Please try again.') }
    finally { setIsUploading(false) }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!user.clan_id || !form.full_name.trim() || !form.email.trim() || !form.relationship_type || !form.family_id) return
    addMember(
      {
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        relationship_type: form.relationship_type,
        family_id: form.family_id,
        profile_picture_url: profilePictureUrl || undefined,
      },
      {
        onSuccess: () => {
          setForm(EMPTY_FORM)
          setProfilePictureUrl('')
          // Archive the interest form that led to this add, if any
          if (interestId) archiveInterest(interestId)
        },
      },
    )
  }

  const isDisabled = !user.clan_id || !form.full_name.trim() || !form.email.trim() ||
    !form.relationship_type || !form.family_id || isPending || isUploading

  const selectCls = 'w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-merriweather text-gray-900 bg-white hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'

  return (
    <div className="flex min-h-screen" style={{ background: '#fafaf8' }}>
      <Sidebar role={user.role} />
      <div className="flex-1 flex flex-col ml-64">
        <main className="flex-1 p-8">

          <div className="mb-7">
            <p className="text-xs font-merriweather tracking-[0.25em] text-secondary uppercase mb-1">Clan Leader</p>
            <h1 className="text-2xl font-bold text-gray-900 font-merriweather">Add Clan Member</h1>
            <p className="text-gray-400 text-sm mt-1 font-merriweather">Add a new member to your clan, assign them a family, and define your relationship.</p>
          </div>

          {!user.clan_id && (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <p className="font-merriweather text-gray-500 text-sm">You must create a clan first.</p>
              <Button variant="primary" onClick={() => navigate('/clan-leader/create')} className="rounded-full">
                Create Clan
              </Button>
            </div>
          )}

          <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 ${!user.clan_id ? 'hidden' : ''}`}>
            {/* Form card */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
              <div className="h-[2px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
              <div className="p-6">
                <h2 className="font-merriweather font-bold text-base text-gray-900 mb-5">Member Details</h2>
                {interestId && (
                  <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 mb-4 text-xs font-merriweather text-primary">
                    Pre-filled from interest form — complete and submit to add this person to your clan.
                  </div>
                )}
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <Input label="Full Name" required value={form.full_name} onChange={handleChange('full_name')}
                    placeholder="e.g. Amara Nakato" disabled={!user.clan_id} />
                  <Input label="Email Address" required type="email" value={form.email} onChange={handleChange('email')}
                    placeholder="member@example.com" disabled={!user.clan_id} />

                  {/* Family selector */}
                  <div>
                    <label className="text-xs font-merriweather font-semibold uppercase tracking-wider text-gray-500 mb-1.5 block">
                      Family <span className="text-primary">*</span>
                    </label>
                    {familiesLoading ? (
                      <div className="flex items-center gap-2 py-2">
                        <Spinner size="sm" />
                        <span className="text-xs text-gray-400 font-merriweather">Loading families…</span>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <select
                          value={form.family_id}
                          onChange={handleChange('family_id')}
                          disabled={!user.clan_id}
                          required
                          className={selectCls + ' flex-1'}
                        >
                          <option value="">Select family…</option>
                          {families.map((f) => (
                            <option key={f.id} value={f.id}>{f.name}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => setCreateFamilyOpen(true)}
                          className="px-3 py-2 border border-gray-200 rounded-xl text-xs font-merriweather text-primary hover:border-primary/40 hover:bg-primary/5 transition-colors flex-shrink-0"
                          title="Create a new family"
                        >
                          + New
                        </button>
                      </div>
                    )}
                    {!familiesLoading && families.length === 0 && (
                      <p className="text-xs text-amber-600 font-merriweather mt-1">
                        No families yet — click &quot;+ New&quot; to create one first.
                      </p>
                    )}
                  </div>

                  {/* Relationship selector */}
                  <div>
                    <label className="text-xs font-merriweather font-semibold uppercase tracking-wider text-gray-500 mb-1.5 block">
                      Relationship to You <span className="text-primary">*</span>
                    </label>
                    <select value={form.relationship_type} onChange={handleChange('relationship_type')}
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
                  {members.map((m) => {
                    const familyName = m.family_id ? families.find((f) => f.id === m.family_id)?.name : undefined
                    return (
                      <li key={m.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                        <Avatar src={m.profile_picture_url} name={m.full_name} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 font-merriweather truncate">{m.full_name}</p>
                          {familyName
                            ? <p className="text-xs text-gray-400 font-merriweather truncate">{familyName}</p>
                            : m.email && <p className="text-xs text-gray-400 font-merriweather truncate">{m.email}</p>
                          }
                        </div>
                        <Badge status="active" label="Member" />
                      </li>
                    )
                  })}
                </ul>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Create family modal */}
      <Modal isOpen={createFamilyOpen} onClose={() => setCreateFamilyOpen(false)} title="Create New Family" size="sm">
        <p className="text-sm text-gray-500 font-merriweather mb-4 leading-relaxed">
          Give this family a name. You can add more families any time.
        </p>
        <form
          onSubmit={(e) => { e.preventDefault(); if (newFamilyName.trim()) createFamily({ name: newFamilyName.trim() }) }}
          className="flex flex-col gap-4"
        >
          <Input
            label="Family Name"
            required
            value={newFamilyName}
            onChange={(e) => setNewFamilyName(e.target.value)}
            placeholder="e.g. The Nakato Family"
          />
          <div className="flex gap-3 justify-end">
            <Button type="button" variant="outline" size="sm" onClick={() => setCreateFamilyOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isCreatingFamily} disabled={!newFamilyName.trim()}>
              Create Family
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default AddMemberPage
