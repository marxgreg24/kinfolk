import apiClient from './axios'
import type { Relationship, RelationshipType } from '@/types/relationship'

export const submitRelationship = async (data: {
  to_member_id: string
  clan_id: string
  relationship_type: RelationshipType
}): Promise<{ relationship: Relationship; conflicted: boolean }> => {
  const res = await apiClient.post('/api/v1/relationships', data)
  const body = res.data as { data: Relationship; conflicted: boolean }
  return { relationship: body.data, conflicted: body.conflicted }
}

export const listRelationships = async (clanId: string): Promise<Relationship[]> => {
  const res = await apiClient.get(`/api/v1/clans/${clanId}/relationships`)
  return (res.data as { data: Relationship[] }).data ?? []
}
