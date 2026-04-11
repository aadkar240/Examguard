import { useEffect, useMemo, useState } from 'react'
import api from '../../utils/api'
import { toast } from 'react-toastify'

const Registry = () => {
  const [roleFilter, setRoleFilter] = useState('all')
  const [users, setUsers] = useState([])
  const [studentExamAccess, setStudentExamAccess] = useState({})
  const [expandedStudentId, setExpandedStudentId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [updatingKey, setUpdatingKey] = useState('')

  const fetchRegistry = async () => {
    try {
      setLoading(true)
      const query = roleFilter === 'all' ? '' : `?role=${roleFilter}`
      const response = await api.get(`/users/registry${query}`)
      const list = response.data.users || []
      const accessMap = {}
      ;(response.data.studentsWithExamAccess || []).forEach((entry) => {
        accessMap[entry.studentId] = entry.exams || []
      })
      setUsers(list)
      setStudentExamAccess(accessMap)

      if (expandedStudentId && !accessMap[expandedStudentId]) {
        setExpandedStudentId(null)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load registered users data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRegistry()
  }, [roleFilter])

  const studentsCount = useMemo(() => users.filter((user) => user.role === 'student').length, [users])
  const facultyCount = useMemo(() => users.filter((user) => user.role === 'faculty').length, [users])

  const handleAccessUpdate = async (studentId, examId, allowAccess) => {
    const key = `access-${studentId}-${examId}`
    try {
      setUpdatingKey(key)
      const response = await api.patch('/users/student-exam-access', {
        studentId,
        examId,
        allowAccess
      })

      const reactivated = Boolean(response?.data?.evaluationReactivated)

      setStudentExamAccess((prev) => ({
        ...prev,
        [studentId]: (prev[studentId] || []).map((exam) =>
          exam._id === examId
            ? {
                ...exam,
                isBlocked: !allowAccess,
                ...(allowAccess
                  ? {
                      hasSubmitted: reactivated ? false : exam.hasSubmitted,
                      evaluationStatus: reactivated ? null : exam.evaluationStatus,
                      submittedAt: reactivated ? null : exam.submittedAt,
                      totalMarks: reactivated ? null : exam.totalMarks,
                      maxMarks: reactivated ? null : exam.maxMarks
                    }
                  : {})
              }
            : exam,
        )
      }))

      toast.success(
        allowAccess
          ? (reactivated
            ? 'Exam access allowed and evaluation re-activated for retest'
            : 'Exam access allowed for student')
          : 'Exam removed from student dashboard'
      )
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update exam access')
    } finally {
      setUpdatingKey('')
    }
  }

  const handleReschedule = async (studentId, examId) => {
    const key = `reschedule-${studentId}-${examId}`
    try {
      setUpdatingKey(key)
      await api.patch('/users/student-exam-reschedule', {
        studentId,
        examId
      })

      setStudentExamAccess((prev) => ({
        ...prev,
        [studentId]: (prev[studentId] || []).map((exam) =>
          exam._id === examId
            ? {
                ...exam,
                isBlocked: false,
                hasSubmitted: false,
                evaluationStatus: null,
                submittedAt: null,
                totalMarks: null,
                maxMarks: null
              }
            : exam,
        )
      }))

      toast.success('Exam rescheduled. Student can give this test again.')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reschedule exam')
    } finally {
      setUpdatingKey('')
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
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">Registered Users & Exam Access</h1>
        <div className="text-sm text-gray-600">Total: {users.length} | Students: {studentsCount} | Faculty: {facultyCount}</div>
      </div>

      <div className="card flex gap-2 flex-wrap">
        {['all', 'student', 'faculty'].map((role) => (
          <button
            key={role}
            onClick={() => setRoleFilter(role)}
            className={`px-4 py-2 rounded-md capitalize ${
              roleFilter === role
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {role}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {users.length === 0 ? (
          <div className="card text-center text-gray-500 py-10">No registered users found.</div>
        ) : (
          users.map((user) => {
            const isStudent = user.role === 'student'
            const exams = studentExamAccess[user._id] || []
            const isExpanded = expandedStudentId === user._id

            return (
              <div key={user._id} className="card">
                <div
                  className={`flex items-center justify-between gap-4 ${isStudent ? 'cursor-pointer' : ''}`}
                  onClick={() => {
                    if (!isStudent) return
                    setExpandedStudentId(isExpanded ? null : user._id)
                  }}
                >
                  <div
                    className={isStudent ? 'cursor-pointer' : ''}
                  >
                    <p className="text-lg font-semibold text-gray-800">{user.name}</p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Role: <span className="capitalize font-medium">{user.role}</span>
                      {user.department ? ` | Dept: ${user.department}` : ''}
                      {user.semester ? ` | Sem: ${user.semester}` : ''}
                    </p>
                    {isStudent && (
                      <p className="text-xs text-blue-600 mt-2">Click name to view all published exams for this student</p>
                    )}
                  </div>

                  {isStudent && (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        setExpandedStudentId(isExpanded ? null : user._id)
                      }}
                      className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                    >
                      {isExpanded ? 'Hide Exams' : 'View Exams'}
                    </button>
                  )}
                </div>

                {isStudent && isExpanded && (
                  <div className="border-t mt-4 pt-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Published Tests For This Student</h3>
                    {exams.length === 0 ? (
                      <p className="text-sm text-gray-500">No published tests available for this student.</p>
                    ) : (
                      <div className="space-y-2">
                        {exams.map((exam) => {
                          const accessKey = `access-${user._id}-${exam._id}`
                          const rescheduleKey = `reschedule-${user._id}-${exam._id}`
                          const isAccessUpdating = updatingKey === accessKey
                          const isRescheduling = updatingKey === rescheduleKey
                          return (
                            <div key={exam._id} className="flex items-center justify-between gap-3 p-3 bg-gray-50 rounded border">
                              <div>
                                <p className="font-medium text-gray-800">{exam.title}</p>
                                <p className="text-xs text-gray-600">{exam.subject} | {exam.department} | Sem: {exam.semesters?.join(', ')}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {exam.hasSubmitted
                                    ? `Submitted (${exam.evaluationStatus || 'under-evaluation'})${exam.totalMarks !== null && exam.maxMarks !== null ? ` • Marks: ${exam.totalMarks}/${exam.maxMarks}` : ''}`
                                    : 'Not submitted yet'}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                {exam.isBlocked ? (
                                  <button
                                    onClick={() => handleAccessUpdate(user._id, exam._id, true)}
                                    disabled={isAccessUpdating || isRescheduling}
                                    className="px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
                                  >
                                    {isAccessUpdating ? 'Updating...' : 'Allow Test'}
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleAccessUpdate(user._id, exam._id, false)}
                                    disabled={isAccessUpdating || isRescheduling}
                                    className="px-3 py-1.5 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-50"
                                  >
                                    {isAccessUpdating ? 'Updating...' : 'Delete From Dashboard'}
                                  </button>
                                )}

                                <button
                                  onClick={() => handleReschedule(user._id, exam._id)}
                                  disabled={isRescheduling || isAccessUpdating}
                                  className="px-3 py-1.5 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 disabled:opacity-50"
                                >
                                  {isRescheduling ? 'Rescheduling...' : 'Reschedule Retest'}
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default Registry
