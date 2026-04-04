import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import toast from 'react-hot-toast'
import type { RootState } from '@/store'
import { useCompleteProfile } from '@/hooks/useAuth'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Avatar from '@/components/ui/Avatar'

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
    setIsUploading(true)
    setUploadError('')
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('upload_preset', CLOUDINARY_PRESET)
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`,
        { method: 'POST', body: form },
      )
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
      {
        birth_year: parseInt(birthYear, 10),
        gender,
        phone,
        profile_picture_url: profilePictureUrl,
      },
      {
        onSuccess: () => navigate('/dashboard'),
        onError: () => toast.error('Failed to save your profile. Please try again.'),
      },
    )
  }

  const currentYear = new Date().getFullYear()
  const isDisabled = completeProfile.isPending || isUploading || !birthYear || !gender || !phone

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-primary text-center font-merriweather mb-2">
          Kinfolk
        </h1>
        <p className="text-sm text-gray-500 text-center mb-8">
          Tell us a little more about yourself
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Profile picture upload */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2 block">Profile Picture</p>
            {profilePictureUrl ? (
              <div className="flex flex-col items-center gap-3 mb-2">
                <Avatar
                  src={profilePictureUrl}
                  name={user?.full_name ?? 'You'}
                  size="xl"
                  className="mx-auto"
                />
                <button
                  type="button"
                  onClick={() => setProfilePictureUrl('')}
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                >
                  Remove photo
                </button>
              </div>
            ) : (
              <div
                className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-primary transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <p className="text-sm text-gray-500 font-merriweather">
                  {isUploading ? 'Uploading…' : 'Click to upload a photo'}
                </p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          <Input
            label="Year of Birth"
            name="birth_year"
            type="number"
            value={birthYear}
            onChange={(e) => setBirthYear(e.target.value)}
            required
          />
          {/* min/max added via native HTML — Input component passes through via spread if needed */}
          {/* Wrapping with a native input override for min/max */}
          <div className="-mt-3">
            <input
              type="hidden"
              min={1900}
              max={currentYear}
            />
          </div>

          {/* Gender select */}
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Gender <span className="text-red-500 ml-1">*</span>
            </label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-merriweather focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>

          <Input
            label="Phone Number"
            name="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />

          {uploadError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm font-merriweather">
              {uploadError}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            isLoading={completeProfile.isPending}
            disabled={isDisabled}
            className="w-full mt-2"
          >
            Complete Profile
          </Button>
        </form>

        <p className="text-center mt-4">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            Skip for now →
          </button>
        </p>
      </div>
    </div>
  )
}

export default CompleteProfilePage
