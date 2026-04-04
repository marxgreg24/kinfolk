import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { useSelector } from 'react-redux'
import type { RootState } from '@/store'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'

const Navbar = () => {
  const { isSignedIn, signOut } = useAuth()
  const user = useSelector((state: RootState) => state.auth.user)
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = async () => {
    setDropdownOpen(false)
    await signOut()
    navigate('/')
  }

  const logoTo = isSignedIn ? '/dashboard' : '/'
  const showClanChat =
    user?.role === 'clan_leader' || user?.role === 'general_user'

  return (
    <nav className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between">
          {/* Logo */}
          <Link
            to={logoTo}
            className="font-merriweather font-bold text-2xl text-primary"
          >
            Kinfolk
          </Link>

          {/* Right side */}
          {!isSignedIn ? (
            <div className="flex items-center gap-3">
              <Link to="/login">
                <Button variant="outline" size="sm">Login</Button>
              </Link>
              <Link to="/signup">
                <Button variant="primary" size="sm">Sign Up</Button>
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              {showClanChat && (
                <Link
                  to="/clan/chat"
                  className="text-sm font-merriweather text-secondary hover:text-primary transition-colors"
                >
                  Clan Chat
                </Link>
              )}

              {/* Profile dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen((prev) => !prev)}
                  className="flex items-center focus:outline-none"
                  aria-label="Open profile menu"
                >
                  <Avatar
                    src={user?.profile_picture_url}
                    name={user?.full_name ?? 'User'}
                    size="sm"
                  />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 z-50">
                    <Link
                      to="/dashboard"
                      onClick={() => setDropdownOpen(false)}
                      className="block w-full text-left px-4 py-2 text-sm font-merriweather text-gray-700 hover:bg-gray-50 hover:text-primary rounded-t-lg"
                    >
                      My Profile
                    </Link>
                    <Link
                      to="/clan"
                      onClick={() => setDropdownOpen(false)}
                      className="block w-full text-left px-4 py-2 text-sm font-merriweather text-gray-700 hover:bg-gray-50 hover:text-primary"
                    >
                      My Clan
                    </Link>
                    <Link
                      to="/clan/tree"
                      onClick={() => setDropdownOpen(false)}
                      className="block w-full text-left px-4 py-2 text-sm font-merriweather text-gray-700 hover:bg-gray-50 hover:text-primary"
                    >
                      Family Tree
                    </Link>
                    <div className="border-t border-gray-100 my-1" />
                    <button
                      onClick={handleSignOut}
                      className="block w-full text-left px-4 py-2 text-sm font-merriweather text-gray-700 hover:bg-gray-50 hover:text-primary rounded-b-lg"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar

