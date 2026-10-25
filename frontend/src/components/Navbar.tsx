import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Bell, Menu, X, LogOut, User, Shield, Building2 } from 'lucide-react'

export default function Navbar() {
  const { user, logout, isOfficer } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const institutionLinks = [
    { to: '/institution/dashboard', label: 'Dashboard' },
    { to: '/institution/submit', label: 'Submit FDR' },
    { to: '/institution/fdrs', label: 'My FDRs' },
  ]

  const officerLinks = [
    { to: '/officer/dashboard', label: 'Dashboard' },
    { to: '/officer/queue', label: 'Case Queue' },
    { to: '/officer/analytics', label: 'Analytics' },
    { to: '/officer/audit', label: 'Audit Trail' },
  ]

  const links = isOfficer ? officerLinks : institutionLinks
  const roleLabel = user?.role === 'officer' ? 'AICTE Officer' :
    user?.role === 'authority' ? 'Competent Authority' :
    user?.role === 'admin' ? 'Administrator' : 'Institution'

  return (
    <nav className="bg-[#003366] text-white shadow-lg sticky top-0 z-50">
      {/* Top strip */}
      <div className="bg-[#1a1a2e] py-1 px-4 text-xs text-center text-blue-200">
        🏛️ AICTE — All India Council for Technical Education | FDR Management Portal &nbsp;|&nbsp;
        <span className="text-yellow-300">⚠ Demo Prototype — Test Data Only</span>
      </div>

      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
              <Shield className="w-5 h-5 text-blue-900" />
            </div>
            <div>
              <div className="font-bold text-sm leading-tight">AICTE FDR Portal</div>
              <div className="text-xs text-blue-300 leading-tight">Security Deposit Management</div>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {links.map(l => (
              <Link
                key={l.to}
                to={l.to}
                className={`px-3 py-1.5 rounded text-sm transition-colors ${
                  location.pathname.startsWith(l.to)
                    ? 'bg-white/20 text-white font-semibold'
                    : 'text-blue-200 hover:bg-white/10 hover:text-white'
                }`}
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            <Link to={isOfficer ? '/officer/notifications' : '/institution/notifications'}
              className="relative p-2 text-blue-200 hover:text-white hover:bg-white/10 rounded-full transition-colors">
              <Bell className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-lg text-sm">
              {isOfficer ? <Shield className="w-4 h-4 text-yellow-300" /> : <Building2 className="w-4 h-4 text-blue-300" />}
              <div>
                <div className="font-medium text-white text-xs">{user?.full_name}</div>
                <div className="text-blue-300 text-xs">{roleLabel}</div>
              </div>
            </div>
            <button onClick={handleLogout}
              className="p-2 text-blue-200 hover:text-red-300 hover:bg-white/10 rounded-full transition-colors"
              title="Logout">
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile menu button */}
          <button className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden pb-4 border-t border-blue-800 mt-2 pt-3 space-y-1">
            {links.map(l => (
              <Link key={l.to} to={l.to}
                className="block px-3 py-2 rounded text-sm text-blue-200 hover:bg-white/10"
                onClick={() => setMenuOpen(false)}>
                {l.label}
              </Link>
            ))}
            <button onClick={handleLogout} className="block w-full text-left px-3 py-2 text-sm text-red-300">
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}
