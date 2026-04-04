import { useState } from 'react'
import type { Relationship, RelationshipType } from '@/types/relationship'
import { RELATIONSHIP_TYPES } from '@/utils/relationships'
import { useSubmitRelationship } from '@/hooks/useRelationships'
import Button from '@/components/ui/Button'

interface RelationshipSelectorProps {
  memberId: string
  clanId: string
  existingRelationship?: Relationship
}

const RelationshipSelector = ({
  memberId,
  clanId,
  existingRelationship,
}: RelationshipSelectorProps) => {
  const [selected, setSelected] = useState<RelationshipType | ''>(
    existingRelationship?.relationship_type ?? '',
  )
  const { mutate, isPending } = useSubmitRelationship()

  const isDirty =
    selected !== '' && selected !== existingRelationship?.relationship_type

  const handleSubmit = () => {
    if (!selected) return
    mutate({
      to_member_id: memberId,
      clan_id: clanId,
      relationship_type: selected,
    })
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value as RelationshipType | '')}
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm font-merriweather focus:ring-2 focus:ring-primary outline-none"
      >
        <option value="">Select relationship...</option>
        {RELATIONSHIP_TYPES.map((r) => (
          <option key={r.value} value={r.value}>
            {r.label}
          </option>
        ))}
      </select>

      {isDirty && (
        <Button
          variant="primary"
          size="sm"
          isLoading={isPending}
          onClick={handleSubmit}
        >
          Save
        </Button>
      )}
    </div>
  )
}

export default RelationshipSelector
