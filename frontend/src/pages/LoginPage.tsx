import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Shield, Eye, EyeOff, LogIn } from 'lucide-react'
import toast from 'react-hot-toast'

const DEMO_ACCOUNTS = [
  { label: 'AICTE Officer', email: 'officer1@aicte.gov.in', password: 'Officer@123', color: 'bg-blue-600' },
  { label: 'Institution (CVR)', email: 'cvr@college.edu', password: 'College@123', color: 'bg-green-600' },
  { label: 'Institution (VNR)', email: 'vnr@college.edu', password: 'College@123', color: 'bg-teal-600' },
  { label: 'Authority', email: 'authority@aicte.gov.in', password: 'Auth@123', color: 'bg-purple-600' },
]

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      // login() returns the user object directly — no need to re-read localStorage,
      // which avoids a race where navigate() fires before React state has flushed.
      const loggedInUser = await login(email, password)
      toast.success(`Welcome, ${loggedInUser.full_name}!`)
      if (['officer', 'authority', 'admin'].includes(loggedInUser.role)) {
        navigate('/officer/dashboard', { replace: true })
      } else {
        navigate('/institution/dashboard', { replace: true })
      }
    } catch (err: any) {
      // The 401 interceptor no longer swallows login errors, so this always fires.
      const detail = err.response?.data?.detail
      toast.error(detail || 'Login failed. Please check your credentials and try again.')
    } finally {
      setLoading(false)
    }
  }

  const fillDemo = (acc: typeof DEMO_ACCOUNTS[0]) => {
    setEmail(acc.email)
    setPassword(acc.password)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#003366] via-[#1e3a5f] to-[#0ea5e9] flex flex-col">
      {/* Top bar */}
      <div className="bg-[#1a1a2e] py-2 px-6 text-center text-xs text-blue-300">
        🏛️ Government of India &nbsp;|&nbsp; All India Council for Technical Education (AICTE) &nbsp;|&nbsp;
        <span className="text-yellow-300">⚠ Prototype Demo — Not a real government portal</span>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 items-center">
          {/* Left: Portal info */}
          <div className="text-white">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">AICTE FDR Portal</h1>
                <p className="text-blue-300 text-sm">Security Deposit Management System</p>
              </div>
            </div>
            <h2 className="text-3xl font-bold mb-3">Intelligent FDR<br />Scrutiny Portal</h2>
            <p className="text-blue-200 text-sm mb-6">
              Manage Fixed Deposit Receipts submitted by technical institutions.
              Automated discrepancy detection, maturity monitoring, and case prioritization.
            </p>
            <div className="space-y-2 text-sm text-blue-200">
              {['Automated OCR document analysis', 'Priority-based case queue', 'Maturity & renewal tracking', 'Full audit trail'].map(f => (
                <div key={f} className="flex items-center gap-2">
                  <span className="w-5 h-5 bg-green-400/20 rounded-full flex items-center justify-center text-green-400 text-xs">✓</span>
                  {f}
                </div>
              ))}
            </div>
            {/* Demo accounts */}
            <div className="mt-8">
              <p className="text-xs text-blue-300 mb-3 font-semibold uppercase tracking-wide">Quick Demo Login:</p>
              <div className="grid grid-cols-2 gap-2">
                {DEMO_ACCOUNTS.map(acc => (
                  <button key={acc.email} onClick={() => fillDemo(acc)}
                    className={`${acc.color} text-white text-xs px-3 py-2 rounded-lg text-left hover:opacity-90 transition-opacity`}>
                    <div className="font-semibold">{acc.label}</div>
                    <div className="opacity-75 truncate">{acc.email}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Login form */}
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Sign In</h3>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  required placeholder="Enter your email"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                    required placeholder="Enter your password"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-[#003366] text-white py-2.5 rounded-lg font-semibold hover:bg-blue-900 disabled:opacity-60 flex items-center justify-center gap-2 transition-colors">
                {loading ? <span className="animate-spin">⏳</span> : <LogIn className="w-4 h-4" />}
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
            <div className="mt-4 text-center text-sm text-gray-500">
              New institution?{' '}
              <Link to="/register" className="text-blue-600 hover:underline font-medium">Register here</Link>
            </div>
            <div className="mt-6 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
              <strong>⚠ Demo Portal:</strong> This is a hackathon prototype. Use the quick-login buttons above to explore different roles.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
