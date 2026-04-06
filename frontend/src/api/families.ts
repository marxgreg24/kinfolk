import apiClient from './axios'
import type { Family } from '@/types/family'
import type { Member } from '@/types/member'

export const listFamilies = async (): Promise<Family[]> => {
  const res = await apiClient.get('/api/v1/clan-leader/families')
  return (res.data as { data: Family[] }).data ?? []
}

export const createFamily = async (data: {
  name: string
  add_leader_as_member?: boolean
}): Promise<Family> => {
  const res = await apiClient.post('/api/v1/clan-leader/families', data)
  return (res.data as { data: Family }).data
}

export const listFamilyMembers = async (familyId: string): Promise<Member[]> => {
  const res = await apiClient.get(`/api/v1/families/${familyId}/members`)
  return (res.data as { data: Member[] }).data ?? []
}
