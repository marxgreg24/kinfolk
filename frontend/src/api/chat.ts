import apiClient from './axios'

export const getStreamToken = async (): Promise<{
  token: string
  user_id: string
}> => {
  const res = await apiClient.get('/api/v1/chat/token')
  return res.data.data
}
