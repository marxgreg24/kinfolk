import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSignUp } from '@clerk/clerk-react'
import { useDispatch } from 'react-redux'
import type { AppDispatch } from '@/store'
import { setUser } from '@/store/slices/authSlice'
import { validateClanName } from '@/api/clans'
import { syncUser } from '@/api/auth'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

const SignupPage = () => {
  const { signUp, isLoaded, setActive } = useSignUp()
  const navigate = useNavigate()
  const dispatch = useDispatch<AppDispatch>()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [clanName, setClanName] = useState('')
  const [clanValid, setClanValid] = useState<boolean | null>(null)
  const [clanValidating, setClanValidating] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Debounced clan name validation
  useEffect(() => {
    if (!clanName.trim()) {
      setClanValid(null)
      setClanValidating(false)
      return
    }
    setClanValidating(true)
    setClanValid(null)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        const result = await validateClanName(clanName.trim())
        setClanValid(result.available)
      } catch {
        setClanValid(null)
      } finally {
        setClanValidating(false)
      }
    }, 500)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [clanName])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoaded || !signUp) return
    setIsSubmitting(true)
    setError('')

    // Step 1: Clerk sign-up
    try {
      await signUp.create({ emailAddress: email, password })
      if (signUp.createdSessionId) {
        await setActive({ session: signUp.createdSessionId })
      }
    } catch (err: unknown) {
      const clerkErr = err as { errors?: Array<{ longMessage?: string; message?: string }> }
      const msg =
        clerkErr.errors?.[0]?.longMessage ??
        clerkErr.errors?.[0]?.message ??
        'Sign up failed. Please try again.'
      setError(msg)
      setIsSubmitting(false)
      return
    }

    // Step 2: Sync with backend
    try {
      const user = await syncUser({
        clerk_user_id: signUp.createdUserId ?? '',
        email,
        full_name: fullName,
        clan_name: clanName,
      })
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
      setError('Failed to sync your account. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isDisabled =
    isSubmitting || !clanValid || !fullName.trim() || !email.trim() || password.length < 8

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-primary text-center font-merriweather mb-2">
          Kinfolk
        </h1>
        <p className="text-sm text-gray-500 text-center mb-8">
          Create your account and find your clan
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Full Name"
            name="full_name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
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

          <div>
            <Input
              label="Clan Name"
              name="clan_name"
              value={clanName}
              onChange={(e) => setClanName(e.target.value)}
              required
            />
            {clanValidating && (
              <p className="text-gray-400 text-sm mt-1">Checking...</p>
            )}
            {!clanValidating && clanValid === true && (
              <p className="text-green-600 text-sm mt-1 flex items-center gap-1">
                ✓ Clan found — you can proceed
              </p>
            )}
            {!clanValidating && clanValid === false && clanName.trim() !== '' && (
              <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                ✗ Clan not found — check the spelling
              </p>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm font-merriweather">
              {error}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            disabled={isDisabled}
            className="w-full mt-2"
          >
            Create Account
          </Button>
        </form>

        <p className="text-sm text-gray-500 text-center mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-primary hover:text-secondary font-medium transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

export default SignupPage
