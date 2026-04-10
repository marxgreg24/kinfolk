export type RelationshipType =
  | 'child' | 'parent' | 'spouse' | 'sibling'
  | 'uncle' | 'aunt' | 'cousin' | 'second_cousin'
  | 'grandparent' | 'grandchild' | 'nephew' | 'niece'
  | 'in_law' | 'step_parent' | 'step_child' | 'half_sibling'
  | 'co_wife'

export interface Relationship {
  id: string
  clan_id: string
  from_user_id: string
  to_member_id: string
  relationship_type: RelationshipType
  is_inferred: boolean
  status: 'active' | 'pending' | 'conflicted'
  submitted_by?: string
  created_at: string
  updated_at: string
}

export interface TreeData {
  members: import('./member').Member[]
  relationships: Relationship[]
}
