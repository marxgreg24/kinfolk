import { useListMatchSuggestions, useApproveMatchSuggestion, useRejectMatchSuggestion } from '@/hooks/useClanLeader'
import Spinner from '@/components/ui/Spinner'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Avatar from '@/components/ui/Avatar'

interface MatchSuggestionsPanelProps {
  clanId: string
}

const MatchSuggestionsPanel = ({ clanId }: MatchSuggestionsPanelProps) => {
  const { data: suggestions, isLoading } = useListMatchSuggestions(clanId)
  const approve = useApproveMatchSuggestion(clanId)
  const reject = useRejectMatchSuggestion(clanId)

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 85) return <Badge status="active" label="High Confidence" />
    if (confidence >= 70) return <Badge status="pending" label="Medium Confidence" />
    return null
  }

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-6">
      <h2 className="font-merriweather font-bold text-lg text-gray-900">
        Member Match Suggestions
      </h2>
      <p className="text-gray-500 text-sm mb-4">
        These members may match existing clan invitations.
      </p>

      {isLoading && <Spinner size="sm" />}

      {!isLoading && (!suggestions || suggestions.length === 0) && (
        <p className="text-gray-400 text-sm text-center py-4">No pending match suggestions.</p>
      )}

      {suggestions?.map((suggestion) => (
        <div
          key={suggestion.id}
          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-2"
        >
          <div className="flex items-center gap-3">
            <Avatar name="Member" size="sm" />
            <div>
              <p className="text-sm font-medium text-gray-900">
                Member ID: {suggestion.member_id.slice(0, 8)}...
              </p>
              <p className="text-xs text-gray-500">Confidence: {suggestion.confidence}%</p>
              {getConfidenceBadge(suggestion.confidence)}
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="primary"
              size="sm"
              isLoading={approve.isPending}
              onClick={() => approve.mutate(suggestion.id)}
            >
              Approve
            </Button>
            <Button
              variant="outline"
              size="sm"
              isLoading={reject.isPending}
              onClick={() => reject.mutate(suggestion.id)}
            >
              Dismiss
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}

export default MatchSuggestionsPanel
