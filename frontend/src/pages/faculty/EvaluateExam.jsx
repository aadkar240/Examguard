import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../utils/api'
import SubjectiveAnswerEvaluation from '../../components/SubjectiveAnswerEvaluation'
import { format } from 'date-fns'
import { FiEye, FiEdit, FiCheckCircle, FiClock, FiUser, FiFileText, FiZap } from 'react-icons/fi'
import { toast } from 'react-toastify'

const EvaluateExam = () => {
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, pending, evaluated
  const [selectedSubmission, setSelectedSubmission] = useState(null)
  const [evaluating, setEvaluating] = useState(false)
  const [marks, setMarks] = useState({})
  const [feedback, setFeedback] = useState({})
  const [selectedIds, setSelectedIds] = useState([]) // For bulk operations
  const [bulkGrading, setBulkGrading] = useState(false)
  const [aiGrading, setAiGrading] = useState(false)
  const navigate = useNavigate()
  const { id: evaluationId } = useParams()

  const isPendingStatus = (status) => ['under-evaluation', 're-evaluation-requested'].includes(status)
  const isCompletedStatus = (status) => ['evaluated', 're-evaluated'].includes(status)

  useEffect(() => {
    fetchSubmissions()
  }, [])

  useEffect(() => {
    if (evaluationId) {
      fetchSubmissionDetails(evaluationId)
    }
  }, [evaluationId])

  const fetchSubmissions = async () => {
    try {
      setLoading(true)
      const response = await api.get('/evaluations/pending/list')
      setSubmissions(response.data.evaluations || [])
    } catch (error) {
      toast.error('Error fetching submissions')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSubmissionDetails = async (id) => {
    try {
      const response = await api.get(`/evaluations/${id}`)
      const evaluation = response.data.evaluation
      setSelectedSubmission(evaluation)
      
      // Initialize marks state
      const initialMarks = {}
      const initialFeedback = {}
      evaluation.answers.forEach(answer => {
        initialMarks[answer.questionNumber] = answer.marksObtained || 0
        initialFeedback[answer.questionNumber] = answer.feedback || ''
      })
      setMarks(initialMarks)
      setFeedback(initialFeedback)
    } catch (error) {
      toast.error('Error fetching submission details')
      console.error(error)
    }
  }

  const handleEvaluate = async () => {
    try {
      setEvaluating(true)
      
      const answersToUpdate = selectedSubmission.answers.map(answer => ({
        questionNumber: answer.questionNumber,
        marksObtained: parseFloat(marks[answer.questionNumber]) || 0,
        feedback: feedback[answer.questionNumber] || ''
      }))

      await api.put(`/evaluations/${selectedSubmission._id}/evaluate`, {
        answers: answersToUpdate
      })

      toast.success('Evaluation submitted successfully!')
      setSelectedSubmission(null)
      fetchSubmissions() // Refresh list
    } catch (error) {
      toast.error('Error submitting evaluation')
      console.error(error)
    } finally {
      setEvaluating(false)
    }
  }

  const handleAiGrade = async (evaluationId) => {
    try {
      setAiGrading(true)
      toast.info('AI is grading the submission...')
      
      const response = await api.post(`/evaluations/${evaluationId}/ai-grade`)
      
      if (response.data.success) {
        toast.success('AI grading completed successfully!')
        
        // If viewing this submission, refresh it
        if (selectedSubmission && selectedSubmission._id === evaluationId) {
          await fetchSubmissionDetails(evaluationId)
        }
        
        // Refresh submissions list
        fetchSubmissions()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error during AI grading')
      console.error(error)
    } finally {
      setAiGrading(false)
    }
  }

  const handleBulkAiGrade = async () => {
    if (selectedIds.length === 0) {
      toast.warning('Please select submissions to grade')
      return
    }

    const pendingSubmissions = selectedIds.filter(id => {
      const sub = submissions.find(s => s._id === id)
      return sub && sub.status === 'under-evaluation'
    })

    if (pendingSubmissions.length === 0) {
      toast.warning('No pending submissions selected')
      return
    }

    const confirmed = window.confirm(
      `AI will automatically grade ${pendingSubmissions.length} submission(s). Continue?`
    )
    if (!confirmed) return

    try {
      setBulkGrading(true)
      toast.info(`AI is grading ${pendingSubmissions.length} submission(s)...`)
      
      const response = await api.post('/evaluations/bulk/ai-grade', {
        evaluationIds: pendingSubmissions
      })

      if (response.data.success) {
        const { results } = response.data
        toast.success(
          `✅ ${results.successful} graded successfully, ❌ ${results.failed} failed`,
          { autoClose: 5000 }
        )
        
        // Clear selection and refresh
        setSelectedIds([])
        fetchSubmissions()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error during bulk AI grading')
      console.error(error)
    } finally {
      setBulkGrading(false)
    }
  }

  const toggleSelection = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredSubmissions.filter(s => s.status === 'under-evaluation').length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredSubmissions.filter(s => s.status === 'under-evaluation').map(s => s._id))
    }
  }

  const filteredSubmissions = submissions.filter(sub => {
    if (filter === 'pending') return isPendingStatus(sub.status)
    if (filter === 'evaluated') return isCompletedStatus(sub.status)
    return true
  })

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  // Evaluation Form Modal
  if (selectedSubmission) {
    const totalMarksAssigned = Object.values(marks).reduce((sum, m) => sum + (parseFloat(m) || 0), 0)
    const maxMarks = selectedSubmission.maxMarks

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSelectedSubmission(null)}
            className="text-gray-600 hover:text-gray-800 flex items-center gap-2"
          >
            ← Back to Submissions
          </button>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary-600">
              {totalMarksAssigned} / {maxMarks}
            </div>
            <div className="text-sm text-gray-600">Total Marks</div>
          </div>
        </div>

        {/* Student & Exam Info */}
        <div className="card bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-gray-600 mb-1">Student</div>
              <div className="font-semibold text-gray-800 flex items-center gap-2">
                <FiUser /> {selectedSubmission.student.name}
              </div>
              <div className="text-xs text-gray-500">{selectedSubmission.student.email}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Exam</div>
              <div className="font-semibold text-gray-800">{selectedSubmission.exam.title}</div>
              <div className="text-xs text-gray-500">{selectedSubmission.exam.subject}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Submitted At</div>
              <div className="font-semibold text-gray-800">
                {format(new Date(selectedSubmission.submittedAt), 'PPp')}
              </div>
              <div className="text-xs text-gray-500">Time: {selectedSubmission.timeTaken} mins</div>
            </div>
          </div>
        </div>

        {/* Questions & Answers */}
        <div className="space-y-4">
          {selectedSubmission.exam.questions.map((question, idx) => {
            const studentAnswer = selectedSubmission.answers[idx]
            const isAutoGraded = question.questionType === 'mcq' || question.questionType === 'true-false'
            
            return (
              <div key={idx} className="card border-l-4 border-primary-500">
                <div className="mb-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-800 text-lg">
                      Question {idx + 1}
                    </h3>
                    <span className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-700">
                      {question.questionType.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-gray-700 mb-3">{question.questionText}</p>
                  
                  {/* Show options for MCQ/True-False */}
                  {question.questionType === 'mcq' && question.options && (
                    <div className="mb-3 space-y-1">
                      <div className="text-sm font-medium text-gray-600 mb-2">Options:</div>
                      {question.options.map((opt, i) => (
                        <div 
                          key={i}
                          className={`text-sm p-2 rounded ${
                            opt === question.correctAnswer 
                              ? 'bg-green-50 text-green-700 font-medium' 
                              : 'text-gray-600'
                          }`}
                        >
                          {String.fromCharCode(65 + i)}. {opt}
                          {opt === question.correctAnswer && ' ✓ (Correct)'}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {question.questionType === 'true-false' && (
                    <div className="text-sm mb-3">
                      <span className="text-gray-600">Correct Answer: </span>
                      <span className="font-medium text-green-700">{question.correctAnswer}</span>
                    </div>
                  )}
                </div>

                {/* Student Answer */}
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <div className="text-sm font-medium text-gray-600 mb-2">Student's Answer:</div>
                  <div className={`${
                    isAutoGraded 
                      ? studentAnswer.isCorrect 
                        ? 'text-green-700 font-medium' 
                        : 'text-red-600 font-medium'
                      : 'text-gray-800'
                  }`}>
                    {studentAnswer.answer || <span className="italic text-gray-400">No answer provided</span>}
                    {isAutoGraded && (
                      <span className="ml-2">
                        {studentAnswer.isCorrect ? '✓' : '✗'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Marks Assignment */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Marks (Max: {question.marks})
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={question.marks}
                      step="0.5"
                      value={marks[studentAnswer.questionNumber] || 0}
                      onChange={(e) => {
                        const value = Math.min(parseFloat(e.target.value) || 0, question.marks)
                        setMarks(prev => ({
                          ...prev,
                          [studentAnswer.questionNumber]: value
                        }))
                      }}
                      disabled={isAutoGraded}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
                    />
                    {isAutoGraded && (
                      <p className="text-xs text-gray-500 mt-1">Auto-graded</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Feedback (Optional)
                    </label>
                    <textarea
                      value={feedback[studentAnswer.questionNumber] || ''}
                      onChange={(e) => setFeedback(prev => ({
                        ...prev,
                        [studentAnswer.questionNumber]: e.target.value
                      }))}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                      rows="2"
                      placeholder="Add feedback for this answer..."
                    />
                  </div>
                </div>

                {/* Subjective Answer Evaluation Component */}
                {question.questionType === 'subjective' && (
                  <div className="mt-4">
                    <SubjectiveAnswerEvaluation
                      answer={studentAnswer}
                      question={question}
                      evaluationId={selectedSubmission._id}
                      answerIndex={idx}
                      onEvaluationComplete={(index, marksValue) => {
                        setMarks(prev => ({
                          ...prev,
                          [studentAnswer.questionNumber]: marksValue
                        }))
                      }}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Submit Button */}
        <div className="flex justify-between items-center sticky bottom-0 bg-white py-4 border-t">
          <button
            onClick={() => handleAiGrade(selectedSubmission._id)}
            disabled={aiGrading}
            className="px-6 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg hover:from-purple-600 hover:to-indigo-700 disabled:opacity-50 flex items-center gap-2 transition"
            title="Run AI grading on all subjective questions"
          >
            {aiGrading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                AI Grading...
              </>
            ) : (
              <>
                <FiZap /> AI Auto-Grade
              </>
            )}
          </button>
          
          <div className="flex gap-4">
            <button
              onClick={() => setSelectedSubmission(null)}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleEvaluate}
              disabled={evaluating}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
            >
              {evaluating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <FiCheckCircle /> Submit Evaluation
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Submissions List View
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">📝 Evaluate Submissions</h1>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 font-medium transition border-b-2 ${
            filter === 'all'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-600 hover:text-gray-800'
          }`}
        >
          All ({submissions.length})
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 font-medium transition border-b-2 ${
            filter === 'pending'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-600 hover:text-gray-800'
          }`}
        >
          Pending ({submissions.filter(s => isPendingStatus(s.status)).length})
        </button>
        <button
          onClick={() => setFilter('evaluated')}
          className={`px-4 py-2 font-medium transition border-b-2 ${
            filter === 'evaluated'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-600 hover:text-gray-800'
          }`}
        >
          Evaluated ({submissions.filter(s => isCompletedStatus(s.status)).length})
        </button>
      </div>

      {/* Bulk Actions Bar */}
      {filteredSubmissions.filter(s => isPendingStatus(s.status)).length > 0 && (
        <div className="card bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedIds.length === filteredSubmissions.filter(s => isPendingStatus(s.status)).length && selectedIds.length > 0}
                  onChange={toggleSelectAll}
                  className="w-5 h-5 text-primary-600 rounded"
                />
                <span className="font-medium text-gray-700">
                  Select All Pending ({filteredSubmissions.filter(s => isPendingStatus(s.status)).length})
                </span>
              </label>
              {selectedIds.length > 0 && (
                <span className="text-sm text-gray-600">
                  {selectedIds.length} selected
                </span>
              )}
            </div>
            <button
              onClick={handleBulkAiGrade}
              disabled={bulkGrading || selectedIds.length === 0}
              className="px-6 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg hover:from-purple-600 hover:to-indigo-700 disabled:opacity-50 flex items-center gap-2 transition font-medium"
            >
              {bulkGrading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  AI Grading...
                </>
              ) : (
                <>
                  <FiZap /> AI Auto-Grade Selected
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Submissions Grid */}
      {filteredSubmissions.length === 0 ? (
        <div className="card text-center py-12">
          <FiFileText className="mx-auto text-6xl text-gray-300 mb-4" />
          <p className="text-gray-500">No submissions found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredSubmissions.map((submission) => (
            <div
              key={submission._id}
              className="card hover:shadow-lg transition"
            >
              <div className="flex items-center justify-between">
                {/* Checkbox for pending submissions */}
                {isPendingStatus(submission.status) && (
                  <div className="mr-4" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(submission._id)}
                      onChange={() => toggleSelection(submission._id)}
                      className="w-5 h-5 text-primary-600 rounded cursor-pointer"
                    />
                  </div>
                )}
                
                <div className="flex-1 cursor-pointer" onClick={() => fetchSubmissionDetails(submission._id)}>
                  <div className="flex items-center gap-3 mb-2">
                    <FiUser className="text-gray-400" />
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        {submission.student.name}
                      </h3>
                      <p className="text-sm text-gray-500">{submission.student.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <FiFileText className="text-gray-400" />
                      <span className="text-gray-700">{submission.exam.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FiClock className="text-gray-400" />
                      <span className="text-gray-600">
                        {format(new Date(submission.submittedAt), 'PPp')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="mb-2">
                    <span className={`text-xs px-3 py-1 rounded-full ${
                      submission.status === 'evaluated' || submission.status === 're-evaluated'
                        ? 'bg-green-100 text-green-700'
                        : submission.status === 'under-evaluation' || submission.status === 're-evaluation-requested'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {submission.status === 'evaluated' ? '✓ Evaluated' :
                       submission.status === 're-evaluated' ? '✓ Re-Evaluated' :
                       submission.status === 'under-evaluation' ? '⏳ Pending' :
                       submission.status === 're-evaluation-requested' ? '🔁 Re-check Requested' :
                       submission.status}
                    </span>
                  </div>
                  {isCompletedStatus(submission.status) && (
                    <div className="text-2xl font-bold text-primary-600">
                      {submission.totalMarks}/{submission.maxMarks}
                    </div>
                  )}
                  <button
                    onClick={() => fetchSubmissionDetails(submission._id)}
                    className="mt-2 px-4 py-2 bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100 flex items-center gap-2 transition"
                  >
                    <FiEye /> {isCompletedStatus(submission.status) ? 'View & Re-check' : 'View & Evaluate'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default EvaluateExam
