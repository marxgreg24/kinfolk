import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import notify from '@/utils/toast'
import { listConflicts, resolveConflict } from '@/api/conflicts'
import { listMatchSuggestions, approveMatchSuggestion, rejectMatchSuggestion } from '@/api/matchSuggestions'
import { addMember } from '@/api/members'
import { createClan } from '@/api/clans'
import type { Conflict } from '@/types/conflict'
import type { Relationship } from '@/types/relationship'

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
    onSuccess: (_, variables) => {
      const currentConflicts = queryClient.getQueryData<Conflict[]>(['conflicts', clanId]) ?? []
      const resolvedConflict = currentConflicts.find((conflict) => conflict.id === variables.conflictId)

      queryClient.setQueryData<Conflict[]>(['conflicts', clanId], (existing = []) =>
        existing.filter((conflict) => conflict.id !== variables.conflictId),
      )

      if (resolvedConflict) {
        queryClient.setQueryData<Relationship[]>(['clan-relationships', clanId], (existing = []) =>
          existing.map((relationship) => {
            if (relationship.id === resolvedConflict.original_relationship_id) {
              return {
                ...relationship,
                status:
                  variables.resolution === 'approve_original'
                    ? 'active'
                    : 'conflicted',
              }
            }

            if (relationship.id === resolvedConflict.conflicting_relationship_id) {
              return {
                ...relationship,
                status:
                  variables.resolution === 'approve_conflicting'
                    ? 'active'
                    : 'conflicted',
              }
            }

            return relationship
          }),
        )
      }

      notify.success('Conflict resolved successfully.')
      void queryClient.invalidateQueries({ queryKey: ['conflicts', clanId] })
      void queryClient.invalidateQueries({ queryKey: ['clan-relationships', clanId] })
      void queryClient.invalidateQueries({ queryKey: ['clan-tree', clanId] })
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error ?? 'Failed to resolve conflict. Please try again.'
      notify.error(message)
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
      notify.success('Member match approved and linked successfully.')
      void queryClient.invalidateQueries({ queryKey: ['match-suggestions', clanId] })
      void queryClient.invalidateQueries({ queryKey: ['clan-members', clanId] })
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error ?? 'Failed to approve suggestion. Please try again.'
      notify.error(message)
    },
  })
}

export const useRejectMatchSuggestion = (clanId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: rejectMatchSuggestion,
    onSuccess: () => {
      notify.neutral('Match suggestion dismissed.')
      void queryClient.invalidateQueries({ queryKey: ['match-suggestions', clanId] })
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error ?? 'Failed to reject suggestion. Please try again.'
      notify.error(message)
    },
  })
}

export const useAddMember = (clanId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: {
      full_name: string
      email: string
      relationship_type: string
      family_id: string
      profile_picture_url?: string
    }) => addMember(clanId, data),
    onSuccess: (member) => {
      notify.success(`${member.full_name} has been added to your clan.`)
      void queryClient.invalidateQueries({ queryKey: ['clan-members'] })
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error ?? 'Failed to add member. Please try again.'
      notify.error(message)
    },
  })
}

export const useCreateClan = (onCreated?: () => void) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (name: string) => createClan({ name }),
    onSuccess: () => {
      notify.success('Clan created successfully.')
      void queryClient.invalidateQueries({ queryKey: ['clan'] })
      onCreated?.()
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error ?? 'Failed to create clan. Please try again.'
      notify.error(message)
    },
  })
}
