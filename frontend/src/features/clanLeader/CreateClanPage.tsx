import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import type { RootState } from '@/store'
import { validateClanName } from '@/api/clans'
import { useCreateClan } from '@/hooks/useClan'
import Navbar from '@/components/layout/Navbar'
import Sidebar from '@/components/layout/Sidebar'
import Spinner from '@/components/ui/Spinner'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

const CreateClanPage = () => {
  const navigate = useNavigate()
  const user = useSelector((s: RootState) => s.auth.user)
  const { mutate: createClan, isPending } = useCreateClan()

  const [clanName, setClanName] = useState('')
  const [nameExists, setNameExists] = useState(false)
  const [validating, setValidating] = useState(false)

  useEffect(() => {
    if (!clanName.trim()) {
      setNameExists(false)
      return
    }
    const timer = setTimeout(async () => {
      setValidating(true)
      try {
        const result = await validateClanName(clanName.trim())
        // available=true means clan already EXISTS → name is taken
        setNameExists(result.available)
      } finally {
        setValidating(false)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [clanName])

  if (!user) return <Spinner fullScreen />

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!clanName.trim() || nameExists) return
    createClan({ name: clanName.trim() }, {
      onSuccess: () => navigate('/clan-leader/members/add'),
    })
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role={user.role} />

      <div className="flex-1 flex flex-col ml-64">
        <Navbar />

        <main className="flex-1 p-8 max-w-xl">
          <h1 className="text-2xl font-bold text-gray-900 font-merriweather mb-6">
            Create Your Clan
          </h1>

          <div className="bg-white border border-gray-100 rounded-xl p-6">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <Input
                  label="Clan Name"
                  required
                  value={clanName}
                  onChange={(e) => setClanName(e.target.value)}
                  placeholder="e.g. Baganda, Acholi"
                  error={nameExists ? 'This clan name is already taken.' : undefined}
                />
                {validating && (
                  <p className="text-xs text-gray-400 mt-1 font-merriweather">Checking availability…</p>
                )}
                {!validating && clanName.trim() && !nameExists && (
                  <p className="text-xs text-green-600 mt-1 font-merriweather">Name is available.</p>
                )}
              </div>

              <Button
                type="submit"
                variant="primary"
                isLoading={isPending}
                disabled={!clanName.trim() || nameExists || validating}
              >
                Create Clan
              </Button>
            </form>
          </div>
        </main>
      </div>
    </div>
  )
}

export default CreateClanPage
