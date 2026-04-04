import { useApiHealth } from '@/hooks/useAdmin'

const ApiStatusBadge = () => {
  const { data, isLoading, isError } = useApiHealth()

  if (isLoading) {
    return (
      <span className="flex items-center text-sm font-merriweather text-gray-500">
        <span className="w-2 h-2 rounded-full inline-block mr-2 bg-gray-400 animate-pulse" />
        Checking...
      </span>
    )
  }

  if (isError || data?.status !== 'ok') {
    return (
      <span className="flex items-center text-sm font-merriweather text-red-600">
        <span className="w-2 h-2 rounded-full inline-block mr-2 bg-red-500" />
        API Offline
      </span>
    )
  }

  return (
    <span className="flex items-center text-sm font-merriweather text-green-700">
      <span className="w-2 h-2 rounded-full inline-block mr-2 bg-green-500" />
      API Online
    </span>
  )
}

export default ApiStatusBadge
