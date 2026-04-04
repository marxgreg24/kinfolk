import apiClient from './axios'
import type { User } from '@/types/user'

// syncUser upserts the Clerk-authenticated user into our backend and runs
// the member-link heuristic. Call this immediately after Clerk sign-in/sign-up.
export const syncUser = async (data: {
  clerk_user_id: string
  email: string
  full_name: string
  clan_name?: string
}): Promise<User> => {
  const res = await apiClient.post('/api/v1/auth/sync', data)
  return (res.data as { data: User }).data
}
