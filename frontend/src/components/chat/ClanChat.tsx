import { useEffect, useState } from 'react'
import { StreamChat } from 'stream-chat'
import {
  Chat,
  Channel,
  ChannelHeader,
  MessageList,
  MessageInput,
  Thread,
  Window,
} from 'stream-chat-react'
import 'stream-chat-react/dist/css/v2/index.css'
import { useSelector } from 'react-redux'
import type { RootState } from '@/store/index'
import { useGetStreamToken } from '@/hooks/useChat'
import Navbar from '@/components/layout/Navbar'
import Sidebar from '@/components/layout/Sidebar'
import Spinner from '@/components/ui/Spinner'
import Button from '@/components/ui/Button'

const cssOverrides = `
  .str-chat__theme-light {
    --str-chat-primary-color: #CDB53F;
    --str-chat-active-primary-color: #b8a030;
  }
  .str-chat__channel-header {
    font-family: 'Merriweather', serif;
    background-color: #ffffff;
    border-bottom: 1px solid #f0f0f0;
  }
  .str-chat__message-input {
    border-top: 1px solid #f0f0f0;
  }
  .str-chat__message-text {
    font-family: 'Merriweather', serif;
  }
`

const ClanChat = () => {
  const user = useSelector((s: RootState) => s.auth.user)
  const { data: tokenData, isLoading: tokenLoading, refetch } = useGetStreamToken()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [chatClient, setChatClient] = useState<StreamChat | null>(null)
  const [channel, setChannel] = useState<ReturnType<StreamChat['channel']> | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const apiKey = import.meta.env.VITE_STREAM_API_KEY as string | undefined
    if (!apiKey || !tokenData || !user) return

    const client = StreamChat.getInstance(apiKey)

    const connectUser = async () => {
      try {
        // Skip reconnect if already connected as this user
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

        const ch = client.channel('messaging', user.clan_id)

        await ch.watch()
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
  }, [tokenData, user])

  // ── Render ────────────────────────────────────────────────────────────────

  if (!user) return <Spinner fullScreen />

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role={user.role} />

      <div className="flex-1 flex flex-col ml-64">
        <Navbar />

        <div
          className="flex flex-col flex-1 overflow-hidden"
          style={{ height: 'calc(100vh - 64px)', fontFamily: 'Merriweather, serif' }}
        >
          <style>{cssOverrides}</style>

          {tokenLoading && (
            <div className="flex flex-1 items-center justify-center">
              <Spinner />
            </div>
          )}

          {!tokenLoading && error && (
            <div className="flex flex-col items-center justify-center flex-1 gap-4">
              <p className="text-red-500 font-merriweather">{error}</p>
              <Button
                variant="outline"
                onClick={() => {
                  setError(null)
                  setChatClient(null)
                  setChannel(null)
                  refetch()
                }}
              >
                Retry
              </Button>
            </div>
          )}

          {!tokenLoading && !error && (!chatClient || !channel) && (
            <div className="flex flex-1 items-center justify-center">
              <Spinner />
            </div>
          )}

          {!tokenLoading && !error && chatClient && channel && (
            <Chat client={chatClient} theme="str-chat__theme-light">
              <Channel channel={channel}>
                <Window>
                  <ChannelHeader />
                  <MessageList />
                  <MessageInput />
                </Window>
                <Thread />
              </Channel>
            </Chat>
          )}
        </div>
      </div>
    </div>
  )
}

export default ClanChat
