import { useSelector } from 'react-redux'
import type { RootState } from '@/store'
import { useListConflicts, useResolveConflict } from '@/hooks/useClanLeader'
import Navbar from '@/components/layout/Navbar'
import Sidebar from '@/components/layout/Sidebar'
import Spinner from '@/components/ui/Spinner'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'

const ConflictsPage = () => {
  const user = useSelector((s: RootState) => s.auth.user)
  const clanId = user?.clan_id ?? ''
  const { data: conflicts, isLoading } = useListConflicts(clanId)
  const resolveConflict = useResolveConflict(clanId)

  if (!user || isLoading) return <Spinner fullScreen />

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role={user.role} />

      <div className="flex-1 flex flex-col ml-64">
        <Navbar />

        <main className="flex-1 p-8">
          <h1 className="text-2xl font-bold text-gray-900 font-merriweather mb-2">
            Relationship Conflicts
          </h1>
          <p className="text-gray-500 text-sm mb-8">
            Review and resolve conflicting relationship submissions from your clan members.
          </p>

          {conflicts?.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">✓</span>
              </div>
              <h3 className="font-merriweather font-bold text-gray-900 mb-2">No conflicts to resolve</h3>
              <p className="text-gray-500 text-sm">All relationship submissions are consistent.</p>
            </div>
          )}

          {conflicts?.map((conflict) => (
            <div
              key={conflict.id}
              className="bg-white border border-gray-100 rounded-xl p-6 mb-4 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <Badge status="conflicted" label="Conflict" />
                <span className="text-xs text-gray-400">
                  {new Date(conflict.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 uppercase mb-2">Original</p>
                  <p className="text-sm text-gray-700">
                    ID: {conflict.original_relationship_id.slice(0, 8)}...
                  </p>
                </div>
                <div className="bg-orange-50 rounded-lg p-4">
                  <p className="text-xs text-orange-600 uppercase mb-2">Conflicting</p>
                  <p className="text-sm text-gray-700">
                    ID: {conflict.conflicting_relationship_id.slice(0, 8)}...
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6 justify-end">
                <Button
                  variant="primary"
                  size="sm"
                  isLoading={resolveConflict.isPending}
                  onClick={() =>
                    resolveConflict.mutate({ conflictId: conflict.id, resolution: 'approve_original' })
                  }
                >
                  Approve Original
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  isLoading={resolveConflict.isPending}
                  onClick={() =>
                    resolveConflict.mutate({ conflictId: conflict.id, resolution: 'approve_conflicting' })
                  }
                >
                  Approve New
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  isLoading={resolveConflict.isPending}
                  onClick={() =>
                    resolveConflict.mutate({ conflictId: conflict.id, resolution: 'reject_both' })
                  }
                >
                  Reject Both
                </Button>
              </div>
            </div>
          ))}
        </main>
      </div>
    </div>
  )
}

export default ConflictsPage
