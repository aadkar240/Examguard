import { useState } from 'react'
import { FiX, FiUser, FiMail, FiPhone, FiBook, FiHash } from 'react-icons/fi'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import { toast } from 'react-toastify'

const ProfileModal = ({ isOpen, onClose }) => {
  const { user, updateUser } = useAuth()
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    department: user?.department || '',
    semester: user?.semester || '',
  })
  const [loading, setLoading] = useState(false)
  const [otpLoading, setOtpLoading] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordData, setPasswordData] = useState({
    otp: '',
    newPassword: '',
    confirmPassword: '',
  })

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await api.put('/auth/update-profile', formData)
      updateUser(response.data.user)
      toast.success('Profile updated successfully!')
      onClose()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()

    if (!passwordData.otp || passwordData.otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP!')
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Passwords do not match!')
      return
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters!')
      return
    }

    setLoading(true)

    try {
      await api.put('/auth/update-password', {
        otp: passwordData.otp,
        newPassword: passwordData.newPassword,
      })
      toast.success('Password updated successfully!')
      setPasswordData({
        otp: '',
        newPassword: '',
        confirmPassword: '',
      })
      setIsChangingPassword(false)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  const handleSendPasswordOtp = async () => {
    setOtpLoading(true)
    try {
      const response = await api.post('/auth/send-update-password-otp')
      toast.success(response.data?.message || 'OTP sent successfully!')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send OTP')
    } finally {
      setOtpLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">Profile Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <FiX className="text-2xl" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* User Info */}
          <div className="mb-6 p-4 bg-primary-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">{user?.name}</h3>
                <p className="text-sm text-gray-600">{user?.email}</p>
                <span className="inline-block mt-1 px-3 py-1 bg-primary-600 text-white text-xs rounded-full">
                  {user?.role?.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Toggle between Profile and Password */}
          <div className="flex space-x-2 mb-6">
            <button
              onClick={() => setIsChangingPassword(false)}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                !isChangingPassword
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Update Profile
            </button>
            <button
              onClick={() => setIsChangingPassword(true)}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                isChangingPassword
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Change Password
            </button>
          </div>

          {/* Profile Update Form */}
          {!isChangingPassword && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Full Name</label>
                <div className="relative">
                  <FiUser className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="input pl-10"
                    placeholder="Your name"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="label">Email (Read-only)</label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="email"
                    value={user?.email}
                    className="input pl-10 bg-gray-100"
                    disabled
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>

              {user?.role === 'student' && (
                <div>
                  <label className="label">Student ID (Read-only)</label>
                  <div className="relative">
                    <FiHash className="absolute left-3 top-3 text-gray-400" />
                    <input
                      type="text"
                      value={user?.studentId}
                      className="input pl-10 bg-gray-100"
                      disabled
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="label">Phone</label>
                <div className="relative">
                  <FiPhone className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="input pl-10"
                    placeholder="Your phone number"
                  />
                </div>
              </div>

              <div>
                <label className="label">Department</label>
                <div className="relative">
                  <FiBook className="absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="input pl-10"
                    placeholder="Your department"
                  />
                </div>
              </div>

              {user?.role === 'student' && (
                <div>
                  <label className="label">Semester</label>
                  <select
                    name="semester"
                    value={formData.semester}
                    onChange={handleChange}
                    className="input"
                  >
                    <option value="">Select Semester</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                      <option key={sem} value={sem}>
                        Semester {sem}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary flex-1 disabled:opacity-50"
                >
                  {loading ? 'Updating...' : 'Update Profile'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Password Change Form */}
          {isChangingPassword && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="label">OTP</label>
                <button
                  type="button"
                  onClick={handleSendPasswordOtp}
                  disabled={otpLoading}
                  className="btn btn-secondary w-full mb-2 disabled:opacity-50"
                >
                  {otpLoading ? 'Sending OTP...' : 'Send OTP to Email'}
                </button>
                <input
                  type="text"
                  name="otp"
                  value={passwordData.otp}
                  onChange={handlePasswordChange}
                  className="input"
                  placeholder="Enter 6-digit OTP"
                  maxLength={6}
                  required
                />
              </div>

              <div>
                <label className="label">New Password</label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  className="input"
                  placeholder="Enter new password (min 6 characters)"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="label">Confirm New Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  className="input"
                  placeholder="Re-enter new password"
                  required
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary flex-1 disabled:opacity-50"
                >
                  {loading ? 'Updating...' : 'Change Password'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProfileModal
