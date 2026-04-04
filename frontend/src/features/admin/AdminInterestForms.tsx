import { useState } from 'react'
import { useSelector } from 'react-redux'
import type { RootState } from '@/store'
import { useListInterestForms, useUpdateInterestFormStatus } from '@/hooks/useAdmin'
import Navbar from '@/components/layout/Navbar'
import Sidebar from '@/components/layout/Sidebar'
import Spinner from '@/components/ui/Spinner'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'

type Tab = 'all' | 'pending' | 'approved' | 'rejected'
const TABS: Tab[] = ['all', 'pending', 'approved', 'rejected']

const AdminInterestForms = () => {
  const user = useSelector((s: RootState) => s.auth.user)
  const [activeTab, setActiveTab] = useState<Tab>('all')
  const { data: forms, isLoading } = useListInterestForms(
    activeTab === 'all' ? undefined : activeTab,
  )
  const updateStatus = useUpdateInterestFormStatus()

  if (!user) return <Spinner fullScreen />

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role={user.role} />

      <div className="flex-1 flex flex-col ml-64">
        <Navbar />

        <main className="flex-1 p-8">
          <h1 className="text-2xl font-bold text-gray-900 font-merriweather mb-6">
            Interest Forms
          </h1>

          {/* Tabs */}
          <div className="flex gap-0 mb-6 border-b border-gray-200">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-merriweather cursor-pointer capitalize ${
                  activeTab === tab
                    ? 'border-b-2 border-primary text-primary font-semibold'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {isLoading && <Spinner />}

          {!isLoading && (!forms || forms.length === 0) && (
            <p className="text-gray-500 text-sm text-center py-8">No interest forms found.</p>
          )}

          {!isLoading && forms?.map((form) => (
            <div
              key={form.id}
              className="bg-white border border-gray-100 rounded-xl p-6 mb-4 shadow-sm"
            >
              {/* Top row */}
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-gray-900 font-merriweather">{form.full_name}</p>
                  <p className="text-secondary text-sm">{form.clan_name}</p>
                </div>
                <Badge status={form.status} />
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                <div>
                  <p className="text-xs text-gray-400 uppercase mb-1">Email</p>
                  <p className="text-gray-700">{form.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase mb-1">Phone</p>
                  <p className="text-gray-700">{form.phone}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase mb-1">Region</p>
                  <p className="text-gray-700">{form.region ?? '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase mb-1">Expected Members</p>
                  <p className="text-gray-700">{form.expected_members ?? '—'}</p>
                </div>
              </div>

              {/* Message */}
              {form.message && (
                <div className="mt-4 bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600 italic">{form.message}</p>
                </div>
              )}

              {/* Submitted date */}
              <p className="text-xs text-gray-400 mt-3">
                Submitted{' '}
                {new Date(form.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>

              {/* Actions */}
              {form.status === 'pending' && (
                <div className="flex gap-3 mt-4 justify-end">
                  <Button
                    variant="primary"
                    size="sm"
                    isLoading={updateStatus.isPending}
                    onClick={() => updateStatus.mutate({ id: form.id, status: 'approved' })}
                  >
                    Approve
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    isLoading={updateStatus.isPending}
                    onClick={() => updateStatus.mutate({ id: form.id, status: 'rejected' })}
                  >
                    Reject
                  </Button>
                </div>
              )}
            </div>
          ))}
        </main>
      </div>
    </div>
  )
}

export default AdminInterestForms
