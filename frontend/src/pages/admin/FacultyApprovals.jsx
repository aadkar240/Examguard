import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import api from '../../utils/api'

const FacultyApprovals = () => {
  const [facultyApprovals, setFacultyApprovals] = useState([])
  const [approvingFacultyIds, setApprovingFacultyIds] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchFacultyApprovals = async () => {
    try {
      const response = await api.get('/users?role=faculty')
      setFacultyApprovals(response.data.users || [])
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch faculty registrations.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFacultyApprovals()

    const facultyRefreshInterval = setInterval(() => {
      fetchFacultyApprovals()
    }, 5000)

    return () => clearInterval(facultyRefreshInterval)
  }, [])

  const handleFacultyDecision = async (facultyId, status) => {
    setApprovingFacultyIds((prev) => [...prev, facultyId])
    try {
      await api.put(`/users/${facultyId}`, { facultyApprovalStatus: status })
      setFacultyApprovals((prev) =>
        prev.map((faculty) =>
          faculty._id === facultyId
            ? {
                ...faculty,
                facultyApprovalStatus: status,
              }
            : faculty,
        ),
      )
      toast.success(status === 'approved' ? 'Faculty approved successfully.' : 'Faculty rejected successfully.')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update faculty status.')
    } finally {
      setApprovingFacultyIds((prev) => prev.filter((id) => id !== facultyId))
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Faculty Approvals</h1>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">Faculty Registrations</h2>
          <button
            onClick={fetchFacultyApprovals}
            className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-medium transition-colors"
            title="Refresh faculty list"
          >
            🔄 Refresh
          </button>
        </div>

        {facultyApprovals.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-gray-600 text-sm">No faculty registrations found.</p>
            <p className="text-gray-400 text-xs mt-1">Click Refresh to check for new registrations</p>
          </div>
        ) : (
          <div className="space-y-3">
            {facultyApprovals.map((faculty) => {
              const isProcessing = approvingFacultyIds.includes(faculty._id)
              const isPending = faculty.facultyApprovalStatus === 'pending'

              return (
                <div
                  key={faculty._id}
                  className="p-4 border border-gray-200 rounded-lg flex flex-col md:flex-row md:items-center md:justify-between gap-3 hover:bg-gray-50 transition-colors"
                >
                  <div>
                    <p className="font-semibold text-gray-800">{faculty.name}</p>
                    <p className="text-sm text-gray-800 font-medium">Email: {faculty.email}</p>
                    <p className="text-xs text-gray-600 mt-1">Department: {faculty.department || 'N/A'}</p>
                    <p className="text-xs mt-1">
                      Status:{' '}
                      <span
                        className={`font-semibold ${
                          faculty.facultyApprovalStatus === 'approved'
                            ? 'text-green-700'
                            : faculty.facultyApprovalStatus === 'rejected'
                              ? 'text-red-700'
                              : 'text-amber-700'
                        }`}
                      >
                        {faculty.facultyApprovalStatus || 'pending'}
                      </span>
                    </p>
                  </div>
                  {isPending ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleFacultyDecision(faculty._id, 'approved')}
                        disabled={isProcessing}
                        className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleFacultyDecision(faculty._id, 'rejected')}
                        disabled={isProcessing}
                        className="px-3 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">
                      {faculty.facultyApprovalStatus === 'approved' ? 'Already approved' : 'Already rejected'}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default FacultyApprovals
