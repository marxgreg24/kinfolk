import { createBrowserRouter } from 'react-router-dom'
import React, { lazy, Suspense } from 'react'
import Spinner from '@/components/ui/Spinner'
import ProtectedRoute from '@/components/layout/ProtectedRoute'
import AdminRoute from '@/components/layout/AdminRoute'
import ClanLeaderRoute from '@/components/layout/ClanLeaderRoute'

const withSuspense = (Component: React.LazyExoticComponent<() => React.ReactElement>) => (
  <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Spinner /></div>}>
    <Component />
  </Suspense>
)

const LandingPage         = lazy(() => import('@/features/landing/LandingPage'))
const LoginPage           = lazy(() => import('@/features/auth/LoginPage'))
const WelcomePage         = lazy(() => import('@/features/auth/WelcomePage'))
const CompleteProfilePage = lazy(() => import('@/features/auth/CompleteProfilePage'))
const ResetPasswordPage   = lazy(() => import('@/features/auth/ResetPasswordPage'))
const DashboardPage       = lazy(() => import('@/features/dashboard/DashboardPage'))
const ClanPage            = lazy(() => import('@/features/clan/ClanPage'))
const ClanChat            = lazy(() => import('@/components/chat/ClanChat'))
const FamilyTree          = lazy(() => import('@/components/tree/FamilyTree'))
const ClanLeaderDashboard = lazy(() => import('@/features/clanLeader/ClanLeaderDashboard'))
const CreateClanPage      = lazy(() => import('@/features/clanLeader/CreateClanPage'))
const AddMemberPage          = lazy(() => import('@/features/clanLeader/AddMemberPage'))
const MemberInterestsPage    = lazy(() => import('@/features/clanLeader/MemberInterestsPage'))
const ConflictsPage          = lazy(() => import('@/features/clanLeader/ConflictsPage'))
const MyClanPage             = lazy(() => import('@/features/clanLeader/MyClanPage'))
const AdminDashboard      = lazy(() => import('@/features/admin/AdminDashboard'))
const AdminUsers          = lazy(() => import('@/features/admin/AdminUsers'))
const AdminClanLeaders    = lazy(() => import('@/features/admin/AdminClanLeaders'))
const AdminInterestForms  = lazy(() => import('@/features/admin/AdminInterestForms'))
const AdminAuditLogs      = lazy(() => import('@/features/admin/AdminAuditLogs'))
const NotFoundPage        = lazy(() => import('@/features/NotFoundPage'))

export const router = createBrowserRouter([
  { path: '/',                        element: withSuspense(LandingPage) },
  { path: '/login',                   element: withSuspense(LoginPage) },
  { path: '/welcome',                 element: <ProtectedRoute>{withSuspense(WelcomePage)}</ProtectedRoute> },
  { path: '/complete-profile',        element: <ProtectedRoute>{withSuspense(CompleteProfilePage)}</ProtectedRoute> },
  { path: '/reset-password',          element: <ProtectedRoute>{withSuspense(ResetPasswordPage)}</ProtectedRoute> },
  { path: '/dashboard',               element: <ProtectedRoute>{withSuspense(DashboardPage)}</ProtectedRoute> },
  { path: '/clan',                    element: <ProtectedRoute>{withSuspense(ClanPage)}</ProtectedRoute> },
  { path: '/clan/chat',               element: <ProtectedRoute>{withSuspense(ClanChat)}</ProtectedRoute> },
  { path: '/clan/tree',               element: <ProtectedRoute>{withSuspense(FamilyTree)}</ProtectedRoute> },
  { path: '/clan-leader/dashboard',   element: <ClanLeaderRoute>{withSuspense(ClanLeaderDashboard)}</ClanLeaderRoute> },
  { path: '/clan-leader/create',      element: <ClanLeaderRoute>{withSuspense(CreateClanPage)}</ClanLeaderRoute> },
  { path: '/clan-leader/members/add',       element: <ClanLeaderRoute>{withSuspense(AddMemberPage)}</ClanLeaderRoute> },
  { path: '/clan-leader/my-clan',          element: <ClanLeaderRoute>{withSuspense(MyClanPage)}</ClanLeaderRoute> },
  { path: '/clan-leader/member-interests', element: <ClanLeaderRoute>{withSuspense(MemberInterestsPage)}</ClanLeaderRoute> },
  { path: '/clan-leader/conflicts',         element: <ClanLeaderRoute>{withSuspense(ConflictsPage)}</ClanLeaderRoute> },
  { path: '/admin',                   element: <AdminRoute>{withSuspense(AdminDashboard)}</AdminRoute> },
  { path: '/admin/users',             element: <AdminRoute>{withSuspense(AdminUsers)}</AdminRoute> },
  { path: '/admin/clan-leaders',      element: <AdminRoute>{withSuspense(AdminClanLeaders)}</AdminRoute> },
  { path: '/admin/interest-forms',    element: <AdminRoute>{withSuspense(AdminInterestForms)}</AdminRoute> },
  { path: '/admin/audit-logs',        element: <AdminRoute>{withSuspense(AdminAuditLogs)}</AdminRoute> },
  { path: '*',                        element: withSuspense(NotFoundPage) },
])
