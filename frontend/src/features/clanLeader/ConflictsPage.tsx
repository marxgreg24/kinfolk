import { useSelector } from 'react-redux'
import type { RootState } from '@/store'
import { useListConflicts, useResolveConflict } from '@/hooks/useClanLeader'
import Sidebar from '@/components/layout/Sidebar'
import Spinner from '@/components/ui/Spinner'
import Button from '@/components/ui/Button'

const ConflictsPage = () => {
  const user = useSelector((s: RootState) => s.auth.user)
  const clanId = user?.clan_id ?? ''
  const { data: conflicts, isLoading } = useListConflicts(clanId)
  const resolveConflict = useResolveConflict(clanId)

  if (!user || isLoading) return <Spinner fullScreen />

  return (
    <div className="flex min-h-screen" style={{ background: '#fafaf8' }}>
      <Sidebar role={user.role} />
      <div className="flex-1 flex flex-col ml-64">
        <main className="flex-1 p-8">

          <div className="mb-7">
            <p className="text-xs font-merriweather tracking-[0.25em] text-secondary uppercase mb-1">Clan Leader</p>
            <h1 className="text-2xl font-bold text-gray-900 font-merriweather">Relationship Conflicts</h1>
            <p className="text-gray-400 text-sm mt-1 font-merriweather">
              Review and resolve conflicting relationship submissions from your clan members.
            </p>
          </div>

          {/* Empty state */}
          {conflicts?.length === 0 && (
            <div className="bg-white border border-gray-100 rounded-2xl p-16 text-center shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-7 h-7">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              </div>
              <h3 className="font-merriweather font-bold text-gray-900 mb-1">No conflicts</h3>
              <p className="text-gray-400 text-sm font-merriweather">All relationship submissions are consistent.</p>
            </div>
          )}

          {/* Conflict cards */}
          <div className="flex flex-col gap-4">
            {conflicts?.map((conflict) => (
              <div key={conflict.id} className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                <div className="h-[2px] bg-gradient-to-r from-transparent via-red-400/40 to-transparent" />
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                      <span className="text-xs font-merriweather font-semibold text-red-600 uppercase tracking-wider">Conflict</span>
                    </div>
                    <span className="text-xs text-gray-400 font-merriweather">
                      {new Date(conflict.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>

                  {/* Relationship cards */}
                  <div className="grid grid-cols-2 gap-4 mb-5">
                    <div className="border border-gray-100 rounded-xl p-4">
                      <p className="text-[10px] font-merriweather uppercase tracking-widest text-gray-400 mb-2">Original</p>
                      <p className="text-xs font-mono text-gray-600">{conflict.original_relationship_id.slice(0, 12)}…</p>
                    </div>
                    <div className="border border-amber-200 bg-amber-50/40 rounded-xl p-4">
                      <p className="text-[10px] font-merriweather uppercase tracking-widest text-amber-600 mb-2">Conflicting</p>
                      <p className="text-xs font-mono text-gray-600">{conflict.conflicting_relationship_id.slice(0, 12)}…</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 justify-end pt-3 border-t border-gray-50">
                    <Button variant="primary" size="sm" isLoading={resolveConflict.isPending}
                      onClick={() => resolveConflict.mutate({ conflictId: conflict.id, resolution: 'approve_original' })}
                      className="rounded-full">
                      Approve Original
                    </Button>
                    <Button variant="outline" size="sm" isLoading={resolveConflict.isPending}
                      onClick={() => resolveConflict.mutate({ conflictId: conflict.id, resolution: 'approve_conflicting' })}
                      className="rounded-full">
                      Approve New
                    </Button>
                    <Button variant="danger" size="sm" isLoading={resolveConflict.isPending}
                      onClick={() => resolveConflict.mutate({ conflictId: conflict.id, resolution: 'reject_both' })}
                      className="rounded-full">
                      Reject Both
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}

export default ConflictsPage
