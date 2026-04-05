import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'
import { useClerk } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'
import notify from '@/utils/toast'
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
      notify.success('Profile updated successfully.')
      void queryClient.invalidateQueries({ queryKey: ['me'] })
    },
    onError: () => {
      notify.error('Failed to update profile. Please try again.')
    },
  })
}

export const useCompleteProfile = () => {
  const dispatch = useDispatch<AppDispatch>()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: completeProfile,
    onSuccess: async () => {
      const user = await queryClient.fetchQuery({
        queryKey: ['me'],
        queryFn: getMe,
      })
      dispatch(setUser(user))
      notify.success('Profile saved — welcome to Kinfolk.')
      void queryClient.invalidateQueries({ queryKey: ['me'] })
    },
    onError: () => {
      notify.error('Failed to save your profile. Please try again.')
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
      notify.success('Your account has been deleted.')
      await signOut()
      navigate('/')
    },
    onError: () => {
      notify.error('Failed to delete account. Please try again.')
    },
  })
}
