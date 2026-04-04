import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'
import { useClerk } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import type { AppDispatch } from '@/store'
import { setUser, clearUser } from '@/store/slices/authSlice'
import { getMe, updateMe, completeProfile, deleteMe } from '@/api/users'
import { useAuth as useClerkAuth } from '@clerk/clerk-react'

export const useGetMe = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { isSignedIn } = useClerkAuth()

  return useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const user = await getMe()
      dispatch(setUser(user))
      return user
    },
    enabled: !!isSignedIn,
    staleTime: 1000 * 60 * 5,
  })
}

export const useUpdateMe = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: updateMe,
    onSuccess: () => {
      toast.success('Profile updated successfully')
      void queryClient.invalidateQueries({ queryKey: ['me'] })
    },
    onError: () => {
      toast.error('Failed to update profile. Please try again.')
    },
  })
}

export const useCompleteProfile = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: completeProfile,
    onSuccess: () => {
      toast.success('Profile completed!')
      void queryClient.invalidateQueries({ queryKey: ['me'] })
    },
  })
}

export const useDeleteMe = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { signOut } = useClerk()
  const navigate = useNavigate()
  return useMutation({
    mutationFn: deleteMe,
    onSuccess: async () => {
      dispatch(clearUser())
      toast.success('Your account has been deleted.')
      await signOut()
      navigate('/')
    },
    onError: () => {
      toast.error('Failed to delete account. Please try again.')
    },
  })
}
