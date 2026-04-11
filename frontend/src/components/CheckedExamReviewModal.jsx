import { FiX, FiCheckCircle, FiXCircle, FiAlertCircle } from 'react-icons/fi'

const CheckedExamReviewModal = ({ evaluation, onClose }) => {
  if (!evaluation?.exam) return null

  const questions = evaluation.exam.questions || []
  const answersByNumber = (evaluation.answers || []).reduce((acc, answer) => {
    acc[answer.questionNumber] = answer
    return acc
  }, {})

  const getStatusBadge = (obtained, maxMarks) => {
    if ((obtained || 0) === maxMarks) {
      return {
        className: 'bg-green-100 text-green-700',
        icon: <FiCheckCircle size={14} />,
        label: 'Correct'
      }
    }

    if ((obtained || 0) === 0) {
      return {
        className: 'bg-red-100 text-red-700',
        icon: <FiXCircle size={14} />,
        label: 'Needs improvement'
      }
    }

    return {
      className: 'bg-yellow-100 text-yellow-700',
      icon: <FiAlertCircle size={14} />,
      label: 'Partially correct'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-5 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Checked Exam Paper</h2>
            <p className="text-sm text-gray-600 mt-1">
              {evaluation.exam.title} • {evaluation.exam.subject}
            </p>
            <p className="text-sm font-medium text-primary-700 mt-2">
              Score: {evaluation.totalMarks}/{evaluation.maxMarks} ({evaluation.percentage?.toFixed(1)}%) • Grade: {evaluation.grade}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          >
            <FiX size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {questions.map((question, idx) => {
            const questionNumber = question.questionNumber || idx + 1
            const answer = answersByNumber[questionNumber] || {}
            const obtained = answer.marksObtained || 0
            const maxMarks = question.marks || answer.maxMarks || 0
            const status = getStatusBadge(obtained, maxMarks)
            const isObjective = question.questionType === 'mcq' || question.questionType === 'true-false'

            return (
              <div key={questionNumber} className="border rounded-lg p-4 bg-white">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-800">Q{questionNumber}. {question.questionText}</h3>
                    <p className="text-xs text-gray-500 mt-1">Type: {question.questionType} • Marks: {maxMarks}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary-700">{obtained}/{maxMarks}</p>
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${status.className}`}>
                      {status.icon}
                      {status.label}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-gray-600 mb-1">Your Answer</p>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">
                      {answer.answer || 'No answer submitted'}
                    </p>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs font-semibold text-blue-700 mb-1">
                      {isObjective ? 'Expected Answer' : 'Marking Rubric'}
                    </p>
                    <p className="text-sm text-blue-800 whitespace-pre-wrap">
                      {isObjective
                        ? (question.correctAnswer || 'Not available')
                        : (question.rubric || 'Rubric not provided by faculty')}
                    </p>
                  </div>
                </div>

                <div className="mt-3 bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                  <p className="text-xs font-semibold text-yellow-700 mb-1">Faculty Feedback</p>
                  <p className="text-sm text-yellow-800 whitespace-pre-wrap">
                    {answer.feedback || 'No feedback provided'}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default CheckedExamReviewModal
