import { useState } from 'react'
import { FiCheckCircle, FiAlertCircle, FiBarChart2, FiRefreshCw } from 'react-icons/fi'
import { toast } from 'react-toastify'
import api from '../utils/api'

const SubjectiveAnswerEvaluation = ({
  answer,
  question,
  evaluationId,
  answerIndex,
  onEvaluationComplete
}) => {
  const [evaluating, setEvaluating] = useState(false)
  const [evaluation, setEvaluation] = useState(answer?.evaluation || null)
  const [manualMarks, setManualMarks] = useState(answer?.manualMarksAssigned || '')
  const [manualFeedback, setManualFeedback] = useState(answer?.manualFeedback || '')
  const [showManualReview, setShowManualReview] = useState(false)
  const [submittingReview, setSubmittingReview] = useState(false)

  const runAiEvaluation = async () => {
    try {
      setEvaluating(true)
      const response = await api.post(`/evaluations/${evaluationId}/evaluate-subjective`, {
        answerIndex,
        studentAnswer: answer.answer,
        actionType: 'pending' // Don't auto-accept
      })

      setEvaluation(response.data.evaluation)
      toast.success('AI Evaluation completed!')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error running AI evaluation')
      console.error(error)
    } finally {
      setEvaluating(false)
    }
  }

  const acceptAiMarks = async () => {
    try {
      setEvaluating(true)
      const response = await api.post(`/evaluations/${evaluationId}/evaluate-subjective`, {
        answerIndex,
        studentAnswer: answer.answer,
        actionType: 'accept' // Auto-accept the AI marks
      })

      setEvaluation(response.data.evaluation)
      toast.success('AI marks accepted!')
      if (onEvaluationComplete) {
        onEvaluationComplete(answerIndex, response.data.evaluation.aiAutoMarks)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error accepting AI marks')
      console.error(error)
    } finally {
      setEvaluating(false)
    }
  }

  const submitManualReview = async () => {
    if (!manualMarks && manualMarks !== 0) {
      toast.error('Please enter marks')
      return
    }

    if (manualMarks < 0 || manualMarks > question.marks) {
      toast.error(`Marks must be between 0 and ${question.marks}`)
      return
    }

    try {
      setSubmittingReview(true)
      const response = await api.post(
        `/evaluations/${evaluationId}/subjective-manual-review`,
        {
          answerIndex,
          manualMarks: parseFloat(manualMarks),
          feedback: manualFeedback
        }
      )

      toast.success('Manual review submitted!')
      setShowManualReview(false)
      if (onEvaluationComplete) {
        onEvaluationComplete(answerIndex, parseFloat(manualMarks))
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error submitting manual review')
      console.error(error)
    } finally {
      setSubmittingReview(false)
    }
  }

  const ConfidenceBadge = ({ score }) => {
    if (score >= 80) {
      return (
        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
          High Confidence ({score}%)
        </span>
      )
    } else if (score >= 60) {
      return (
        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
          Medium Confidence ({score}%)
        </span>
      )
    } else {
      return (
        <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
          Low Confidence ({score}%)
        </span>
      )
    }
  }

  const KeywordMatchVisual = ({ matchScore }) => {
    const filledBars = Math.round((matchScore / 100) * 10)
    return (
      <div className="flex items-center gap-2">
        <div className="flex gap-1">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className={`h-2 w-3 rounded-sm ${
                i < filledBars ? 'bg-primary-600' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
        <span className="text-sm font-semibold text-gray-700">{matchScore}%</span>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-primary-50 to-blue-50 rounded-lg p-4 border border-primary-200">
      {!evaluation ? (
        // Initial state - no evaluation yet
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FiAlertCircle className="text-blue-600 text-lg" />
            <span className="text-sm text-gray-700">
              This is a subjective question. Use AI to evaluate the answer.
            </span>
          </div>
          <button
            onClick={runAiEvaluation}
            disabled={evaluating}
            className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 disabled:opacity-50 transition flex items-center gap-2"
          >
            {evaluating ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
                Analyzing...
              </>
            ) : (
              <>
                <FiBarChart2 /> Analyze with AI
              </>
            )}
          </button>
        </div>
      ) : (
        // Evaluation results
        <div className="space-y-4">
          {/* AI Evaluation Header */}
          <div className="flex items-center justify-between pb-3 border-b border-primary-200">
            <div className="flex items-center gap-2">
              <FiCheckCircle className="text-green-600 text-lg" />
              <span className="font-semibold text-gray-800">AI Evaluation Results</span>
            </div>
            <ConfidenceBadge score={evaluation.aiConfidenceScore} />
          </div>

          {/* Keyword Match Score */}
          <div className="bg-white rounded-lg p-3">
            <div className="text-sm font-medium text-gray-700 mb-2">Keyword Match:</div>
            <KeywordMatchVisual matchScore={evaluation.keywordMatchScore} />
          </div>

          {/* Keywords Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="bg-white rounded-lg p-3">
              <div className="font-medium text-gray-700 mb-2">Student's Keywords:</div>
              <div className="flex flex-wrap gap-2">
                {evaluation.studentAnswerKeywords?.map((kw, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-lg p-3">
              <div className="font-medium text-gray-700 mb-2">AI Keywords:</div>
              <div className="flex flex-wrap gap-2">
                {evaluation.aiAnswerKeywords?.map((kw, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* AI Auto Marks */}
          <div className="bg-white rounded-lg p-3 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-700">Auto-Assigned Marks:</div>
              <div className="text-xs text-gray-500 mt-1">
                Based on keyword match: {evaluation.keywordMatchScore}%
              </div>
            </div>
            <div className="text-2xl font-bold text-primary-600">
              {evaluation.aiAutoMarks} / {question.marks}
            </div>
          </div>

          {/* Recommendation */}
          <div
            className={`p-3 rounded-lg text-sm ${
              evaluation.requiresManualReview
                ? 'bg-yellow-50 border border-yellow-200 text-yellow-800'
                : 'bg-green-50 border border-green-200 text-green-800'
            }`}
          >
            <div className="font-medium mb-1">
              {evaluation.recommendation}
            </div>
            {evaluation.requiresManualReview && (
              <div className="text-xs text-yellow-700 mt-1">
                This answer requires your manual review before final approval.
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            {!evaluation.requiresManualReview && (
              <button
                onClick={acceptAiMarks}
                disabled={evaluating}
                className="flex-1 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
              >
                <FiCheckCircle /> Accept AI Marks
              </button>
            )}
            <button
              onClick={() => setShowManualReview(!showManualReview)}
              className="flex-1 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
            >
              <FiRefreshCw /> {showManualReview ? 'Hide' : 'Manual Review'}
            </button>
          </div>

          {/* Manual Review Form */}
          {showManualReview && (
            <div className="bg-white rounded-lg p-4 space-y-3 border-t-2 border-blue-200">
              <h4 className="font-semibold text-gray-800">Manual Review</h4>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assign Marks (Max: {question.marks})
                </label>
                <input
                  type="number"
                  min="0"
                  max={question.marks}
                  step="0.5"
                  value={manualMarks}
                  onChange={(e) => setManualMarks(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                  placeholder="Enter marks"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Feedback
                </label>
                <textarea
                  value={manualFeedback}
                  onChange={(e) => setManualFeedback(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                  rows="3"
                  placeholder="Provide feedback for the student..."
                />
              </div>
              <button
                onClick={submitManualReview}
                disabled={submittingReview}
                className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition"
              >
                {submittingReview ? 'Submitting...' : 'Submit Manual Review'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default SubjectiveAnswerEvaluation
