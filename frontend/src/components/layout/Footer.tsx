import { Link } from 'react-router-dom'

const Footer = () => (
  <footer className="bg-white border-t border-gray-100 py-8">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center gap-3 text-center">
      <span className="font-bold font-merriweather text-primary text-lg">Kinfolk</span>
      <p className="text-sm text-gray-500 font-merriweather">
        Preserving Ugandan clan heritage, one family at a time.
      </p>
      <div className="flex items-center gap-4 text-sm">
        <Link to="/login" className="text-secondary hover:text-primary transition-colors font-merriweather">
          Login
        </Link>
        <span className="text-gray-300">|</span>
        <Link to="/signup" className="text-secondary hover:text-primary transition-colors font-merriweather">
          Sign Up
        </Link>
      </div>
      <p className="text-xs text-gray-400 font-merriweather">
        &copy; 2026 Kinfolk. All rights reserved.
      </p>
    </div>
  </footer>
)

export default Footer
