import { useState } from 'react'
import { useSelector } from 'react-redux'
import type { RootState } from '@/store'
import { useListUsers, useSuspendUser, useDeleteUser } from '@/hooks/useAdmin'
import Navbar from '@/components/layout/Navbar'
import Sidebar from '@/components/layout/Sidebar'
import Spinner from '@/components/ui/Spinner'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Avatar from '@/components/ui/Avatar'
import Modal from '@/components/ui/Modal'

const AdminUsers = () => {
  const user = useSelector((s: RootState) => s.auth.user)
  const { data: users, isLoading } = useListUsers()
  const suspendMutation = useSuspendUser()
  const deleteMutation = useDeleteUser()

  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [confirmSuspend, setConfirmSuspend] = useState<{ id: string; suspend: boolean } | null>(null)
  const [roleFilter, setRoleFilter] = useState('')
  const [suspendedFilter, setSuspendedFilter] = useState('')

  if (!user || isLoading) return <Spinner fullScreen />

  const filtered = (users ?? []).filter((u) => {
    if (roleFilter && u.role !== roleFilter) return false
    if (suspendedFilter === 'true' && !u.is_suspended) return false
    if (suspendedFilter === 'false' && u.is_suspended) return false
    return true
  })

  const getRoleBadge = (role: string) => {
    if (role === 'clan_leader') return <Badge status="pending" label="Clan Leader" />
    if (role === 'general_user') return <Badge status="active" label="General User" />
    return <Badge status={role} label={role} />
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role={user.role} />

      <div className="flex-1 flex flex-col ml-64">
        <Navbar />

        <main className="flex-1 p-8">
          <h1 className="text-2xl font-bold text-gray-900 font-merriweather mb-6">Users</h1>

          <div className="flex gap-3 mb-6">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm font-merriweather"
            >
              <option value="">All Roles</option>
              <option value="general_user">General User</option>
              <option value="clan_leader">Clan Leader</option>
            </select>
            <select
              value={suspendedFilter}
              onChange={(e) => setSuspendedFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm font-merriweather"
            >
              <option value="">All Statuses</option>
              <option value="false">Active</option>
              <option value="true">Suspended</option>
            </select>
          </div>

          {filtered.length === 0 && (
            <p className="text-gray-500 text-sm text-center py-8">No users found.</p>
          )}

          {filtered.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr>
                    {['Name', 'Email', 'Role', 'Clan', 'Status', 'Joined', 'Actions'].map((h) => (
                      <th
                        key={h}
                        className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4 bg-gray-50"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Avatar src={u.profile_picture_url} name={u.full_name} size="sm" />
                          <span className="text-sm font-medium text-gray-900 font-merriweather">
                            {u.full_name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{u.email}</td>
                      <td className="py-3 px-4">{getRoleBadge(u.role)}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {u.clan_id ? `${u.clan_id.slice(0, 8)}...` : '—'}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          status={u.is_suspended ? 'suspended' : 'active'}
                          label={u.is_suspended ? 'Suspended' : 'Active'}
                        />
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {new Date(u.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          {u.is_suspended ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setConfirmSuspend({ id: u.id, suspend: false })}
                            >
                              Reactivate
                            </Button>
                          ) : (
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => setConfirmSuspend({ id: u.id, suspend: true })}
                            >
                              Suspend
                            </Button>
                          )}
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => setConfirmDelete(u.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>

      {/* Suspend/Reactivate confirm modal */}
      <Modal
        isOpen={!!confirmSuspend}
        onClose={() => setConfirmSuspend(null)}
        title="Confirm Action"
        size="sm"
      >
        <p className="text-sm text-gray-600 font-merriweather mb-6">
          {confirmSuspend?.suspend
            ? 'Are you sure you want to suspend this user?'
            : 'Are you sure you want to reactivate this user?'}
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" size="sm" onClick={() => setConfirmSuspend(null)}>
            Cancel
          </Button>
          <Button
            variant={confirmSuspend?.suspend ? 'danger' : 'primary'}
            size="sm"
            isLoading={suspendMutation.isPending}
            onClick={() => {
              if (confirmSuspend) {
                suspendMutation.mutate(confirmSuspend, {
                  onSettled: () => setConfirmSuspend(null),
                })
              }
            }}
          >
            Confirm
          </Button>
        </div>
      </Modal>

      {/* Delete confirm modal */}
      <Modal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Delete User"
        size="sm"
      >
        <p className="text-sm text-gray-600 font-merriweather mb-6">
          Are you sure? This action cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="outline" size="sm" onClick={() => setConfirmDelete(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            isLoading={deleteMutation.isPending}
            onClick={() => {
              if (confirmDelete) {
                deleteMutation.mutate(confirmDelete, {
                  onSettled: () => setConfirmDelete(null),
                })
              }
            }}
          >
            Delete Account
          </Button>
        </div>
      </Modal>
    </div>
  )
}

export default AdminUsers
