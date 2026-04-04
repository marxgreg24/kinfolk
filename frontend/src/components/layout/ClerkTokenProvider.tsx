import { useEffect } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { setTokenGetter } from '@/api/axios'

const ClerkTokenProvider = ({ children }: { children: React.ReactNode }) => {
  const { getToken, isSignedIn } = useAuth()

  useEffect(() => {
    setTokenGetter(async () => {
      if (!isSignedIn) return null
      return await getToken()
    })
  }, [getToken, isSignedIn])

  return <>{children}</>
}

export default ClerkTokenProvider
