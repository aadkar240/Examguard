import { createContext, useState, useContext, useEffect } from 'react'
import api from '../utils/api'
import { toast } from 'react-toastify'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const normalizeUserRole = (userData) => {
    if (!userData) return userData
    return {
      ...userData,
      role: String(userData.role || '').toLowerCase(),
    }
  }

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const token = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')

    if (token && storedUser) {
      try {
        const normalizedStoredUser = normalizeUserRole(JSON.parse(storedUser))
        setUser(normalizedStoredUser)
        localStorage.setItem('user', JSON.stringify(normalizedStoredUser))
        // Verify token is still valid
        await api.get('/auth/me')
      } catch (error) {
        console.error('Auth check failed:', error)
        logout()
      }
    }
    setLoading(false)
  }

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password })
      console.log(response.data)
      const { token, user } = response.data
      const normalizedUser = normalizeUserRole(user)

      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(normalizedUser))
      setUser(normalizedUser)
      
      toast.success('Login successful!')
      return { success: true, user: normalizedUser, data: { ...response.data, user: normalizedUser } }
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed'
      toast.error(message)
      return { success: false, message }
    }
  }

  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register', userData)
      const { token, user, requiresApproval, message } = response.data

      if (token && user) {
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))
        setUser(user)
      }

      toast.success(message || 'Registration successful!')
      return { success: true, requiresApproval: !!requiresApproval }
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed'
      toast.error(message)
      return { success: false, message }
    }
  }

  const sendRegistrationOtp = async (email, role) => {
    try {
      const response = await api.post('/auth/send-registration-otp', { email, role })
      toast.success(response.data?.message || 'OTP sent successfully')
      return { success: true, otp: response.data?.otp }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to send OTP'
      toast.error(message)
      return { success: false, message }
    }
  }

  const sendLoginOtp = async (email) => {
    try {
      const response = await api.post('/auth/send-login-otp', { email })
      toast.success(response.data?.message || 'OTP sent successfully')
      return { success: true, otp: response.data?.otp }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to send OTP'
      toast.error(message)
      return { success: false, message }
    }
  }

  const loginWithOtp = async (email, otp) => {
    try {
      const response = await api.post('/auth/login-otp', { email, otp })
      console.log(response.data)
      const { token, user } = response.data
      const normalizedUser = normalizeUserRole(user)

      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(normalizedUser))
      setUser(normalizedUser)

      toast.success('Login successful!')
      return { success: true, user: normalizedUser, data: { ...response.data, user: normalizedUser } }
    } catch (error) {
      const message = error.response?.data?.message || 'OTP login failed'
      toast.error(message)
      return { success: false, message }
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    toast.info('Logged out successfully')
  }

  const updateUser = (updatedUser) => {
    const normalizedUser = normalizeUserRole(updatedUser)
    setUser(normalizedUser)
    localStorage.setItem('user', JSON.stringify(normalizedUser))
  }

  const value = {
    user,
    loading,
    login,
    loginWithOtp,
    register,
    sendRegistrationOtp,
    sendLoginOtp,
    logout,
    updateUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
