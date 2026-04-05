import { useEffect, useState } from 'react'
import { StreamChat } from 'stream-chat'
import {
  Chat,
  Channel,
  MessageInput,
  MessageList,
  Thread,
  Window,
} from 'stream-chat-react'
import 'stream-chat-react/dist/css/v2/index.css'
import { useSelector } from 'react-redux'
import type { RootState } from '@/store/index'
import { useGetStreamToken } from '@/hooks/useChat'
import { useGetClanMembers } from '@/hooks/useClan'
import Sidebar from '@/components/layout/Sidebar'
import Spinner from '@/components/ui/Spinner'
import Button from '@/components/ui/Button'
import Avatar from '@/components/ui/Avatar'

interface ChatMember {
  id: string
  name: string
  image?: string
  online: boolean
}

const cssOverrides = `
  /* ════════════════════════════════════════════════════
     BASE THEME
  ════════════════════════════════════════════════════ */
  .str-chat__theme-light {
    --str-chat-primary-color: #CDB53F;
    --str-chat-active-primary-color: #b8a030;
    --str-chat-font-family: 'Merriweather', Georgia, serif;
  }

  /* ════════════════════════════════════════════════════
     MESSAGE LIST — Pumble-style white canvas
  ════════════════════════════════════════════════════ */
  .str-chat__list {
    background: #ffffff;
    padding: 12px 0 4px;
  }
  .str-chat__list::-webkit-scrollbar { width: 5px; }
  .str-chat__list::-webkit-scrollbar-track { background: transparent; }
  .str-chat__list::-webkit-scrollbar-thumb {
    background: #ede9df;
    border-radius: 4px;
  }
  .str-chat__list::-webkit-scrollbar-thumb:hover { background: #CDB53F; }

  /* ════════════════════════════════════════════════════
     MESSAGE ROW — flat, full-width, Pumble-style
  ════════════════════════════════════════════════════ */
  .str-chat__message-simple,
  .str-chat__message {
    padding: 3px 20px 3px 16px !important;
    margin: 0 !important;
    transition: background 0.1s ease;
  }
  .str-chat__message-simple:hover,
  .str-chat__message:hover {
    background: #fdf9f0 !important;
  }

  /* Own messages: gold left accent instead of bubble */
  .str-chat__message--me {
    background: transparent !important;
  }
  .str-chat__message--me:hover {
    background: #fffdf5 !important;
  }
  .str-chat__message--me .str-chat__message-inner {
    border-left: 2px solid rgba(205, 181, 63, 0.45);
    padding-left: 10px;
    margin-left: -2px;
  }

  /* ── STRIP ALL BUBBLE STYLING ── */
  .str-chat__message-text-inner,
  .str-chat__message--me .str-chat__message-text-inner {
    background: transparent !important;
    border: none !important;
    border-radius: 0 !important;
    padding: 1px 0 0 !important;
    box-shadow: none !important;
  }

  /* ── Message text ── */
  .str-chat__message-text,
  .str-chat__message-text p {
    font-family: 'Merriweather', serif !important;
    font-size: 13.5px !important;
    line-height: 1.7 !important;
    color: #2d2418 !important;
    margin: 0 !important;
  }
  .str-chat__message--me .str-chat__message-text,
  .str-chat__message--me .str-chat__message-text p {
    color: #2d2418 !important;
  }

  /* ── Sender name — always prominent ── */
  .str-chat__message-sender-name,
  .str-chat__message-simple-name,
  .str-chat__message-name,
  [data-testid="message-username"] {
    display: inline-block !important;
    visibility: visible !important;
    font-family: 'Merriweather', serif !important;
    font-size: 13px !important;
    font-weight: 700 !important;
    color: #3b2d1e !important;
    letter-spacing: 0.01em;
    margin-bottom: 2px;
    line-height: 1.3 !important;
  }
  .str-chat__message--me .str-chat__message-sender-name,
  .str-chat__message--me .str-chat__message-simple-name,
  .str-chat__message--me .str-chat__message-name,
  .str-chat__message--me [data-testid="message-username"] {
    color: #9a6f10 !important;
  }

  /* ── Timestamp inline after name ── */
  .str-chat__message-simple-timestamp,
  .str-chat__message-timestamp,
  .str-chat__message-metadata time {
    font-family: 'Merriweather', serif !important;
    font-size: 10px !important;
    color: #c0b8a8 !important;
    letter-spacing: 0.02em;
    margin-left: 6px !important;
  }

  /* ── Avatar ── */
  .str-chat__avatar {
    border-radius: 6px !important;
    overflow: hidden;
    flex-shrink: 0;
  }
  .str-chat__avatar-fallback {
    background: linear-gradient(135deg, #CDB53F 0%, #b8a030 100%) !important;
    color: #fff !important;
    font-family: 'Merriweather', serif !important;
    font-size: 11px !important;
    font-weight: 700 !important;
    border-radius: 6px !important;
  }

  /* ════════════════════════════════════════════════════
     HIDE — reactions, actions, options, emoji, thread
  ════════════════════════════════════════════════════ */
  .str-chat__message-reactions-container,
  .str-chat__message-reactions,
  .str-chat__reaction-selector,
  .str-chat__message-options,
  .str-chat__message-actions-container,
  .str-chat__message-actions-list,
  .str-chat__message-simple__actions,
  .str-chat__thread-start,
  [data-testid="message-actions"],
  [data-testid="reactions-button"],
  [data-testid="thread-action"] { display: none !important; }

  /* ════════════════════════════════════════════════════
     DATE SEPARATOR
  ════════════════════════════════════════════════════ */
  .str-chat__date-separator {
    padding: 18px 20px 10px !important;
  }
  .str-chat__date-separator-date {
    font-family: 'Merriweather', serif !important;
    font-size: 10.5px !important;
    font-weight: 700 !important;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #a09880 !important;
    background: #ffffff !important;
    padding: 0 14px !important;
  }
  .str-chat__date-separator-line { border-color: #ede9df !important; }

  /* ════════════════════════════════════════════════════
     INPUT AREA — single clean bordered box
  ════════════════════════════════════════════════════ */

  /* Outer shell: just padding + top divider, NO border */
  .str-chat__message-input {
    background: #ffffff !important;
    border-top: 1px solid #ede9df !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    padding: 14px 20px 16px !important;
    flex-shrink: 0;
  }

  /* Stream's wrapper layers stay invisible */
  .str-chat__message-input-wrapper,
  .str-chat__message-input-inner {
    border: none !important;
    border-radius: 0 !important;
    background: transparent !important;
    padding: 0 !important;
    margin: 0 !important;
    box-shadow: none !important;
    outline: none !important;
  }

  /* Textarea container: THE single visible border */
  .str-chat__message-input .str-chat__message-textarea-container {
    background: #ffffff !important;
    border: 1.5px solid #d8d2c6 !important;
    border-radius: 10px !important;
    padding: 0 10px 0 16px !important;
    transition: border-color 0.2s, box-shadow 0.2s !important;
    align-items: center;
    box-shadow: 0 1px 4px rgba(0,0,0,0.04) !important;
    outline: none !important;
  }
  .str-chat__message-input .str-chat__message-textarea-container:focus-within {
    border-color: #CDB53F !important;
    box-shadow: 0 0 0 3px rgba(205,181,63,0.13), 0 1px 6px rgba(0,0,0,0.06) !important;
  }

  /* Textarea inside */
  .str-chat__message-input textarea,
  .str-chat__message-input [contenteditable] {
    font-family: 'Merriweather', serif !important;
    font-size: 13.5px !important;
    line-height: 1.55 !important;
    padding: 11px 0 !important;
    background: transparent !important;
    color: #2d2418 !important;
    resize: none !important;
    border: none !important;
    outline: none !important;
    box-shadow: none !important;
  }
  .str-chat__message-input textarea::placeholder {
    color: #bfb8a8 !important;
    font-style: italic;
  }

  /* ── Hide attachment / file-upload ── */
  .str-chat__fileupload-wrapper,
  .str-chat__attachment-picker-button,
  .str-chat__input-flat-fileupload,
  .str-chat__message-input-icons > label,
  [data-testid="file-upload-button"],
  [data-testid="attachment-button"],
  .str-chat__message-input-icons button[aria-label*="ttach"],
  .str-chat__message-input-icons button[aria-label*="ile"] { display: none !important; }

  .str-chat__message-input .str-chat__send-button {
    display: flex !important;
    align-items: center;
    justify-content: center;
    width: 38px !important;
    height: 38px !important;
    margin-right: 4px !important;
    border-radius: 8px !important;
    background: linear-gradient(135deg, #CDB53F 0%, #b8a030 100%) !important;
    color: #ffffff !important;
    box-shadow: 0 2px 8px rgba(205,181,63,0.35) !important;
  }
  .str-chat__message-input .str-chat__send-button:disabled {
    background: #f0ece4 !important;
    box-shadow: none !important;
  }
  .str-chat__message-input .str-chat__send-button svg path {
    fill: #ffffff !important;
  }
  .str-chat__message-input .str-chat__send-button:disabled svg path {
    fill: #c0b8a8 !important;
  }

  /* ════════════════════════════════════════════════════
     TYPING INDICATOR
  ════════════════════════════════════════════════════ */
  .str-chat__typing-indicator {
    font-family: 'Merriweather', serif !important;
    font-size: 11px !important;
    color: #9c8958 !important;
    padding: 2px 20px 6px !important;
    background: #fff;
  }
  .str-chat__typing-indicator__dots span {
    background: #CDB53F !important;
  }

  /* ════════════════════════════════════════════════════
     CHANNEL / WINDOW HEIGHT
  ════════════════════════════════════════════════════ */
  .str-chat__channel,
  .str-chat__main-panel,
  .str-chat__container {
    height: 100%;
    background: #ffffff !important;
  }

  /* ── Hide Stream's built-in header ── */
  .str-chat__header-livestream,
  .str-chat__channel-header { display: none !important; }

  /* ════════════════════════════════════════════════════
     EMPTY STATE
  ════════════════════════════════════════════════════ */
  .str-chat__empty-channel {
    font-family: 'Merriweather', serif !important;
    background: #ffffff !important;
  }
  .str-chat__empty-channel-text {
    font-family: 'Merriweather', serif !important;
    color: #c0b8a8 !important;
    font-size: 13px !important;
  }
`

/* ──────────────────────────────────────────────────────── */
/*  Sub-components                                          */
/* ──────────────────────────────────────────────────────── */

const HamburgerIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
    strokeLinecap="round" className="w-5 h-5 text-gray-600">
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
)

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
    strokeLinecap="round" className="w-4 h-4 text-gray-500">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

const ChatIcon = ({ size = 'w-5 h-5', color = '#CDB53F' }: { size?: string; color?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.75}
    strokeLinecap="round" strokeLinejoin="round" className={size}>
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
  </svg>
)

const MembersIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}
    strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
  </svg>
)

const OnlineDot = ({ pulse = false }: { pulse?: boolean }) => (
  <span className={`inline-block w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0 ${pulse ? 'animate-pulse' : ''}`} />
)

function MemberRow({ member, compact = false }: { member: ChatMember; compact?: boolean }) {
  return (
    <div className={`flex items-center gap-2.5 ${!member.online ? 'opacity-50' : ''}`}>
      <div className="relative flex-shrink-0">
        <Avatar src={member.image} name={member.name} size="sm" />
        <span
          className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white
            ${member.online ? 'bg-emerald-400' : 'bg-gray-300'}`}
        />
      </div>
      <p className={`font-merriweather truncate ${compact ? 'text-xs text-gray-700' : 'text-sm text-gray-700'}`}>
        {member.name}
      </p>
      {!compact && member.online && (
        <span className="ml-auto text-[10px] font-merriweather text-emerald-500 flex-shrink-0">Online</span>
      )}
    </div>
  )
}

/* ──────────────────────────────────────────────────────── */
/*  Main component                                          */
/* ──────────────────────────────────────────────────────── */

const ClanChat = () => {
  const user = useSelector((s: RootState) => s.auth.user)
  const { data: tokenData, isLoading: tokenLoading, refetch } = useGetStreamToken()
  const { data: clanMembersData, isLoading: clanMembersLoading } = useGetClanMembers(user?.clan_id ?? '')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [chatClient, setChatClient] = useState<StreamChat | null>(null)
  const [channel, setChannel] = useState<ReturnType<StreamChat['channel']> | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [onlineCount, setOnlineCount] = useState<number>(1)
  const [members, setMembers] = useState<ChatMember[]>([])
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMembersOpen, setIsMembersOpen] = useState(false)

  const isClanLeader = user?.role === 'clan_leader'

  useEffect(() => {
    const apiKey = import.meta.env.VITE_STREAM_API_KEY as string | undefined
    if (!apiKey || !tokenData || !user) return

    const client = StreamChat.getInstance(apiKey)

    const connectUser = async () => {
      try {
        if (client.userID !== tokenData.user_id) {
          await client.connectUser(
            {
              id: tokenData.user_id,
              name: user.full_name,
              image: user.profile_picture_url ?? undefined,
            },
            tokenData.token,
          )
        }

        if (!user.clan_id) {
          setError('You are not part of a clan yet.')
          return
        }

        const linkedUserIDs = (clanMembersData?.members ?? [])
          .map((member) => member.user_id)
          .filter((memberUserID): memberUserID is string => !!memberUserID)
        const channelMemberIDs = Array.from(new Set([tokenData.user_id, ...linkedUserIDs]))

        const ch = client.channel('messaging', user.clan_id, {
          members: channelMemberIDs,
        })
        await ch.watch()

        const updatePresence = () => {
          const list: ChatMember[] = Object.values(ch.state.members)
            .filter((m) => !!m.user_id)
            .map((m) => ({
              id: m.user_id!,
              name: m.user?.name ?? 'Member',
              image: m.user?.image as string | undefined,
              online: m.user?.online ?? false,
            }))
          setMembers(list)
          setOnlineCount(Math.max(1, list.filter((m) => m.online).length))
        }

        updatePresence()
        client.on('user.presence.changed', updatePresence)

        setChatClient(client)
        setChannel(ch)
      } catch (err) {
        console.error('Stream Chat error:', err)
        setError('Failed to connect to clan chat. Please try again.')
      }
    }

    void connectUser()

    return () => {
      client.disconnectUser().catch(console.error)
      setChatClient(null)
      setChannel(null)
    }
  }, [clanMembersData?.clan.name, clanMembersData?.members, tokenData, user])

  if (!user) return <Spinner fullScreen />

  const onlineMembers = members.filter((m) => m.online)
  const offlineMembers = members.filter((m) => !m.online)

  return (
    <div className="flex min-h-screen bg-[#fafaf8]">
      <style>{cssOverrides}</style>

      {/* ── Mobile backdrop ── */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-20 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* ── Sidebar (hidden on mobile unless toggled) ── */}
      <div className={isMobileMenuOpen ? 'block' : 'hidden lg:block'}>
        <Sidebar role={user.role} />
      </div>

      {/* ── Main column ── */}
      <div className="flex-1 flex flex-col lg:ml-64 h-screen overflow-hidden">

        {/* ════ Mobile top bar ════ */}
        <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 shadow-sm lg:hidden flex-shrink-0">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-1.5 rounded-xl hover:bg-gray-50 active:bg-gray-100 transition-colors"
            aria-label="Open menu"
          >
            <HamburgerIcon />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <ChatIcon size="w-4 h-4" />
            </div>
            <span className="font-merriweather font-bold text-gray-900 text-sm">Clan Chat</span>
            <span className="inline-flex items-center gap-1 text-xs font-merriweather text-emerald-600">
              <OnlineDot pulse />
              {onlineCount}
            </span>
          </div>

          {isClanLeader ? (
            <button
              onClick={() => setIsMembersOpen((p) => !p)}
              className={`p-1.5 rounded-xl transition-colors ${isMembersOpen ? 'bg-primary/10 text-primary' : 'hover:bg-gray-50 text-gray-500'}`}
              aria-label="Toggle members"
            >
              <MembersIcon className="w-5 h-5" />
            </button>
          ) : (
            <div className="w-9" />
          )}
        </div>

        {/* ════ Loading ════ */}
        {(tokenLoading || clanMembersLoading) && (
          <div className="flex flex-1 items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Spinner />
              <p className="font-merriweather text-sm text-gray-400">Connecting to chat…</p>
            </div>
          </div>
        )}

        {/* ════ Error / empty states ════ */}
        {!tokenLoading && error && (
          <div className="flex flex-col items-center justify-center flex-1 gap-6 px-6">
            {error.includes('not part of a clan') ? (
              <div className="flex flex-col items-center gap-5 text-center max-w-xs">
                <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center shadow-sm">
                  <ChatIcon size="w-10 h-10" />
                </div>
                <div>
                  <h2 className="font-merriweather font-bold text-gray-800 text-lg mb-2">No clan yet</h2>
                  <p className="font-merriweather text-gray-400 text-sm leading-relaxed">
                    You haven't been added to a clan. Once your clan leader adds you, the chat will appear here.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-5 text-center max-w-xs">
                <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth={1.5} className="w-8 h-8">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v4m0 4h.01" strokeLinecap="round" />
                  </svg>
                </div>
                <div>
                  <p className="font-merriweather font-semibold text-gray-700 mb-1">Connection failed</p>
                  <p className="font-merriweather text-gray-400 text-sm">{error}</p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => { setError(null); setChatClient(null); setChannel(null); refetch() }}
                >
                  Try again
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ════ Connecting spinner ════ */}
        {!tokenLoading && !error && (!chatClient || !channel) && (
          <div className="flex flex-1 items-center justify-center">
            <Spinner />
          </div>
        )}

        {/* ════ Chat UI ════ */}
        {!tokenLoading && !error && chatClient && channel && (
          <div className="flex flex-col flex-1 overflow-hidden">

            {/* ── Desktop header (Pumble-style) ── */}
            <div className="hidden lg:flex items-center gap-0 bg-white border-b border-gray-100 flex-shrink-0"
              style={{ boxShadow: '0 1px 0 #ede9df', minHeight: '56px' }}>

              {/* Hash + channel name */}
              <div className="flex items-center gap-3 px-5 py-3 flex-1 min-w-0">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 flex-shrink-0">
                  <span className="font-merriweather font-black text-primary text-base leading-none" style={{ marginTop: '-1px' }}>#</span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5">
                    <span className="font-merriweather font-bold text-gray-900 text-[15px] leading-tight">clan-general</span>
                    {isClanLeader && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-merriweather font-bold bg-primary/10 text-primary border border-primary/20">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-2.5 h-2.5">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Leader
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="inline-flex items-center gap-1 text-[11px] font-merriweather text-emerald-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                      {onlineCount} online
                    </span>
                    {members.length > 0 && (
                      <span className="text-[11px] font-merriweather text-gray-350">·</span>
                    )}
                    {members.length > 0 && (
                      <span className="text-[11px] font-merriweather text-gray-400">{members.length} members</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right actions */}
              <div className="flex items-center gap-1 px-4">
                {/* Members panel toggle — always visible, reveals member count */}
                <button
                  onClick={() => setIsMembersOpen((p) => !p)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-merriweather font-semibold
                    transition-all duration-150
                    ${isMembersOpen
                      ? 'bg-primary/10 text-primary'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                    }`}
                >
                  <MembersIcon className="w-3.5 h-3.5" />
                  {members.length > 0 ? members.length : ''} Members
                </button>
              </div>
            </div>

            {/* ── Body: chat + optional members panel ── */}
            <div className="flex flex-1 overflow-hidden">

              {/* Stream Chat */}
              <div className="flex-1 overflow-hidden min-w-0">
                <Chat client={chatClient} theme="str-chat__theme-light">
                  <Channel channel={channel}>
                    <Window>
                      <MessageList noGroupByUser />
                      <MessageInput />
                    </Window>
                    <Thread />
                  </Channel>
                </Chat>
              </div>

              {/* ── Desktop members panel ── */}
              {isMembersOpen && (
                <aside className="hidden lg:flex w-60 xl:w-64 flex-col bg-white border-l border-gray-100 flex-shrink-0 overflow-hidden">
                  {/* Panel header */}
                  <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <MembersIcon className="w-3.5 h-3.5 text-gray-400" />
                      <p className="font-merriweather font-bold text-gray-700 text-xs uppercase tracking-widest">
                        Members
                      </p>
                      {members.length > 0 && (
                        <span className="text-[10px] font-merriweather text-gray-400 font-normal">({members.length})</span>
                      )}
                    </div>
                    <button
                      onClick={() => setIsMembersOpen(false)}
                      className="p-1.5 rounded-lg hover:bg-gray-50 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <CloseIcon />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto py-2">
                    {/* Online section */}
                    {onlineMembers.length > 0 && (
                      <div className="px-4 pt-3 pb-1">
                        <p className="text-[9px] font-merriweather font-bold text-emerald-500 uppercase tracking-[0.15em] mb-2">
                          Online · {onlineMembers.length}
                        </p>
                        <div className="flex flex-col gap-0.5">
                          {onlineMembers.map((m) => (
                            <div key={m.id} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors cursor-default">
                              <div className="relative flex-shrink-0">
                                <Avatar src={m.image} name={m.name} size="sm" />
                                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white bg-emerald-400" />
                              </div>
                              <span className="font-merriweather text-xs text-gray-700 truncate">{m.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {onlineMembers.length > 0 && offlineMembers.length > 0 && (
                      <div className="mx-4 my-2 border-t border-gray-50" />
                    )}

                    {/* Offline section */}
                    {offlineMembers.length > 0 && (
                      <div className="px-4 pt-1 pb-3">
                        <p className="text-[9px] font-merriweather font-bold text-gray-400 uppercase tracking-[0.15em] mb-2">
                          Offline · {offlineMembers.length}
                        </p>
                        <div className="flex flex-col gap-0.5">
                          {offlineMembers.map((m) => (
                            <div key={m.id} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg opacity-50 cursor-default">
                              <div className="relative flex-shrink-0">
                                <Avatar src={m.image} name={m.name} size="sm" />
                                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white bg-gray-300" />
                              </div>
                              <span className="font-merriweather text-xs text-gray-600 truncate">{m.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {members.length === 0 && (
                      <div className="flex flex-col items-center justify-center h-32 text-center px-4">
                        <p className="font-merriweather text-xs text-gray-400">No members yet</p>
                      </div>
                    )}
                  </div>
                </aside>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Mobile members bottom sheet (clan leader) ── */}
      {isClanLeader && isMembersOpen && !tokenLoading && !error && chatClient && channel && (
        <>
          <div
            className="fixed inset-0 bg-black/30 z-30 lg:hidden"
            onClick={() => setIsMembersOpen(false)}
          />
          <div className="fixed inset-x-0 bottom-0 z-40 lg:hidden bg-white rounded-t-2xl shadow-2xl border-t border-gray-100 flex flex-col"
            style={{ maxHeight: '60vh' }}>
            {/* Sheet handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-gray-200" />
            </div>

            {/* Sheet header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <p className="font-merriweather font-bold text-gray-800 text-sm">
                Members
                <span className="ml-2 text-xs font-normal text-gray-400">({members.length})</span>
              </p>
              <button onClick={() => setIsMembersOpen(false)} className="p-1 rounded-lg hover:bg-gray-50">
                <CloseIcon />
              </button>
            </div>

            {/* Sheet body */}
            <div className="overflow-y-auto flex-1 px-5 py-3">
              {onlineMembers.length > 0 && (
                <>
                  <p className="text-[10px] font-merriweather font-bold text-emerald-500 uppercase tracking-widest mb-3">
                    Online — {onlineMembers.length}
                  </p>
                  <div className="flex flex-col gap-3 mb-4">
                    {onlineMembers.map((m) => <MemberRow key={m.id} member={m} />)}
                  </div>
                </>
              )}
              {offlineMembers.length > 0 && (
                <>
                  {onlineMembers.length > 0 && <div className="border-t border-gray-50 mb-4" />}
                  <p className="text-[10px] font-merriweather font-bold text-gray-400 uppercase tracking-widest mb-3">
                    Offline — {offlineMembers.length}
                  </p>
                  <div className="flex flex-col gap-3 mb-4">
                    {offlineMembers.map((m) => <MemberRow key={m.id} member={m} />)}
                  </div>
                </>
              )}
              {members.length === 0 && (
                <p className="font-merriweather text-sm text-gray-400 text-center py-8">No members yet</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default ClanChat
