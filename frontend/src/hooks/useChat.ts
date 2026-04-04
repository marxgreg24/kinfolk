import { useQuery } from '@tanstack/react-query'
import { getStreamToken } from '@/api/chat'
import { useAuth } from '@clerk/clerk-react'

export const useGetStreamToken = () => {
  const { isSignedIn } = useAuth()
  return useQuery({
    queryKey: ['stream-token'],
    queryFn: getStreamToken,
    enabled: !!isSignedIn,
    staleTime: 1000 * 60 * 55,
    retry: 1,
  })
}
