import { useState, useEffect } from 'react'
import api from '../../utils/api'
import { FiUsers, FiBook, FiClipboard, FiMessageSquare, FiCheckCircle, FiAlertCircle } from 'react-icons/fi'
import { toast } from 'react-toastify'
import { io } from 'socket.io-client'
import { API_BASE_URL, API_URL } from '../../config/api'

const AdminDashboard = () => {
  const [stats, setStats] = useState(null)
  const [grievances, setGrievances] = useState([])
  const [grievanceFilter, setGrievanceFilter] = useState('all')
  const [expandedGrievanceId, setExpandedGrievanceId] = useState(null)
  const [recordings, setRecordings] = useState([])
  const [selectedRecordingIds, setSelectedRecordingIds] = useState([])
  const [deletingRecordings, setDeletingRecordings] = useState(false)
  const [proctoringSessions, setProctoringSessions] = useState([])
  const [liveAlerts, setLiveAlerts] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [announcementForm, setAnnouncementForm] = useState({ title: '', message: '' })
  const [postingAnnouncement, setPostingAnnouncement] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [dashboardResponse, recordingsResponse, sessionsResponse, grievancesResponse, announcementsResponse] = await Promise.all([
        api.get('/dashboard/admin'),
        api.get('/proctoring/admin-recordings'),
        api.get('/proctoring/admin-sessions'),
        api.get('/grievances'),
        api.get('/announcements').catch(() => ({ data: { announcements: [] } })),
      ])
      const { stats } = dashboardResponse.data.data
      setStats(stats)
      setRecordings(recordingsResponse.data.recordings || [])
      setProctoringSessions(sessionsResponse.data.sessions || [])
      setGrievances(grievancesResponse.data.grievances || [])
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
        message: announcementForm.message,
      })
      setAnnouncementForm({ title: '', message: '' })
      toast.success('Announcement posted for students.')
      fetchDashboardData()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to post announcement.')
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
      toast.error(error.response?.data?.message || 'Failed to delete announcement.')
    }
  }

  const socketBaseUrl = API_BASE_URL
  const authToken = localStorage.getItem('token')

  useEffect(() => {
    const socket = io(socketBaseUrl, {
      transports: ['websocket', 'polling'],
    })

    socket.on('connect', () => {
      socket.emit('join-admin-room')
    })

    socket.on('proctoring:alert', (alert) => {
      setLiveAlerts((prev) => [alert, ...prev].slice(0, 50))

      setProctoringSessions((prev) => {
        const index = prev.findIndex((session) => session._id === alert.sessionId)
        if (index === -1) return prev

        const updated = [...prev]
        updated[index] = {
          ...updated[index],
          violationScore: alert.violationScore,
          warningCount: alert.warningCount,
          riskLevel: alert.riskLevel,
        }
        return updated
      })
    })

    return () => {
      socket.disconnect()
    }
  }, [socketBaseUrl])

  const getSecureRecordingUrl = (recordingId) => `${API_URL}/proctoring/recordings/${recordingId}/stream?token=${encodeURIComponent(authToken || '')}`

  const toggleRecordingSelection = (recordingId) => {
    setSelectedRecordingIds((prev) =>
      prev.includes(recordingId)
        ? prev.filter((id) => id !== recordingId)
        : [...prev, recordingId],
    )
  }

  const toggleSelectAllRecordings = () => {
    if (selectedRecordingIds.length === recordings.length) {
      setSelectedRecordingIds([])
      return
    }
    setSelectedRecordingIds(recordings.map((recording) => recording._id))
  }

  const deleteSelectedRecordings = async () => {
    if (!selectedRecordingIds.length) {
      toast.warning('Select recordings to delete.')
      return
    }

    const confirmDelete = window.confirm(
      `Delete ${selectedRecordingIds.length} recording(s)? This action cannot be undone.`,
    )
    if (!confirmDelete) return

    setDeletingRecordings(true)
    try {
      await api.delete('/proctoring/admin-recordings', {
        data: { recordingIds: selectedRecordingIds },
      })

      setRecordings((prev) => prev.filter((recording) => !selectedRecordingIds.includes(recording._id)))
      setSelectedRecordingIds([])
      toast.success('Selected recordings deleted successfully.')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete recordings.')
    } finally {
      setDeletingRecordings(false)
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
      <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>

      <div className="card border-l-4 border-purple-500 bg-purple-50">
        <h2 className="text-xl font-bold text-purple-900 mb-3">Announcement Board (Post to Students)</h2>
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
            <p className="text-purple-800">No announcements yet.</p>
          ) : (
            announcements.map((item) => (
              <div key={item._id} className="bg-white border border-purple-100 rounded-lg p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-gray-800">{item.title}</p>
                  <span className="text-xs text-gray-500">{new Date(item.createdAt).toLocaleString()}</span>
                </div>
                <p className="text-sm text-gray-700 mt-1">{item.message}</p>
                <div className="flex items-center justify-between mt-2 gap-2">
                  <p className="text-xs text-purple-700">Posted by {item.createdBy?.name || item.createdByRole}</p>
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
              <p className="text-blue-100">Total Users</p>
              <h3 className="text-3xl font-bold mt-2">{stats?.totalUsers || 0}</h3>
              <p className="text-xs text-blue-100 mt-2">
                {stats?.totalStudents || 0} Students | {stats?.totalFaculty || 0} Faculty
              </p>
            </div>
            <FiUsers className="text-5xl text-blue-200 opacity-50" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100">Total Exams</p>
              <h3 className="text-3xl font-bold mt-2">{stats?.totalExams || 0}</h3>
              <p className="text-xs text-purple-100 mt-2">
                {stats?.activeExams || 0} Active
              </p>
            </div>
            <FiBook className="text-5xl text-purple-200 opacity-50" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">Evaluations</p>
              <h3 className="text-3xl font-bold mt-2">{stats?.totalEvaluations || 0}</h3>
              <p className="text-xs text-green-100 mt-2">
                {stats?.pendingEvaluations || 0} Pending
              </p>
            </div>
            <FiClipboard className="text-5xl text-green-200 opacity-50" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100">Grievances</p>
              <h3 className="text-3xl font-bold mt-2">{stats?.totalGrievances || 0}</h3>
              <p className="text-xs text-orange-100 mt-2">
                {stats?.openGrievances || 0} Open | {stats?.resolvedGrievances || 0} Resolved
              </p>
            </div>
            <FiMessageSquare className="text-5xl text-orange-200 opacity-50" />
          </div>
        </div>
      </div>

      {/* System Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-bold text-gray-800 mb-4">System Health</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <FiCheckCircle className="text-green-600 text-2xl" />
                <div>
                  <h3 className="font-medium text-gray-800">Database Status</h3>
                  <p className="text-sm text-gray-600">Connected & Running</p>
                </div>
              </div>
              <div className="text-2xl font-bold text-green-600">✓</div>
            </div>

            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <FiCheckCircle className="text-green-600 text-2xl" />
                <div>
                  <h3 className="font-medium text-gray-800">API Status</h3>
                  <p className="text-sm text-gray-600">All Endpoints Active</p>
                </div>
              </div>
              <div className="text-2xl font-bold text-green-600">✓</div>
            </div>

            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <FiAlertCircle className="text-blue-600 text-2xl" />
                <div>
                  <h3 className="font-medium text-gray-800">Pending Actions</h3>
                  <p className="text-sm text-gray-600">{stats?.pendingEvaluations || 0} evaluations need attention</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Grievance Resolution Stats</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Resolution Rate</span>
                <span className="font-bold text-primary-600">{stats?.resolutionRate || 0}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-primary-500 to-primary-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${stats?.resolutionRate || 0}%` }}
                ></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-600">Open</p>
                <p className="text-2xl font-bold text-blue-700">{stats?.openGrievances || 0}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-600">Resolved</p>
                <p className="text-2xl font-bold text-green-700">{stats?.resolvedGrievances || 0}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grievance Management Section */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">All Grievances</h2>
          <div className="text-sm text-gray-600">
            Total: {grievances.length}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-4 border-b">
          {['all', 'open', 'in-progress', 'resolved'].map((tab) => (
            <button
              key={tab}
              onClick={() => setGrievanceFilter(tab)}
              className={`px-3 py-2 text-sm font-medium border-b-2 capitalize ${
                grievanceFilter === tab
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              {tab} ({grievances.filter((g) => {
                if (tab === 'open') return g.status === 'open'
                if (tab === 'in-progress') return g.status === 'in-progress'
                if (tab === 'resolved') return ['resolved', 'closed'].includes(g.status)
                return true
              }).length})
            </button>
          ))}
        </div>

        {/* Grievances List */}
        {grievances.filter((g) => {
          if (grievanceFilter === 'open') return g.status === 'open'
          if (grievanceFilter === 'in-progress') return g.status === 'in-progress'
          if (grievanceFilter === 'resolved') return ['resolved', 'closed'].includes(g.status)
          return true
        }).length === 0 ? (
          <p className="text-gray-600 text-center py-8">No grievances in this category</p>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {grievances.filter((g) => {
              if (grievanceFilter === 'open') return g.status === 'open'
              if (grievanceFilter === 'in-progress') return g.status === 'in-progress'
              if (grievanceFilter === 'resolved') return ['resolved', 'closed'].includes(g.status)
              return true
            }).map((grievance) => {
              const getStatusColor = (status) => {
                const colors = {
                  open: 'bg-blue-100 text-blue-700',
                  'in-progress': 'bg-yellow-100 text-yellow-700',
                  resolved: 'bg-green-100 text-green-700',
                  closed: 'bg-gray-100 text-gray-700',
                }
                return colors[status] || 'bg-gray-100 text-gray-700'
              }

              return (
                <div
                  key={grievance._id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() =>
                    setExpandedGrievanceId(expandedGrievanceId === grievance._id ? null : grievance._id)
                  }
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-mono text-gray-500">{grievance.ticketId}</span>
                        <span className={`text-xs px-2 py-1 rounded ${getStatusColor(grievance.status)}`}>
                          {grievance.status}
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-800">{grievance.subject}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {grievance.student?.name} • {grievance.department} • Sem {grievance.semester}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        Type: {grievance.problemType} | Assigned: {grievance.assignedTo?.name || 'Unassigned'}
                      </p>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedGrievanceId === grievance._id && (
                    <div className="border-t mt-4 pt-4 space-y-3">
                      <div>
                        <h4 className="font-semibold text-gray-700 mb-2">Description</h4>
                        <p className="text-sm text-gray-600">{grievance.description}</p>
                      </div>

                      {grievance.relatedEvaluation && (
                        <div className="bg-blue-50 p-3 rounded border border-blue-200">
                          <h4 className="font-semibold text-gray-700 mb-2">Related Evaluation</h4>
                          <div className="text-xs text-gray-600 space-y-1">
                            <p>Marks: {grievance.relatedEvaluation.totalMarks}/{grievance.relatedEvaluation.maxMarks}</p>
                            <p>Grade: {grievance.relatedEvaluation.grade}</p>
                          </div>
                        </div>
                      )}

                      {grievance.evaluationReview && (
                        <div className="bg-green-50 p-3 rounded border border-green-200">
                          <h4 className="font-semibold text-green-700 mb-2">Marks Update</h4>
                          <div className="text-xs text-gray-600 space-y-1">
                            <p>Before: {grievance.evaluationReview.previousTotalMarks} → After: {grievance.evaluationReview.updatedTotalMarks}</p>
                            {grievance.evaluationReview.remarks && (
                              <p>Remarks: {grievance.evaluationReview.remarks}</p>
                            )}
                          </div>
                        </div>
                      )}

                      {grievance.responses && grievance.responses.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-700 mb-2">Responses ({grievance.responses.length})</h4>
                          <p className="text-xs text-gray-600">Last response from {grievance.responses[grievance.responses.length - 1].respondedBy?.name || 'Staff'}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 bg-primary-50 hover:bg-primary-100 rounded-lg text-left transition-colors">
            <FiUsers className="text-primary-600 text-2xl mb-2" />
            <h3 className="font-medium text-gray-800">Manage Users</h3>
            <p className="text-sm text-gray-600">Add, edit, or remove users</p>
          </button>

          <button className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg text-left transition-colors">
            <FiBook className="text-purple-600 text-2xl mb-2" />
            <h3 className="font-medium text-gray-800">View All Exams</h3>
            <p className="text-sm text-gray-600">Monitor exam activities</p>
          </button>

          <button className="p-4 bg-orange-50 hover:bg-orange-100 rounded-lg text-left transition-colors">
            <FiMessageSquare className="text-orange-600 text-2xl mb-2" />
            <h3 className="font-medium text-gray-800">Manage Grievances</h3>
            <p className="text-sm text-gray-600">Handle pending grievances</p>
          </button>
        </div>
      </div>

      <div className="card">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Live Proctoring Alerts</h2>
        {liveAlerts.length === 0 ? (
          <p className="text-gray-600">No live alerts yet.</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {liveAlerts.map((alert, idx) => (
              <div key={`${alert.sessionId}-${idx}`} className="p-3 rounded-lg bg-red-50 border border-red-200">
                <p className="text-sm font-semibold text-red-700">
                  {alert.type} • Score: {alert.violationScore?.toFixed?.(2) ?? alert.violationScore}
                </p>
                <p className="text-xs text-red-600">
                  Session: {alert.sessionId} • Warnings: {alert.warningCount} • Risk: {alert.riskLevel}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Candidate Violation Scores</h2>
        {proctoringSessions.length === 0 ? (
          <p className="text-gray-600">No active proctoring sessions.</p>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {proctoringSessions.map((session) => (
              <div key={session._id} className="p-3 border border-gray-200 rounded-lg flex justify-between items-center">
                <div>
                  <p className="font-semibold text-gray-800">{session.student?.name || 'Student'} • {session.exam?.title || 'Exam'}</p>
                  <p className="text-xs text-gray-600">Warnings: {session.warningCount || 0} • Risk: {session.riskLevel || 'low'}</p>
                </div>
                <span className="text-sm font-bold text-primary-700">{Number(session.violationScore || 0).toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Proctoring Recordings */}
      <div className="card">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <h2 className="text-xl font-bold text-gray-800">Exam Proctoring Recordings</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleSelectAllRecordings}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              disabled={!recordings.length}
            >
              {selectedRecordingIds.length === recordings.length && recordings.length > 0 ? 'Unselect All' : 'Select All'}
            </button>
            <button
              onClick={deleteSelectedRecordings}
              disabled={!selectedRecordingIds.length || deletingRecordings}
              className="px-3 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {deletingRecordings ? 'Deleting...' : `Delete Selected (${selectedRecordingIds.length})`}
            </button>
          </div>
        </div>
        {recordings.length === 0 ? (
          <p className="text-gray-600">No recordings uploaded yet.</p>
        ) : (
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
            {recordings.map((recording) => (
              <div key={recording._id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={selectedRecordingIds.includes(recording._id)}
                      onChange={() => toggleRecordingSelection(recording._id)}
                    />
                    <div>
                    <h3 className="font-semibold text-gray-800">{recording.exam?.title || 'Exam'}</h3>
                    <p className="text-sm text-gray-600">
                      Student: {recording.student?.name || 'Unknown'} ({recording.student?.email || 'N/A'})
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Warnings: {recording.warningCount || 0} • Reason: {recording.terminationReason || 'normal-submit'}
                    </p>
                    </div>
                  </div>
                  <a
                    href={getSecureRecordingUrl(recording._id)}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
                  >
                    Open Recording
                  </a>
                </div>

                <video
                  controls
                  className="w-full rounded-lg bg-black max-h-72"
                  src={getSecureRecordingUrl(recording._id)}
                >
                  Your browser does not support video playback.
                </video>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminDashboard
