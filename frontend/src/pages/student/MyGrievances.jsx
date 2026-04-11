import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import api from '../../utils/api'
import { FiPlus, FiMessageSquare, FiCheck } from 'react-icons/fi'
import { format } from 'date-fns'

const MyGrievances = () => {
  const [grievances, setGrievances] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState(null)
  const [searchParams] = useSearchParams()

  useEffect(() => {
    fetchGrievances()
  }, [])

  const fetchGrievances = async () => {
    try {
      const response = await api.get('/grievances/my-grievances')
      setGrievances(response.data.grievances)
    } catch (error) {
      console.error('Error fetching grievances:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const grievanceId = searchParams.get('grievanceId')
    if (grievanceId && grievances.some((g) => g._id === grievanceId)) {
      setExpandedId(grievanceId)
    }
  }, [grievances, searchParams])

  const getProcessFlow = (grievance) => {
    const statusRank = {
      open: 1,
      'in-progress': 2,
      'pending-response': 3,
      escalated: 3,
      resolved: 4,
      closed: 5
    }

    const currentRank = statusRank[grievance.status] || 1
    const hasFacultyResponse = (grievance.responses || []).some((response) => !response.isInternal)

    const steps = [
      {
        key: 'submitted',
        label: 'Submitted',
        done: true,
        at: grievance.createdAt
      },
      {
        key: 'review',
        label: 'Under Review',
        done: currentRank >= 2 || hasFacultyResponse,
        at: (grievance.timeline || []).find((entry) => (entry.action || '').toLowerCase().includes('in-progress'))?.timestamp
      },
      {
        key: 'response',
        label: 'Faculty Response',
        done: currentRank >= 3 || hasFacultyResponse,
        at: (grievance.responses || []).find((response) => !response.isInternal)?.timestamp
      },
      {
        key: 'resolved',
        label: 'Resolved',
        done: currentRank >= 4,
        at: grievance.resolution?.resolvedAt
      },
      {
        key: 'closed',
        label: 'Closed',
        done: currentRank >= 5,
        at: (grievance.timeline || []).find((entry) => (entry.action || '').toLowerCase().includes('closed'))?.timestamp
      }
    ]

    return steps
  }

  const getStatusColor = (status) => {
    const colors = {
      open: 'bg-blue-100 text-blue-700',
      'in-progress': 'bg-yellow-100 text-yellow-700',
      'pending-response': 'bg-orange-100 text-orange-700',
      resolved: 'bg-green-100 text-green-700',
      closed: 'bg-gray-100 text-gray-700',
      escalated: 'bg-red-100 text-red-700',
    }
    return colors[status] || 'bg-gray-100 text-gray-700'
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">My Grievances</h1>
        <Link to="/student/grievances/create" className="btn btn-primary flex items-center space-x-2">
          <FiPlus />
          <span>Submit Grievance</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {grievances.length === 0 ? (
          <div className="card text-center py-12">
            <FiMessageSquare className="mx-auto text-6xl text-gray-300 mb-4" />
            <p className="text-gray-500">No grievances submitted yet</p>
            <Link to="/student/grievances/create" className="btn btn-primary mt-4">
              Submit Your First Grievance
            </Link>
          </div>
        ) : (
          grievances.map((grievance) => (
            <div key={grievance._id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-sm font-mono text-gray-500">{grievance.ticketId}</span>
                    <span className={`text-xs px-3 py-1 rounded-full ${getStatusColor(grievance.status)}`}>
                      {grievance.status.replace('-', ' ')}
                    </span>
                    <span className={`text-xs px-3 py-1 rounded-full ${
                      grievance.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                      grievance.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                      grievance.priority === 'medium' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {grievance.priority}
                    </span>
                  </div>
                  
                  <h2 className="text-xl font-bold text-gray-800">{grievance.subject}</h2>
                  <p className="text-gray-600 mt-1 capitalize">{grievance.category.replace('-', ' ')}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Submitted on {format(new Date(grievance.createdAt), 'PPp')}
                  </p>
                  
                  {grievance.responses && grievance.responses.length > 0 && (
                    <div className="mt-3 text-sm text-primary-600">
                      {grievance.responses.length} response(s) received
                    </div>
                  )}
                </div>

                <button className="btn btn-primary">
                  <span
                    onClick={() => setExpandedId(expandedId === grievance._id ? null : grievance._id)}
                  >
                    {expandedId === grievance._id ? 'Hide Details' : 'View Details'}
                  </span>
                </button>
              </div>

              {expandedId === grievance._id && (
                <div className="mt-5 border-t pt-4 space-y-4">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-1">Description</h3>
                    <p className="text-sm text-gray-600">{grievance.description}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Grievance Timeline</h3>
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                      {getProcessFlow(grievance).map((step, index, steps) => {
                        const isLast = index === steps.length - 1
                        return (
                          <div key={`${grievance._id}-${step.key}`} className="flex gap-3">
                            <div className="flex flex-col items-center">
                              <div
                                className={`h-6 w-6 rounded-full flex items-center justify-center ${
                                  step.done
                                    ? 'bg-green-500 text-white'
                                    : 'bg-gray-200 text-gray-400'
                                }`}
                              >
                                {step.done ? <FiCheck size={14} /> : <span className="h-2 w-2 rounded-full bg-gray-400" />}
                              </div>
                              {!isLast && (
                                <div
                                  className={`w-0.5 flex-1 min-h-6 ${
                                    step.done ? 'bg-green-300' : 'bg-gray-300'
                                  }`}
                                />
                              )}
                            </div>

                            <div className="pb-5">
                              <p className={`text-sm font-medium ${step.done ? 'text-green-700' : 'text-gray-500'}`}>
                                {step.label}
                              </p>
                              {step.at && (
                                <p className="text-xs text-gray-500 mt-1">{format(new Date(step.at), 'PPp')}</p>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default MyGrievances
