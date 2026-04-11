import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../utils/api'
import { toast } from 'react-toastify'
import { useAuth } from '../../context/AuthContext'
import { useEffect } from 'react'

const CreateGrievance = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    department: user?.department || '',
    semester: user?.semester || '',
    problemType: 'marks-calculation-error',
    otherProblemText: '',
    category: 'marks-discrepancy',
    relatedEvaluation: '',
    subject: '',
    description: '',
    priority: 'medium',
  })
  const [evaluations, setEvaluations] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchEvaluations = async () => {
      try {
        const response = await api.get('/evaluations/my-evaluations')
        const completed = (response.data.evaluations || []).filter((evaluation) =>
          ['evaluated', 're-evaluated'].includes(evaluation.status)
        )
        setEvaluations(completed)
      } catch (error) {
        setEvaluations([])
      }
    }

    fetchEvaluations()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target

    if (name === 'problemType') {
      const problemTypeToCategory = {
        'marks-calculation-error': 'marks-discrepancy',
        'question-not-evaluated': 'evaluation-dispute',
        'partiality-issue': 'evaluation-dispute',
        'answer-key-dispute': 're-evaluation',
        'technical-upload-issue': 'technical',
        'attendance-issue': 'administrative',
        other: 'other',
      }

      setFormData((prev) => ({
        ...prev,
        problemType: value,
        category: problemTypeToCategory[value] || 'other',
      }))
      return
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (formData.problemType === 'other' && !formData.otherProblemText.trim()) {
        toast.error('Please enter your problem in detail')
        setLoading(false)
        return
      }

      await api.post('/grievances', {
        ...formData,
        semester: Number(formData.semester),
        relatedEvaluation: formData.relatedEvaluation || undefined,
      })
      toast.success('Grievance submitted successfully!')
      navigate('/student/grievances')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit grievance')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Submit Grievance</h1>

      <form onSubmit={handleSubmit} className="card space-y-6">
        <div>
          <label className="label">Department</label>
          <input
            type="text"
            name="department"
            value={formData.department}
            onChange={handleChange}
            className="input"
            required
          />
        </div>

        <div>
          <label className="label">Semester</label>
          <select
            name="semester"
            value={formData.semester}
            onChange={handleChange}
            className="input"
            required
          >
            <option value="">Select Semester</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
              <option key={sem} value={sem}>
                Semester {sem}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Problem Type</label>
          <select
            name="problemType"
            value={formData.problemType}
            onChange={handleChange}
            className="input"
            required
          >
            <option value="marks-calculation-error">Marks Calculation Error</option>
            <option value="question-not-evaluated">Question Not Evaluated</option>
            <option value="partiality-issue">Partiality / Unfair Checking</option>
            <option value="answer-key-dispute">Answer Key / Rubric Dispute</option>
            <option value="technical-upload-issue">Technical Upload Issue</option>
            <option value="attendance-issue">Attendance / Administrative Issue</option>
            <option value="other">Other</option>
          </select>
        </div>

        {formData.problemType === 'other' && (
          <div>
            <label className="label">Other Problem Details</label>
            <textarea
              name="otherProblemText"
              value={formData.otherProblemText}
              onChange={handleChange}
              className="input"
              rows="3"
              placeholder="Write your exact issue..."
              required
            />
          </div>
        )}

        <div>
          <label className="label">Select Evaluated Paper (Optional)</label>
          <p className="text-sm text-gray-600 mb-3">
            Select an exam/paper you've already completed if your grievance is related to marks or evaluation
          </p>

          {evaluations.length === 0 ? (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">
                📚 No evaluated papers found yet. You can still submit a grievance without linking to a paper.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {/* "Not linked" option */}
              <label className="flex items-start p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="relatedEvaluation"
                  value=""
                  checked={formData.relatedEvaluation === ''}
                  onChange={handleChange}
                  className="mt-1 mr-3"
                />
                <span className="text-sm text-gray-600">Not linked to any paper</span>
              </label>

              {/* Evaluated exams list */}
              {evaluations.map((evaluation) => (
                <label
                  key={evaluation._id}
                  className="flex items-start p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-colors"
                >
                  <input
                    type="radio"
                    name="relatedEvaluation"
                    value={evaluation._id}
                    checked={formData.relatedEvaluation === evaluation._id}
                    onChange={handleChange}
                    className="mt-1 mr-3"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-gray-800 truncate">
                        {evaluation.exam?.title}
                      </h4>
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded whitespace-nowrap">
                        {evaluation.status}
                      </span>
                    </div>
                    <div className="mt-1 grid grid-cols-3 gap-3 text-xs text-gray-600">
                      <div>
                        <span className="text-gray-500">Marks:</span>
                        <p className="font-semibold text-gray-800">
                          {evaluation.totalMarks}/{evaluation.maxMarks}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Grade:</span>
                        <p className="font-semibold text-gray-800">
                          {evaluation.grade || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Date:</span>
                        <p className="font-semibold text-gray-800">
                          {evaluation.evaluatedAt
                            ? new Date(evaluation.evaluatedAt).toLocaleDateString('en-IN')
                            : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="label">Priority</label>
          <select
            name="priority"
            value={formData.priority}
            onChange={handleChange}
            className="input"
            required
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>

        <div>
          <label className="label">Subject</label>
          <input
            type="text"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            className="input"
            placeholder="Brief summary of your grievance"
            required
          />
        </div>

        <div>
          <label className="label">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="input"
            rows="6"
            placeholder="Describe your grievance in detail (minimum 10 characters)"
            required
            minLength="10"
          />
        </div>

        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary flex-1 disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit Grievance'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/student/grievances')}
            className="btn btn-secondary"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

export default CreateGrievance
