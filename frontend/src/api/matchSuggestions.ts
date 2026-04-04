import apiClient from './axios'
import type { MatchSuggestion } from '@/types/matchSuggestion'

export const listMatchSuggestions = async (clanId: string): Promise<MatchSuggestion[]> => {
  const res = await apiClient.get(`/api/v1/clan-leader/match-suggestions?clan_id=${clanId}`)
  return (res.data as { data: MatchSuggestion[] | null }).data ?? []
}

export const approveMatchSuggestion = async (suggestionId: string): Promise<void> => {
  await apiClient.post(`/api/v1/clan-leader/match-suggestions/${suggestionId}/approve`)
}

export const rejectMatchSuggestion = async (suggestionId: string): Promise<void> => {
  await apiClient.post(`/api/v1/clan-leader/match-suggestions/${suggestionId}/reject`)
}
