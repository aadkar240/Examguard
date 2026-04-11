import { useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import api from '../../utils/api'

const roleToApiRole = {
  student: 'student',
  faculty: 'faculty',
  staff: 'admin',
}

const Settings = () => {
  const [selectedRole, setSelectedRole] = useState('student')
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [deletingUserIds, setDeletingUserIds] = useState([])
  const [updatingStatusUserIds, setUpdatingStatusUserIds] = useState([])

  const roleTitle = useMemo(() => {
    if (selectedRole === 'student') return 'Students'
    if (selectedRole === 'faculty') return 'Faculty'
    return 'Staff'
  }, [selectedRole])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const apiRole = roleToApiRole[selectedRole]
      const response = await api.get(`/users?role=${apiRole}`)
      setUsers(response.data.users || [])
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [selectedRole])

  const handleRemoveUser = async (userId, userName) => {
    const confirmed = window.confirm(`Remove ${userName} from ${roleTitle.toLowerCase()}?`)
    if (!confirmed) {
      return
    }

    setDeletingUserIds((prev) => [...prev, userId])
    try {
      await api.delete(`/users/${userId}`)
      setUsers((prev) => prev.filter((user) => user._id !== userId))
      toast.success('User removed successfully')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to remove user')
    } finally {
      setDeletingUserIds((prev) => prev.filter((id) => id !== userId))
    }
  }

  const handleToggleStudentStatus = async (userId, currentStatus) => {
    const nextStatus = !currentStatus
    setUpdatingStatusUserIds((prev) => [...prev, userId])

    try {
      await api.put(`/users/${userId}`, { isActive: nextStatus })
      setUsers((prev) =>
        prev.map((user) =>
          user._id === userId
            ? {
                ...user,
                isActive: nextStatus,
              }
            : user,
        ),
      )
      toast.success(nextStatus ? 'Student activated successfully' : 'Student deactivated successfully')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update student status')
    } finally {
      setUpdatingStatusUserIds((prev) => prev.filter((id) => id !== userId))
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Settings</h1>

      <div className="card space-y-4">
        <h2 className="text-xl font-semibold text-gray-800">Remove Users</h2>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelectedRole('student')}
            className={`px-4 py-2 rounded-md ${selectedRole === 'student' ? 'btn-primary' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            Students
          </button>
          <button
            type="button"
            onClick={() => setSelectedRole('faculty')}
            className={`px-4 py-2 rounded-md ${selectedRole === 'faculty' ? 'btn-primary' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            Faculty
          </button>
          <button
            type="button"
            onClick={() => setSelectedRole('staff')}
            className={`px-4 py-2 rounded-md ${selectedRole === 'staff' ? 'btn-primary' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            Staff
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Email</th>
                <th className="py-2 pr-4">Department</th>
                <th className="py-2 pr-4">Semester</th>
                {selectedRole === 'student' && <th className="py-2 pr-4">Status</th>}
                <th className="py-2 pr-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="py-3" colSpan={selectedRole === 'student' ? 6 : 5}>Loading {roleTitle.toLowerCase()}...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td className="py-3" colSpan={selectedRole === 'student' ? 6 : 5}>No {roleTitle.toLowerCase()} found.</td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user._id} className="border-b last:border-0">
                    <td className="py-2 pr-4">{user.name}</td>
                    <td className="py-2 pr-4">{user.email}</td>
                    <td className="py-2 pr-4">{user.department || '-'}</td>
                    <td className="py-2 pr-4">{user.semester || '-'}</td>
                    {selectedRole === 'student' && (
                      <td className="py-2 pr-4">
                        <span className={user.isActive ? 'text-green-700 font-medium' : 'text-red-700 font-medium'}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                    )}
                    <td className="py-2 pr-4">
                      <div className="flex items-center gap-3">
                        {selectedRole === 'student' && (
                          <button
                            type="button"
                            disabled={updatingStatusUserIds.includes(user._id)}
                            onClick={() => handleToggleStudentStatus(user._id, user.isActive)}
                            className="text-blue-600 hover:text-blue-700 disabled:opacity-60"
                          >
                            {updatingStatusUserIds.includes(user._id)
                              ? 'Updating...'
                              : user.isActive
                                ? 'Deactivate'
                                : 'Activate'}
                          </button>
                        )}

                        <button
                          type="button"
                          disabled={deletingUserIds.includes(user._id)}
                          onClick={() => handleRemoveUser(user._id, user.name)}
                          className="text-red-600 hover:text-red-700 disabled:opacity-60"
                        >
                          {deletingUserIds.includes(user._id) ? 'Removing...' : 'Remove'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Settings
