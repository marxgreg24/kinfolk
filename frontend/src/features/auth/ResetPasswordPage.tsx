import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/clerk-react'
import { useDispatch, useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import type { RootState, AppDispatch } from '@/store'
import { setUser } from '@/store/slices/authSlice'
import type { User } from '@/types/user'
import apiClient from '@/api/axios'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

const ResetPasswordPage = () => {
  const navigate = useNavigate()
  const { user: clerkUser, isLoaded } = useUser()
  const dispatch = useDispatch<AppDispatch>()
  const reduxUser = useSelector((state: RootState) => state.auth.user)

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isLoaded) return
    if (!reduxUser || reduxUser.role !== 'clan_leader') {
      navigate('/dashboard')
    }
  }, [isLoaded, reduxUser, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clerkUser) return

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setIsSubmitting(true)
    setError('')
    try {
      await clerkUser.updatePassword({
        newPassword,
        signOutOfOtherSessions: true,
      })

      const meRes = await apiClient.get('/api/v1/users/me')
      const updated = (meRes.data as { data: User }).data
      dispatch(setUser(updated))

      toast.success('Password updated successfully')
      navigate('/clan-leader/dashboard')
    } catch (err: unknown) {
      const clerkErr = err as { errors?: Array<{ longMessage?: string; message?: string }> }
      const msg =
        clerkErr.errors?.[0]?.longMessage ??
        clerkErr.errors?.[0]?.message ??
        'Failed to update password. Please try again.'
      setError(msg)
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
        <p className="text-sm text-gray-500 text-center mb-8">
          Please set a new password to continue
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="New Password"
            name="new_password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <Input
            label="Confirm Password"
            name="confirm_password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
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
            Set New Password
          </Button>
        </form>
      </div>
    </div>
  )
}

export default ResetPasswordPage
