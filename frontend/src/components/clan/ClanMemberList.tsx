import { useState } from 'react'
import Avatar from '@/components/ui/Avatar'
import Spinner from '@/components/ui/Spinner'
import type { Member } from '@/types/member'

interface ClanMemberListProps {
  members: Member[]
  isLoading?: boolean
  /** When true, shows the email column (clan leader view) */
  showContact?: boolean
}

const EmailIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 flex-shrink-0">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
)

const UserCheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
    <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <polyline points="16 11 18 13 22 9" />
  </svg>
)

const ClanMemberList = ({ members, isLoading = false, showContact = false }: ClanMemberListProps) => {
  const [search, setSearch] = useState('')

  const filtered = members.filter((m) => {
    const q = search.toLowerCase()
    return (
      m.full_name.toLowerCase().includes(q) ||
      (m.email ?? '').toLowerCase().includes(q)
    )
  })

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="h-[3px] bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      <div className="px-6 py-4 flex items-center justify-between gap-4 border-b border-gray-50">
        <div>
          <h2 className="text-sm font-bold font-merriweather text-gray-900">Clan Members</h2>
          <p className="text-xs text-gray-400 font-merriweather mt-0.5">
            {isLoading ? '…' : `${members.length} member${members.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        {/* Search */}
        <div className="relative w-56">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300 pointer-events-none">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search members…"
            className="w-full pl-8 pr-3 py-2 text-xs font-merriweather border border-gray-200 rounded-xl bg-gray-50 text-gray-700 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all"
          />
        </div>
      </div>

      {/* Body */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm font-merriweather text-gray-400">
            {search ? 'No members match your search.' : 'No members in this clan yet.'}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {filtered.map((member) => (
            <div key={member.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/70 transition-colors">
              {/* Avatar */}
              <Avatar
                src={member.profile_picture_url}
                name={member.full_name}
                size="sm"
                className="flex-shrink-0"
              />

              {/* Name + contact */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-merriweather font-semibold text-gray-900 truncate">
                    {member.full_name}
                  </p>
                  {member.user_id && (
                    <span
                      title="Registered user"
                      className="inline-flex items-center gap-1 text-[10px] font-merriweather text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-full px-2 py-0.5"
                    >
                      <UserCheckIcon />
                      Registered
                    </span>
                  )}
                </div>

                {/* Contact row */}
                {(showContact || member.email) && member.email ? (
                  <a
                    href={`mailto:${member.email}`}
                    className="inline-flex items-center gap-1.5 text-xs font-merriweather text-gray-400 hover:text-primary transition-colors mt-0.5 truncate max-w-full"
                  >
                    <EmailIcon />
                    {member.email}
                  </a>
                ) : (
                  <p className="text-xs font-merriweather text-gray-300 mt-0.5 italic">No contact info</p>
                )}
              </div>

              {/* Joined date */}
              <div className="hidden sm:block text-right flex-shrink-0">
                <p className="text-[10px] font-merriweather uppercase tracking-widest text-gray-300">Joined</p>
                <p className="text-xs font-merriweather text-gray-400">
                  {new Date(member.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ClanMemberList
