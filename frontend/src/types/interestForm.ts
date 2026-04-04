export interface InterestForm {
  id: string
  full_name: string
  clan_name: string
  email: string
  phone: string
  region?: string
  expected_members?: number
  message?: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}
