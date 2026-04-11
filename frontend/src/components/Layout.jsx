import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useUI } from '../context/UIContext'
import { FiHome, FiBook, FiClipboard, FiMessageSquare, FiLogOut, FiUser, FiSettings, FiCheckSquare, FiSun, FiMoon } from 'react-icons/fi'
import ProfileModal from './ProfileModal'

const Layout = ({ children }) => {
  const { user, logout } = useAuth()
  const { theme, toggleTheme, language, setLanguage, languageOptions, t } = useUI()
  const navigate = useNavigate()
  const [isProfileOpen, setIsProfileOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const getNavLinks = () => {
    if (user?.role === 'student') {
      return [
        { path: '/student/dashboard', label: t('dashboard'), icon: <FiHome /> },
        { path: '/student/exams', label: t('exams'), icon: <FiBook /> },
        { path: '/student/evaluations', label: 'Evaluations', icon: <FiClipboard /> },
        { path: '/student/results', label: 'Results', icon: <FiCheckSquare /> },
        { path: '/student/grievances', label: t('grievances'), icon: <FiMessageSquare /> },
      ]
    } else if (user?.role === 'faculty') {
      return [
        { path: '/faculty/dashboard', label: t('dashboard'), icon: <FiHome /> },
        { path: '/faculty/exam/create', label: t('createExam'), icon: <FiBook /> },
        { path: '/faculty/exam/evaluate', label: t('evaluateExam'), icon: <FiCheckSquare /> },
        { path: '/faculty/grievances', label: t('grievances'), icon: <FiMessageSquare /> },
      ]
    } else if (user?.role === 'admin') {
      return [
        { path: '/admin/dashboard', label: t('dashboard'), icon: <FiHome /> },
        { path: '/admin/registry', label: 'Registry', icon: <FiClipboard /> },
        { path: '/admin/users', label: 'People', icon: <FiUser /> },
        { path: '/admin/feedback', label: 'Feedback', icon: <FiMessageSquare /> },
        { path: '/admin/faculty-approvals', label: 'Faculty Approvals', icon: <FiCheckSquare /> },
        { path: '/admin/settings', label: t('settings'), icon: <FiSettings /> },
      ]
    }
    return []
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 dark:text-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm dark:bg-gray-800 dark:shadow-gray-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex items-center space-x-3">
                <img src="/logo.jpeg" alt="ExamGuard logo" className="h-14 w-14 rounded object-cover" />
                <h1 className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                  {t('appName')}
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="input !w-32 !py-1.5 !px-2"
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
                className="flex items-center space-x-1 px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700 transition-colors"
              >
                {theme === 'dark' ? <FiSun /> : <FiMoon />}
                <span className="text-sm">{theme === 'dark' ? t('lightMode') : t('darkMode')}</span>
              </button>

              <button
                onClick={() => setIsProfileOpen(true)}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group"
              >
                <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-100 group-hover:text-primary-600 dark:group-hover:text-primary-400">
                    {user?.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-300 capitalize">{t(user?.role, user?.role)}</p>
                </div>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 text-red-600 hover:text-red-700 transition-colors"
              >
                <FiLogOut />
                <span>{t('logout')}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white dark:bg-gray-800 shadow-sm min-h-[calc(100vh-4rem)]">
          <nav className="p-4 space-y-2">
            {getNavLinks().map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-primary-50 dark:hover:bg-gray-700 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                {link.icon}
                <span>{link.label}</span>
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Profile Modal */}
      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </div>
  )
}

export default Layout
