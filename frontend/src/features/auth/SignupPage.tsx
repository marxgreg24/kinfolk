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
import KinfolkWordmark from '@/components/ui/KinfolkWordmark'

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

  useEffect(() => {
    if (!clanName.trim()) { setClanValid(null); setClanValidating(false); return }
    setClanValidating(true); setClanValid(null)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try { setClanValid((await validateClanName(clanName.trim())).available) }
      catch { setClanValid(null) }
      finally { setClanValidating(false) }
    }, 500)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [clanName])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isLoaded || !signUp) return
    setIsSubmitting(true); setError('')

    try {
      await signUp.create({ emailAddress: email, password })
      if (signUp.createdSessionId) await setActive({ session: signUp.createdSessionId })
    } catch (err: unknown) {
      const clerkErr = err as { errors?: Array<{ longMessage?: string; message?: string }> }
      setError(clerkErr.errors?.[0]?.longMessage ?? clerkErr.errors?.[0]?.message ?? 'Sign up failed.')
      setIsSubmitting(false); return
    }

    try {
      const user = await syncUser({ clerk_user_id: signUp.createdUserId ?? '', email, full_name: fullName, clan_name: clanName })
      dispatch(setUser(user))
      if (user.role === 'admin') navigate('/admin')
      else if (user.role === 'clan_leader') navigate(user.password_reset_required ? '/reset-password' : '/clan-leader/dashboard')
      else navigate('/complete-profile')
    } catch {
      setError('Failed to sync your account. Please try again.')
    } finally { setIsSubmitting(false) }
  }

  const isDisabled = isSubmitting || !clanValid || !fullName.trim() || !email.trim() || password.length < 8

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

          <div className="mt-16 space-y-6">
            {[
              { n: '01', t: 'Find Your Clan', d: 'Enter your clan name to join the right family network.' },
              { n: '02', t: 'Build Your Tree', d: 'Define relationships and explore your genealogy visually.' },
              { n: '03', t: 'Connect & Chat', d: 'Stay in touch with relatives near and far.' },
            ].map((step) => (
              <div key={step.n} className="flex gap-4">
                <span className="text-primary font-merriweather font-bold text-xs opacity-60 mt-0.5 flex-shrink-0">{step.n}</span>
                <div>
                  <p className="text-white/80 text-sm font-merriweather font-medium">{step.t}</p>
                  <p className="text-white/35 text-xs font-merriweather mt-0.5 leading-relaxed">{step.d}</p>
                </div>
              </div>
            ))}
          </div>

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
      <div className="flex-1 flex items-center justify-center bg-white px-6 py-12 overflow-y-auto">
        <div className="w-full max-w-[400px]">
          <div className="lg:hidden mb-8">
            <KinfolkWordmark uppercase className="font-merriweather font-bold text-2xl tracking-[0.12em] text-gray-900" />
          </div>

          <h1 className="font-merriweather font-bold text-2xl text-gray-900 mb-1">Create your account</h1>
          <p className="text-sm text-gray-400 font-merriweather mb-8">Join your clan on Kinfolk</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input label="Full Name" name="full_name" value={fullName}
              onChange={(e) => setFullName(e.target.value)} required placeholder="e.g. Nakato Sarah" />
            <Input label="Email Address" name="email" type="email" value={email}
              onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
            <Input label="Password" name="password" type="password" value={password}
              onChange={(e) => setPassword(e.target.value)} required placeholder="At least 8 characters" />

            <div>
              <Input label="Clan Name" name="clan_name" value={clanName}
                onChange={(e) => setClanName(e.target.value)} required placeholder="e.g. Baganda" />
              {clanValidating && (
                <p className="text-gray-400 text-xs mt-1.5 font-merriweather flex items-center gap-1.5">
                  <span className="inline-block w-3 h-3 border-2 border-gray-300 border-t-primary rounded-full animate-spin" />
                  Checking clan name…
                </p>
              )}
              {!clanValidating && clanValid === true && (
                <p className="text-emerald-600 text-xs mt-1.5 font-merriweather flex items-center gap-1">
                  <span>✓</span> Clan found — you can proceed
                </p>
              )}
              {!clanValidating && clanValid === false && clanName.trim() !== '' && (
                <p className="text-red-500 text-xs mt-1.5 font-merriweather flex items-center gap-1">
                  <span>✕</span> Clan not found — check the spelling
                </p>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm font-merriweather">
                {error}
              </div>
            )}

            <Button type="submit" variant="primary" isLoading={isSubmitting}
              disabled={isDisabled} className="w-full rounded-full py-3 mt-1">
              Create Account
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-400 font-merriweather">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:text-secondary font-medium transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SignupPage
