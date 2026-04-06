import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { useDispatch, useSelector } from 'react-redux'
import notify from '@/utils/toast'
import type { RootState, AppDispatch } from '@/store'
import { setUser } from '@/store/slices/authSlice'
import type { User } from '@/types/user'
import apiClient from '@/api/axios'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import KinfolkWordmark from '@/components/ui/KinfolkWordmark'

const WelcomePage = () => {
  const navigate = useNavigate()
  const { isLoaded } = useAuth()
  const dispatch = useDispatch<AppDispatch>()
  const reduxUser = useSelector((state: RootState) => state.auth.user)

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Guard: only general_user with password_reset_required may access this page
  useEffect(() => {
    if (!isLoaded || !reduxUser) return
    if (!reduxUser.password_reset_required) {
      navigate('/dashboard', { replace: true })
    }
  }, [isLoaded, reduxUser, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return }
    if (newPassword.length < 8) { setError('Password must be at least 8 characters'); return }

    setIsSubmitting(true)
    setError('')
    try {
      await apiClient.post('/api/v1/users/me/set-password', { new_password: newPassword })
      const meRes = await apiClient.get('/api/v1/users/me')
      dispatch(setUser((meRes.data as { data: User }).data))
      notify.success('Password set! Welcome to Kinfolk.')
      navigate('/dashboard')
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } }; message?: string }
      setError(axiosErr.response?.data?.error ?? axiosErr.message ?? 'Failed to set password.')
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
          <p className="text-[9px] font-merriweather tracking-[0.35em] text-primary/70 uppercase mt-1">Preserve Your Roots</p>

          <div className="mt-auto mb-12">
            {/* Family tree icon */}
            <div className="w-12 h-12 rounded-full border border-primary/30 flex items-center justify-center mb-6">
              <svg viewBox="0 0 24 24" fill="none" stroke="#CDB53F" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                <circle cx="12" cy="4" r="2"/>
                <circle cx="6" cy="14" r="2"/>
                <circle cx="18" cy="14" r="2"/>
                <path d="M12 6v4M12 10l-4 2M12 10l4 2"/>
                <circle cx="12" cy="20" r="2"/>
                <path d="M12 16v2"/>
              </svg>
            </div>
            <p className="font-merriweather text-white/70 text-sm leading-relaxed max-w-xs">
              Your clan leader has added you to your family&rsquo;s story on Kinfolk. Set your personal password to get started.
            </p>
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
      <div className="flex-1 flex items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-[400px]">
          <div className="lg:hidden mb-8">
            <KinfolkWordmark uppercase className="font-merriweather font-bold text-2xl tracking-[0.12em] text-gray-900" />
          </div>

          {/* Welcome badge */}
          <div className="flex items-center gap-2 mb-5">
            <span className="h-px w-4 bg-primary/40" />
            <span className="text-[10px] font-merriweather tracking-[0.3em] text-secondary uppercase">Welcome</span>
          </div>

          <h1 className="font-merriweather font-bold text-2xl text-gray-900 mb-1">
            Hello, {reduxUser?.full_name?.split(' ')[0] ?? 'there'}!
          </h1>
          <p className="text-sm text-gray-400 font-merriweather mb-8">
            You have been added to your clan on Kinfolk. Set a personal password to secure your account and get started.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="New Password"
              name="new_password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              placeholder="At least 8 characters"
            />
            <Input
              label="Confirm Password"
              name="confirm_password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Repeat your password"
            />

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm font-merriweather">
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              disabled={isSubmitting}
              className="w-full rounded-full py-3 mt-1"
            >
              Set Password &amp; Enter Kinfolk
            </Button>
          </form>

          <p className="text-xs text-gray-300 font-merriweather text-center mt-6 leading-relaxed">
            Need help? Contact{' '}
            <a href="mailto:info@kinfolkapp.me" className="text-secondary hover:underline">
              info@kinfolkapp.me
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default WelcomePage
