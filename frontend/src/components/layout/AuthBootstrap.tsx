import { useEffect } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { useDispatch, useSelector } from 'react-redux'
import { getMe } from '@/api/users'
import type { AppDispatch, RootState } from '@/store'
import { clearUser, setLoading, setUser } from '@/store/slices/authSlice'

const AuthBootstrap = ({ children }: { children: React.ReactNode }) => {
	const dispatch = useDispatch<AppDispatch>()
	const { isLoaded, isSignedIn } = useAuth()
	const { user } = useSelector((state: RootState) => state.auth)

	useEffect(() => {
		if (!isLoaded) {
			return
		}

		if (!isSignedIn) {
			dispatch(clearUser())
			return
		}

		if (user) {
			return
		}

		let isActive = true
		dispatch(setLoading(true))

		void getMe()
			.then((me) => {
				if (!isActive) {
					return
				}
				dispatch(setUser(me))
			})
			.catch(() => {
				if (!isActive) {
					return
				}
				dispatch(clearUser())
			})

		return () => {
			isActive = false
		}
	}, [dispatch, isLoaded, isSignedIn, user])

	return <>{children}</>
}

export default AuthBootstrap