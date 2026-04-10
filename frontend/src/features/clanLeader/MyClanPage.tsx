import { useState } from 'react'
import { useSelector } from 'react-redux'
import { useQueryClient } from '@tanstack/react-query'
import type { RootState } from '@/store'
import { useGetClanMembers, useGetClanRelationships, useUpdateRelationshipType } from '@/hooks/useClan'
import { RELATIONSHIP_TYPES, getRelationshipLabel } from '@/utils/relationships'
import { submitRelationship } from '@/api/relationships'
import notify from '@/utils/toast'
import Sidebar from '@/components/layout/Sidebar'
import Spinner from '@/components/ui/Spinner'
import Avatar from '@/components/ui/Avatar'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import type { Member } from '@/types/member'
import type { Relationship, RelationshipType } from '@/types/relationship'

const MyClanPage = () => {
  const user = useSelector((s: RootState) => s.auth.user)
  const clanId = user?.clan_id ?? ''
  const queryClient = useQueryClient()

  const { data: clanMembersData, isLoading: membersLoading } = useGetClanMembers(clanId)
  const { data: relationships = [], isLoading: relsLoading } = useGetClanRelationships(clanId)
  const { mutate: updateRelType, isPending: isUpdating } = useUpdateRelationshipType(clanId)

  const members: Member[] = (clanMembersData?.members ?? []).filter(
    // The clan leader cannot declare a relationship with themselves.
    (m) => m.user_id !== user?.id,
  )

  // Only direct (non-inferred) relationships submitted by the clan leader
  const myRelationships = relationships.filter(
    (r) => r.from_user_id === user?.id && !r.is_inferred,
  )
  const relByMember = new Map<string, Relationship>(
    myRelationships.map((r) => [r.to_member_id, r]),
  )

  // Unified set/edit modal state
  const [modalTarget, setModalTarget] = useState<{ rel: Relationship | null; member: Member } | null>(null)
  const [modalType, setModalType] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const openModal = (member: Member) => {
    const rel = relByMember.get(member.id) ?? null
    setModalTarget({ rel, member })
    setModalType(rel?.relationship_type ?? '')
  }

  const handleSave = async () => {
    if (!modalTarget || !modalType) return
    setIsSaving(true)
    try {
      if (modalTarget.rel) {
        // Update existing relationship
        updateRelType(
          { id: modalTarget.rel.id, relationship_type: modalType },
          { onSuccess: () => setModalTarget(null) },
        )
      } else {
        // Create new relationship
        await submitRelationship({
          to_member_id: modalTarget.member.id,
          clan_id: clanId,
          relationship_type: modalType as RelationshipType,
        })
        void queryClient.invalidateQueries({ queryKey: ['clan-relationships', clanId] })
        notify.success('Relationship set.')
        setModalTarget(null)
      }
    } catch {
      notify.error('Failed to save relationship. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const isLoading = membersLoading || relsLoading

  const selectCls =
    'w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-merriweather text-gray-900 bg-white hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all duration-200'

  if (!user) return <Spinner fullScreen />

  return (
    <div className="flex min-h-screen" style={{ background: '#fafaf8' }}>
      <Sidebar role={user.role} />
      <div className="flex-1 flex flex-col ml-64">
        <main className="flex-1 p-8">

          <div className="mb-7">
            <p className="text-xs font-merriweather tracking-[0.25em] text-secondary uppercase mb-1">Clan Leader</p>
            <h1 className="text-2xl font-bold text-gray-900 font-merriweather">My Clan</h1>
            <p className="text-gray-400 text-sm mt-1 font-merriweather">
              Your personal relationships with every clan member.
            </p>
          </div>

          {isLoading && <Spinner />}

          {!isLoading && members.length === 0 && (
            <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center">
              <p className="text-sm text-gray-400 font-merriweather">No members in your clan yet.</p>
            </div>
          )}

          {!isLoading && members.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
              <div className="h-[2px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
              <div className="divide-y divide-gray-50">
                {members.map((member) => {
                  const rel = relByMember.get(member.id)
                  return (
                    <div
                      key={member.id}
                      className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/60 transition-colors"
                    >
                      <Avatar src={member.profile_picture_url} name={member.full_name} size="sm" />

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 font-merriweather truncate">
                          {member.full_name}
                        </p>
                        {member.email && (
                          <p className="text-xs text-gray-400 font-merriweather truncate">{member.email}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        {rel ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-merriweather font-medium bg-primary/10 text-primary border border-primary/15">
                            {getRelationshipLabel(rel.relationship_type)}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-merriweather font-medium bg-gray-100 text-gray-400 border border-gray-200">
                            Not set
                          </span>
                        )}

                        <button
                          onClick={() => openModal(member)}
                          className="text-xs text-gray-400 hover:text-primary font-merriweather transition-colors px-2 py-1 rounded-lg hover:bg-primary/5"
                        >
                          {rel ? 'Edit' : 'Set'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Set / Edit relationship modal */}
      {modalTarget && (
        <Modal
          isOpen
          onClose={() => setModalTarget(null)}
          title={modalTarget.rel ? 'Update Relationship' : 'Set Relationship'}
          size="sm"
        >
          <p className="text-sm text-gray-500 font-merriweather mb-4 leading-relaxed">
            {modalTarget.rel ? 'Change' : 'Set'} your relationship with{' '}
            <span className="font-semibold text-gray-800">{modalTarget.member.full_name}</span>.
          </p>
          <select
            value={modalType}
            onChange={(e) => setModalType(e.target.value)}
            className={selectCls}
          >
            <option value="">Select relationship…</option>
            {RELATIONSHIP_TYPES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
          <div className="flex gap-3 justify-end mt-5">
            <Button type="button" variant="outline" size="sm" onClick={() => setModalTarget(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              isLoading={isSaving || isUpdating}
              disabled={!modalType || modalType === (modalTarget.rel?.relationship_type ?? '')}
              onClick={handleSave}
            >
              Save
            </Button>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default MyClanPage
