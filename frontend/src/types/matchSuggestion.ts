export interface MatchSuggestion {
  id: string
  user_id: string
  member_id: string
  confidence: number
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}
