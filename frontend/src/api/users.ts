import apiClient from './axios'
import type { User } from '@/types/user'

export const getMe = async (): Promise<User> => {
  const res = await apiClient.get('/api/v1/users/me')
  return (res.data as { data: User }).data
}

export const updateMe = async (data: {
  full_name?: string
  phone?: string
  profile_picture_url?: string
}): Promise<void> => {
  await apiClient.put('/api/v1/users/me', data)
}

export const deleteMe = async (): Promise<void> => {
  await apiClient.delete('/api/v1/users/me')
}

export const completeProfile = async (data: {
  birth_year: number
  gender: string
  profile_picture_url: string
  phone: string
}): Promise<void> => {
  await apiClient.post('/api/v1/users/me/profile', data)
}
