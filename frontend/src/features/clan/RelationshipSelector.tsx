import { useState } from 'react'
import type { Relationship, RelationshipType } from '@/types/relationship'
import { RELATIONSHIP_TYPES } from '@/utils/relationships'
import { useSubmitRelationship } from '@/hooks/useRelationships'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'

interface RelationshipSelectorProps {
  memberId: string
  clanId: string
  existingRelationship?: Relationship
  memberName?: string
}

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
    <polyline points="20 6 9 17 4 12" />
  </svg>
)

const RelationshipSelector = ({
  memberId,
  clanId,
  existingRelationship,
  memberName,
}: RelationshipSelectorProps) => {
  const [selected, setSelected] = useState<RelationshipType | ''>(
    existingRelationship?.relationship_type ?? '',
  )
  const [open, setOpen] = useState(false)
  const { mutate, isPending } = useSubmitRelationship()

  const isDirty = selected !== '' && selected !== existingRelationship?.relationship_type
  const selectedLabel = RELATIONSHIP_TYPES.find((r) => r.value === selected)?.label

  const handleSelect = (value: RelationshipType) => {
    setSelected(value)
  }

  const handleSave = () => {
    if (!selected) return
    mutate(
      { to_member_id: memberId, clan_id: clanId, relationship_type: selected },
      { onSuccess: () => setOpen(false) },
    )
  }

  return (
    <>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`
          inline-flex items-center justify-between gap-2
          min-w-[180px] px-3.5 py-2 rounded-xl
          bg-white border font-merriweather text-sm
          transition-all duration-200 shadow-sm
          focus:outline-none hover:shadow-md
          ${selectedLabel
            ? 'border-primary/40 text-gray-800 hover:border-primary'
            : 'border-gray-200 text-gray-400 hover:border-primary/50 hover:text-gray-600'
          }
        `}
      >
        <span>{selectedLabel ?? 'Select relationship…'}</span>
      </button>

      {/* Relationship picker modal */}
      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title={memberName ? `Relationship to ${memberName}` : 'Select Relationship'}
        size="2xl"
      >
        <div className="grid grid-cols-4 gap-2 mb-5">
          {RELATIONSHIP_TYPES.map((r) => {
            const isActive = selected === r.value
            return (
              <button
                key={r.value}
                type="button"
                onClick={() => handleSelect(r.value as RelationshipType)}
                className={`
                  flex items-center justify-between gap-1
                  px-4 py-3 rounded-xl text-sm font-merriweather text-left
                  transition-all duration-150
                  ${isActive
                    ? 'bg-primary/10 text-primary border border-primary/30 font-medium'
                    : 'text-gray-700 border border-gray-100 hover:bg-gray-50 hover:border-primary/20'
                  }
                `}
              >
                <span>{r.label}</span>
                {isActive && (
                  <span className="text-primary flex-shrink-0">
                    <CheckIcon />
                  </span>
                )}
              </button>
            )
          })}
        </div>

        <div className="flex gap-3 justify-end">
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            isLoading={isPending}
            disabled={!isDirty}
            onClick={handleSave}
          >
            Save
          </Button>
        </div>
      </Modal>
    </>
  )
}

export default RelationshipSelector
