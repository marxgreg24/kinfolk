import { useState } from 'react'
import { useSelector } from 'react-redux'
import type { RootState } from '@/store'
import { useListInterestForms, useUpdateInterestFormStatus } from '@/hooks/useAdmin'
import Sidebar from '@/components/layout/Sidebar'
import { SkeletonCards } from '@/components/ui/Skeleton'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'

type Tab = 'all' | 'pending' | 'approved' | 'rejected'
const TABS: Tab[] = ['all', 'pending', 'approved', 'rejected']

const AdminInterestForms = () => {
  const user = useSelector((s: RootState) => s.auth.user)
  const [activeTab, setActiveTab] = useState<Tab>('pending')
  const { data: forms, isLoading } = useListInterestForms(activeTab === 'all' ? undefined : activeTab)
  const updateStatus = useUpdateInterestFormStatus()

  if (!user) return <></>

  return (
    <div className="flex min-h-screen" style={{ background: '#fafaf8' }}>
      <Sidebar role={user.role} />
      <div className="flex-1 flex flex-col ml-64">
        <main className="flex-1 p-8">

          <div className="mb-7">
            <p className="text-xs font-merriweather tracking-[0.25em] text-secondary uppercase mb-1">Admin</p>
            <h1 className="text-2xl font-bold text-gray-900 font-merriweather">Interest Forms</h1>
            <p className="text-gray-400 text-sm mt-1 font-merriweather">Review and approve clan registration requests</p>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-6">
            {TABS.map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-5 py-2.5 text-sm font-merriweather capitalize transition-colors relative ${
                  activeTab === tab ? 'text-primary font-semibold' : 'text-gray-400 hover:text-gray-600'
                }`}>
                {tab}
                {activeTab === tab && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-full" />
                )}
              </button>
            ))}
          </div>

          {isLoading ? (
            <SkeletonCards count={4} />
          ) : !forms || forms.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-2xl p-16 text-center shadow-sm">
              <p className="text-gray-400 text-sm font-merriweather">No {activeTab === 'all' ? '' : activeTab} interest forms found.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {forms.map((form) => (
                <div key={form.id} className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                  <div className="h-[2px] bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
                  <div className="p-6">
                    {/* Top row */}
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="font-bold text-gray-900 font-merriweather text-base">{form.full_name}</p>
                        <p className="text-secondary text-sm font-merriweather mt-0.5">{form.clan_name}</p>
                      </div>
                      <Badge status={form.status} />
                    </div>

                    {/* Info grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm bg-gray-50/70 rounded-xl p-4">
                      {[
                        { label: 'Email', value: form.email },
                        { label: 'Phone', value: form.phone },
                        { label: 'Region', value: form.region ?? '—' },
                        { label: 'Expected Members', value: form.expected_members ?? '—' },
                      ].map((item) => (
                        <div key={item.label}>
                          <p className="text-[10px] text-gray-400 uppercase tracking-wider font-merriweather mb-0.5">{item.label}</p>
                          <p className="text-gray-700 font-merriweather text-sm">{item.value}</p>
                        </div>
                      ))}
                    </div>

                    {form.message && (
                      <div className="mt-4 border-l-2 border-primary/30 pl-4">
                        <p className="text-sm text-gray-500 font-merriweather italic leading-relaxed">{form.message}</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-50">
                      <p className="text-xs text-gray-400 font-merriweather">
                        Submitted {new Date(form.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                      {form.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button variant="primary" size="sm" isLoading={updateStatus.isPending}
                            onClick={() => updateStatus.mutate({ id: form.id, status: 'approved' })}
                            className="rounded-full px-4">
                            Approve
                          </Button>
                          <Button variant="danger" size="sm" isLoading={updateStatus.isPending}
                            onClick={() => updateStatus.mutate({ id: form.id, status: 'rejected' })}
                            className="rounded-full px-4">
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default AdminInterestForms
