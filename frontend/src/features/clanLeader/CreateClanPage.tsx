import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import type { RootState, AppDispatch } from '@/store'
import { setUser } from '@/store/slices/authSlice'
import type { User } from '@/types/user'
import { validateClanName } from '@/api/clans'
import { useCreateClan } from '@/hooks/useClan'
import { useCreateFamily } from '@/hooks/useFamilies'
import apiClient from '@/api/axios'
import Sidebar from '@/components/layout/Sidebar'
import Spinner from '@/components/ui/Spinner'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'

type Step = 'clan' | 'family'

const CreateClanPage = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch<AppDispatch>()
  const user = useSelector((s: RootState) => s.auth.user)

  const [step, setStep] = useState<Step>('clan')

  // Clan step state
  const [clanName, setClanName] = useState('')
  const [nameExists, setNameExists] = useState(false)
  const [validating, setValidating] = useState(false)
  const { mutate: createClan, isPending: clanPending } = useCreateClan()

  // Family step state
  const [familyName, setFamilyName] = useState('')
  const { mutate: createFamily, isPending: familyPending } = useCreateFamily()

  // Refresh user from backend so clan_id is up to date after clan creation
  const refreshUser = async () => {
    const res = await apiClient.get('/api/v1/users/me')
    dispatch(setUser((res.data as { data: User }).data))
  }

  useEffect(() => {
    if (!clanName.trim()) { setNameExists(false); return }
    const timer = setTimeout(async () => {
      setValidating(true)
      try {
        const result = await validateClanName(clanName.trim())
        setNameExists(result.available) // available=true means name is TAKEN
      } finally {
        setValidating(false)
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [clanName])

  if (!user) return <Spinner fullScreen />

  // If the clan leader already has a clan and a family, skip to add-member
  // (they shouldn't reach this page in normal flow, but guard it)

  const handleClanSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!clanName.trim() || nameExists) return
    createClan({ name: clanName.trim() }, {
      onSuccess: async () => {
        await refreshUser()
        setStep('family')
      },
    })
  }

  const handleFamilySubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!familyName.trim()) return
    createFamily(
      { name: familyName.trim(), add_leader_as_member: true },
      { onSuccess: () => navigate('/clan-leader/members/add') },
    )
  }

  return (
    <div className="flex min-h-screen" style={{ background: '#fafaf8' }}>
      <Sidebar role={user.role} />
      <div className="flex-1 flex flex-col ml-64">
        <main className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-xl">

          {/* Step indicator */}
          <div className="flex items-center gap-3 mb-8">
            {(['clan', 'family'] as Step[]).map((s, i) => {
              const isDone = step === 'family' && s === 'clan'
              const isActive = step === s
              return (
                <div key={s} className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 text-xs font-merriweather font-bold transition-all ${
                    isDone ? 'bg-primary border-primary text-white' :
                    isActive ? 'border-primary text-primary bg-white' :
                    'border-gray-200 text-gray-300 bg-white'
                  }`}>
                    {isDone ? (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : i + 1}
                  </div>
                  <span className={`text-xs font-merriweather capitalize ${isActive ? 'text-gray-900 font-semibold' : isDone ? 'text-gray-400' : 'text-gray-300'}`}>
                    {s === 'clan' ? 'Create Clan' : 'Create Family'}
                  </span>
                  {i < 1 && <div className="h-px w-8 bg-gray-200" />}
                </div>
              )
            })}
          </div>

          {step === 'clan' && (
            <>
              <div className="mb-6">
                <p className="text-xs font-merriweather tracking-[0.25em] text-secondary uppercase mb-1">Step 1 of 2</p>
                <h1 className="text-2xl font-bold text-gray-900 font-merriweather">Create Your Clan</h1>
                <p className="text-gray-400 text-sm mt-1 font-merriweather">Give your clan a name. This is the top-level group for all your families.</p>
              </div>
              <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                <div className="h-[2px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                <div className="p-6">
                  <form onSubmit={handleClanSubmit} className="flex flex-col gap-4">
                    <div>
                      <Input
                        label="Clan Name"
                        required
                        value={clanName}
                        onChange={(e) => setClanName(e.target.value)}
                        placeholder="e.g. Baganda, Acholi"
                        error={nameExists ? 'This clan name is already taken.' : undefined}
                      />
                      {validating && <p className="text-xs text-gray-400 mt-1 font-merriweather">Checking availability…</p>}
                      {!validating && clanName.trim() && !nameExists && (
                        <p className="text-xs text-green-600 mt-1 font-merriweather">Name is available.</p>
                      )}
                    </div>
                    <Button
                      type="submit"
                      variant="primary"
                      isLoading={clanPending}
                      disabled={!clanName.trim() || nameExists || validating}
                      className="rounded-full py-3"
                    >
                      Create Clan & Continue
                    </Button>
                  </form>
                </div>
              </div>
            </>
          )}

          {step === 'family' && (
            <>
              <div className="mb-6">
                <p className="text-xs font-merriweather tracking-[0.25em] text-secondary uppercase mb-1">Step 2 of 2</p>
                <h1 className="text-2xl font-bold text-gray-900 font-merriweather">Create Your Family</h1>
                <p className="text-gray-400 text-sm mt-1 font-merriweather">
                  A clan is made up of families. Create the family you belong to — you will be added to it automatically.
                </p>
              </div>
              <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                <div className="h-[2px] bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
                <div className="p-6">
                  <form onSubmit={handleFamilySubmit} className="flex flex-col gap-4">
                    <Input
                      label="Family Name"
                      required
                      value={familyName}
                      onChange={(e) => setFamilyName(e.target.value)}
                      placeholder="e.g. The Nakato Family"
                    />
                    <p className="text-xs text-gray-400 font-merriweather -mt-1">
                      You will be added as a member of this family automatically.
                    </p>
                    <Button
                      type="submit"
                      variant="primary"
                      isLoading={familyPending}
                      disabled={!familyName.trim()}
                      className="rounded-full py-3"
                    >
                      Create Family & Continue
                    </Button>
                  </form>
                </div>
              </div>
            </>
          )}
        </div>
        </main>
      </div>
    </div>
  )
}

export default CreateClanPage
