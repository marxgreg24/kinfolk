import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSignIn, useAuth } from '@clerk/clerk-react'
import { useDispatch } from 'react-redux'
import type { AppDispatch } from '@/store'
import { setUser } from '@/store/slices/authSlice'
import { getMe } from '@/api/users'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import KinfolkWordmark from '@/components/ui/KinfolkWordmark'

const LoginPage = () => {
  const { signIn, isLoaded, setActive } = useSignIn()
  const { isSignedIn } = useAuth()
  const navigate = useNavigate()
  const dispatch = useDispatch<AppDispatch>()

  // Redirect already-authenticated users to their dashboard
  useEffect(() => {
    if (!isSignedIn) return
    getMe()
      .then((user) => {
        dispatch(setUser(user))
        if (user.role === 'admin') navigate('/admin', { replace: true })
        else if (user.role === 'clan_leader') navigate(user.password_reset_required ? '/reset-password' : '/clan-leader/dashboard', { replace: true })
        else navigate('/complete-profile', { replace: true })
      })
      .catch(() => {/* session exists but profile fetch failed — let them stay on login */})
  }, [isSignedIn]) // eslint-disable-line react-hooks/exhaustive-deps

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoaded || !signIn) return
    setIsSubmitting(true)
    setError('')

    try {
      const result = await signIn.create({ identifier: email, password })
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
      }
    } catch (err: unknown) {
      const clerkErr = err as { errors?: Array<{ longMessage?: string; message?: string }> }
      setError(clerkErr.errors?.[0]?.longMessage ?? clerkErr.errors?.[0]?.message ?? 'Sign in failed.')
      setIsSubmitting(false)
      return
    }

    try {
      const user = await getMe()
      dispatch(setUser(user))
      if (user.role === 'admin') navigate('/admin')
      else if (user.role === 'clan_leader') navigate(user.password_reset_required ? '/reset-password' : '/clan-leader/dashboard')
      else navigate('/complete-profile')
    } catch {
      setError('Unable to load your account. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* ── Left decorative panel ── */}
      <div
        className="hidden lg:flex flex-col w-[42%] relative overflow-hidden"
        style={{ background: 'linear-gradient(155deg, #141414 0%, #1c1406 55%, #111 100%)' }}
      >
        <div className="h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent" />
        <div className="flex flex-col flex-1 p-12 pt-14">
          <KinfolkWordmark uppercase className="font-merriweather font-bold text-2xl tracking-[0.15em] text-white" />
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
        <p className="p-12 pt-0 text-white/20 text-[10px] font-merriweather tracking-widest uppercase">
          © {new Date().getFullYear()} Kinfolk
        </p>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8">
            <KinfolkWordmark uppercase className="font-merriweather font-bold text-2xl tracking-[0.12em] text-gray-900" />
          </div>

          <h1 className="font-merriweather font-bold text-2xl text-gray-900 mb-1">Welcome back</h1>
          <p className="text-sm text-gray-400 font-merriweather mb-8">Sign in to your Kinfolk account</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input label="Email Address" name="email" type="email" value={email}
              onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
            <Input label="Password" name="password" type="password" value={password}
              onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm font-merriweather flex items-center gap-2">
                <span className="text-red-400">✕</span> {error}
              </div>
            )}

            <Button type="submit" variant="primary" isLoading={isSubmitting}
              disabled={isSubmitting} className="w-full rounded-full py-3 mt-1">
              Sign In
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 flex flex-col gap-3 text-center">
            <p className="text-sm text-gray-400 font-merriweather">
              Don&apos;t have an account?{' '}
              <Link to="/signup" className="text-primary hover:text-secondary font-medium transition-colors">
                Create one
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
