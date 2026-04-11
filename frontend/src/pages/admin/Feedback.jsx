import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import api from '../../utils/api'

const AdminFeedback = () => {
  const [feedbackItems, setFeedbackItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedExam, setSelectedExam] = useState('all')
  const [selectedDepartment, setSelectedDepartment] = useState('all')
  const [minOverallRating, setMinOverallRating] = useState('all')

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const response = await api.get('/evaluations/feedback/list')
        setFeedbackItems(response.data.feedback || [])
      } catch (error) {
        console.error('Error fetching exam feedback:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchFeedback()
  }, [])

  const examOptions = useMemo(() => {
    return Array.from(new Set(feedbackItems.map((item) => item.exam?.title).filter(Boolean))).sort()
  }, [feedbackItems])

  const departmentOptions = useMemo(() => {
    return Array.from(
      new Set(
        feedbackItems
          .map((item) => item.exam?.department || item.student?.department)
          .filter(Boolean),
      ),
    ).sort()
  }, [feedbackItems])

  const filteredFeedback = useMemo(() => {
    return feedbackItems.filter((item) => {
      const examTitle = item.exam?.title || ''
      const department = item.exam?.department || item.student?.department || ''
      const overallRating = item.feedback?.overallExperienceRating || 0

      const examMatch = selectedExam === 'all' || examTitle === selectedExam
      const departmentMatch = selectedDepartment === 'all' || department === selectedDepartment
      const ratingMatch = minOverallRating === 'all' || overallRating >= Number(minOverallRating)

      return examMatch && departmentMatch && ratingMatch
    })
  }, [feedbackItems, selectedExam, selectedDepartment, minOverallRating])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Student Feedback</h1>

      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Exam</label>
            <select
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
              className="input w-full"
            >
              <option value="all">All Exams</option>
              {examOptions.map((exam) => (
                <option key={exam} value={exam}>{exam}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="input w-full"
            >
              <option value="all">All Departments</option>
              {departmentOptions.map((department) => (
                <option key={department} value={department}>{department}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Min Overall Rating</label>
            <select
              value={minOverallRating}
              onChange={(e) => setMinOverallRating(e.target.value)}
              className="input w-full"
            >
              <option value="all">Any Rating</option>
              <option value="5">5 and above</option>
              <option value="4">4 and above</option>
              <option value="3">3 and above</option>
              <option value="2">2 and above</option>
              <option value="1">1 and above</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2 pr-4">Student</th>
              <th className="py-2 pr-4">Exam</th>
              <th className="py-2 pr-4">UI</th>
              <th className="py-2 pr-4">Clarity</th>
              <th className="py-2 pr-4">Overall</th>
              <th className="py-2 pr-4">Comments</th>
              <th className="py-2 pr-4">Submitted At</th>
            </tr>
          </thead>
          <tbody>
            {filteredFeedback.length === 0 ? (
              <tr>
                <td className="py-3" colSpan={7}>No feedback found for selected filters.</td>
              </tr>
            ) : (
              filteredFeedback.map((item) => (
                <tr key={item._id} className="border-b last:border-0 align-top">
                  <td className="py-2 pr-4">
                    <p className="font-medium text-gray-800">{item.student?.name || '-'}</p>
                    <p className="text-xs text-gray-500">{item.student?.studentId || item.student?.email || '-'}</p>
                  </td>
                  <td className="py-2 pr-4">
                    <p className="font-medium text-gray-800">{item.exam?.title || '-'}</p>
                    <p className="text-xs text-gray-500">{item.exam?.subject || '-'}</p>
                  </td>
                  <td className="py-2 pr-4">{item.feedback?.uiExperienceRating || '-'}/5</td>
                  <td className="py-2 pr-4">{item.feedback?.questionClarityRating || '-'}/5</td>
                  <td className="py-2 pr-4">{item.feedback?.overallExperienceRating || '-'}/5</td>
                  <td className="py-2 pr-4 max-w-xs">
                    <p className="text-gray-700 whitespace-pre-wrap break-words">{item.feedback?.comments || '-'}</p>
                  </td>
                  <td className="py-2 pr-4 whitespace-nowrap">
                    {item.feedback?.submittedAt ? format(new Date(item.feedback.submittedAt), 'PPp') : '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AdminFeedback
