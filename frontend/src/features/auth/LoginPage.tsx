import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useSignIn, useAuth, useUser } from '@clerk/clerk-react'
import { useDispatch } from 'react-redux'
import type { AppDispatch } from '@/store'
import { setUser } from '@/store/slices/authSlice'
import { getMe } from '@/api/users'
import { syncUser } from '@/api/auth'
import { getPostAuthPath } from '@/utils/profile'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import KinfolkWordmark from '@/components/ui/KinfolkWordmark'

const ACCOUNT_LOAD_RETRY_DELAYS_MS = [150, 300, 600, 1000]

const wait = (delayMs: number) => new Promise((resolve) => {
  window.setTimeout(resolve, delayMs)
})

const LoginPage = () => {
  const { signIn, isLoaded, setActive } = useSignIn()
  const { isSignedIn } = useAuth()
  const { user: clerkUser } = useUser()
  const navigate = useNavigate()
  const dispatch = useDispatch<AppDispatch>()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isBootstrappingSession, setIsBootstrappingSession] = useState(false)
  const [error, setError] = useState('')

  const loadCurrentUser = async () => {
    let lastError: unknown = null

    for (const delayMs of [0, ...ACCOUNT_LOAD_RETRY_DELAYS_MS]) {
      if (delayMs > 0) await wait(delayMs)

      try {
        const user = await getMe()
        dispatch(setUser(user))
        return user
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } }).response?.status

        // User authenticated in Clerk but DB record missing (sync failed at sign-up).
        // Recover by creating the record now and skip retries.
        if (status === 404 && clerkUser) {
          const synced = await syncUser({
            email: clerkUser.primaryEmailAddress?.emailAddress ?? '',
            full_name: clerkUser.fullName ?? clerkUser.firstName ?? '',
          })
          dispatch(setUser(synced))
          return synced
        }

        lastError = err
      }
    }

    throw lastError
  }

  // Redirect already-authenticated users to their dashboard
  useEffect(() => {
    if (!isSignedIn) return
    let isMounted = true

    setError('')
    setIsBootstrappingSession(true)

    void loadCurrentUser()
      .then((user) => {
        if (!isMounted) return
        navigate(getPostAuthPath(user), { replace: true })
      })
      .catch(() => {
        if (!isMounted) return
        setError('Unable to load your account. Please refresh and try again.')
      })
      .finally(() => {
        if (!isMounted) return
        setIsBootstrappingSession(false)
        setIsSubmitting(false)
      })

    return () => {
      isMounted = false
    }
  }, [dispatch, isSignedIn, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoaded || !signIn) return
    setIsSubmitting(true)
    setError('')

    try {
      const result = await signIn.create({ identifier: email, password })
      if (result.status === 'complete') {
        setIsBootstrappingSession(true)
        await setActive({ session: result.createdSessionId })
        return
      }
      setError('Sign in could not be completed. Please try again.')
    } catch (err: unknown) {
      const clerkErr = err as { errors?: Array<{ longMessage?: string; message?: string }> }
      setError(clerkErr.errors?.[0]?.longMessage ?? clerkErr.errors?.[0]?.message ?? 'Sign in failed.')
      setIsSubmitting(false)
      return
    }

    setIsSubmitting(false)
    setIsBootstrappingSession(false)
  }

  return (
    <div className="min-h-screen flex">
      {/* ── Left decorative panel ── */}
      <div
        className="hidden lg:flex flex-col w-[42%] relative overflow-hidden"
        style={{
          backgroundImage: "url('https://res.cloudinary.com/df3lhzzy7/image/upload/v1775388692/sign_in_pages_bg_uahfmz.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/80" aria-hidden="true" />
        <div className="relative z-10 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent" />
        <div className="relative z-10 flex flex-col flex-1 p-12 pt-14">
          <Link to="/" className="hover:opacity-80 transition-opacity">
            <KinfolkWordmark uppercase className="font-merriweather font-bold text-2xl tracking-[0.15em] text-white" />
          </Link>
          <p className="text-[9px] font-merriweather tracking-[0.35em] text-primary/70 uppercase mt-1">
            Preserve Your Roots
          </p>

          <div className="mt-auto mb-12">
            <div className="flex items-center gap-3 mb-6">
              <span className="h-px w-8 bg-primary/40" />
              <span className="text-primary text-[10px]">◆</span>
              <span className="h-px w-8 bg-primary/40" />
            </div>
            <blockquote className="font-merriweather text-white/70 text-sm leading-relaxed italic max-w-xs">
              "Connect with your heritage. Every family has a story worth preserving."
            </blockquote>
          </div>

          {/* Decorative tree lines */}
          <svg viewBox="0 0 280 180" className="absolute bottom-0 right-0 w-72 opacity-[0.04]" aria-hidden="true">
            <line x1="140" y1="20" x2="70" y2="90" stroke="#CDB53F" strokeWidth="2"/>
            <line x1="140" y1="20" x2="210" y2="90" stroke="#CDB53F" strokeWidth="2"/>
            <line x1="70" y1="90" x2="35" y2="160" stroke="#CDB53F" strokeWidth="1.5"/>
            <line x1="70" y1="90" x2="105" y2="160" stroke="#CDB53F" strokeWidth="1.5"/>
            <line x1="210" y1="90" x2="175" y2="160" stroke="#CDB53F" strokeWidth="1.5"/>
            <line x1="210" y1="90" x2="245" y2="160" stroke="#CDB53F" strokeWidth="1.5"/>
            <circle cx="140" cy="20" r="8" fill="#CDB53F"/>
            <circle cx="70" cy="90" r="6" fill="#CDB53F"/>
            <circle cx="210" cy="90" r="6" fill="#CDB53F"/>
            <circle cx="35" cy="160" r="5" fill="#CDB53F"/>
            <circle cx="105" cy="160" r="5" fill="#CDB53F"/>
            <circle cx="175" cy="160" r="5" fill="#CDB53F"/>
            <circle cx="245" cy="160" r="5" fill="#CDB53F"/>
          </svg>
        </div>
        <p className="relative z-10 p-12 pt-0 text-white/20 text-[10px] font-merriweather tracking-widest uppercase">
          © {new Date().getFullYear()} Kinfolk
        </p>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8">
            <Link to="/" className="hover:opacity-80 transition-opacity">
              <KinfolkWordmark uppercase className="font-merriweather font-bold text-2xl tracking-[0.12em] text-gray-900" />
            </Link>
          </div>

          <h1 className="font-merriweather font-bold text-2xl text-gray-900 mb-1">Welcome back</h1>
          <p className="text-sm text-gray-400 font-merriweather mb-8">Sign in to your Kinfolk account</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input label="Email Address" name="email" type="email" value={email}
              onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" disabled={isSubmitting || isBootstrappingSession} />
            <Input label="Password" name="password" type="password" value={password}
              onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" disabled={isSubmitting || isBootstrappingSession} />

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm font-merriweather flex items-center gap-2">
                <span className="text-red-400">✕</span> {error}
              </div>
            )}

            <Button type="submit" variant="primary" isLoading={isSubmitting || isBootstrappingSession}
              disabled={isSubmitting || isBootstrappingSession} className="w-full rounded-full py-3 mt-1">
              Sign In
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-300 font-merriweather leading-relaxed">
              Access is by invitation only.<br />Contact your clan leader if you haven&apos;t received credentials.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
