import { type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { useSelector } from 'react-redux'
import type { RootState } from '@/store'
import Spinner from '@/components/ui/Spinner'
import { isProfileComplete } from '@/utils/profile'

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { isSignedIn, isLoaded } = useAuth()
  const user = useSelector((state: RootState) => state.auth.user)
  const location = useLocation()

  if (!isLoaded) return <Spinner fullScreen />

  if (!isSignedIn) return <Navigate to="/login" replace />

  // Don't force profile completion until the user has set their own password first.
  if (user && !user.password_reset_required && !isProfileComplete(user) && location.pathname !== '/complete-profile') {
    return <Navigate to="/complete-profile" replace />
  }

  return <>{children}</>
}

export default ProtectedRoute
