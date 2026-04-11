import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../utils/api'
import { format } from 'date-fns'
import { FiMessageSquare, FiCheckCircle, FiChevronDown, FiChevronUp, FiFileText } from 'react-icons/fi'
import { toast } from 'react-toastify'
import CheckedExamReviewModal from '../../components/CheckedExamReviewModal'

const ManageGrievances = () => {
  const [grievances, setGrievances] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, open, in-progress, resolved
  const [expandedId, setExpandedId] = useState(null)
  const [reviewMode, setReviewMode] = useState(null) // null or grievance id
  const [updatedMarks, setUpdatedMarks] = useState('')
  const [reviewRemarks, setReviewRemarks] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [responding, setResponding] = useState(false)
  const [responseText, setResponseText] = useState('')
  const [viewingEvaluation, setViewingEvaluation] = useState(null) // For modal
  const [loadingEvaluation, setLoadingEvaluation] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    fetchGrievances()
  }, [])

  const fetchGrievances = async () => {
    try {
      setLoading(true)
      const response = await api.get('/grievances')
      console.log('Fetched grievances:', response.data)
      setGrievances(response.data.grievances || [])
      if (response.data.grievances?.length === 0) {
        console.warn('No grievances returned from backend')
      }
    } catch (error) {
      console.error('Error fetching grievances:', error)
      console.error('Error details:', error.response?.data)
      toast.error('Error fetching grievances: ' + (error.response?.data?.message || error.message))
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (grievanceId, status) => {
    try {
      await api.patch(`/grievances/${grievanceId}/status`, { status })
      toast.success(`Status updated to ${status}`)
      fetchGrievances()
    } catch (error) {
      toast.error('Error updating status')
    }
  }

  const handleAddResponse = async (grievanceId) => {
    if (!responseText.trim()) {
      toast.error('Please enter a response')
      return
    }

    try {
      setResponding(true)
      await api.post(`/grievances/${grievanceId}/respond`, {
        message: responseText,
        isInternal: false
      })
      toast.success('Response added successfully')
      setResponseText('')
      fetchGrievances()
    } catch (error) {
      toast.error('Error adding response')
    } finally {
      setResponding(false)
    }
  }

  const handleReviewEvaluation = async (grievanceId) => {
    if (!updatedMarks || reviewMode !== grievanceId) return

    try {
      setSubmitting(true)
      await api.post(`/grievances/${grievanceId}/review-evaluation`, {
        updatedTotalMarks: parseFloat(updatedMarks),
        remarks: reviewRemarks
      })

      toast.success('Evaluation reviewed and marks updated!')
      setReviewMode(null)
      setUpdatedMarks('')
      setReviewRemarks('')
      fetchGrievances()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error reviewing evaluation')
    } finally {
      setSubmitting(false)
    }
  }

  const handleViewStudentAnswers = async (evaluationId) => {
    try {
      setLoadingEvaluation(true)
      const response = await api.get(`/evaluations/${evaluationId}`)
      setViewingEvaluation(response.data.evaluation)
    } catch (error) {
      console.error('Error fetching evaluation:', error)
      toast.error('Error loading student answers: ' + (error.response?.data?.message || error.message))
    } finally {
      setLoadingEvaluation(false)
    }
  }

  const handleRecheckInEvaluator = (evaluationId) => {
    navigate(`/faculty/evaluate/${evaluationId}`)
  }

  const filteredGrievances = grievances.filter((g) => {
    if (filter === 'open') return g.status === 'open'
    if (filter === 'in-progress') return g.status === 'in-progress'
    if (filter === 'resolved') return ['resolved', 'closed'].includes(g.status)
    return true
  })

  const getStatusColor = (status) => {
    const colors = {
      open: 'bg-blue-100 text-blue-700',
      'in-progress': 'bg-yellow-100 text-yellow-700',
      'pending-response': 'bg-orange-100 text-orange-700',
      resolved: 'bg-green-100 text-green-700',
      closed: 'bg-gray-100 text-gray-700',
      escalated: 'bg-red-100 text-red-700'
    }
    return colors[status] || 'bg-gray-100 text-gray-700'
  }

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-gray-100 text-gray-700',
      medium: 'bg-blue-100 text-blue-700',
      high: 'bg-orange-100 text-orange-700',
      urgent: 'bg-red-100 text-red-700'
    }
    return colors[priority] || 'bg-gray-100 text-gray-700'
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
        <h1 className="text-3xl font-bold text-gray-800">Manage Grievances</h1>
        <div className="flex gap-4 items-center">
          <div className="text-sm text-gray-600">
            Total: {grievances.length} | Open: {grievances.filter((g) => g.status === 'open').length}
          </div>
          <button
            onClick={fetchGrievances}
            disabled={loading}
            className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
          >
            {loading ? 'Refreshing...' : '🔄 Refresh'}
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b">
        {['all', 'open', 'in-progress', 'resolved'].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 font-medium transition border-b-2 capitalize ${
              filter === tab
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
      <div className="space-y-3">
        {filteredGrievances.length === 0 ? (
          <div className="card text-center py-12">
            <FiMessageSquare className="mx-auto text-6xl text-gray-300 mb-4" />
            <p className="text-gray-500">No grievances in this category</p>
            {grievances.length === 0 && (
              <p className="text-xs text-gray-400 mt-4">
                (or no grievances created yet - check that student department matches your department)
              </p>
            )}
          </div>
        ) : (
          filteredGrievances.map((grievance) => (
            <div
              key={grievance._id}
              className="card hover:shadow-lg transition-shadow overflow-hidden"
            >
              {/* Header Row */}
              <div className="flex items-start justify-between cursor-pointer p-4 hover:bg-gray-50"
                onClick={() =>
                  setExpandedId(expandedId === grievance._id ? null : grievance._id)
                }
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-mono text-gray-500">{grievance.ticketId}</span>
                    <span className={`text-xs px-2 py-1 rounded ${getStatusColor(grievance.status)}`}>
                      {grievance.status.replace('-', ' ')}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${getPriorityColor(grievance.priority)}`}>
                      {grievance.priority}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-gray-800">{grievance.subject}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {grievance.student?.name} ({grievance.student?.studentId})
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Problem: {grievance.problemType.replace('-', ' ')} | Dept: {grievance.department} | Sem: {grievance.semester}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs text-gray-500">
                    {format(new Date(grievance.createdAt), 'PP')}
                  </p>
                  {expandedId === grievance._id ? (
                    <FiChevronUp className="text-gray-400 mt-2" />
                  ) : (
                    <FiChevronDown className="text-gray-400 mt-2" />
                  )}
                </div>
              </div>

              {/* Expanded Details */}
              {expandedId === grievance._id && (
                <div className="border-t pt-4 px-4 pb-4 bg-white space-y-4">
                  {/* Description */}
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Description</h4>
                    <p className="text-gray-600">{grievance.description}</p>
                    {grievance.otherProblemText && (
                      <p className="text-gray-600 mt-2 italic">Other: {grievance.otherProblemText}</p>
                    )}
                  </div>

                  {/* Related Evaluation Info */}
                  {grievance.relatedEvaluation && (
                    <div className="bg-blue-50 p-3 rounded border border-blue-200">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-gray-700">Related Evaluation</h4>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleViewStudentAnswers(grievance.relatedEvaluation._id)}
                            disabled={loadingEvaluation}
                            className="px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
                          >
                            <FiFileText size={14} />
                            {loadingEvaluation ? 'Loading...' : 'View Student Answers'}
                          </button>
                          <button
                            onClick={() => handleRecheckInEvaluator(grievance.relatedEvaluation._id)}
                            className="px-3 py-1.5 bg-purple-600 text-white rounded text-xs font-medium hover:bg-purple-700"
                          >
                            Recheck in Evaluator
                          </button>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>
                          <strong>Current Marks:</strong> {grievance.relatedEvaluation.totalMarks}/
                          {grievance.relatedEvaluation.maxMarks}
                        </p>
                        <p>
                          <strong>Grade:</strong> {grievance.relatedEvaluation.grade}
                        </p>
                        <p>
                          <strong>Status:</strong> {grievance.relatedEvaluation.status}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Evaluation Review Section */}
                  {grievance.relatedEvaluation && reviewMode !== grievance._id && (
                    <button
                      onClick={() => {
                        setReviewMode(grievance._id)
                        setUpdatedMarks(grievance.relatedEvaluation.totalMarks.toString())
                        setReviewRemarks('')
                      }}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"
                    >
                      Review & Update Marks
                    </button>
                  )}

                  {/* Review Form */}
                  {reviewMode === grievance._id && (
                    <div className="bg-purple-50 p-4 rounded border border-purple-200 space-y-3">
                      <h4 className="font-semibold text-gray-700">Update Marks</h4>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Updated Total Marks (Max: {grievance.relatedEvaluation.maxMarks})
                        </label>
                        <input
                          type="number"
                          min="0"
                          max={grievance.relatedEvaluation.maxMarks}
                          step="0.5"
                          value={updatedMarks}
                          onChange={(e) => setUpdatedMarks(e.target.value)}
                          className="w-full px-3 py-2 border rounded text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Remarks (Optional)
                        </label>
                        <textarea
                          value={reviewRemarks}
                          onChange={(e) => setReviewRemarks(e.target.value)}
                          className="w-full px-3 py-2 border rounded text-sm"
                          rows="2"
                          placeholder="E.g., Rechecked answer to question 3..."
                        />
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleReviewEvaluation(grievance._id)}
                          disabled={submitting || !updatedMarks}
                          className="flex-1 px-3 py-2 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                        >
                          {submitting ? 'Updating...' : 'Confirm & Update'}
                        </button>
                        <button
                          onClick={() => setReviewMode(null)}
                          className="px-3 py-2 bg-gray-300 text-gray-700 rounded text-sm font-medium hover:bg-gray-400"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Evaluation Review Result */}
                  {grievance.evaluationReview && (
                    <div className="bg-green-50 p-3 rounded border border-green-200">
                      <h4 className="font-semibold text-green-700 mb-2">Marks Update Summary</h4>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>
                          <strong>Before:</strong> {grievance.evaluationReview.previousTotalMarks} (
                          {grievance.evaluationReview.previousGrade})
                        </p>
                        <p>
                          <strong>After:</strong> {grievance.evaluationReview.updatedTotalMarks} (
                          {grievance.evaluationReview.updatedGrade})
                        </p>
                        {grievance.evaluationReview.remarks && (
                          <p>
                            <strong>Notes:</strong> {grievance.evaluationReview.remarks}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Responses */}
                  {grievance.responses && grievance.responses.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-2">Responses</h4>
                      <div className="space-y-2">
                        {grievance.responses.map((response, idx) => (
                          <div key={idx} className="bg-gray-50 p-3 rounded border">
                            <div className="flex justify-between items-start mb-1">
                              <p className="font-medium text-sm text-gray-700">
                                {response.respondedBy?.name || 'Staff'}
                              </p>
                              <p className="text-xs text-gray-500">
                                {format(new Date(response.timestamp), 'PPp')}
                              </p>
                            </div>
                            <p className="text-sm text-gray-600">{response.message}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Response Input */}
                  {!['resolved', 'closed'].includes(grievance.status) && (
                    <div className="border-t pt-4">
                      <h4 className="font-semibold text-gray-700 mb-2">Add Response</h4>
                      <textarea
                        value={responseText}
                        onChange={(e) => setResponseText(e.target.value)}
                        className="w-full px-3 py-2 border rounded mb-2"
                        rows="3"
                        placeholder="Type your response..."
                      />
                      <button
                        onClick={() => handleAddResponse(grievance._id)}
                        disabled={responding || !responseText.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
                      >
                        {responding ? 'Sending...' : 'Send Response'}
                      </button>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {!['resolved', 'closed'].includes(grievance.status) && (
                    <div className="border-t pt-4 flex gap-2">
                      <button
                        onClick={() => handleUpdateStatus(grievance._id, 'in-progress')}
                        className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 text-sm font-medium"
                      >
                        Mark In Progress
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(grievance._id, 'resolved')}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-medium flex items-center justify-center gap-1"
                      >
                        <FiCheckCircle size={16} />
                        Resolve
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Evaluation Review Modal */}
      {viewingEvaluation && (
        <CheckedExamReviewModal
          evaluation={viewingEvaluation}
          onClose={() => setViewingEvaluation(null)}
        />
      )}
    </div>
  )
}

export default ManageGrievances
