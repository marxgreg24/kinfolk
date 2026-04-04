// Base shimmer bar
const SkeletonBar = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse bg-gray-200 rounded-lg ${className}`} />
)

// A full table skeleton — renders `rows` placeholder rows matching common table column widths
export const SkeletonTableRows = ({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) => (
  <>
    {Array.from({ length: rows }).map((_, i) => (
      <tr key={i} className="border-b border-gray-50">
        {Array.from({ length: cols }).map((_, j) => (
          <td key={j} className="px-5 py-4">
            <SkeletonBar className={`h-3.5 ${j === 0 ? 'w-36' : j === cols - 1 ? 'w-16' : 'w-28'}`} />
          </td>
        ))}
      </tr>
    ))}
  </>
)

// A card skeleton for list/card layouts
export const SkeletonCards = ({ count = 4 }: { count?: number }) => (
  <div className="flex flex-col gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 animate-pulse">
        <div className="flex items-start justify-between mb-4">
          <div className="flex flex-col gap-2">
            <SkeletonBar className="h-4 w-40" />
            <SkeletonBar className="h-3 w-24" />
          </div>
          <SkeletonBar className="h-6 w-16 rounded-full" />
        </div>
        <div className="grid grid-cols-3 gap-3 mb-3">
          <SkeletonBar className="h-3 w-full" />
          <SkeletonBar className="h-3 w-full" />
          <SkeletonBar className="h-3 w-full" />
        </div>
        <SkeletonBar className="h-12 w-full rounded-xl" />
      </div>
    ))}
  </div>
)

// A simple row skeleton for small panels
export const SkeletonRows = ({ rows = 4 }: { rows?: number }) => (
  <div className="flex flex-col gap-3">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex items-center gap-3 animate-pulse">
        <SkeletonBar className="w-8 h-8 rounded-full flex-shrink-0" />
        <div className="flex flex-col gap-1.5 flex-1">
          <SkeletonBar className="h-3.5 w-1/2" />
          <SkeletonBar className="h-3 w-1/3" />
        </div>
        <SkeletonBar className="h-5 w-16 rounded-full flex-shrink-0" />
      </div>
    ))}
  </div>
)

export default SkeletonBar
