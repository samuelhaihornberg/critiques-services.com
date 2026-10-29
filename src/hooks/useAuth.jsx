import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('critiques_user')
    if (stored) {
      try {
        setUser(JSON.parse(stored))
      } catch {
        localStorage.removeItem('critiques_user')
      }
    }
    setLoading(false)
  }, [])

  const login = useCallback((userData) => {
    const newUser = {
      id: Date.now().toString(),
      ...userData,
      createdAt: new Date().toISOString()
    }
    setUser(newUser)
    localStorage.setItem('critiques_user', JSON.stringify(newUser))
    return newUser
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem('critiques_user')
  }, [])

  const updateProfile = useCallback((updates) => {
    const updated = { ...user, ...updates }
    setUser(updated)
    localStorage.setItem('critiques_user', JSON.stringify(updated))
  }, [user])

  const value = {
    user,
    login,
    logout,
    updateProfile,
    isAuthenticated: !!user,
    loading
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}