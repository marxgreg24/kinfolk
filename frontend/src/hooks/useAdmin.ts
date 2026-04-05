import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import notify from '@/utils/toast'
import {
  listUsers,
  createClanLeader,
  suspendUser,
  deleteUser,
  listAuditLogs,
  listInterestForms,
  updateInterestFormStatus,
  listAdminClans,
  getApiHealth,
} from '@/api/admin'

export const useListUsers = (params?: { role?: string; is_suspended?: boolean }) =>
  useQuery({
    queryKey: ['admin-users', params],
    queryFn: () => listUsers(params),
  })

export const useCreateClanLeader = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { full_name: string; email: string; phone: string }) =>
      createClanLeader(data),
    onSuccess: ({ user, temp_password }) => {
      notify.success(`Clan leader account created for ${user.full_name}`, {
        detail: `Temporary password: ${temp_password}  ·  A welcome email has been sent.`,
        duration: 12000,
      })
      void queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error ?? 'Failed to create clan leader. Please try again.'
      notify.error(message)
    },
  })
}

export const useSuspendUser = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, suspend }: { id: string; suspend: boolean }) =>
      suspendUser(id, suspend),
    onSuccess: (_data, variables) => {
      const action = variables.suspend ? 'suspended' : 'reactivated'
      notify.success(`User account ${action} successfully.`)
      void queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error ?? 'Failed to update user status. Please try again.'
      notify.error(message)
    },
  })
}

export const useDeleteUser = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      notify.success('User account deleted successfully.')
      void queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error ?? 'Failed to delete user. Please try again.'
      notify.error(message)
    },
  })
}

export const useListAuditLogs = (params?: {
  actor_id?: string
  action?: string
  target_type?: string
  from?: string
  to?: string
}) =>
  useQuery({
    queryKey: ['audit-logs', params],
    queryFn: () => listAuditLogs(params),
  })

export const useListInterestForms = (status?: string) =>
  useQuery({
    queryKey: ['interest-forms', status],
    queryFn: () => listInterestForms(status),
  })

export const useUpdateInterestFormStatus = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'approved' | 'rejected' }) =>
      updateInterestFormStatus(id, status),
    onSuccess: (_, variables) => {
      const action = variables.status === 'approved' ? 'approved' : 'rejected'
      const detail = variables.status === 'approved' ? 'You can now create a clan leader for this clan.' : undefined
      notify.success(`Interest form ${action}.`, { detail })
      void queryClient.invalidateQueries({ queryKey: ['interest-forms'] })
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error ?? 'Failed to update form status. Please try again.'
      notify.error(message)
    },
  })
}

export const useListAdminClans = () =>
  useQuery({
    queryKey: ['admin-clans'],
    queryFn: listAdminClans,
  })

export const useApiHealth = () =>
  useQuery({
    queryKey: ['api-health'],
    queryFn: getApiHealth,
    refetchInterval: 30000,
    retry: 1,
  })
