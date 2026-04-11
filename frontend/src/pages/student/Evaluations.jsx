import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { FiAlertCircle, FiCheckCircle, FiClock, FiDownload, FiRefreshCw } from 'react-icons/fi'
import api from '../../utils/api'
import jsPDF from 'jspdf'

const statusClasses = {
  submitted: 'bg-yellow-100 text-yellow-700',
  'under-evaluation': 'bg-orange-100 text-orange-700',
  're-evaluation-requested': 'bg-purple-100 text-purple-700',
  evaluated: 'bg-green-100 text-green-700',
  're-evaluated': 'bg-blue-100 text-blue-700'
}

const Evaluations = () => {
  const [evaluations, setEvaluations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  const statusFilterOptions = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 're-evaluation-requested', label: 'Re-evaluation Requested' },
    { value: 'evaluated', label: 'Evaluated' },
    { value: 're-evaluated', label: 'Re-evaluated' }
  ]

  const fetchEvaluations = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get('/evaluations/my-evaluations')
      setEvaluations(response.data?.evaluations || [])
    } catch (err) {
      console.error('Error fetching evaluations:', err)
      setError(err.response?.data?.message || 'Failed to fetch evaluations')
      setEvaluations([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEvaluations()
  }, [])

  const filteredEvaluations = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    return evaluations.filter((item) => {
      const isPendingStatus = ['submitted', 'under-evaluation'].includes(item.status)
      const statusMatch = statusFilter === 'all'
        ? true
        : statusFilter === 'pending'
          ? isPendingStatus
          : item.status === statusFilter
      const title = item.exam?.title?.toLowerCase() || ''
      const subject = item.exam?.subject?.toLowerCase() || ''
      const searchMatch = !normalizedSearch || title.includes(normalizedSearch) || subject.includes(normalizedSearch)
      return statusMatch && searchMatch
    })
  }, [evaluations, statusFilter, searchTerm])

  const statusCounts = useMemo(() => ({
    all: evaluations.length,
    pending: evaluations.filter((item) => ['submitted', 'under-evaluation'].includes(item.status)).length,
    're-evaluation-requested': evaluations.filter((item) => item.status === 're-evaluation-requested').length,
    evaluated: evaluations.filter((item) => item.status === 'evaluated').length,
    're-evaluated': evaluations.filter((item) => item.status === 're-evaluated').length
  }), [evaluations])

  const sections = useMemo(() => ({
    evaluated: filteredEvaluations.filter((item) => item.status === 'evaluated'),
    reEvaluated: filteredEvaluations.filter((item) => item.status === 're-evaluated'),
    reEvaluationRequested: filteredEvaluations.filter((item) => item.status === 're-evaluation-requested'),
    pending: filteredEvaluations.filter((item) => ['submitted', 'under-evaluation'].includes(item.status))
  }), [filteredEvaluations])

  const downloadEvaluationResult = (evaluation) => {
    try {
      const pdf = new jsPDF()
      const pageWidth = pdf.internal.pageSize.getWidth()
      let y = 20

      pdf.setFontSize(18)
      pdf.text('Exam Evaluation Result', pageWidth / 2, y, { align: 'center' })
      y += 12

      pdf.setFontSize(11)
      pdf.setTextColor(60, 60, 60)

      const lines = [
        ['Exam Title', evaluation.exam?.title || 'N/A'],
        ['Subject', evaluation.exam?.subject || 'N/A'],
        ['Status', evaluation.status || 'N/A'],
        ['Marks', `${evaluation.totalMarks || 0}/${evaluation.maxMarks || 0}`],
        ['Percentage', `${evaluation.percentage?.toFixed(2) || '0.00'}%`],
        ['Grade', evaluation.grade || 'Pending'],
        ['Submitted At', evaluation.submittedAt ? format(new Date(evaluation.submittedAt), 'PPP p') : 'N/A'],
        ['Evaluated At', evaluation.evaluatedAt ? format(new Date(evaluation.evaluatedAt), 'PPP p') : 'N/A']
      ]

      lines.forEach(([label, value]) => {
        pdf.text(`${label}:`, 20, y)
        pdf.text(String(value), 70, y)
        y += 8
      })

      if (evaluation.status === 're-evaluated' && evaluation.reEvaluationComparison) {
        y += 5
        pdf.setFontSize(12)
        pdf.text('Re-evaluation Changes', 20, y)
        y += 8
        pdf.setFontSize(11)

        const changeLines = [
          ['Marks', `${evaluation.reEvaluationComparison.previousTotalMarks} -> ${evaluation.reEvaluationComparison.updatedTotalMarks}`],
          ['Percentage', `${evaluation.reEvaluationComparison.previousPercentage?.toFixed(2) || '0.00'}% -> ${evaluation.reEvaluationComparison.updatedPercentage?.toFixed(2) || '0.00'}%`],
          ['Grade', `${evaluation.reEvaluationComparison.previousGrade || 'N/A'} -> ${evaluation.reEvaluationComparison.updatedGrade || 'N/A'}`]
        ]

        changeLines.forEach(([label, value]) => {
          pdf.text(`${label}:`, 20, y)
          pdf.text(String(value), 70, y)
          y += 8
        })
      }

      const fileTitle = (evaluation.exam?.title || 'Exam').replace(/\s+/g, '_')
      pdf.save(`Evaluation_Result_${fileTitle}.pdf`)
    } catch (error) {
      console.error('Error downloading evaluation result:', error)
      setError('Failed to download result PDF')
    }
  }

  const renderResultCard = (evaluation) => (
    <div key={evaluation._id} className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h4 className="font-semibold text-gray-800">{evaluation.exam?.title || 'Exam'}</h4>
          <p className="text-sm text-gray-600">{evaluation.exam?.subject || 'N/A'}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-1 rounded-full ${statusClasses[evaluation.status] || 'bg-gray-100 text-gray-700'}`}>
            {evaluation.status}
          </span>
          <button
            onClick={() => downloadEvaluationResult(evaluation)}
            className="btn btn-secondary inline-flex items-center gap-1 !px-3 !py-1.5 !text-xs"
          >
            <FiDownload />
            <span>Download Result</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 text-sm">
        <div>
          <p className="text-gray-500">Marks</p>
          <p className="font-semibold text-gray-800">{evaluation.totalMarks}/{evaluation.maxMarks}</p>
        </div>
        <div>
          <p className="text-gray-500">Percentage</p>
          <p className="font-semibold text-gray-800">{evaluation.percentage?.toFixed(2) || '0.00'}%</p>
        </div>
        <div>
          <p className="text-gray-500">Grade</p>
          <p className="font-semibold text-gray-800">{evaluation.grade || 'Pending'}</p>
        </div>
        <div>
          <p className="text-gray-500">Evaluated At</p>
          <p className="font-semibold text-gray-800">
            {evaluation.evaluatedAt ? format(new Date(evaluation.evaluatedAt), 'PPP p') : 'N/A'}
          </p>
        </div>
      </div>

      {evaluation.status === 're-evaluated' && evaluation.reEvaluationComparison && (
        <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
          <p className="text-sm font-semibold text-blue-800 mb-2">Marks Updated After Re-evaluation</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-blue-700">Marks</p>
              <p className="font-semibold text-blue-900">
                {evaluation.reEvaluationComparison.previousTotalMarks} → {evaluation.reEvaluationComparison.updatedTotalMarks}
              </p>
            </div>
            <div>
              <p className="text-blue-700">Percentage</p>
              <p className="font-semibold text-blue-900">
                {evaluation.reEvaluationComparison.previousPercentage?.toFixed(2) || '0.00'}% → {evaluation.reEvaluationComparison.updatedPercentage?.toFixed(2) || '0.00'}%
              </p>
            </div>
            <div>
              <p className="text-blue-700">Grade</p>
              <p className="font-semibold text-blue-900">
                {evaluation.reEvaluationComparison.previousGrade || 'N/A'} → {evaluation.reEvaluationComparison.updatedGrade || 'N/A'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  const renderPendingCard = (evaluation) => (
    <div key={evaluation._id} className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h4 className="font-semibold text-gray-800">{evaluation.exam?.title || 'Exam'}</h4>
          <p className="text-sm text-gray-600">{evaluation.exam?.subject || 'N/A'}</p>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full ${statusClasses[evaluation.status] || 'bg-gray-100 text-gray-700'}`}>
          {evaluation.status}
        </span>
      </div>
      <div className="mt-3 text-sm text-gray-600">
        Submitted: {evaluation.submittedAt ? format(new Date(evaluation.submittedAt), 'PPP p') : 'N/A'}
      </div>
    </div>
  )

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
        <h1 className="text-3xl font-bold text-gray-800">Evaluation Dashboard</h1>
        <button
          onClick={fetchEvaluations}
          className="btn btn-secondary inline-flex items-center space-x-2"
        >
          <FiRefreshCw />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="card border-l-4 border-red-400 bg-red-50">
          <div className="flex space-x-3">
            <FiAlertCircle className="text-red-600 mt-1 flex-shrink-0" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      <div className="card">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-2">Status Filters</label>
            <div className="flex flex-wrap gap-2">
              {statusFilterOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setStatusFilter(option.value)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium border transition ${
                    statusFilter === option.value
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {option.label} ({statusCounts[option.value] || 0})
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Search Exam</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by exam title or subject"
              className="input w-full"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card bg-yellow-50 border border-yellow-200">
          <p className="text-yellow-700 text-sm">Pending</p>
          <h3 className="text-3xl font-bold text-yellow-800 mt-2">{sections.pending.length}</h3>
        </div>
        <div className="card bg-purple-50 border border-purple-200">
          <p className="text-purple-700 text-sm">Re-evaluation Requested</p>
          <h3 className="text-3xl font-bold text-purple-800 mt-2">{sections.reEvaluationRequested.length}</h3>
        </div>
        <div className="card bg-green-50 border border-green-200">
          <p className="text-green-700 text-sm">Evaluated</p>
          <h3 className="text-3xl font-bold text-green-800 mt-2">{sections.evaluated.length}</h3>
        </div>
        <div className="card bg-blue-50 border border-blue-200">
          <p className="text-blue-700 text-sm">Re-evaluated</p>
          <h3 className="text-3xl font-bold text-blue-800 mt-2">{sections.reEvaluated.length}</h3>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <FiClock className="text-yellow-600" />
          Pending Evaluations
        </h2>
        {sections.pending.length === 0 ? (
          <p className="text-gray-500">No pending evaluations.</p>
        ) : (
          <div className="space-y-3">
            {sections.pending.map(renderPendingCard)}
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Re-evaluation Requested</h2>
        {sections.reEvaluationRequested.length === 0 ? (
          <p className="text-gray-500">No re-evaluation requests pending.</p>
        ) : (
          <div className="space-y-3">
            {sections.reEvaluationRequested.map(renderPendingCard)}
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <FiCheckCircle className="text-green-600" />
          Evaluated Results
        </h2>
        {sections.evaluated.length === 0 ? (
          <p className="text-gray-500">No evaluated results yet.</p>
        ) : (
          <div className="space-y-3">
            {sections.evaluated.map(renderResultCard)}
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Re-evaluated Results</h2>
        {sections.reEvaluated.length === 0 ? (
          <p className="text-gray-500">No re-evaluated results yet.</p>
        ) : (
          <div className="space-y-3">
            {sections.reEvaluated.map(renderResultCard)}
          </div>
        )}
      </div>
    </div>
  )
}

export default Evaluations
