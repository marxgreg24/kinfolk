export interface ClanMemberInterest {
  id: string
  clan_id: string
  full_name: string
  email: string
  phone: string
  status: 'pending' | 'archived'
  created_at: string
}
