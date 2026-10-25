import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { register } from '../api/services'
import { Shield } from 'lucide-react'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ full_name: '', email: '', password: '', confirm: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password !== form.confirm) { toast.error('Passwords do not match'); return }
    setLoading(true)
    try {
      await register({ email: form.email, password: form.password, full_name: form.full_name })
      toast.success('Account created! Please log in.')
      navigate('/login')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#003366] to-[#0ea5e9] flex items-center justify-center px-4 py-8">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-900 rounded-xl flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-gray-800">AICTE FDR Portal</h1>
            <p className="text-xs text-gray-500">Institution Registration</p>
          </div>
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-5">Create Account</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { label: 'Full Name', key: 'full_name', type: 'text', placeholder: 'Your full name' },
            { label: 'Email Address', key: 'email', type: 'email', placeholder: 'official@college.edu' },
            { label: 'Password', key: 'password', type: 'password', placeholder: 'Minimum 8 characters' },
            { label: 'Confirm Password', key: 'confirm', type: 'password', placeholder: 'Re-enter password' },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
              <input type={f.type} required placeholder={f.placeholder}
                value={(form as any)[f.key]}
                onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}
          <button type="submit" disabled={loading}
            className="w-full bg-[#003366] text-white py-2.5 rounded-lg font-semibold hover:bg-blue-900 disabled:opacity-60 transition-colors">
            {loading ? 'Creating...' : 'Create Account'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 hover:underline font-medium">Sign in</Link>
        </p>
        <p className="mt-3 text-xs text-gray-400 text-center">
          After registration, complete your institution profile before submitting FDRs.
        </p>
      </div>
    </div>
  )
}
