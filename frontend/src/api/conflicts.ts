import apiClient from './axios'
import type { Conflict } from '@/types/conflict'

export const listConflicts = async (clanId: string): Promise<Conflict[]> => {
  const res = await apiClient.get(`/api/v1/clan-leader/conflicts?clan_id=${clanId}`)
  return (res.data as { data: Conflict[] | null }).data ?? []
}

export const resolveConflict = async (
  conflictId: string,
  resolution: 'approve_original' | 'approve_conflicting' | 'reject_both',
): Promise<void> => {
  await apiClient.post(`/api/v1/clan-leader/conflicts/${conflictId}/resolve`, { resolution })
}
