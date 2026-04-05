import { useEffect } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { setTokenGetter } from '@/api/axios'

const ClerkTokenProvider = ({ children }: { children: React.ReactNode }) => {
  const { getToken } = useAuth()

  useEffect(() => {
    setTokenGetter(async () => {
      try {
        return await getToken()
      } catch {
        return null
      }
    })
  }, [getToken])

  return <>{children}</>
}

export default ClerkTokenProvider
