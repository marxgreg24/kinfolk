import { useState } from 'react'
import { useSelector } from 'react-redux'
import type { RootState } from '@/store'
import { useListUsers, useCreateClanLeader } from '@/hooks/useAdmin'
import Navbar from '@/components/layout/Navbar'
import Sidebar from '@/components/layout/Sidebar'
import Spinner from '@/components/ui/Spinner'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Avatar from '@/components/ui/Avatar'

const EMPTY_FORM = { full_name: '', email: '', phone: '' }

const AdminClanLeaders = () => {
  const user = useSelector((s: RootState) => s.auth.user)
  const createMutation = useCreateClanLeader()
  const { data: clanLeaders, isLoading } = useListUsers({ role: 'clan_leader' })
  const [form, setForm] = useState(EMPTY_FORM)

  if (!user) return <Spinner fullScreen />

  const handleChange =
    (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.full_name.trim() || !form.email.trim() || !form.phone.trim()) return
    createMutation.mutate(
      { full_name: form.full_name.trim(), email: form.email.trim(), phone: form.phone.trim() },
      { onSuccess: () => setForm(EMPTY_FORM) },
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role={user.role} />

      <div className="flex-1 flex flex-col ml-64">
        <Navbar />

        <main className="flex-1 p-8">
          {/* Create form */}
          <div className="bg-white border border-gray-100 rounded-xl p-6 mb-8">
            <h2 className="font-merriweather font-bold text-lg mb-4">Add New Clan Leader</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-md">
              <Input
                label="Full Name"
                required
                value={form.full_name}
                onChange={handleChange('full_name')}
                placeholder="e.g. Namukasa Joyce"
              />
              <Input
                label="Email"
                type="email"
                required
                value={form.email}
                onChange={handleChange('email')}
                placeholder="joyce@gmail.com"
              />
              <Input
                label="Phone"
                type="tel"
                required
                value={form.phone}
                onChange={handleChange('phone')}
                placeholder="+256700000002"
              />
              <p className="text-xs text-gray-400">
                A welcome email will be sent with temporary login credentials.
              </p>
              <Button
                type="submit"
                variant="primary"
                isLoading={createMutation.isPending}
                disabled={!form.full_name.trim() || !form.email.trim() || !form.phone.trim()}
              >
                Create Clan Leader
              </Button>
            </form>
          </div>

          {/* Existing leaders */}
          <h2 className="font-merriweather font-bold text-lg mb-4">Existing Clan Leaders</h2>

          {isLoading && <Spinner />}

          {!isLoading && (!clanLeaders || clanLeaders.length === 0) && (
            <p className="text-gray-500 text-sm text-center py-8">No clan leaders yet.</p>
          )}

          {!isLoading && clanLeaders && clanLeaders.length > 0 && (
            <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr>
                    {['Name', 'Email', 'Clan', 'Status', 'Joined'].map((h) => (
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
                  {clanLeaders.map((l) => (
                    <tr key={l.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Avatar src={l.profile_picture_url} name={l.full_name} size="sm" />
                          <span className="text-sm font-medium text-gray-900 font-merriweather">
                            {l.full_name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{l.email}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {l.clan_id ? `${l.clan_id.slice(0, 8)}...` : '—'}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          status={l.is_suspended ? 'suspended' : 'active'}
                          label={l.is_suspended ? 'Suspended' : 'Active'}
                        />
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {new Date(l.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default AdminClanLeaders
