import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { login as apiLogin } from '../api/services'

interface User {
  user_id: number
  full_name: string
  role: 'institution' | 'officer' | 'authority' | 'admin'
  email?: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<User>
  logout: () => void
  isOfficer: boolean
  isInstitution: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')
    if (storedToken && storedUser) {
      setToken(storedToken)
      setUser(JSON.parse(storedUser))
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string): Promise<User> => {
    const res = await apiLogin(email, password)
    const { access_token, role, user_id, full_name } = res.data
    const userData: User = { user_id, full_name, role, email }
    localStorage.setItem('token', access_token)
    localStorage.setItem('user', JSON.stringify(userData))
    setToken(access_token)
    setUser(userData)
    // Return userData directly so the caller can navigate based on role
    // without waiting for the React state update to flush.
    return userData
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{
      user, token, isLoading, login, logout,
      isOfficer: user?.role === 'officer' || user?.role === 'authority' || user?.role === 'admin',
      isInstitution: user?.role === 'institution',
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
