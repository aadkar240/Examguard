import React, { useState, useEffect } from 'react';
import { Plus, Brain, FileText, Archive, TrendingUp, AlertCircle, Trash2 } from 'lucide-react';
import AIGenerateExamModal from './AIGenerateExamModal';
import ExamCardComponent from './ExamCardComponent';
import CreateTimetableModal from './CreateTimetableModal';
import api from '../utils/api';

const AIExamDashboard = () => {
  const [exams, setExams] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showTimetableModal, setShowTimetableModal] = useState(false);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchExams();
    fetchStatistics();
  }, [filterStatus]);

  const normalizeExam = (exam) => {
    const backendStatus = String(exam?.status || '').toLowerCase();
    let uiStatus = 'Draft';

    if (backendStatus === 'completed' || backendStatus === 'cancelled') {
      uiStatus = 'Archived';
    } else if (backendStatus === 'scheduled' && !exam?.isPublished) {
      uiStatus = 'Scheduled';
    } else if (exam?.isPublished || backendStatus === 'ongoing' || backendStatus === 'scheduled') {
      uiStatus = 'Published';
    }

    return {
      ...exam,
      id: exam?._id || exam?.id,
      title: exam?.title || `${exam?.subject || 'Exam'} Exam`,
      status: uiStatus,
      total_marks: exam?.totalMarks ?? exam?.total_marks ?? 0,
      created_at: exam?.createdAt || exam?.created_at,
      exam_type: exam?.examType || exam?.exam_type || 'Internal',
      question_count: Array.isArray(exam?.questions) ? exam.questions.length : exam?.question_count || 0,
      is_ai_generated: exam?.is_ai_generated ?? true,
      topics: exam?.topics || []
    };
  };

  const fetchExams = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/exams');
      const allExams = (response?.data?.exams || []).map(normalizeExam);

      if (filterStatus === 'all') {
        setExams(allExams);
      } else {
        const targetStatus = filterStatus.toLowerCase();
        setExams(
          allExams.filter((exam) => String(exam.status).toLowerCase() === targetStatus)
        );
      }
    } catch (err) {
      console.error('Failed to fetch exams:', err);
      setError(err?.response?.data?.message || 'Could not load exams. Please login again and retry.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await api.get('/dashboard/stats');
      const stats = response?.data?.stats || {};
      setStatistics({
        total_exams: stats.totalExams || 0,
        published_exams: stats.activeExams || 0,
        ai_generated_exams: stats.totalExams || 0,
        avg_marks: '-'
      });
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
      setStatistics(null);
    }
  };

  const handleExamCreated = () => {
    setShowAIModal(false);
    fetchExams();
    fetchStatistics();
  };

  const handleClearAll = async () => {
    if (exams.length === 0) {
      alert('No exams to delete');
      return;
    }

    const confirm1 = window.confirm(
      `Are you sure you want to DELETE all ${exams.length} exam${exams.length > 1 ? 's' : ''}?\nThis action cannot be undone.`
    );

    if (!confirm1) return;

    const confirm2 = window.confirm(
      'Are you ABSOLUTELY SURE? All exams will be permanently deleted.'
    );

    if (!confirm2) return;

    try {
      setLoading(true);
      let deletedCount = 0;
      let failedCount = 0;

      for (const exam of exams) {
        try {
          await api.delete(`/exams/${exam.id}`);
          if (true) {
            deletedCount++;
          }
        } catch (error) {
          console.error(`Error deleting exam ${exam.id}:`, error);
          failedCount++;
        }
      }

      setError('');
      fetchExams();
      fetchStatistics();
      alert(`${deletedCount} exam${deletedCount > 1 ? 's' : ''} deleted successfully${failedCount > 0 ? `. ${failedCount} failed.` : '.'}`);
    } catch (error) {
      console.error('Error in clear all:', error);
      setError('Failed to delete all exams');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">AI-Powered Exam Management</h1>
            <p className="text-gray-600 mt-1">Create and manage exams with intelligent AI assistance</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowTimetableModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Plus size={20} />
              Create Exam Timetable
            </button>
            <button
              onClick={() => setShowAIModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition"
            >
              <Brain size={20} />
              AI Generate Exam
            </button>
            {exams.length > 0 && (
              <button
                onClick={handleClearAll}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 size={20} />
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 flex gap-3">
            <AlertCircle className="text-yellow-600 flex-shrink-0" size={20} />
            <p className="text-yellow-800">{error}</p>
          </div>
        )}

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Total Exams</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">{statistics.total_exams}</p>
                </div>
                <FileText className="text-blue-600" size={32} />
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Published</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">{statistics.published_exams}</p>
                </div>
                <TrendingUp className="text-green-600" size={32} />
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">AI Generated</p>
                  <p className="text-2xl font-bold text-purple-600 mt-1">{statistics.ai_generated_exams}</p>
                </div>
                <Brain className="text-purple-600" size={32} />
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">Avg Marks</p>
                  <p className="text-2xl font-bold text-orange-600 mt-1">{statistics.avg_marks}</p>
                </div>
                <Archive className="text-orange-600" size={32} />
              </div>
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow p-2 flex gap-2">
          {['all', 'draft', 'published', 'archived'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-md transition ${
                filterStatus === status
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Exams Grid */}
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : exams.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <FileText className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-500 text-lg">No exams found</p>
            <p className="text-gray-400 mt-2">Click "AI Generate Exam" to create your first exam</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exams.map((exam) => (
              <ExamCardComponent
                key={exam.id}
                exam={exam}
                onUpdate={fetchExams}
              />
            ))}
          </div>
        )}
      </div>

      {/* AI Generation Modal */}
      {showAIModal && (
        <AIGenerateExamModal
          onClose={() => setShowAIModal(false)}
          onSuccess={handleExamCreated}
        />
      )}

      {showTimetableModal && (
        <CreateTimetableModal
          onClose={() => setShowTimetableModal(false)}
          onSuccess={() => {
            setShowTimetableModal(false);
          }}
        />
      )}
    </div>
  );
};

export default AIExamDashboard;
