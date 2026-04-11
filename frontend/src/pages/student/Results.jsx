import { useEffect, useState } from 'react'
import api from '../../utils/api'
import { FiDownload, FiRefreshCw, FiAlertCircle } from 'react-icons/fi'
import { format } from 'date-fns'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

const Results = () => {
  const [result, setResult] = useState(null)
  const [resultHistory, setResultHistory] = useState([])
  const [resultEligibility, setResultEligibility] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchResult()
  }, [])

  const fetchResult = async () => {
    try {
      setLoading(true)
      setError(null)

      // First fetch result history (latest first)
      const historyResponse = await api.get('/results/my-results').catch(() => ({ data: { results: [] } }))
      const allResults = historyResponse.data?.results || []

      setResultHistory(allResults)

      if (allResults.length > 0) {
        setResult(allResults[0])
      } else {
        setResult(null)
      }

      // Always check latest eligibility so user can generate new 5-exam batch
      const eligibilityResponse = await api.get('/results/latest').catch(() => ({ data: null }))
      setResultEligibility(eligibilityResponse.data)

      if (allResults.length === 0 && eligibilityResponse.data?.success && eligibilityResponse.data?.data) {
        setResult(eligibilityResponse.data.data)
      }
    } catch (err) {
      console.error('Error fetching result:', err)
      setError(err.response?.data?.error || 'Failed to fetch result')
    } finally {
      setLoading(false)
    }
  }

  const generateResult = async () => {
    try {
      setGenerating(true)
      setError(null)

      const response = await api.post('/results/generate')
      if (response.data?.result) {
        await fetchResult()
      }
    } catch (err) {
      console.error('Error generating result:', err)
      setError(err.response?.data?.error || 'Failed to generate result')
    } finally {
      setGenerating(false)
    }
  }

  const getExamId = (exam) => {
    if (!exam) return null
    if (typeof exam.exam === 'string') return exam.exam
    if (exam.exam?._id) return exam.exam._id
    if (exam._id) return exam._id
    return null
  }

  const hasNewExamBatch = () => {
    if (!resultEligibility?.canGenerate || !resultEligibility?.data?.exams?.length) return false
    if (!latestGeneratedResult?.exams?.length) return true

    const latestExamIds = resultEligibility.data.exams.map((exam) => String(getExamId(exam)))
    const currentExamIds = latestGeneratedResult.exams.map((exam) => String(getExamId(exam)))

    if (latestExamIds.length !== currentExamIds.length) return true
    return latestExamIds.some((examId, index) => examId !== currentExamIds[index])
  }

  const latestGeneratedResult = resultHistory[0] || null
  const activeResult = resultEligibility?.success && resultEligibility?.data && hasNewExamBatch()
    ? resultEligibility.data
    : result

  const showGenerateButton = resultEligibility?.canGenerate && (!latestGeneratedResult || hasNewExamBatch())
  const canDownloadResult = Boolean(Array.isArray(activeResult?.exams) && activeResult.exams.length > 0)

  const formatNumber = (value, decimals = 2) => {
    const numericValue = Number(value)
    return Number.isFinite(numericValue) ? numericValue.toFixed(decimals) : '0.00'
  }

  const downloadPDF = async (selectedResult = activeResult) => {
    if (!selectedResult || !Array.isArray(selectedResult.exams) || selectedResult.exams.length === 0) {
      setError('No result data available to download')
      return
    }

    try {
      const pdf = new jsPDF()
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      let yPosition = 20

      // Header
      pdf.setFontSize(20)
      pdf.text('Academic Result Sheet', pageWidth / 2, yPosition, { align: 'center' })
      yPosition += 15

      // Student Info
      pdf.setFontSize(11)
      pdf.setTextColor(60, 60, 60)

      const studentDetails = selectedResult.studentDetails || selectedResult.student
      const studentName = studentDetails?.name || 'N/A'
      const studentEmail = studentDetails?.email || 'N/A'
      const rollNumber = studentDetails?.rollNumber || 'N/A'
      const department = studentDetails?.department || 'N/A'

      const studentInfo = [
        [`Student Name:`, studentName],
        [`Roll Number:`, rollNumber],
        [`Department:`, department],
        [`Email:`, studentEmail],
        [`Generated:`, format(new Date(selectedResult.generatedAt || new Date()), 'PPP')]
      ]

      studentInfo.forEach(([label, value]) => {
        pdf.text(label, 20, yPosition)
        pdf.text(String(value), 70, yPosition)
        yPosition += 7
      })

      yPosition += 5

      // Exam Details Table
      pdf.setFontSize(12)
      pdf.text('Exam Details', 20, yPosition)
      yPosition += 8

      const examRows = Array.isArray(selectedResult.exams) ? selectedResult.exams : []
      const tableData = examRows.map((exam, index) => [
        index + 1,
        exam.title || exam.exam?.title || 'N/A',
        exam.subject || exam.exam?.subject || 'N/A',
        `${exam.totalMarks ?? 0}/${exam.maxMarks ?? 0}`,
        `${formatNumber(exam.percentage)}%`,
        exam.grade || 'N/A',
        exam.creditPoints ?? 0
      ])

      pdf.autoTable({
        startY: yPosition,
        head: [['#', 'Exam Title', 'Subject', 'Marks', 'Percentage', 'Grade', 'Credits']],
        body: tableData,
        theme: 'grid',
        margin: { left: 15, right: 15 },
        headStyles: {
          fillColor: [79, 70, 229],
          textColor: 255,
          fontStyle: 'bold'
        },
        bodyStyles: {
          textColor: 60
        },
        alternateRowStyles: {
          fillColor: [245, 245, 250]
        },
        columnStyles: {
          0: { halign: 'center', cellWidth: 12 },
          1: { cellWidth: 40 },
          2: { cellWidth: 30 },
          3: { halign: 'center', cellWidth: 25 },
          4: { halign: 'center', cellWidth: 25 },
          5: { halign: 'center', cellWidth: 18 },
          6: { halign: 'center', cellWidth: 18 }
        }
      })

      yPosition = pdf.lastAutoTable?.finalY ? pdf.lastAutoTable.finalY + 15 : yPosition + 15

      // Summary Section
      pdf.setFontSize(12)
      pdf.text('Summary', 20, yPosition)
      yPosition += 8

      const summaryData = [
        [`Total Obtained Marks:`, `${selectedResult.totalObtainedMarks ?? 0}/${selectedResult.totalMaxMarks ?? 0}`],
        [`Overall Percentage:`, `${formatNumber(selectedResult.overallPercentage)}%`],
        [`CGPA:`, formatNumber(selectedResult.cgpa)],
        [`Total Credits:`, selectedResult.totalCredits ?? 0],
        [`Academic Semester:`, selectedResult.academicSemester || 'N/A'],
        [`Academic Year:`, selectedResult.academicYear || 'N/A']
      ]

      pdf.setFontSize(10)
      pdf.setTextColor(40, 40, 40)
      summaryData.forEach(([label, value]) => {
        pdf.text(label, 20, yPosition)
        pdf.setFont(undefined, 'bold')
        pdf.text(String(value), 100, yPosition)
        pdf.setFont(undefined, 'normal')
        yPosition += 7
      })

      // Footer
      pdf.setFontSize(8)
      pdf.setTextColor(150, 150, 150)
      pdf.text(
        `Generated on ${format(new Date(), 'PPpp')} - Academic Result System`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      )

      const batchNumber = selectedResult.batchNumber || 1
      const generatedDateForFile = selectedResult.generatedAt ? new Date(selectedResult.generatedAt) : new Date()
      pdf.save(
        `Result_Batch_${batchNumber}_${studentName.replace(/\s+/g, '_')}_${format(generatedDateForFile, 'dd-MM-yyyy')}.pdf`
      )
    } catch (err) {
      console.error('Error generating PDF:', err)
      setError('Failed to download PDF')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  // No result yet
  if (!activeResult && (!resultEligibility || !resultEligibility.canGenerate)) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-800">Academic Results</h1>

        <div className="card border-l-4 border-yellow-400 bg-yellow-50">
          <div className="flex items-start space-x-3">
            <FiAlertCircle className="text-yellow-600 mt-1 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-semibold text-yellow-800">Not Yet Eligible</h3>
              <p className="text-yellow-700 mt-1">
                You need to complete and get evaluated for at least 5 exams to generate your result sheet.
              </p>
              {resultEligibility && (
                <p className="text-yellow-700 mt-2 font-medium">
                  Current Progress: {resultEligibility.evaluated || 0} / 5 exams evaluated
                </p>
              )}
              <div className="mt-4 w-full bg-yellow-200 rounded-full h-2">
                <div
                  className="bg-yellow-600 h-2 rounded-full transition-all"
                  style={{
                    width: `${Math.min(((resultEligibility?.evaluated || 0) / 5) * 100, 100)}%`
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-bold text-gray-800 mb-4">How to Generate Your Result</h2>
          <ol className="space-y-3">
            <li className="flex space-x-3">
              <span className="flex-shrink-0 w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-semibold">
                1
              </span>
              <span className="text-gray-700">Complete at least 5 exams</span>
            </li>
            <li className="flex space-x-3">
              <span className="flex-shrink-0 w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-semibold">
                2
              </span>
              <span className="text-gray-700">Wait for all 5 exams to be evaluated by faculty</span>
            </li>
            <li className="flex space-x-3">
              <span className="flex-shrink-0 w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-semibold">
                3
              </span>
              <span className="text-gray-700">Click "Generate Result" button to create your result sheet</span>
            </li>
            <li className="flex space-x-3">
              <span className="flex-shrink-0 w-8 h-8 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-semibold">
                4
              </span>
              <span className="text-gray-700">Download your academic transcript as PDF</span>
            </li>
          </ol>
        </div>
      </div>
    )
  }

  // Result is ready
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">Academic Results</h1>
        <div className="space-x-2">
          <button
            onClick={fetchResult}
            disabled={loading}
            className="btn btn-secondary inline-flex items-center space-x-2"
          >
            <FiRefreshCw className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
          {canDownloadResult && (
            <button
              onClick={downloadPDF}
              className="btn btn-primary inline-flex items-center space-x-2"
            >
              <FiDownload />
              <span>Download PDF</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="card border-l-4 border-red-400 bg-red-50">
          <div className="flex space-x-3">
            <FiAlertCircle className="text-red-600 mt-1 flex-shrink-0" />
            <div>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Student Information Card */}
      <div className="card bg-gradient-to-r from-indigo-50 to-violet-50">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Student Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Name</p>
            <p className="text-lg font-semibold text-gray-800">
              {activeResult.studentDetails?.name || activeResult.student?.name || 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Roll Number</p>
            <p className="text-lg font-semibold text-gray-800">
              {activeResult.studentDetails?.rollNumber || activeResult.student?.rollNumber || 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Department</p>
            <p className="text-lg font-semibold text-gray-800">
              {activeResult.studentDetails?.department || activeResult.student?.department || 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Academic Year</p>
            <p className="text-lg font-semibold text-gray-800">{activeResult.academicYear || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Exam Results Table */}
      <div className="card">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Exam Performance</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-indigo-100 border-b-2 border-indigo-200">
                <th className="px-4 py-3 text-left text-sm font-semibold text-indigo-900">#</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-indigo-900">Exam Title</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-indigo-900">Subject</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-indigo-900">Marks</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-indigo-900">Percentage</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-indigo-900">Grade</th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-indigo-900">Credits</th>
              </tr>
            </thead>
            <tbody>
              {activeResult.exams.map((exam, index) => (
                <tr key={index} className="border-b border-gray-200 hover:bg-gray-50 transition">
                  <td className="px-4 py-3 text-sm text-gray-800 font-medium">{index + 1}</td>
                  <td className="px-4 py-3 text-sm text-gray-800">{exam.title || exam.exam?.title || 'N/A'}</td>
                  <td className="px-4 py-3 text-sm text-gray-800">{exam.subject || exam.exam?.subject || 'N/A'}</td>
                  <td className="px-4 py-3 text-sm text-gray-800 text-center">
                    <span className="font-semibold">{exam.totalMarks}</span>
                    <span className="text-gray-500">/{exam.maxMarks}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-800 text-center">
                    {exam.percentage?.toFixed(2) || 0}%
                  </td>
                  <td className="px-4 py-3 text-sm text-center">
                    <span className={`px-3 py-1 rounded-full font-semibold text-white ${
                      exam.grade === 'A' ? 'bg-green-500' :
                      exam.grade === 'B+' ? 'bg-blue-500' :
                      exam.grade === 'B' ? 'bg-cyan-500' :
                      exam.grade === 'C' ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}>
                      {exam.grade || 'N/A'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-800 text-center font-semibold">
                    {exam.creditPoints}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <p className="text-blue-100 text-sm">Total Marks Obtained</p>
          <h3 className="text-3xl font-bold mt-2">{activeResult.totalObtainedMarks}</h3>
          <p className="text-sm text-blue-100 mt-1">out of {activeResult.totalMaxMarks}</p>
        </div>

        <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
          <p className="text-green-100 text-sm">Overall Percentage</p>
          <h3 className="text-3xl font-bold mt-2">{formatNumber(activeResult.overallPercentage)}%</h3>
          <p className="text-sm text-green-100 mt-1">for this 5-exam batch</p>
        </div>

        <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <p className="text-purple-100 text-sm">CGPA</p>
          <h3 className="text-3xl font-bold mt-2">{formatNumber(activeResult.cgpa)}</h3>
          <p className="text-sm text-purple-100 mt-1">on 4.0 scale</p>
        </div>

        <div className="card bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <p className="text-orange-100 text-sm">Total Credits</p>
          <h3 className="text-3xl font-bold mt-2">{activeResult.totalCredits}</h3>
          <p className="text-sm text-orange-100 mt-1">earned</p>
        </div>
      </div>

      {resultHistory.length > 1 && (
        <div className="card">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Previous 5-Exam Results</h2>
          <div className="space-y-3">
            {resultHistory.slice(1).map((historyItem, index) => (
              <div key={historyItem._id || index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                  <p className="font-semibold text-gray-800">
                    Batch #{historyItem.batchNumber || resultHistory.length - index - 1}
                  </p>
                  <div className="flex items-center gap-3">
                    <p className="text-sm text-gray-600">
                      Generated: {format(new Date(historyItem.generatedAt), 'PPP p')}
                    </p>
                    <button
                      onClick={() => downloadPDF(historyItem)}
                      className="btn btn-secondary inline-flex items-center space-x-2"
                    >
                      <FiDownload />
                      <span>Download</span>
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 text-sm">
                  <div>
                    <p className="text-gray-500">Marks</p>
                    <p className="font-semibold text-gray-800">
                      {historyItem.totalObtainedMarks}/{historyItem.totalMaxMarks}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Percentage</p>
                    <p className="font-semibold text-gray-800">{historyItem.overallPercentage?.toFixed(2)}%</p>
                  </div>
                  <div>
                    <p className="text-gray-500">CGPA</p>
                    <p className="font-semibold text-gray-800">{historyItem.cgpa?.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Credits</p>
                    <p className="font-semibold text-gray-800">{historyItem.totalCredits}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grade Scale Reference */}
      <div className="card">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Grade Scale Reference</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { grade: 'A', range: '85%+', points: '4.0 pts', color: 'bg-green-100 text-green-700' },
            { grade: 'B+', range: '75-84%', points: '3.5 pts', color: 'bg-blue-100 text-blue-700' },
            { grade: 'B', range: '65-74%', points: '3.0 pts', color: 'bg-cyan-100 text-cyan-700' },
            { grade: 'C', range: '55-64%', points: '2.0 pts', color: 'bg-yellow-100 text-yellow-700' },
            { grade: 'F', range: '<55%', points: '0.0 pts', color: 'bg-red-100 text-red-700' }
          ].map((item) => (
            <div key={item.grade} className={`${item.color} px-3 py-2 rounded-lg text-center`}>
              <p className="font-bold">{item.grade}</p>
              <p className="text-xs">{item.range}</p>
              <p className="text-xs font-semibold">{item.points}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Generate Result Button (if not yet generated) */}
      {showGenerateButton && (
        <div className="card border-l-4 border-blue-400 bg-blue-50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-blue-900">Generate Official Result</h3>
              <p className="text-blue-700 mt-1">
                {latestGeneratedResult?.generatedAt
                  ? 'A new 5-exam evaluated set is available. Generate the next result while keeping previous results.'
                  : 'You now have 5 exams evaluated. Generate your official academic result sheet.'}
              </p>
            </div>
            <button
              onClick={generateResult}
              disabled={generating}
              className="btn btn-primary"
            >
              {generating ? 'Generating...' : 'Generate Result'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Results
