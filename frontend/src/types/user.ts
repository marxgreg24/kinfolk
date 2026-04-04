export interface User {
  id: string
  clerk_user_id: string
  full_name: string
  email: string
  phone?: string
  birth_year?: number
  gender?: 'male' | 'female'
  profile_picture_url?: string
  role: 'general_user' | 'clan_leader' | 'admin'
  clan_id?: string
  is_suspended: boolean
  password_reset_required: boolean
  created_at: string
  updated_at: string
}
