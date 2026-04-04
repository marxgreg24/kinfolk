import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { listConflicts, resolveConflict } from '@/api/conflicts'
import { listMatchSuggestions, approveMatchSuggestion, rejectMatchSuggestion } from '@/api/matchSuggestions'
import { addMember } from '@/api/members'
import { createClan } from '@/api/clans'

export const useListConflicts = (clanId: string) =>
  useQuery({
    queryKey: ['conflicts', clanId],
    queryFn: () => listConflicts(clanId),
    enabled: !!clanId,
    select: (data) => data ?? [],
  })

export const useResolveConflict = (clanId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      conflictId,
      resolution,
    }: {
      conflictId: string
      resolution: 'approve_original' | 'approve_conflicting' | 'reject_both'
    }) => resolveConflict(conflictId, resolution),
    onSuccess: () => {
      toast.success('Conflict resolved successfully.')
      void queryClient.invalidateQueries({ queryKey: ['conflicts', clanId] })
      void queryClient.invalidateQueries({ queryKey: ['clan-relationships', clanId] })
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error ?? 'Failed to resolve conflict. Please try again.'
      toast.error(message)
    },
  })
}

export const useListMatchSuggestions = (clanId: string) =>
  useQuery({
    queryKey: ['match-suggestions', clanId],
    queryFn: () => listMatchSuggestions(clanId),
    enabled: !!clanId,
    select: (data) => data ?? [],
  })

export const useApproveMatchSuggestion = (clanId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: approveMatchSuggestion,
    onSuccess: () => {
      toast.success('Member match approved and linked successfully.')
      void queryClient.invalidateQueries({ queryKey: ['match-suggestions', clanId] })
      void queryClient.invalidateQueries({ queryKey: ['clan-members', clanId] })
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error ?? 'Failed to approve suggestion. Please try again.'
      toast.error(message)
    },
  })
}

export const useRejectMatchSuggestion = (clanId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: rejectMatchSuggestion,
    onSuccess: () => {
      toast('Match suggestion dismissed.', {
        icon: '✕',
        style: { fontFamily: 'Merriweather, serif' },
      })
      void queryClient.invalidateQueries({ queryKey: ['match-suggestions', clanId] })
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error ?? 'Failed to reject suggestion. Please try again.'
      toast.error(message)
    },
  })
}

export const useAddMember = (clanId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      full_name: string
      email?: string
      profile_picture_url?: string
      relationship_to_leader: string
    }) => addMember(clanId, data),
    onSuccess: (member) => {
      toast.success(`${member.full_name} has been added to your clan.`)
      void queryClient.invalidateQueries({ queryKey: ['clan-members'] })
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error ?? 'Failed to add member. Please try again.'
      toast.error(message)
    },
  })
}

export const useCreateClan = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (name: string) => createClan({ name }),
    onSuccess: () => {
      toast.success('Clan created successfully.')
      void queryClient.invalidateQueries({ queryKey: ['clan'] })
    },
    onError: () => {
      toast.error('Failed to create clan. Please try again.')
    },
  })
}
