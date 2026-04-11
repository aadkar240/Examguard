import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import api from '../../utils/api'
import { format } from 'date-fns'
import { FiClock, FiBook, FiEye } from 'react-icons/fi'
import { toast } from 'react-toastify'
import ExamDetailsModal from '../../components/ExamDetailsModal'
import CheckedExamReviewModal from '../../components/CheckedExamReviewModal'

const ExamsList = () => {
  const [exams, setExams] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedExam, setSelectedExam] = useState(null)
  const [selectedEvaluation, setSelectedEvaluation] = useState(null)
  const [reviewLoadingId, setReviewLoadingId] = useState(null)
  const [error, setError] = useState(null)
  const [showFeedbackForm, setShowFeedbackForm] = useState(false)
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false)
  const [feedbackExamId, setFeedbackExamId] = useState(null)
  const [feedbackForm, setFeedbackForm] = useState({
    uiExperienceRating: 5,
    questionClarityRating: 5,
    overallExperienceRating: 5,
    comments: '',
  })
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    fetchExams()
  }, [])

  useEffect(() => {
    const state = location.state || {}
    const storageRaw = sessionStorage.getItem('pendingExamFeedback')
    const storageState = storageRaw ? JSON.parse(storageRaw) : null

    const triggerFromState = state.openFeedback && state.examId
    const triggerFromStorage = storageState?.examId

    if (!triggerFromState && !triggerFromStorage) return

    const selectedExamId = triggerFromState ? state.examId : storageState.examId

    setFeedbackExamId(selectedExamId)
    setShowFeedbackForm(true)

    sessionStorage.removeItem('pendingExamFeedback')
    navigate('/student/exams', { replace: true, state: null })
  }, [location.state, navigate])

  const handleFeedbackInputChange = (field, value) => {
    setFeedbackForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmitFeedback = async () => {
    if (!feedbackExamId) {
      setShowFeedbackForm(false)
      return
    }

    try {
      setFeedbackSubmitting(true)
      await api.post(`/exams/${feedbackExamId}/feedback`, feedbackForm)
      toast.success('Thanks for sharing your feedback!')
      setShowFeedbackForm(false)
      setFeedbackExamId(null)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit feedback')
    } finally {
      setFeedbackSubmitting(false)
    }
  }

  const handleSkipFeedback = () => {
    setShowFeedbackForm(false)
    setFeedbackExamId(null)
  }

  const fetchExams = async () => {
    try {
      setError(null)
      const response = await api.get('/exams/my-exams')
      setExams(response.data.exams || [])
    } catch (error) {
      console.error('Error fetching exams:', error)
      setError(error.response?.data?.message || 'Failed to load exams. Please try again.')
      setExams([])
    } finally {
      setLoading(false)
    }
  }

  const handleStartExam = (examId) => {
    setSelectedExam(null)
    navigate(`/student/exam/${examId}`)
  }

  const handleViewCheckedPaper = async (evaluationId) => {
    if (!evaluationId) {
      toast.error('Checked paper is not available for this exam yet')
      return
    }

    try {
      setReviewLoadingId(evaluationId)
      const response = await api.get(`/evaluations/${evaluationId}`)
      setSelectedEvaluation(response.data.evaluation)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load checked paper')
    } finally {
      setReviewLoadingId(null)
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-800">📚 My Exams</h1>
        <div className="card text-center py-12">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <p className="text-red-600 font-medium mb-4">{error}</p>
          <button 
            onClick={fetchExams}
            className="btn btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-800">📚 My Exams</h1>

        <div className="grid grid-cols-1 gap-4">
          {exams.length === 0 ? (
            <div className="card text-center py-12">
              <FiBook className="mx-auto text-6xl text-gray-300 mb-4" />
              <p className="text-gray-500">No exams available</p>
            </div>
          ) : (
            exams.map((exam) => (
              <div key={exam._id} className="card hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-gray-800">{exam.title}</h2>
                    <p className="text-gray-600 mt-1">{exam.subject}</p>
                    
                    <div className="flex items-center space-x-4 mt-3 text-sm text-gray-600 flex-wrap">
                      <div className="flex items-center space-x-1">
                        <FiClock />
                        <span>{exam.startTime ? format(new Date(exam.startTime), 'PPp') : 'Not scheduled'}</span>
                      </div>
                      <span>•</span>
                      <span>{exam.duration} minutes</span>
                      <span>•</span>
                      <span>{exam.totalMarks} marks</span>
                      <span>•</span>
                      <span>{exam.questions?.length || 0} questions</span>
                    </div>

                    <div className="flex items-center space-x-2 mt-3">
                      <span className={`text-xs px-3 py-1 rounded-full ${
                        exam.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                        exam.status === 'ongoing' ? 'bg-green-100 text-green-700' :
                        exam.status === 'completed' ? 'bg-gray-100 text-gray-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {exam.status}
                      </span>
                      {exam.hasSubmitted && (
                        <span className="text-xs px-3 py-1 rounded-full bg-green-100 text-green-700">
                          ✓ Submitted
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-right ml-4">
                    {!exam.hasSubmitted && exam.status === 'ongoing' && (
                      <div className="space-y-2">
                        <button
                          onClick={() => setSelectedExam(exam)}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition text-sm font-medium"
                        >
                          <FiEye size={16} /> View Exam
                        </button>
                        <button
                          onClick={() => handleStartExam(exam._id)}
                          className="w-full btn btn-primary text-sm"
                        >
                          Take Exam
                        </button>
                      </div>
                    )}
                    {exam.hasSubmitted && ['evaluated', 're-evaluated'].includes(exam.evaluationStatus) && (
                      <div className="text-right">
                        <div className="text-3xl font-bold text-primary-600">
                          {exam.marksObtained}/{exam.totalMarks}
                        </div>
                        <button
                          onClick={() => handleViewCheckedPaper(exam.evaluationId)}
                          className="text-sm text-primary-600 hover:underline mt-2 inline-block"
                          disabled={reviewLoadingId === exam.evaluationId}
                        >
                          {reviewLoadingId === exam.evaluationId ? 'Loading...' : 'View Checked Paper'}
                        </button>
                      </div>
                    )}
                    {exam.hasSubmitted && !['evaluated', 're-evaluated'].includes(exam.evaluationStatus) && (
                      <div>
                        <div className="text-sm text-gray-600 font-medium">
                          Under Evaluation
                        </div>
                        {exam.submittedAt && (
                          <div className="text-xs text-gray-500 mt-2">
                            {format(new Date(exam.submittedAt), 'PPp')}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Exam Details Modal */}
      {selectedExam && (
        <ExamDetailsModal
          exam={selectedExam}
          onClose={() => setSelectedExam(null)}
          onStartExam={() => handleStartExam(selectedExam._id)}
        />
      )}

      {selectedEvaluation && (
        <CheckedExamReviewModal
          evaluation={selectedEvaluation}
          onClose={() => setSelectedEvaluation(null)}
        />
      )}

      {showFeedbackForm && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-xl p-6 space-y-5">
            <h2 className="text-2xl font-bold text-gray-800">Exam Feedback</h2>
            <p className="text-sm text-gray-600">
              Please share your experience with the exam UI and process.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">UI Experience (1-5)</label>
                <select
                  value={feedbackForm.uiExperienceRating}
                  onChange={(e) => handleFeedbackInputChange('uiExperienceRating', Number(e.target.value))}
                  className="input w-full"
                >
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <option key={rating} value={rating}>{rating}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Question Clarity (1-5)</label>
                <select
                  value={feedbackForm.questionClarityRating}
                  onChange={(e) => handleFeedbackInputChange('questionClarityRating', Number(e.target.value))}
                  className="input w-full"
                >
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <option key={rating} value={rating}>{rating}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Overall Experience (1-5)</label>
                <select
                  value={feedbackForm.overallExperienceRating}
                  onChange={(e) => handleFeedbackInputChange('overallExperienceRating', Number(e.target.value))}
                  className="input w-full"
                >
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <option key={rating} value={rating}>{rating}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Comments (optional)</label>
                <textarea
                  value={feedbackForm.comments}
                  onChange={(e) => handleFeedbackInputChange('comments', e.target.value)}
                  className="input w-full h-28 resize-none"
                  placeholder="Tell us about your exam experience..."
                  maxLength={1000}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleSkipFeedback}
                disabled={feedbackSubmitting}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Skip
              </button>
              <button
                type="button"
                onClick={handleSubmitFeedback}
                disabled={feedbackSubmitting}
                className="btn btn-primary disabled:opacity-50"
              >
                {feedbackSubmitting ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default ExamsList
