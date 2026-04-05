import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import notify from '@/utils/toast'
import { submitRelationship, listRelationships } from '@/api/relationships'

export const useListRelationships = (clanId: string) =>
  useQuery({
    queryKey: ['relationships', clanId],
    queryFn: () => listRelationships(clanId),
    enabled: !!clanId,
  })

export const useSubmitRelationship = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: submitRelationship,
    onSuccess: (data) => {
      if (data.conflicted) {
        notify.warning('A conflict was flagged and sent to your clan leader for review.')
      } else {
        notify.success('Relationship saved successfully.')
      }
      void queryClient.invalidateQueries({ queryKey: ['relationships'] })
      void queryClient.invalidateQueries({ queryKey: ['clan-relationships'] })
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error ?? 'Failed to submit relationship. Please try again.'
      notify.error(message)
    },
  })
}
