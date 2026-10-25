import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'

// Auth pages
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'

// Institution pages
import InstitutionDashboard from './pages/institution/Dashboard'
import SubmitFDR from './pages/institution/SubmitFDR'
import MyFDRs from './pages/institution/MyFDRs'
import FDRDetail from './pages/institution/FDRDetail'
import InstitutionNotifications from './pages/institution/Notifications'

// Officer pages
import OfficerDashboard from './pages/officer/Dashboard'
import CaseQueue from './pages/officer/CaseQueue'
import OfficerFDRDetail from './pages/officer/FDRDetail'
import Analytics from './pages/officer/Analytics'
import AuditTrail from './pages/officer/AuditTrail'
import OfficerNotifications from './pages/officer/Notifications'

// Helper: read user from context OR localStorage (for the one render cycle
// between navigate() and React flushing the setUser() state update).
function resolveUser(contextUser: any) {
  if (contextUser) return contextUser
  try {
    const stored = localStorage.getItem('user')
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

function ProtectedRoute({ children, requireOfficer }: { children: React.ReactNode; requireOfficer?: boolean }) {
  const { user, isLoading } = useAuth()

  // While AuthProvider is reading localStorage on first mount, show a brief loader.
  // We also resolve from localStorage directly to avoid a flash-to-login on navigate.
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen text-gray-500">Loading...</div>
  }

  const effectiveUser = resolveUser(user)

  if (!effectiveUser) return <Navigate to="/login" replace />

  if (requireOfficer && !['officer', 'authority', 'admin'].includes(effectiveUser.role)) {
    return <Navigate to="/institution/dashboard" replace />
  }

  return <>{children}</>
}

function HomeRedirect() {
  const { user, isLoading } = useAuth()
  if (isLoading) return null
  const effectiveUser = resolveUser(user)
  if (!effectiveUser) return <Navigate to="/login" replace />
  if (['officer', 'authority', 'admin'].includes(effectiveUser.role)) {
    return <Navigate to="/officer/dashboard" replace />
  }
  return <Navigate to="/institution/dashboard" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
        <Routes>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Institution Portal */}
          <Route path="/institution/dashboard" element={<ProtectedRoute><InstitutionDashboard /></ProtectedRoute>} />
          <Route path="/institution/submit" element={<ProtectedRoute><SubmitFDR /></ProtectedRoute>} />
          <Route path="/institution/fdrs" element={<ProtectedRoute><MyFDRs /></ProtectedRoute>} />
          <Route path="/institution/fdr/:id" element={<ProtectedRoute><FDRDetail /></ProtectedRoute>} />
          <Route path="/institution/notifications" element={<ProtectedRoute><InstitutionNotifications /></ProtectedRoute>} />

          {/* Officer Portal */}
          <Route path="/officer/dashboard" element={<ProtectedRoute requireOfficer><OfficerDashboard /></ProtectedRoute>} />
          <Route path="/officer/queue" element={<ProtectedRoute requireOfficer><CaseQueue /></ProtectedRoute>} />
          <Route path="/officer/fdr/:id" element={<ProtectedRoute requireOfficer><OfficerFDRDetail /></ProtectedRoute>} />
          <Route path="/officer/analytics" element={<ProtectedRoute requireOfficer><Analytics /></ProtectedRoute>} />
          <Route path="/officer/audit" element={<ProtectedRoute requireOfficer><AuditTrail /></ProtectedRoute>} />
          <Route path="/officer/notifications" element={<ProtectedRoute requireOfficer><OfficerNotifications /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
