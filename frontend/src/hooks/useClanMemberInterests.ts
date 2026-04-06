import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import notify from '@/utils/toast'
import {
  submitClanMemberInterest,
  listClanMemberInterests,
  archiveClanMemberInterest,
} from '@/api/clanMemberInterests'

export const useListClanMemberInterests = () =>
  useQuery({
    queryKey: ['clan-member-interests'],
    queryFn: listClanMemberInterests,
  })

export const useSubmitClanMemberInterest = () =>
  useMutation({
    mutationFn: submitClanMemberInterest,
    onError: (err: any) => {
      const msg = err?.response?.data?.error ?? 'Failed to submit interest. Please try again.'
      notify.error(msg)
    },
  })

export const useArchiveClanMemberInterest = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: archiveClanMemberInterest,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['clan-member-interests'] })
    },
    onError: () => {
      notify.error('Failed to archive interest form.')
    },
  })
}
