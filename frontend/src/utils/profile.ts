import type { User } from '@/types/user'

export const isProfileComplete = (user: User): boolean => (
  user.birth_year != null &&
  user.gender != null &&
  user.phone != null &&
  user.phone.trim() !== ''
)

export const getPostAuthPath = (user: User): string => {
  if (user.role === 'admin') return '/admin'
  if (user.role === 'clan_leader') return user.password_reset_required ? '/reset-password' : '/clan-leader/dashboard'
  return isProfileComplete(user) ? '/dashboard' : '/complete-profile'
}