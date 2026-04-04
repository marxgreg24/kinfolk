import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
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
        toast('A conflict was flagged and sent to your clan leader for review.', {
          icon: '⚠️',
          duration: 5000,
          style: { borderLeft: '4px solid #CDB53F' },
        })
      } else {
        toast.success('Relationship saved successfully.')
      }
      void queryClient.invalidateQueries({ queryKey: ['relationships'] })
      void queryClient.invalidateQueries({ queryKey: ['clan-relationships'] })
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error ?? 'Failed to submit relationship. Please try again.'
      toast.error(message)
    },
  })
}
