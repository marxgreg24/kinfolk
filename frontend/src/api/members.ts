import apiClient from './axios'
import type { Member } from '@/types/member'
import type { Clan } from '@/types/clan'

export const addMember = async (
  clanId: string,
  data: {
    full_name: string
    email: string
    relationship_type: string
    family_id: string
    profile_picture_url?: string
  },
): Promise<Member> => {
  const res = await apiClient.post(`/api/v1/clan-leader/clans/${clanId}/members`, data)
  return (res.data as { data: Member }).data
}

export const listMembers = async (clanId: string): Promise<{ clan: Clan; members: Member[] }> => {
  const res = await apiClient.get(`/api/v1/clans/${clanId}/members`)
  return (res.data as { data: { clan: Clan; members: Member[] } }).data
}
