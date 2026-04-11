import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../utils/api'
import { FiBook, FiClipboard, FiMessageSquare, FiClock, FiAward } from 'react-icons/fi'
import { Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { toast } from 'react-toastify'

const isCompletedEvaluation = (status) => ['evaluated', 're-evaluated'].includes(status)
const isPendingEvaluation = (status) => ['submitted', 'under-evaluation', 're-evaluation-requested'].includes(status)

const StudentDashboard = () => {
  const [stats, setStats] = useState(null)
  const [announcements, setAnnouncements] = useState([])
  const [latestTimetable, setLatestTimetable] = useState(null)
  const [upcomingExams, setUpcomingExams] = useState([])
  const [recentEvaluations, setRecentEvaluations] = useState([])
  const [evaluationResults, setEvaluationResults] = useState([])
  const [activeGrievances, setActiveGrievances] = useState([])
  const [resultData, setResultData] = useState(null)
  const [loading, setLoading] = useState(true)

  const completedEvaluations = evaluationResults.filter((evaluation) => isCompletedEvaluation(evaluation.status))
  const pendingEvaluations = evaluationResults.filter((evaluation) => isPendingEvaluation(evaluation.status))

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [dashboardResponse, evaluationsResponse, resultHistoryResponse, resultResponse, announcementsResponse, timetableResponse] = await Promise.all([
        api.get('/dashboard/student'),
        api.get('/evaluations/my-evaluations'),
        api.get('/results/my-results').catch(() => ({ data: { results: [] } })),
        api.get('/results/latest').catch(() => ({ data: { success: false } })),
        api.get('/announcements').catch(() => ({ data: { announcements: [] } })),
        api.get('/timetables/latest').catch(() => ({ data: { timetable: null } }))
      ])

      const { stats, upcomingExams, recentEvaluations, activeGrievances } = dashboardResponse.data.data
      
      setStats(stats)
      setUpcomingExams(upcomingExams)
      setRecentEvaluations(recentEvaluations)
      setEvaluationResults(evaluationsResponse.data.evaluations || [])
      setActiveGrievances(activeGrievances)
      setAnnouncements((announcementsResponse?.data?.announcements || []).slice(0, 5))
      setLatestTimetable(timetableResponse?.data?.timetable || null)

      const latestGeneratedResult = resultHistoryResponse?.data?.results?.[0] || null

      if (latestGeneratedResult) {
        setResultData(latestGeneratedResult)
      } else if (resultResponse.data?.success && resultResponse.data?.data) {
        setResultData(resultResponse.data.data)
      } else {
        setResultData(null)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const recentResultExams = Array.isArray(resultData?.exams) ? resultData.exams.slice(0, 5) : []

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const downloadTimetablePdf = () => {
    if (!latestTimetable) return

    const pdf = new jsPDF()
    const pageWidth = pdf.internal.pageSize.getWidth()

    pdf.setFontSize(18)
    pdf.text(latestTimetable.title || 'Exam Timetable', pageWidth / 2, 16, { align: 'center' })

    pdf.setFontSize(10)
    pdf.text(`Academic Year: ${latestTimetable.academicYear || 'N/A'}`, 14, 26)
    pdf.text(`Semester: ${latestTimetable.semesterLabel || 'N/A'}`, 14, 32)
    pdf.text(`Published: ${format(new Date(latestTimetable.createdAt), 'PPp')}`, 14, 38)

    const rows = (latestTimetable.entries || []).map((entry, index) => ([
      index + 1,
      entry.examTitle,
      entry.examType,
      entry.subject,
      format(new Date(entry.examDate), 'PPP'),
      entry.startTime,
      `${entry.durationMinutes} min`
    ]))

    pdf.autoTable({
      startY: 45,
      head: [['#', 'Exam', 'Type', 'Subject', 'Date', 'Start', 'Duration']],
      body: rows,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246], textColor: 255 },
      styles: { fontSize: 9 }
    })

    pdf.save(`Exam_Timetable_${format(new Date(), 'dd-MM-yyyy')}.pdf`)
  }

  const deleteTimetable = async () => {
    if (!latestTimetable) return
    
    if (!window.confirm('Are you sure you want to delete this timetable?')) return
    
    try {
      await api.delete(`/timetables/${latestTimetable._id}`)
      toast.success('Timetable deleted successfully')
      setLatestTimetable(null)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete timetable')
    }
  }

  return (
    <div className="space-y-6">
      <div className="card border-l-4 border-blue-500 bg-blue-50">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold text-blue-900">Announcements</h2>
          <span className="text-sm text-blue-700">Latest Updates</span>
        </div>
        {announcements.length === 0 ? (
          <p className="text-blue-800">No announcements yet.</p>
        ) : (
          <div className="space-y-3">
            {announcements.map((item) => (
              <div key={item._id} className="bg-white rounded-lg p-3 border border-blue-100">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-gray-800">{item.title}</h3>
                  <span className="text-xs text-gray-500">
                    {format(new Date(item.createdAt), 'PPp')}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mt-1">{item.message}</p>
                <p className="text-xs text-blue-700 mt-2">
                  Posted by {item.createdBy?.name || item.createdByRole}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <h1 className="text-3xl font-bold text-gray-800">Student Dashboard</h1>

      <div className="card border-l-4 border-emerald-500 bg-emerald-50">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold text-emerald-900">Exam Timetable</h2>
          {latestTimetable && (
            <div className="flex gap-2">
              <button onClick={downloadTimetablePdf} className="btn btn-primary text-sm">
                Download Timetable PDF
              </button>
              <button onClick={deleteTimetable} className="btn bg-red-600 hover:bg-red-700 text-white text-sm inline-flex items-center gap-2">
                <Trash2 size={16} />
                Delete
              </button>
            </div>
          )}
        </div>

        {!latestTimetable ? (
          <p className="text-emerald-800">No timetable published yet.</p>
        ) : (
          <>
            <div className="text-sm text-emerald-900 mb-3">
              <span className="font-semibold">{latestTimetable.title}</span>
              <span className="mx-2">•</span>
              <span>{latestTimetable.academicYear || 'N/A'}</span>
              <span className="mx-2">•</span>
              <span>{latestTimetable.semesterLabel || 'N/A'}</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full bg-white rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-emerald-100 text-emerald-900 text-sm">
                    <th className="px-3 py-2 text-left">Exam</th>
                    <th className="px-3 py-2 text-left">Type</th>
                    <th className="px-3 py-2 text-left">Subject</th>
                    <th className="px-3 py-2 text-left">Date</th>
                    <th className="px-3 py-2 text-left">Time</th>
                    <th className="px-3 py-2 text-left">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {(latestTimetable.entries || []).map((entry, index) => (
                    <tr key={`${entry.examTitle}-${index}`} className="border-b border-emerald-100 text-sm">
                      <td className="px-3 py-2 text-gray-800">{entry.examTitle}</td>
                      <td className="px-3 py-2 text-gray-700 capitalize">{entry.examType}</td>
                      <td className="px-3 py-2 text-gray-700">{entry.subject}</td>
                      <td className="px-3 py-2 text-gray-700">{format(new Date(entry.examDate), 'PPP')}</td>
                      <td className="px-3 py-2 text-gray-700">{entry.startTime}</td>
                      <td className="px-3 py-2 text-gray-700">{entry.durationMinutes} min</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
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

        <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">Completed</p>
              <h3 className="text-3xl font-bold mt-2">{stats?.completedExams || 0}</h3>
            </div>
            <FiClipboard className="text-5xl text-green-200 opacity-50" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100">Average Score</p>
              <h3 className="text-3xl font-bold mt-2">{stats?.averageScore?.toFixed(1) || 0}%</h3>
            </div>
            <FiClipboard className="text-5xl text-purple-200 opacity-50" />
          </div>
        </div>

        <div className="card bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100">Grievances</p>
              <h3 className="text-3xl font-bold mt-2">{stats?.totalGrievances || 0}</h3>
            </div>
            <FiMessageSquare className="text-5xl text-orange-200 opacity-50" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Exams */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Upcoming Exams</h2>
            <Link to="/student/exams" className="text-primary-600 hover:text-primary-700 text-sm">
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {upcomingExams.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No upcoming exams</p>
            ) : (
              upcomingExams.slice(0, 5).map((exam) => (
                <div key={exam._id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <FiClock className="text-primary-600 mt-1" />
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-800">{exam.title}</h3>
                    <p className="text-sm text-gray-600">{exam.subject}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {format(new Date(exam.startTime), 'PPp')} ({exam.duration} min)
                    </p>
                    {!exam.isPublished && exam.status === 'scheduled' && exam.scheduledPublishAt && (
                      <p className="text-xs text-blue-600 mt-1">
                        Scheduled to publish: {format(new Date(exam.scheduledPublishAt), 'PPp')}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Evaluations */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Recent Evaluations</h2>
          </div>
          <div className="space-y-3">
            {evaluationResults.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No evaluations yet</p>
            ) : (
              evaluationResults.slice(0, 5).map((evaluation) => (
                <div key={evaluation._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-800">{evaluation.exam?.title}</h3>
                    <p className="text-sm text-gray-600">{evaluation.exam?.subject}</p>
                    <span className={`text-xs px-2 py-1 rounded mt-1 inline-block ${
                      isCompletedEvaluation(evaluation.status) ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {evaluation.status}
                    </span>
                  </div>
                  {isCompletedEvaluation(evaluation.status) && (
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary-600">
                        {evaluation.totalMarks}/{evaluation.maxMarks}
                      </div>
                      <div className="text-sm text-gray-600">{evaluation.percentage.toFixed(1)}%</div>
                      <div className="text-sm font-medium text-gray-700">{evaluation.grade}</div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Evaluations */}
      <div id="evaluations" className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">Evaluations</h2>
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-600">
              Pending: {pendingEvaluations.length} | Completed: {completedEvaluations.length}
            </span>
            <Link to="/student/evaluations" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
              Open Evaluation Dashboard
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-yellow-800 mb-3">Pending Evaluations</h3>
            {pendingEvaluations.length === 0 ? (
              <p className="text-sm text-yellow-700">No pending evaluations.</p>
            ) : (
              <div className="space-y-2">
                {pendingEvaluations.slice(0, 5).map((evaluation) => (
                  <div key={evaluation._id} className="bg-white rounded-md p-3 border border-yellow-100">
                    <p className="text-sm font-medium text-gray-800">{evaluation.exam?.title}</p>
                    <p className="text-xs text-gray-600">{evaluation.exam?.subject}</p>
                    <p className="text-xs text-yellow-700 mt-1 capitalize">{evaluation.status}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-green-800 mb-3">Completed Evaluations</h3>
            {completedEvaluations.length === 0 ? (
              <p className="text-sm text-green-700">No completed evaluations yet.</p>
            ) : (
              <div className="space-y-2">
                {completedEvaluations.slice(0, 5).map((evaluation) => (
                  <div key={evaluation._id} className="bg-white rounded-md p-3 border border-green-100 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{evaluation.exam?.title}</p>
                      <p className="text-xs text-gray-600">{evaluation.exam?.subject}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-green-700">{evaluation.totalMarks}/{evaluation.maxMarks}</p>
                      <p className="text-xs text-gray-600">{evaluation.grade}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Active Grievances */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">Active Grievances</h2>
          <Link to="/student/grievances" className="text-primary-600 hover:text-primary-700 text-sm">
            View All
          </Link>
        </div>
        <div className="space-y-3">
          {activeGrievances.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No active grievances</p>
          ) : (
            activeGrievances.map((grievance) => (
              <div key={grievance._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono text-gray-500">{grievance.ticketId}</span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      grievance.status === 'open' ? 'bg-blue-100 text-blue-700' :
                      grievance.status === 'in-progress' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {grievance.status}
                    </span>
                  </div>
                  <h3 className="font-medium text-gray-800 mt-1">{grievance.subject}</h3>
                  <p className="text-sm text-gray-600 capitalize">{grievance.category.replace('-', ' ')}</p>
                </div>
                <Link
                  to={`/student/grievances?grievanceId=${grievance._id}`}
                  className="btn btn-primary text-sm"
                >
                  View
                </Link>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Results Preview */}
      {resultData && (
        <div id="results" className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center space-x-2">
              <FiAward className="text-primary-600" />
              <span>Academic Results</span>
            </h2>
            <Link to="/student/results" className="text-primary-600 hover:text-primary-700 text-sm">
              View Full Results
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
              <p className="text-sm text-gray-600">CGPA</p>
              <h3 className="text-3xl font-bold text-blue-600 mt-2">{resultData.cgpa.toFixed(2)}</h3>
              <p className="text-xs text-gray-500 mt-1">on 4.0 scale</p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
              <p className="text-sm text-gray-600">Overall %</p>
              <h3 className="text-3xl font-bold text-green-600 mt-2">{resultData.overallPercentage.toFixed(1)}%</h3>
              <p className="text-xs text-gray-500 mt-1">across exams</p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
              <p className="text-sm text-gray-600">Total Credits</p>
              <h3 className="text-3xl font-bold text-purple-600 mt-2">{resultData.totalCredits}</h3>
              <p className="text-xs text-gray-500 mt-1">earned</p>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4">
              <p className="text-sm text-gray-600">Exams Evaluated</p>
              <h3 className="text-3xl font-bold text-orange-600 mt-2">{recentResultExams.length}</h3>
              <p className="text-xs text-gray-500 mt-1">total</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100 border-b">
                  <th className="px-4 py-2 text-left text-gray-800 font-semibold">Exam</th>
                  <th className="px-4 py-2 text-left text-gray-800 font-semibold">Marks</th>
                  <th className="px-4 py-2 text-center text-gray-800 font-semibold">Grade</th>
                  <th className="px-4 py-2 text-center text-gray-800 font-semibold">Credits</th>
                </tr>
              </thead>
              <tbody>
                {recentResultExams.map((exam, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2 text-gray-800">{exam.title || 'Exam'}</td>
                    <td className="px-4 py-2 text-gray-800">{exam.totalMarks}/{exam.maxMarks}</td>
                    <td className="px-4 py-2 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold text-white ${
                        exam.grade === 'A' ? 'bg-green-500' :
                        exam.grade === 'B+' ? 'bg-blue-500' :
                        exam.grade === 'B' ? 'bg-cyan-500' :
                        exam.grade === 'C' ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}>
                        {exam.grade}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-center font-semibold text-gray-800">{exam.creditPoints}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Link
            to="/student/results"
            className="mt-4 btn btn-primary w-full text-center"
          >
            View Complete Results & Download PDF
          </Link>
        </div>
      )}
    </div>
  )
}

export default StudentDashboard

