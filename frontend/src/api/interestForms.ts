import apiClient from './axios'
import type { InterestForm } from '@/types/interestForm'

export const submitInterestForm = async (data: {
  full_name: string
  clan_name: string
  email: string
  phone: string
  region?: string
  expected_members?: number
  message?: string
}): Promise<InterestForm> => {
  const res = await apiClient.post('/api/v1/interest-forms', data)
  return (res.data as { data: InterestForm }).data
}
