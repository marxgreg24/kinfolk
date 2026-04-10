import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { saveAs } from 'file-saver'
import notify from '@/utils/toast'
import {
  listPublicClans,
  getClan,
  getClanMembers,
  getClanRelationships,
  getClanTree,
  exportClanGEDCOM,
  createClan,
  updateRelationshipType,
} from '@/api/clans'

export const useListPublicClans = () =>
  useQuery({
    queryKey: ['public-clans'],
    queryFn: listPublicClans,
    staleTime: 60_000,
  })

export const useGetClan = (id: string) =>
  useQuery({
    queryKey: ['clan', id],
    queryFn: () => getClan(id),
    enabled: !!id,
  })

export const useGetClanMembers = (id: string) =>
  useQuery({
    queryKey: ['clan-members', id],
    queryFn: () => getClanMembers(id),
    enabled: !!id,
  })

export const useGetClanRelationships = (id: string) =>
  useQuery({
    queryKey: ['clan-relationships', id],
    queryFn: () => getClanRelationships(id),
    enabled: !!id,
  })

export const useGetClanTree = (id: string) =>
  useQuery({
    queryKey: ['clan-tree', id],
    queryFn: () => getClanTree(id),
    enabled: !!id,
  })

export const useExportGEDCOM = () =>
  useMutation({
    mutationFn: exportClanGEDCOM,
    onSuccess: (blob) => {
      saveAs(blob, 'clan_family_tree.ged')
      notify.success('Family tree exported successfully.')
    },
    onError: () => {
      notify.error('Failed to export family tree. Please try again.')
    },
  })

export const useUpdateRelationshipType = (clanId: string) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, relationship_type }: { id: string; relationship_type: string }) =>
      updateRelationshipType(id, relationship_type),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['clan-relationships', clanId] })
      notify.success('Relationship updated.')
    },
    onError: () => {
      notify.error('Failed to update relationship. Please try again.')
    },
  })
}

export const useCreateClan = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createClan,
    onSuccess: (clan) => {
      void queryClient.invalidateQueries({ queryKey: ['clan'] })
      notify.success(`Clan "${clan.name}" created successfully.`)
    },
    onError: () => {
      notify.error('Failed to create clan. Please try again.')
    },
  })
}
