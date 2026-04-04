import type { RelationshipType } from '@/types/relationship'

export const RELATIONSHIP_TYPES: { value: RelationshipType; label: string }[] = [
  { value: 'parent', label: 'Parent' },
  { value: 'child', label: 'Child' },
  { value: 'spouse', label: 'Spouse' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'half_sibling', label: 'Half Sibling' },
  { value: 'grandparent', label: 'Grandparent' },
  { value: 'grandchild', label: 'Grandchild' },
  { value: 'uncle', label: 'Uncle' },
  { value: 'aunt', label: 'Aunt' },
  { value: 'nephew', label: 'Nephew' },
  { value: 'niece', label: 'Niece' },
  { value: 'cousin', label: 'Cousin' },
  { value: 'second_cousin', label: 'Second Cousin' },
  { value: 'in_law', label: 'In-Law' },
  { value: 'step_parent', label: 'Step Parent' },
  { value: 'step_child', label: 'Step Child' },
]

export const getRelationshipLabel = (type: RelationshipType): string => {
  return RELATIONSHIP_TYPES.find((r) => r.value === type)?.label ?? type
}
