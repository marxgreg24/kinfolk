import { useState } from 'react'
import { useSelector } from 'react-redux'
import { useLocation } from 'react-router-dom'
import type { RootState } from '@/store'
import { useListUsers, useCreateClanLeader, useListAdminClans } from '@/hooks/useAdmin'
import Sidebar from '@/components/layout/Sidebar'
import { SkeletonTableRows } from '@/components/ui/Skeleton'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Avatar from '@/components/ui/Avatar'

const EMPTY_FORM = { full_name: '', email: '', phone: '' }

const AdminClanLeaders = () => {
  const user = useSelector((s: RootState) => s.auth.user)
  const location = useLocation()
  const prefill = (location.state as { prefill?: { full_name: string; email: string; phone: string } } | null)?.prefill
  const createMutation = useCreateClanLeader()
  const { data: clanLeaders, isLoading } = useListUsers({ role: 'clan_leader' })
  const { data: clans } = useListAdminClans()
  const clanNameById = Object.fromEntries((clans ?? []).map((c) => [c.id, c.name]))
  const [form, setForm] = useState(prefill ?? EMPTY_FORM)

  if (!user) return <></>

  const handleChange = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
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
    <div className="flex min-h-screen" style={{ background: '#fafaf8' }}>
      <Sidebar role={user.role} />
      <div className="flex-1 flex flex-col md:ml-64">
        <main className="flex-1 p-8">

          <div className="mb-7">
            <p className="text-xs font-merriweather tracking-[0.25em] text-secondary uppercase mb-1">Admin</p>
            <h1 className="text-2xl font-bold text-gray-900 font-merriweather">Clan Leaders</h1>
            <p className="text-gray-400 text-sm mt-1 font-merriweather">Create and manage clan leader accounts</p>
          </div>

          {/* Create form */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden mb-8">
            <div className="h-[2px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            <div className="p-6">
              <h2 className="font-merriweather font-bold text-base text-gray-900 mb-5">Add New Clan Leader</h2>
              {prefill && (
                <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 font-merriweather">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" /></svg>
                  Pre-filled from approved interest form. Review and create the account.
                </div>
              )}
              <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                <Input label="Full Name" required value={form.full_name} onChange={handleChange('full_name')} placeholder="e.g. Namukasa Joyce" />
                <Input label="Email" type="email" required value={form.email} onChange={handleChange('email')} placeholder="joyce@gmail.com" />
                <Input label="Phone" type="tel" required value={form.phone} onChange={handleChange('phone')} placeholder="+256 700 000 000" />
                <div className="sm:col-span-3 flex items-center justify-between pt-1">
                  <p className="text-xs text-gray-400 font-merriweather">A welcome email with temporary login credentials will be sent automatically.</p>
                  <Button type="submit" variant="primary" isLoading={createMutation.isPending}
                    disabled={!form.full_name.trim() || !form.email.trim() || !form.phone.trim()} className="rounded-full px-6">
                    Create Clan Leader
                  </Button>
                </div>
              </form>
            </div>
          </div>

          {/* Leaders table */}
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-merriweather font-bold text-base text-gray-900">Existing Clan Leaders</h2>
            <span className="text-xs text-gray-400 font-merriweather">{clanLeaders?.length ?? 0} leaders</span>
          </div>

          {isLoading ? (
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
              <div className="h-[2px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
              <table className="w-full">
                <thead><tr className="border-b border-gray-50">{['Leader','Email','Clan','Status','Joined'].map((h) => <th key={h} className="text-left text-[10px] font-merriweather font-semibold text-gray-400 uppercase tracking-widest py-3.5 px-5 bg-gray-50/50">{h}</th>)}</tr></thead>
                <tbody><SkeletonTableRows rows={5} cols={5} /></tbody>
              </table>
            </div>
          ) : !clanLeaders || clanLeaders.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-2xl p-16 text-center shadow-sm">
              <p className="text-gray-400 text-sm font-merriweather">No clan leaders yet.</p>
            </div>
          ) : (
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
              <div className="h-[2px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-50">
                    {['Leader', 'Email', 'Clan', 'Status', 'Joined'].map((h) => (
                      <th key={h} className="text-left text-[10px] font-merriweather font-semibold text-gray-400 uppercase tracking-widest py-3.5 px-5 bg-gray-50/50">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {clanLeaders.map((l, i) => (
                    <tr key={l.id} className={`hover:bg-gray-50/70 transition-colors ${i < clanLeaders.length - 1 ? 'border-b border-gray-50' : ''}`}>
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <Avatar src={l.profile_picture_url} name={l.full_name} size="sm" />
                          <span className="text-sm font-semibold text-gray-900 font-merriweather">{l.full_name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-5 text-sm text-gray-500 font-merriweather">{l.email}</td>
                      <td className="py-3.5 px-5 text-sm text-gray-600 font-merriweather">
                        {l.clan_id ? (clanNameById[l.clan_id] ?? `${l.clan_id.slice(0, 8)}…`) : '—'}
                      </td>
                      <td className="py-3.5 px-5">
                        <Badge status={l.is_suspended ? 'suspended' : 'active'} label={l.is_suspended ? 'Suspended' : 'Active'} />
                      </td>
                      <td className="py-3.5 px-5 text-xs text-gray-400 font-merriweather">
                        {new Date(l.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
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
