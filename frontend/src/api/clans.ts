import apiClient from './axios'
import type { Clan } from '@/types/clan'
import type { Member } from '@/types/member'
import type { Relationship } from '@/types/relationship'

export const validateClanName = async (
  name: string,
): Promise<{ available: boolean; clan_id: string }> => {
  const res = await apiClient.get(`/api/v1/clans/validate?name=${encodeURIComponent(name)}`)
  return (res.data as { data: { available: boolean; clan_id: string } }).data
}

export const getClan = async (id: string): Promise<Clan> => {
  const res = await apiClient.get(`/api/v1/clans/${id}`)
  return (res.data as { data: Clan }).data
}

export const getClanMembers = async (
  id: string,
): Promise<{ clan: Clan; members: Member[] }> => {
  const res = await apiClient.get(`/api/v1/clans/${id}/members`)
  return (res.data as { data: { clan: Clan; members: Member[] } }).data
}

export const getClanRelationships = async (id: string): Promise<Relationship[]> => {
  const res = await apiClient.get(`/api/v1/clans/${id}/relationships`)
  return (res.data as { data: Relationship[] }).data ?? []
}

export const getClanTree = async (
  id: string,
): Promise<{ members: Member[]; relationships: Relationship[] }> => {
  const res = await apiClient.get(`/api/v1/clans/${id}/tree`)
  return (res.data as { data: { members: Member[]; relationships: Relationship[] } }).data
}

export const exportClanGEDCOM = async (id: string): Promise<Blob> => {
  const res = await apiClient.get(`/api/v1/clans/${id}/export`, {
    responseType: 'blob',
  })
  return res.data as Blob
}

export const createClan = async (data: { name: string }): Promise<Clan> => {
  const res = await apiClient.post('/api/v1/clan-leader/clans', data)
  return (res.data as { data: Clan }).data
}
