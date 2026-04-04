import { type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { useSelector } from 'react-redux'
import type { RootState } from '@/store'
import Spinner from '@/components/ui/Spinner'

const ClanLeaderRoute = ({ children }: { children: ReactNode }) => {
  const { isSignedIn, isLoaded } = useAuth()
  const { user, isLoading } = useSelector((state: RootState) => state.auth)

  if (!isLoaded || isLoading) return <Spinner fullScreen />

  if (!isSignedIn) return <Navigate to="/login" replace />

  if (user?.role !== 'clan_leader') return <Navigate to="/dashboard" replace />

  if (user.password_reset_required) return <Navigate to="/reset-password" replace />

  return <>{children}</>
}

export default ClanLeaderRoute
