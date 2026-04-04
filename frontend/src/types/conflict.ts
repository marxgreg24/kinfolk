export interface Conflict {
  id: string
  clan_id: string
  original_relationship_id: string
  conflicting_relationship_id: string
  resolved_by?: string
  resolution?: 'approve_original' | 'approve_conflicting' | 'reject_both'
  resolved_at?: string
  created_at: string
}
