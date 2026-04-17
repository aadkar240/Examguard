import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useUI } from '../context/UIContext'
import { FiMail, FiLock, FiMoon, FiSun } from 'react-icons/fi'
import api from '../utils/api'
import { toast } from 'react-toastify'

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    otp: '',
  })
  const [loading, setLoading] = useState(false)
  const [otpSending, setOtpSending] = useState(false)
  const [forgotOtpSending, setForgotOtpSending] = useState(false)
  const [forgotLoading, setForgotLoading] = useState(false)
  const [loginMode, setLoginMode] = useState('password')
  const { login, loginWithOtp, sendLoginOtp } = useAuth()
  const { t, theme, toggleTheme, language, setLanguage, languageOptions } = useUI()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    const result =
      loginMode === 'password'
        ? await login(formData.email, formData.password)
        : await loginWithOtp(formData.email, formData.otp)
    
    if (result.success) {
      const role = String(result?.data?.user?.role || result?.user?.role || '').toLowerCase()

      if (role === 'admin') {
        navigate('/admin', { replace: true })
      } else if (role === 'faculty') {
        navigate('/faculty/dashboard', { replace: true })
      } else {
        navigate('/dashboard', { replace: true })
      }
    }
    
    setLoading(false)
  }

  const handleSendOtp = async () => {
    if (!formData.email) {
      return
    }

    setOtpSending(true)
    await sendLoginOtp(formData.email)
    setOtpSending(false)
  }

  const handleSendForgotOtp = async () => {
    if (!formData.email) {
      toast.error('Please enter email first')
      return
    }

    setForgotOtpSending(true)
    try {
      const response = await api.post('/auth/send-forgot-password-otp', { email: formData.email })
      toast.success(response.data?.message || 'OTP sent successfully')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send OTP')
    } finally {
      setForgotOtpSending(false)
    }
  }

  const handleForgotSubmit = async (e) => {
    e.preventDefault()

    if (!formData.otp || formData.otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP')
      return
    }

    if (!formData.password || formData.password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    setForgotLoading(true)
    try {
      const response = await api.post('/auth/reset-password', {
        email: formData.email,
        otp: formData.otp,
        newPassword: formData.password,
      })
      toast.success(response.data?.message || 'Password reset successfully')
      setLoginMode('password')
      setFormData((prev) => ({ ...prev, otp: '' }))
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reset password')
    } finally {
      setForgotLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-100 via-violet-100 to-sky-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-950 py-12 px-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute top-20 left-10 w-80 h-80 bg-rose-200/40 dark:bg-violet-700/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute -bottom-20 right-20 w-96 h-96 bg-violet-200/40 dark:bg-indigo-700/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }}></div>
      <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-sky-200/40 dark:bg-sky-700/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      <div className="absolute inset-0 bg-gradient-to-t from-white/30 dark:from-black/20 to-transparent pointer-events-none"></div>

      {/* Header with theme and language */}
      <div className="absolute top-6 right-6 flex items-center gap-3 z-10">
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="px-4 py-2 rounded-xl bg-white/95 dark:bg-slate-800/90 backdrop-blur-md border-2 border-violet-200 dark:border-slate-600 text-gray-800 dark:text-gray-100 font-semibold hover:bg-white dark:hover:bg-slate-700 transition-all duration-300 shadow-lg hover:shadow-xl"
          aria-label={t('language')}
        >
          {languageOptions.map((option) => (
            <option key={option.code} value={option.code}>
              {option.label}
            </option>
          ))}
        </select>
        <button
          onClick={toggleTheme}
          className="p-3 rounded-xl bg-white/95 dark:bg-slate-800/90 backdrop-blur-md border-2 border-violet-200 dark:border-slate-600 hover:bg-white dark:hover:bg-slate-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-110"
        >
          {theme === 'dark' ? <FiSun className="text-amber-500 text-xl" size={20} /> : <FiMoon className="text-violet-600 text-xl" size={20} />}
        </button>
      </div>

      {/* Logo/Brand section */}
      <div className="flex justify-center mb-12 pt-4 relative z-10">
        <div className="text-center">
          <div className="inline-block p-6 bg-white/70 dark:bg-slate-800/80 backdrop-blur-lg rounded-3xl border-2 border-violet-200 dark:border-slate-600 mb-6 animate-bounce transform hover:scale-110 transition-transform duration-300">
            <div className="text-5xl animate-spin" style={{ animationDuration: '3s' }}>📚</div>
          </div>
          <h1 className="text-3xl font-bold text-violet-800 dark:text-violet-200 mb-1">ExamGuard</h1>
          <p className="text-violet-700 dark:text-violet-300 text-sm font-medium">Secure • Fair • Intelligent Examination Platform</p>
        </div>
      </div>

      <div className="max-w-md w-full mx-auto">
        {/* Main card */}
        <div className="bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-xl p-8 m-4 border-2 border-violet-100 dark:border-slate-700 transform hover:shadow-2xl transition-all duration-500 relative overflow-hidden">
          {/* Decorative top gradient bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-300 via-violet-300 to-sky-300"></div>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-block mb-4 text-5xl animate-bounce" style={{ animationDelay: '0.2s' }}>🔐</div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-700 via-fuchsia-700 to-sky-700 bg-clip-text text-transparent mb-2">{t('welcomeBack')}</h1>
            <p className="text-gray-700 dark:text-gray-300 text-lg font-medium">{t('examSystem')}</p>
          </div>

        <form onSubmit={loginMode === 'forgot' ? handleForgotSubmit : handleSubmit} className="space-y-6">
          {/* Login Mode Selection */}
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-3">📌 Choose Login Method</label>
            <div className="grid grid-cols-3 gap-2 bg-violet-50 dark:bg-slate-800 p-2 rounded-xl border border-violet-100 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setLoginMode('password')}
                className={`py-2 rounded-lg text-sm font-bold transition-all duration-300 transform hover:scale-105 ${
                  loginMode === 'password'
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-slate-700'
                }`}
              >
                🔑 Password
              </button>
              <button
                type="button"
                onClick={() => setLoginMode('otp')}
                className={`py-2 rounded-lg text-sm font-bold transition-all duration-300 transform hover:scale-105 ${
                  loginMode === 'otp'
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-slate-700'
                }`}
              >
                📧 OTP
              </button>
              <button
                type="button"
                onClick={() => setLoginMode('forgot')}
                className={`py-2 rounded-lg text-sm font-bold transition-all duration-300 transform hover:scale-105 ${
                  loginMode === 'forgot'
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-slate-700'
                }`}
              >
                🔄 Reset
              </button>
            </div>
          </div>

          {/* Email field */}
          <div className="group">
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2 flex items-center gap-2">
              <span>📧</span> {t('email')}
            </label>
            <div className="relative">
              <div className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-indigo-500 group-focus-within:scale-125 transition-all duration-300">
                <FiMail size={20} />
              </div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input pl-10 w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-700 focus:outline-none dark:focus:border-indigo-400 transition-all duration-300 placeholder-gray-400 shadow-sm"
                placeholder="your.email@example.com"
                required
              />
            </div>
          </div>

          {/* Password Mode */}
          {loginMode === 'password' && (
            <div className="group">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2 flex items-center gap-2">
                <span>🔒</span> {t('password')}
              </label>
              <div className="relative">
                <div className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-indigo-500 group-focus-within:scale-125 transition-all duration-300">
                  <FiLock size={20} />
                </div>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="input pl-10 w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-700 focus:outline-none dark:focus:border-indigo-400 transition-all duration-300 placeholder-gray-400 shadow-sm"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
          )}

          {/* OTP Mode */}
          {loginMode === 'otp' && (
            <div className="space-y-4">
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={otpSending || !formData.email}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-bold whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                {otpSending ? '⏳ Sending OTP...' : '✉️ Send OTP to Email'}
              </button>

              <div className="group">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2 flex items-center gap-2">
                  <span>🔐</span> Verify OTP
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-indigo-500 group-focus-within:scale-125 transition-all duration-300">
                    <FiLock size={20} />
                  </div>
                  <input
                    type="text"
                    name="otp"
                    value={formData.otp}
                    onChange={handleChange}
                    className="input pl-10 w-full px-4 py-3 rounded-xl border-2 border-violet-200 dark:border-slate-600 bg-white dark:bg-slate-800 focus:border-violet-500 dark:focus:border-violet-400 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-900/40 focus:outline-none transition-all duration-300 placeholder-gray-400 shadow-sm"
                    placeholder="Enter 6-digit OTP"
                    maxLength={6}
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Forgot Password Mode */}
          {loginMode === 'forgot' && (
            <div className="space-y-4">
              <button
                type="button"
                onClick={handleSendForgotOtp}
                disabled={forgotOtpSending || !formData.email}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-bold whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                {forgotOtpSending ? '⏳ Sending OTP...' : '✉️ Send Reset OTP'}
              </button>

              <div className="group">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2 flex items-center gap-2">
                  <span>🔐</span> 6-Digit OTP
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="otp"
                    value={formData.otp}
                    onChange={handleChange}
                    className="input w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-700 focus:outline-none dark:focus:border-indigo-400 transition-all duration-300 placeholder-gray-400 shadow-sm"
                    placeholder="Enter OTP"
                    maxLength={6}
                    required
                  />
                </div>
              </div>

              <div className="group">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2 flex items-center gap-2">
                  <span>🔒</span> New Password
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-indigo-500 group-focus-within:scale-125 transition-all duration-300">
                    <FiLock size={20} />
                  </div>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="input pl-10 w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-700 focus:outline-none dark:focus:border-indigo-400 transition-all duration-300 placeholder-gray-400 shadow-sm"
                    placeholder="Enter new password"
                    required
                    minLength={6}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || forgotLoading}
            className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-500 to-pink-500 hover:from-indigo-700 hover:via-purple-600 hover:to-pink-600 text-white font-bold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center gap-2 group"
          >
            <span className="group-hover:animate-spin" style={{ animationDuration: '1.5s' }}>🚀</span>
            {loginMode === 'forgot'
              ? (forgotLoading ? 'Updating Password...' : 'Reset Password')
              : (loading ? t('loggingIn') : t('login'))}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center space-y-6">
          {/* Decorative divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full h-1 bg-gradient-to-r from-transparent via-violet-200 dark:via-slate-600 to-transparent"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 bg-white dark:bg-slate-900 text-gray-600 dark:text-gray-400 text-sm font-semibold">OR</span>
            </div>
          </div>

          {/* Register Link */}
          <div className="p-5 bg-gradient-to-r from-rose-50 via-violet-50 to-sky-50 dark:from-slate-800 dark:via-slate-800 dark:to-indigo-900/50 rounded-2xl border-2 border-violet-100 dark:border-slate-700 transform hover:scale-105 transition-all duration-300">
            <p className="text-gray-700 dark:text-gray-200 font-medium mb-2">Don't have an account?</p>
            <Link to="/register" className="inline-flex items-center gap-2 font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 hover:scale-110">
              Register Now →
            </Link>
          </div>

          {/* Demo Credentials */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-slate-800 dark:to-sky-900/40 border-2 border-blue-200 dark:border-slate-700 rounded-xl">
            <p className="text-xs font-bold text-blue-900 dark:text-blue-200 mb-3">💡 Demo Account Available</p>
            <div className="text-xs text-blue-800 dark:text-blue-300 space-y-1">
              <p className="flex items-center gap-2">
                <span>👤</span>
                <span>Email: <strong>developeratharva@admin.com</strong></span>
              </p>
              <p className="flex items-center gap-2">
                <span>🔑</span>
                <span>Password: <strong>atharva24</strong></span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  )
}

export default Login
