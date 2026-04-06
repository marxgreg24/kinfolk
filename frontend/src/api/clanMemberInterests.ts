import apiClient from './axios'
import type { ClanMemberInterest } from '@/types/clanMemberInterest'

export const submitClanMemberInterest = async (data: {
  clan_id: string
  full_name: string
  email: string
  phone: string
}): Promise<ClanMemberInterest> => {
  const res = await apiClient.post('/api/v1/clan-member-interests', data)
  return (res.data as { data: ClanMemberInterest }).data
}

export const listClanMemberInterests = async (): Promise<ClanMemberInterest[]> => {
  const res = await apiClient.get('/api/v1/clan-leader/member-interests')
  return (res.data as { data: ClanMemberInterest[] }).data ?? []
}

export const archiveClanMemberInterest = async (id: string): Promise<void> => {
  await apiClient.post(`/api/v1/clan-leader/member-interests/${id}/archive`)
}
