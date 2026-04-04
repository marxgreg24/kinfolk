import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import type { RootState } from '@/store'
import { useCompleteProfile } from '@/hooks/useAuth'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Avatar from '@/components/ui/Avatar'
import KinfolkWordmark from '@/components/ui/KinfolkWordmark'

const CLOUDINARY_CLOUD = 'kinfolk'
const CLOUDINARY_PRESET = 'kinfolk_unsigned'

const CompleteProfilePage = () => {
  const navigate = useNavigate()
  const user = useSelector((state: RootState) => state.auth.user)

  const [birthYear, setBirthYear] = useState('')
  const [gender, setGender] = useState('')
  const [phone, setPhone] = useState('')
  const [profilePictureUrl, setProfilePictureUrl] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const completeProfile = useCompleteProfile()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true); setUploadError('')
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('upload_preset', CLOUDINARY_PRESET)
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, { method: 'POST', body: form })
      if (!res.ok) throw new Error('Upload failed')
      const data = (await res.json()) as { secure_url: string }
      setProfilePictureUrl(data.secure_url)
    } catch {
      setUploadError('Photo upload failed. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    completeProfile.mutate(
      { birth_year: parseInt(birthYear, 10), gender, phone, profile_picture_url: profilePictureUrl },
      { onSuccess: () => navigate('/dashboard'), onError: () => toast.error('Failed to save your profile.') },
    )
  }

  const currentYear = new Date().getFullYear()
  const isDisabled = completeProfile.isPending || isUploading || !birthYear || !gender || !phone

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div
        className="hidden lg:flex flex-col w-[42%] relative overflow-hidden"
        style={{ background: 'linear-gradient(155deg, #141414 0%, #1c1406 55%, #111 100%)' }}
      >
        <div className="h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent" />
        <div className="flex flex-col flex-1 p-12 pt-14">
          <KinfolkWordmark uppercase className="font-merriweather font-bold text-2xl tracking-[0.15em] text-white" />
          <p className="text-[9px] font-merriweather tracking-[0.35em] text-primary/70 uppercase mt-1">Preserve Your Roots</p>

          <div className="mt-auto mb-12">
            <div className="flex items-center gap-3 mb-6">
              <span className="h-px w-8 bg-primary/40" /><span className="text-primary text-[10px]">◆</span><span className="h-px w-8 bg-primary/40" />
            </div>
            <p className="font-merriweather text-white/70 text-sm leading-relaxed italic max-w-xs">
              "Your profile helps the family tree come alive — add your details to help your clan find you."
            </p>
          </div>
          <svg viewBox="0 0 280 180" className="absolute bottom-0 right-0 w-72 opacity-[0.04]" aria-hidden="true">
            <line x1="140" y1="20" x2="70" y2="90" stroke="#CDB53F" strokeWidth="2"/>
            <line x1="140" y1="20" x2="210" y2="90" stroke="#CDB53F" strokeWidth="2"/>
            <line x1="70" y1="90" x2="35" y2="160" stroke="#CDB53F" strokeWidth="1.5"/>
            <line x1="70" y1="90" x2="105" y2="160" stroke="#CDB53F" strokeWidth="1.5"/>
            <line x1="210" y1="90" x2="175" y2="160" stroke="#CDB53F" strokeWidth="1.5"/>
            <line x1="210" y1="90" x2="245" y2="160" stroke="#CDB53F" strokeWidth="1.5"/>
            <circle cx="140" cy="20" r="8" fill="#CDB53F"/><circle cx="70" cy="90" r="6" fill="#CDB53F"/>
            <circle cx="210" cy="90" r="6" fill="#CDB53F"/><circle cx="35" cy="160" r="5" fill="#CDB53F"/>
            <circle cx="105" cy="160" r="5" fill="#CDB53F"/><circle cx="175" cy="160" r="5" fill="#CDB53F"/>
            <circle cx="245" cy="160" r="5" fill="#CDB53F"/>
          </svg>
        </div>
        <p className="p-12 pt-0 text-white/20 text-[10px] font-merriweather tracking-widest uppercase">© {currentYear} Kinfolk</p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center bg-white px-6 py-12 overflow-y-auto">
        <div className="w-full max-w-[400px]">
          <div className="lg:hidden mb-8">
            <KinfolkWordmark uppercase className="font-merriweather font-bold text-2xl tracking-[0.12em] text-gray-900" />
          </div>

          <h1 className="font-merriweather font-bold text-2xl text-gray-900 mb-1">Complete your profile</h1>
          <p className="text-sm text-gray-400 font-merriweather mb-8">Tell us a little more about yourself</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Photo upload */}
            <div>
              <p className="text-xs font-merriweather font-semibold uppercase tracking-wider text-gray-500 mb-2">
                Profile Photo <span className="text-gray-300 normal-case tracking-normal font-normal">(optional)</span>
              </p>
              {profilePictureUrl ? (
                <div className="flex items-center gap-4 p-3 border border-gray-200 rounded-xl">
                  <Avatar src={profilePictureUrl} name={user?.full_name ?? 'You'} size="lg" />
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-merriweather text-gray-700 font-medium">Photo uploaded</p>
                    <button type="button" onClick={() => setProfilePictureUrl('')}
                      className="text-xs text-red-400 hover:text-red-600 transition-colors font-merriweather text-left">
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-200 hover:border-primary rounded-xl p-5 text-center transition-colors group"
                >
                  <div className="w-10 h-10 rounded-full bg-gray-50 group-hover:bg-primary/10 flex items-center justify-center mx-auto mb-2 transition-colors">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors">
                      <path d="M12 16v-8m-4 4l4-4 4 4" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M20 21H4a1 1 0 01-1-1V4a1 1 0 011-1h10l7 7v10a1 1 0 01-1 1z" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <p className="text-sm text-gray-500 font-merriweather group-hover:text-primary transition-colors">
                    {isUploading ? 'Uploading…' : 'Click to upload a photo'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1 font-merriweather">PNG, JPG up to 10MB</p>
                </button>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </div>

            <Input label="Year of Birth" name="birth_year" type="number" value={birthYear}
              onChange={(e) => setBirthYear(e.target.value)} required placeholder={`e.g. ${currentYear - 30}`} />

            <div className="flex flex-col">
              <label className="text-xs font-merriweather font-semibold uppercase tracking-wider text-gray-500 mb-1.5 block">
                Gender <span className="text-primary ml-1">*</span>
              </label>
              <select value={gender} onChange={(e) => setGender(e.target.value)} required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-merriweather text-gray-900 bg-white hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all duration-200">
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>

            <Input label="Phone Number" name="phone" type="tel" value={phone}
              onChange={(e) => setPhone(e.target.value)} required placeholder="+256 700 000 000" />

            {uploadError && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm font-merriweather">
                {uploadError}
              </div>
            )}

            <Button type="submit" variant="primary" isLoading={completeProfile.isPending}
              disabled={isDisabled} className="w-full rounded-full py-3 mt-1">
              Complete Profile
            </Button>
          </form>

          <div className="mt-4 text-center">
            <button type="button" onClick={() => navigate('/dashboard')}
              className="text-sm text-gray-400 hover:text-gray-600 font-merriweather transition-colors">
              Skip for now →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CompleteProfilePage
