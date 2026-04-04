import { useState } from 'react'
import { useSelector } from 'react-redux'
import type { RootState } from '@/store'
import { useListAuditLogs } from '@/hooks/useAdmin'
import Navbar from '@/components/layout/Navbar'
import Sidebar from '@/components/layout/Sidebar'
import Spinner from '@/components/ui/Spinner'
import Button from '@/components/ui/Button'

const AdminAuditLogs = () => {
  const user = useSelector((s: RootState) => s.auth.user)
  const [actionFilter, setActionFilter] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const filters = {
    action: actionFilter || undefined,
    from: fromDate || undefined,
    to: toDate ? new Date(toDate).toISOString() : undefined,
  }
  const { data: logs, isLoading } = useListAuditLogs(filters)

  if (!user || isLoading) return <Spinner fullScreen />

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role={user.role} />

      <div className="flex-1 flex flex-col ml-64">
        <Navbar />

        <main className="flex-1 p-8">
          <h1 className="text-2xl font-bold text-gray-900 font-merriweather mb-6">
            Audit Logs
          </h1>

          {/* Filters */}
          <div className="flex gap-3 mb-6 flex-wrap items-center">
            <input
              type="text"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              placeholder="Filter by action (e.g. clan_created)"
              className="w-64 border border-gray-300 rounded-lg px-3 py-2 text-sm font-merriweather focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm font-merriweather focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm font-merriweather focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setActionFilter('')
                setFromDate('')
                setToDate('')
              }}
            >
              Clear
            </Button>
          </div>

          {!logs || logs.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">No audit logs found.</p>
          ) : (
            <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr>
                    {['Actor', 'Action', 'Target Type', 'Target ID', 'Timestamp'].map((h) => (
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
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {log.actor_id ? `${log.actor_id.slice(0, 8)}...` : 'System'}
                      </td>
                      <td className="py-3 px-4">
                        <code className="bg-gray-100 px-2 py-0.5 rounded text-xs font-mono text-gray-700">
                          {log.action}
                        </code>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {log.target_type ?? '—'}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {log.target_id ? `${log.target_id.slice(0, 8)}...` : '—'}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {new Date(log.created_at).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
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

export default AdminAuditLogs
