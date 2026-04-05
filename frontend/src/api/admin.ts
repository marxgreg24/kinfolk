import apiClient from './axios'
import type { User } from '@/types/user'
import type { AuditLog } from '@/types/auditLog'
import type { InterestForm } from '@/types/interestForm'
import type { Clan } from '@/types/clan'

export const listUsers = async (params?: {
  role?: string
  is_suspended?: boolean
}): Promise<User[]> => {
  const query = new URLSearchParams()
  if (params?.role) query.append('role', params.role)
  if (params?.is_suspended !== undefined) query.append('is_suspended', String(params.is_suspended))
  const res = await apiClient.get(`/api/v1/admin/users?${query.toString()}`)
  return (res.data as { data: User[] | null }).data ?? []
}

export const createClanLeader = async (data: {
  full_name: string
  email: string
  phone: string
}): Promise<{ user: User; temp_password: string }> => {
  const res = await apiClient.post('/api/v1/admin/clan-leaders', data)
  return (res.data as { data: { user: User; temp_password: string } }).data
}

export const suspendUser = async (id: string, suspend: boolean): Promise<void> => {
  await apiClient.patch(`/api/v1/admin/users/${id}/suspend`, { suspend })
}

export const deleteUser = async (id: string): Promise<void> => {
  await apiClient.delete(`/api/v1/admin/users/${id}`)
}

export const listAuditLogs = async (params?: {
  actor_id?: string
  action?: string
  target_type?: string
  from?: string
  to?: string
}): Promise<AuditLog[]> => {
  const query = new URLSearchParams()
  if (params?.actor_id) query.set('actor_id', params.actor_id)
  if (params?.action) query.set('action', params.action)
  if (params?.target_type) query.set('target_type', params.target_type)
  if (params?.from) query.set('from', params.from)
  if (params?.to) query.set('to', params.to)
  const res = await apiClient.get(`/api/v1/admin/audit-logs?${query.toString()}`)
  return (res.data as { data: AuditLog[] | null }).data ?? []
}

export const listInterestForms = async (status?: string): Promise<InterestForm[]> => {
  const query = status ? `?status=${status}` : ''
  const res = await apiClient.get(`/api/v1/admin/interest-forms${query}`)
  return (res.data as { data: InterestForm[] | null }).data ?? []
}

export const updateInterestFormStatus = async (
  id: string,
  status: 'approved' | 'rejected',
): Promise<void> => {
  await apiClient.patch(`/api/v1/admin/interest-forms/${id}`, { status })
}

export const listAdminClans = async (): Promise<Clan[]> => {
  const res = await apiClient.get('/api/v1/admin/clans')
  return (res.data as { data: Clan[] | null }).data ?? []
}

export const getApiHealth = async (): Promise<{ service: string; status: string }> => {
  const res = await apiClient.get('/health')
  return res.data
}
