import { useState } from 'react'
import { useSelector } from 'react-redux'
import type { RootState } from '@/store'
import { useListAuditLogs } from '@/hooks/useAdmin'
import Sidebar from '@/components/layout/Sidebar'
import { SkeletonTableRows } from '@/components/ui/Skeleton'
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

  if (!user) return <></>

  const inputCls = 'border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-merriweather text-gray-700 bg-white hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all duration-200'

  return (
    <div className="flex min-h-screen" style={{ background: '#fafaf8' }}>
      <Sidebar role={user.role} />
      <div className="flex-1 flex flex-col ml-64">
        <main className="flex-1 p-8">

          <div className="mb-7">
            <p className="text-xs font-merriweather tracking-[0.25em] text-secondary uppercase mb-1">Admin</p>
            <h1 className="text-2xl font-bold text-gray-900 font-merriweather">Audit Logs</h1>
            <p className="text-gray-400 text-sm mt-1 font-merriweather">Full history of platform activity</p>
          </div>

          {/* Filters */}
          <div className="bg-white border border-gray-100 rounded-2xl p-4 mb-6 flex flex-wrap items-center gap-3 shadow-sm">
            <input type="text" value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}
              placeholder="Filter by action…" className={`${inputCls} w-60`} />
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 font-merriweather">From</span>
              <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className={inputCls} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 font-merriweather">To</span>
              <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className={inputCls} />
            </div>
            <Button variant="outline" size="sm" onClick={() => { setActionFilter(''); setFromDate(''); setToDate('') }} className="ml-auto">
              Clear
            </Button>
          </div>

          {isLoading ? (
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
              <div className="h-[2px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-50">
                    {['Actor', 'Action', 'Target Type', 'Target ID', 'Timestamp'].map((h) => (
                      <th key={h} className="text-left text-[10px] font-merriweather font-semibold text-gray-400 uppercase tracking-widest py-3.5 px-5 bg-gray-50/50">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody><SkeletonTableRows rows={6} cols={5} /></tbody>
              </table>
            </div>
          ) : !logs || logs.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-2xl p-16 text-center shadow-sm">
              <p className="text-gray-400 text-sm font-merriweather">No audit logs found.</p>
            </div>
          ) : (
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
              <div className="h-[2px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-50">
                    {['Actor', 'Action', 'Target Type', 'Target ID', 'Timestamp'].map((h) => (
                      <th key={h} className="text-left text-[10px] font-merriweather font-semibold text-gray-400 uppercase tracking-widest py-3.5 px-5 bg-gray-50/50">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, i) => (
                    <tr key={log.id} className={`hover:bg-gray-50/70 transition-colors ${i < logs.length - 1 ? 'border-b border-gray-50' : ''}`}>
                      <td className="py-3.5 px-5 text-xs text-gray-500 font-mono">
                        {log.actor_id ? `${log.actor_id.slice(0, 8)}…` : <span className="text-gray-300 font-merriweather">System</span>}
                      </td>
                      <td className="py-3.5 px-5">
                        <code className="bg-primary/10 text-primary px-2 py-0.5 rounded-lg text-xs font-mono">{log.action}</code>
                      </td>
                      <td className="py-3.5 px-5 text-xs text-gray-500 font-merriweather">{log.target_type ?? '—'}</td>
                      <td className="py-3.5 px-5 text-xs text-gray-400 font-mono">
                        {log.target_id ? `${log.target_id.slice(0, 8)}…` : '—'}
                      </td>
                      <td className="py-3.5 px-5 text-xs text-gray-400 font-merriweather">
                        {new Date(log.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
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
