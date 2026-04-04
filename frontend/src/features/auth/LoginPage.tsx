import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSignIn } from '@clerk/clerk-react'
import { useDispatch } from 'react-redux'
import type { AppDispatch } from '@/store'
import { setUser } from '@/store/slices/authSlice'
import { getMe } from '@/api/users'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

const LoginPage = () => {
  const { signIn, isLoaded, setActive } = useSignIn()
  const navigate = useNavigate()
  const dispatch = useDispatch<AppDispatch>()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoaded || !signIn) return
    setIsSubmitting(true)
    setError('')

    // Step 1: Clerk sign-in
    try {
      const result = await signIn.create({ identifier: email, password })
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
      }
    } catch (err: unknown) {
      const clerkErr = err as { errors?: Array<{ longMessage?: string; message?: string }> }
      const msg =
        clerkErr.errors?.[0]?.longMessage ??
        clerkErr.errors?.[0]?.message ??
        'Sign in failed. Please check your credentials.'
      setError(msg)
      setIsSubmitting(false)
      return
    }

    // Step 2: Fetch user from backend
    try {
      const user = await getMe()
      dispatch(setUser(user))
      if (user.role === 'admin') {
        navigate('/admin')
      } else if (user.role === 'clan_leader') {
        if (user.password_reset_required) {
          navigate('/reset-password')
        } else {
          navigate('/clan-leader/dashboard')
        }
      } else {
        navigate('/complete-profile')
      }
    } catch {
      setError('Unable to load your account. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-primary text-center font-merriweather mb-2">
          Kinfolk
        </h1>
        <p className="text-sm text-gray-500 text-center mb-8">Welcome back to Kinfolk</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Email Address"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm font-merriweather">
              {error}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            disabled={isSubmitting}
            className="w-full mt-2"
          >
            Sign In
          </Button>
        </form>

        <p className="text-sm text-secondary text-center mt-4">Forgot your password?</p>

        <p className="text-sm text-gray-500 text-center mt-4">
          Don&apos;t have an account?{' '}
          <Link to="/signup" className="text-primary hover:text-secondary font-medium transition-colors">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}

export default LoginPage
