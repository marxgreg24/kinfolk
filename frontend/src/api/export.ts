import apiClient from './axios'

export const exportGedcom = async (clanId: string): Promise<Blob> => {
  const res = await apiClient.get(`/api/v1/clans/${clanId}/export`, {
    responseType: 'blob',
  })
  return res.data as Blob
}
