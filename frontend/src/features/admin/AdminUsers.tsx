import { useState } from 'react'
import { useSelector } from 'react-redux'
import type { RootState } from '@/store'
import { useListUsers, useSuspendUser, useDeleteUser } from '@/hooks/useAdmin'
import Sidebar from '@/components/layout/Sidebar'
import { SkeletonTableRows } from '@/components/ui/Skeleton'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Avatar from '@/components/ui/Avatar'
import Modal from '@/components/ui/Modal'

type RoleFilter = 'all' | 'general_user' | 'clan_leader' | 'admin'
const ROLES: RoleFilter[] = ['all', 'general_user', 'clan_leader', 'admin']

const AdminUsers = () => {
  const user = useSelector((s: RootState) => s.auth.user)
  const { data: users, isLoading } = useListUsers()
  const suspendUser = useSuspendUser()
  const deleteUser = useDeleteUser()

  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all')
  const [showSuspended, setShowSuspended] = useState(false)
  const [suspendTarget, setSuspendTarget] = useState<{ id: string; name: string; isSuspended: boolean } | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)

  if (!user) return <></>

  const filtered = (users ?? []).filter((u) => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false
    if (showSuspended && !u.is_suspended) return false
    return true
  })

  return (
    <div className="flex min-h-screen" style={{ background: '#fafaf8' }}>
      <Sidebar role={user.role} />
      <div className="flex-1 flex flex-col ml-64">
        <main className="flex-1 p-8">

          <div className="mb-7">
            <p className="text-xs font-merriweather tracking-[0.25em] text-secondary uppercase mb-1">Admin</p>
            <h1 className="text-2xl font-bold text-gray-900 font-merriweather">Manage Users</h1>
            <p className="text-gray-400 text-sm mt-1 font-merriweather">{users?.length ?? 0} total users on the platform</p>
          </div>

          {/* Filters */}
          <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-6 flex flex-wrap items-center gap-3 shadow-sm">
            <div className="flex border border-gray-100 rounded-xl overflow-hidden">
              {ROLES.map((role) => (
                <button key={role} onClick={() => setRoleFilter(role)}
                  className={`px-3 py-1.5 text-xs font-merriweather capitalize transition-colors ${roleFilter === role ? 'bg-primary text-white' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
                  {role.replace('_', ' ')}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2 text-xs font-merriweather text-gray-500 cursor-pointer ml-auto">
              <input type="checkbox" checked={showSuspended} onChange={(e) => setShowSuspended(e.target.checked)} className="rounded accent-primary" />
              Suspended only
            </label>
          </div>

          {isLoading ? (
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
              <div className="h-[2px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-50">{['Name','Email','Role','Status','Joined',''].map((h) => <th key={h} className="text-left text-[10px] font-merriweather font-semibold text-gray-400 uppercase tracking-widest py-3.5 px-5 bg-gray-50/50">{h}</th>)}</tr>
                </thead>
                <tbody><SkeletonTableRows rows={6} cols={6} /></tbody>
              </table>
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-2xl p-16 text-center shadow-sm">
              <p className="text-gray-400 font-merriweather text-sm">No users match the current filters.</p>
            </div>
          ) : (
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
              <div className="h-[2px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-50">
                    {['User', 'Role', 'Status', 'Joined', 'Actions'].map((h) => (
                      <th key={h} className="text-left text-[10px] font-merriweather font-semibold text-gray-400 uppercase tracking-widest py-3.5 px-5 bg-gray-50/50">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u, i) => (
                    <tr key={u.id} className={`hover:bg-gray-50/70 transition-colors ${i < filtered.length - 1 ? 'border-b border-gray-50' : ''}`}>
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <Avatar src={u.profile_picture_url} name={u.full_name} size="sm" />
                          <div>
                            <p className="text-sm font-semibold text-gray-900 font-merriweather">{u.full_name}</p>
                            <p className="text-xs text-gray-400 font-merriweather">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-5"><span className="text-xs font-merriweather text-gray-500 capitalize">{u.role.replace('_', ' ')}</span></td>
                      <td className="py-3.5 px-5"><Badge status={u.is_suspended ? 'suspended' : 'active'} label={u.is_suspended ? 'Suspended' : 'Active'} /></td>
                      <td className="py-3.5 px-5 text-xs text-gray-400 font-merriweather">
                        {new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-2">
                          <button onClick={() => setSuspendTarget({ id: u.id, name: u.full_name, isSuspended: u.is_suspended })}
                            className={`text-xs font-merriweather px-2.5 py-1 rounded-lg border transition-colors ${u.is_suspended ? 'border-emerald-200 text-emerald-600 hover:bg-emerald-50' : 'border-amber-200 text-amber-600 hover:bg-amber-50'}`}>
                            {u.is_suspended ? 'Unsuspend' : 'Suspend'}
                          </button>
                          <button onClick={() => setDeleteTarget({ id: u.id, name: u.full_name })}
                            className="text-xs font-merriweather px-2.5 py-1 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors">
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <Modal isOpen={!!suspendTarget} onClose={() => setSuspendTarget(null)}
            title={suspendTarget?.isSuspended ? 'Unsuspend User' : 'Suspend User'} size="sm">
            <p className="text-sm text-gray-600 font-merriweather mb-6 leading-relaxed">
              {suspendTarget?.isSuspended
                ? `Restore full access for ${suspendTarget.name}?`
                : `This will prevent ${suspendTarget?.name} from accessing Kinfolk. You can reverse this at any time.`}
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" size="sm" onClick={() => setSuspendTarget(null)}>Cancel</Button>
              <Button variant={suspendTarget?.isSuspended ? 'primary' : 'secondary'} size="sm"
                isLoading={suspendUser.isPending}
                onClick={() => { if (!suspendTarget) return; suspendUser.mutate({ id: suspendTarget.id, suspend: !suspendTarget.isSuspended }, { onSuccess: () => setSuspendTarget(null) }) }}>
                {suspendTarget?.isSuspended ? 'Unsuspend' : 'Suspend'}
              </Button>
            </div>
          </Modal>

          <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete User" size="sm">
            <p className="text-sm text-gray-600 font-merriweather mb-6 leading-relaxed">
              Permanently delete <strong>{deleteTarget?.name}</strong>? This cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)}>Cancel</Button>
              <Button variant="danger" size="sm" isLoading={deleteUser.isPending}
                onClick={() => { if (!deleteTarget) return; deleteUser.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) }) }}>
                Delete User
              </Button>
            </div>
          </Modal>
        </main>
      </div>
    </div>
  )
}

export default AdminUsers
