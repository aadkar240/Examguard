import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../utils/api'
import { FiBook, FiUsers, FiClipboard, FiMessageSquare, FiEdit2 } from 'react-icons/fi'
import { format } from 'date-fns'
import EditSemesterModal from '../../components/EditSemesterModal'
import { toast } from 'react-toastify'

const FacultyDashboard = () => {
  const [stats, setStats] = useState(null)
  const [myExams, setMyExams] = useState([])
  const [pendingEvaluations, setPendingEvaluations] = useState([])
  const [assignedGrievances, setAssignedGrievances] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [announcementForm, setAnnouncementForm] = useState({ title: '', message: '' })
  const [postingAnnouncement, setPostingAnnouncement] = useState(false)
  const [loading, setLoading] = useState(true)
  const [editingExam, setEditingExam] = useState(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [response, announcementsResponse] = await Promise.all([
        api.get('/dashboard/faculty'),
        api.get('/announcements').catch(() => ({ data: { announcements: [] } }))
      ])
      const { stats, myExams, pendingEvaluations, assignedGrievances } = response.data.data
      
      setStats(stats)
      setMyExams(myExams)
      setPendingEvaluations(pendingEvaluations)
      setAssignedGrievances(assignedGrievances)
      setAnnouncements((announcementsResponse.data?.announcements || []).slice(0, 5))
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePostAnnouncement = async () => {
    if (!announcementForm.title.trim() || !announcementForm.message.trim()) {
      toast.warning('Please enter announcement title and message.')
      return
    }

    try {
      setPostingAnnouncement(true)
      await api.post('/announcements', {
        title: announcementForm.title,
        message: announcementForm.message
      })
      setAnnouncementForm({ title: '', message: '' })
      toast.success('Announcement posted for students.')
      fetchDashboardData()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to post announcement')
    } finally {
      setPostingAnnouncement(false)
    }
  }

  const handleDeleteAnnouncement = async (announcementId) => {
    const confirmed = window.confirm('Delete this announcement?')
    if (!confirmed) return

    try {
      await api.delete(`/announcements/${announcementId}`)
      toast.success('Announcement deleted.')
      fetchDashboardData()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete announcement')
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
        <h1 className="text-3xl font-bold text-gray-800">Faculty Dashboard</h1>
        <Link to="/faculty/exam/create" className="btn btn-primary">
          Create New Exam
        </Link>
      </div>

      <div className="card border-l-4 border-indigo-500 bg-indigo-50">
        <h2 className="text-xl font-bold text-indigo-900 mb-3">Announcement Board (Post to Students)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <input
            type="text"
            value={announcementForm.title}
            onChange={(e) => setAnnouncementForm((prev) => ({ ...prev, title: e.target.value }))}
            placeholder="Announcement title"
            className="input w-full"
          />
          <button
            onClick={handlePostAnnouncement}
            disabled={postingAnnouncement}
            className="btn btn-primary"
          >
            {postingAnnouncement ? 'Posting...' : 'Post Announcement'}
          </button>
        </div>
        <textarea
          value={announcementForm.message}
          onChange={(e) => setAnnouncementForm((prev) => ({ ...prev, message: e.target.value }))}
          placeholder="Write announcement message for students"
          rows="3"
          className="input w-full"
        />

        <div className="mt-4 space-y-2">
          {announcements.length === 0 ? (
            <p className="text-indigo-800">No announcements yet.</p>
          ) : (
            announcements.map((item) => (
              <div key={item._id} className="bg-white border border-indigo-100 rounded-lg p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-gray-800">{item.title}</p>
                  <span className="text-xs text-gray-500">{format(new Date(item.createdAt), 'PPp')}</span>
                </div>
                <p className="text-sm text-gray-700 mt-1">{item.message}</p>
                <div className="flex items-center justify-between mt-2 gap-2">
                  <p className="text-xs text-indigo-700">Posted by {item.createdBy?.name || item.createdByRole}</p>
                  <button
                    onClick={() => handleDeleteAnnouncement(item._id)}
                    className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Total Exams</p>
              <h3 className="text-3xl font-bold mt-2">{stats?.totalExams || 0}</h3>
            </div>
            <FiBook className="text-5xl text-blue-200 opacity-50" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100">Pending Evaluations</p>
              <h3 className="text-3xl font-bold mt-2">{stats?.pendingEvaluations || 0}</h3>
            </div>
            <FiClipboard className="text-5xl text-yellow-200 opacity-50" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">Completed</p>
              <h3 className="text-3xl font-bold mt-2">{stats?.completedEvaluations || 0}</h3>
            </div>
            <FiClipboard className="text-5xl text-green-200 opacity-50" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100">Grievances</p>
              <h3 className="text-3xl font-bold mt-2">{stats?.assignedGrievances || 0}</h3>
            </div>
            <FiMessageSquare className="text-5xl text-orange-200 opacity-50" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Exams */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-800 mb-4">My Exams</h2>
          <div className="space-y-3">
            {myExams.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No exams created yet</p>
            ) : (
              myExams.map((exam) => (
                <div key={exam._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-800">{exam.title}</h3>
                    <p className="text-sm text-gray-600">
                      {exam.subject} - {
                        exam.semesters && exam.semesters.length > 0 
                          ? exam.semesters.length > 1 
                            ? `Semesters ${exam.semesters.sort((a, b) => a - b).join(', ')}`
                            : `Semester ${exam.semesters[0]}`
                          : exam.semester ? `Semester ${exam.semester}` : 'No semester'
                      }
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`text-xs px-2 py-1 rounded ${
                        exam.status === 'draft' ? 'bg-gray-200 text-gray-700' :
                        exam.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                        exam.status === 'ongoing' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {exam.status}
                      </span>
                      <span className="text-xs text-gray-500">
                        {format(new Date(exam.startTime), 'PP')}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setEditingExam(exam)}
                    className="ml-3 p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    title="Edit Semesters"
                  >
                    <FiEdit2 size={18} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pending Evaluations */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Pending Evaluations</h2>
          <div className="space-y-3">
            {pendingEvaluations.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No pending evaluations</p>
            ) : (
              pendingEvaluations.map((evaluation) => (
                <div key={evaluation._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-800">{evaluation.student?.name}</h3>
                    <p className="text-sm text-gray-600">{evaluation.exam?.title}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      ID: {evaluation.student?.studentId}
                    </p>
                  </div>
                  <Link
                    to={`/faculty/evaluate/${evaluation._id}`}
                    className="btn btn-primary text-sm"
                  >
                    Evaluate
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Assigned Grievances */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">Assigned Grievances</h2>
          <Link to="/faculty/grievances" className="text-primary-600 hover:text-primary-700 text-sm">
            View All
          </Link>
        </div>
        <div className="space-y-3">
          {assignedGrievances.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No assigned grievances</p>
          ) : (
            assignedGrievances.map((grievance) => (
              <div key={grievance._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono text-gray-500">{grievance.ticketId}</span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      grievance.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                      grievance.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {grievance.priority}
                    </span>
                  </div>
                  <h3 className="font-medium text-gray-800 mt-1">{grievance.subject}</h3>

      {/* Edit Semester Modal */}
      {editingExam && (
        <EditSemesterModal
          exam={editingExam}
          onClose={() => setEditingExam(null)}
          onSuccess={() => {
            setEditingExam(null);
            fetchDashboardData();
          }}
        />
      )}
                  <p className="text-sm text-gray-600">
                    {grievance.student?.name} ({grievance.student?.studentId})
                  </p>
                </div>
                <Link
                  to={`/faculty/grievances`}
                  className="btn btn-primary text-sm"
                >
                  Respond
                </Link>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default FacultyDashboard
