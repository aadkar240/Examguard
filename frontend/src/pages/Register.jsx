import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useUI } from '../context/UIContext'
import { FiUser, FiMail, FiLock, FiBook, FiHash, FiMoon, FiSun } from 'react-icons/fi'

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    otp: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    studentId: '',
    department: '',
    semester: '',
    phone: '',
  })
  const [loading, setLoading] = useState(false)
  const [otpLoading, setOtpLoading] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const { register, sendRegistrationOtp } = useAuth()
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

    if (!formData.otp || formData.otp.length !== 6) {
      alert('Please enter a valid 6-digit OTP')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      alert(t('passwordMismatch'))
      return
    }

    if (formData.password.length < 6) {
      alert(t('passwordMinLength'))
      return
    }

    // Faculty-specific validation
    if (formData.role === 'faculty') {
      if (!formData.department || formData.department.trim() === '') {
        alert('Please enter your department')
        return
      }
    }

    // Student-specific validation
    if (formData.role === 'student') {
      if (!formData.studentId || formData.studentId.trim() === '') {
        alert('Please enter your student ID')
        return
      }
      if (!formData.semester) {
        alert('Please select your semester')
        return
      }
    }

    setLoading(true)

    const { confirmPassword, ...registerData } = formData
    const result = await register(registerData)
    
    if (result.success) {
      if (result.requiresApproval) {
        // Show success modal for faculty before navigating
        setShowSuccessModal(true)
        // Auto-navigate after 5 seconds
        setTimeout(() => {
          navigate('/login')
        }, 5000)
      } else {
        navigate('/')
      }
    }
    
    setLoading(false)
  }

  const handleSendOtp = async () => {
    if (!formData.email) {
      alert('Please enter email first')
      return
    }

    setOtpLoading(true)
    const result = await sendRegistrationOtp(formData.email, formData.role)
    if (result.success) {
      setOtpSent(true)
      if (result.otp) {
        setFormData((prev) => ({
          ...prev,
          otp: result.otp,
        }))
      }
    }
    setOtpLoading(false)
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
          <div className="inline-block p-6 bg-white/70 dark:bg-slate-800/80 backdrop-blur-lg rounded-3xl border-2 border-violet-200 dark:border-slate-600 mb-6 animate-bounce transform hover:scale-110 transition-transform duration-300" style={{ animationDelay: '0s' }}>
            <div className="text-5xl animate-spin" style={{ animationDuration: '3s' }}>📚</div>
          </div>
          <h1 className="text-3xl font-bold text-violet-800 dark:text-violet-200 mb-1">ExamGuard</h1>
          <p className="text-violet-700 dark:text-violet-300 text-sm font-medium">Secure • Fair • Intelligent Examination Platform</p>
        </div>
      </div>

      <div className="max-w-2xl w-full mx-auto">
        {/* Main card */}
        <div className="bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-xl p-10 m-4 border-2 border-violet-100 dark:border-slate-700 transform hover:shadow-2xl transition-all duration-500 relative overflow-hidden">
          {/* Decorative top gradient bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-300 via-violet-300 to-sky-300"></div>
          
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-block mb-6 text-5xl animate-bounce" style={{ animationDelay: '0.2s' }}>✨</div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-700 via-fuchsia-700 to-sky-700 bg-clip-text text-transparent mb-2">{t('createAccount')}</h1>
            <p className="text-gray-700 dark:text-gray-300 text-lg font-medium">{t('joinSystem')}</p>
            <div className="flex justify-center gap-2 mt-4 text-sm text-gray-600 dark:text-gray-400">
              <span className="flex items-center gap-1">🎯 Secure</span>
              <span className="text-gray-400">•</span>
              <span className="flex items-center gap-1">⚡ Fast</span>
              <span className="text-gray-400">•</span>
              <span className="flex items-center gap-1">🔐 Private</span>
            </div>
          </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Progress Indicator */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex-1 h-1 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full"></div>
              <span className="px-4 py-1 bg-violet-100 text-violet-700 rounded-full text-xs font-semibold">Step 1</span>
              <div className="flex-1 h-1 bg-violet-100 dark:bg-slate-700 rounded-full"></div>
          </div>

          {/* Role Selection - Enhanced */}
          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-4">🎯 {t('role')} - Choose Your Role</label>
            <div className="grid grid-cols-3 gap-4">
              {['student', 'faculty', 'admin'].map((roleOption) => (
                <button
                  key={roleOption}
                  type="button"
                  onClick={() => setFormData({ ...formData, role: roleOption })}
                  className={`relative p-5 rounded-2xl border-2 transition-all duration-300 transform hover:scale-110 group ${
                    formData.role === roleOption
                      ? 'border-indigo-500 bg-gradient-to-br from-indigo-50 to-purple-50 shadow-xl scale-105 ring-2 ring-indigo-300'
                      : 'border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-indigo-300 dark:hover:border-indigo-500 shadow-md hover:shadow-lg'
                  }`}
                >
                  <div className="text-3xl mb-2 group-hover:scale-125 transition-transform duration-300">
                    {roleOption === 'student' && '👨‍🎓'}
                    {roleOption === 'faculty' && '👨‍🏫'}
                    {roleOption === 'admin' && '⚙️'}
                  </div>
                  <div className="font-bold text-sm capitalize bg-gradient-to-r from-indigo-600 to-purple-500 bg-clip-text text-transparent">
                    {t(roleOption)}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 font-medium">
                    {roleOption === 'student' && 'Take exams'}
                    {roleOption === 'faculty' && 'Create exams'}
                    {roleOption === 'admin' && 'Manage'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Faculty Notice Box - Enhanced */}
          {formData.role === 'faculty' && (
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 border-2 border-blue-400 dark:border-blue-600 rounded-2xl p-5 animate-fadeIn shadow-lg transform hover:scale-105 transition-all duration-300">
              <div className="flex items-start gap-3">
                <div className="text-2xl flex-shrink-0">📋</div>
                <div>
                  <div className="font-bold text-blue-900 dark:text-blue-200 mb-3 text-sm">Faculty Registration Notice</div>
                  <ul className="space-y-2 text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                    <li className="flex items-start gap-2">
                      <span className="text-sm">✓</span>
                      <span>You will receive an OTP via email - check inbox and SPAM folder</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-sm">✓</span>
                      <span>After registration, your account will be pending admin approval</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-sm">✓</span>
                      <span>You can log in only after admin approves your request</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-sm">✓</span>
                      <span>Admin will send you an approval email within 24 hours</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Form Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name field */}
            <div className="group">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2 flex items-center gap-2">
                <span>👤</span> {t('fullName')}
              </label>
              <div className="relative">
                <div className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-indigo-500 group-focus-within:scale-125 transition-all duration-300">
                  <FiUser size={20} />
                </div>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="input pl-10 w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-700 focus:outline-none dark:focus:border-indigo-400 transition-all duration-300 placeholder-gray-400 shadow-sm"
                  placeholder="John Doe"
                  required
                />
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

            {/* OTP field with button */}
            <div className="group md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2 flex items-center gap-2">
                <span>🔐</span> Email OTP Verification
              </label>
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    name="otp"
                    value={formData.otp}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-700 focus:outline-none dark:focus:border-indigo-400 transition-all duration-300 placeholder-gray-400 shadow-sm"
                    placeholder="Enter 6-digit OTP"
                    maxLength={6}
                    required
                  />
                  {otpSent && <div className="absolute right-3 top-3 text-green-500 text-xl">✅</div>}
                </div>
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={otpLoading}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-bold whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  {otpLoading ? '⏳ Sending...' : '✉️ Send OTP'}
                </button>
              </div>
              {otpSent && <p className="text-xs text-green-600 dark:text-green-400 mt-2 flex items-center gap-1 font-semibold">✅ OTP sent to your email</p>}
            </div>

            {/* Password field */}
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

            {/* Confirm Password field */}
            <div className="group">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2 flex items-center gap-2">
                <span>✔️</span> {t('confirmPassword')}
              </label>
              <div className="relative">
                <div className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-indigo-500 group-focus-within:scale-125 transition-all duration-300">
                  <FiLock size={20} />
                </div>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="input pl-10 w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-700 focus:outline-none dark:focus:border-indigo-400 transition-all duration-300 placeholder-gray-400 shadow-sm"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {/* Department field */}
            <div className="group">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2 flex items-center gap-2">
                <span>🏢</span> {t('department')}
              </label>
              <div className="relative">
                <div className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-indigo-500 group-focus-within:scale-125 transition-all duration-300">
                  <FiBook size={20} />
                </div>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="input pl-10 w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-700 focus:outline-none dark:focus:border-indigo-400 transition-all duration-300 placeholder-gray-400 shadow-sm"
                  placeholder="Computer Science"
                  required
                />
              </div>
            </div>

            {/* Student ID field */}
            {formData.role === 'student' && (
              <div className="group">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2 flex items-center gap-2">
                  <span>🎓</span> {t('studentId')}
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-indigo-500 group-focus-within:scale-125 transition-all duration-300">
                    <FiHash size={20} />
                  </div>
                  <input
                    type="text"
                    name="studentId"
                    value={formData.studentId}
                    onChange={handleChange}
                    className="input pl-10 w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-700 focus:outline-none dark:focus:border-indigo-400 transition-all duration-300 placeholder-gray-400 shadow-sm"
                    placeholder="STU12345"
                    required
                  />
                </div>
              </div>
            )}

            {/* Semester field */}
            {formData.role === 'student' && (
              <div className="group">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2 flex items-center gap-2">
                  <span>📅</span> {t('semester')}
                </label>
                <select
                  name="semester"
                  value={formData.semester}
                  onChange={handleChange}
                  className="input w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-700 focus:outline-none dark:focus:border-indigo-400 transition-all duration-300 shadow-sm appearance-none"
                  required
                >
                  <option value="">{t('selectSemester')}</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                    <option key={sem} value={sem}>
                      {t('semester')} {sem}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Phone field */}
            <div className="group md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2 flex items-center gap-2">
                <span>📞</span> {t('phone')}
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="input w-full px-4 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-700 focus:outline-none dark:focus:border-indigo-400 transition-all duration-300 placeholder-gray-400 shadow-sm"
                placeholder="1234567890"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-500 to-pink-500 hover:from-indigo-700 hover:via-purple-600 hover:to-pink-600 text-white font-bold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center gap-2 group"
          >
            <span className="group-hover:animate-spin" style={{ animationDuration: '1.5s' }}>🚀</span>
            {loading ? '⏳ Creating Account...' : 'Create My Account'}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-10 text-center space-y-6">
          {/* Decorative divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full h-1 bg-gradient-to-r from-transparent via-violet-200 dark:via-slate-600 to-transparent"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 bg-white dark:bg-slate-900 text-gray-600 dark:text-gray-400 text-sm font-semibold">OR</span>
            </div>
          </div>
          
          {/* Login link */}
          <div className="p-6 bg-gradient-to-r from-rose-50 via-violet-50 to-sky-50 dark:from-slate-800 dark:via-slate-800 dark:to-indigo-900/50 rounded-2xl border-2 border-violet-100 dark:border-slate-700 transform hover:scale-105 transition-all duration-300">
            <p className="text-gray-700 dark:text-gray-200 font-medium mb-3">Already registered? Welcome back! 👋</p>
            <Link to="/login" className="inline-flex items-center gap-2 font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 hover:scale-110">
              Sign In To Your Account →
            </Link>
          </div>

          {/* Faculty Approval Notice */}
          {formData.role === 'faculty' && (
            <div className="mt-6 p-6 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 border-2 border-amber-400 dark:border-amber-600 rounded-2xl animate-fadeIn shadow-lg transform hover:scale-105 transition-all duration-300">
              <div className="flex items-start gap-3">
                <div className="text-2xl flex-shrink-0">⏳</div>
                <div className="text-left">
                  <p className="text-sm font-bold text-amber-900 dark:text-amber-200 mb-2">
                    Important: Faculty Account Approval Required
                  </p>
                  <ul className="text-xs text-amber-800 dark:text-amber-300 space-y-1 leading-relaxed">
                    <li className="flex items-start gap-2">
                      <span>→</span>
                      <span>Your account is pending admin review for security</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span>→</span>
                      <span>Approval typically takes 24 hours</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span>→</span>
                      <span>You'll receive a confirmation email</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Security info */}
          <div className="text-xs text-gray-600 dark:text-gray-400 flex items-center justify-center gap-2">
            <span>🔒</span>
            <span>Your data is encrypted and secure</span>
          </div>
        </div>
      </div>
      </div>

      {/* Success Modal for Faculty Registration */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-gradient-to-br from-black/70 to-purple-900/70 backdrop-blur-lg flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-md w-full p-8 text-center animate-in transform scale-100 opacity-100 border-2 border-white/20 dark:border-slate-700/50 relative overflow-hidden">
            {/* Decorative top gradient */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500"></div>

            {/* Animated checkmark */}
            <div className="relative mb-8">
              <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full opacity-30 animate-pulse scale-150 blur-xl"></div>
              <div className="relative text-7xl animate-bounce" style={{ animationDelay: '0s' }}>✅</div>
            </div>

            {/* Success heading with gradient */}
            <h2 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-500 bg-clip-text text-transparent mb-2">
              Registration Successful!
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 font-bold">
              🎉 Welcome to ExamGuard
            </p>

            {/* What happens next card */}
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/40 dark:to-cyan-900/40 border-2 border-blue-300 dark:border-blue-600 rounded-2xl p-6 mb-8 text-left shadow-lg">
              <p className="text-sm font-bold text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-2">
                <span className="text-lg">📋</span> What Happens Next:
              </p>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-3">
                <li className="flex items-start gap-3 p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                  <span className="text-lg flex-shrink-0">1️⃣</span>
                  <span><strong>Pending Review:</strong> Your account is pending admin approval</span>
                </li>
                <li className="flex items-start gap-3 p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                  <span className="text-lg flex-shrink-0">2️⃣</span>
                  <span><strong>Admin Review:</strong> Admin will verify your credentials within 24 hours</span>
                </li>
                <li className="flex items-start gap-3 p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                  <span className="text-lg flex-shrink-0">3️⃣</span>
                  <span><strong>Email Notification:</strong> You'll receive approval confirmation</span>
                </li>
                <li className="flex items-start gap-3 p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                  <span className="text-lg flex-shrink-0">4️⃣</span>
                  <span><strong>Start Teaching:</strong> Log in and create your exams</span>
                </li>
              </ul>
            </div>

            {/* Countdown */}
            <div className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/40 dark:to-pink-900/40 border border-purple-300 dark:border-purple-600 rounded-xl p-3 mb-8">
              <p className="text-sm font-semibold text-purple-700 dark:text-purple-300 flex items-center justify-center gap-2">
                <span className="animate-spin">⏱️</span> Redirecting to login in a few seconds...
              </p>
            </div>

            {/* Action button */}
            <button
              onClick={() => navigate('/login')}
              className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 hover:from-green-600 hover:via-emerald-600 hover:to-teal-600 text-white font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2 group"
            >
              <span className="group-hover:scale-125 transition-transform duration-300">🔓</span>
              Go to Login Page
            </button>

            {/* Footer tip */}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-6 font-medium">
              💡 Check your email for admin approval notification
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
export default Register