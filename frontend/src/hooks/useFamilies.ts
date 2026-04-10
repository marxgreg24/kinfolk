import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import notify from '@/utils/toast'
import { listFamilies, createFamily, listFamilyMembers, getClanFamilies } from '@/api/families'

export const useGetClanFamilies = (clanId: string) =>
  useQuery({
    queryKey: ['clan-families', clanId],
    queryFn: () => getClanFamilies(clanId),
    enabled: !!clanId,
    staleTime: 60_000,
  })

export const useListFamilies = (scopeKey?: string) =>
  useQuery({
    queryKey: ['families', scopeKey],
    queryFn: listFamilies,
    enabled: !!scopeKey,
    refetchOnMount: 'always',
  })

export const useCreateFamily = (onCreated?: () => void) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createFamily,
    onSuccess: (family) => {
      notify.success(`Family "${family.name}" created.`)
      void queryClient.invalidateQueries({ queryKey: ['families'] })
      onCreated?.()
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error ?? 'Failed to create family.'
      notify.error(msg)
    },
  })
}

export const useListFamilyMembers = (familyId: string) =>
  useQuery({
    queryKey: ['family-members', familyId],
    queryFn: () => listFamilyMembers(familyId),
    enabled: !!familyId,
  })
