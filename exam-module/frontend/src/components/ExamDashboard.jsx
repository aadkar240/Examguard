import React, { useState, useEffect } from 'react';
import { Plus, Brain, FileText, Archive, TrendingUp } from 'lucide-react';
import CreateExamModal from './CreateExamModal';
import AIGenerateModal from './AIGenerateModal';
import ExamCard from './ExamCard';

const ExamDashboard = () => {
  const [exams, setExams] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchExams();
    fetchStatistics();
  }, [filterStatus]);

  const fetchExams = async () => {
    setLoading(true);
    try {
      const statusParam = filterStatus !== 'all' ? `?status=${filterStatus}` : '';
      const response = await fetch(`http://localhost:8000/api/exams/my-exams${statusParam}`);
      const data = await response.json();
      setExams(data);
    } catch (error) {
      console.error('Failed to fetch exams:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/exams/statistics');
      const data = await response.json();
      setStatistics(data);
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
    }
  };

  const handleExamCreated = () => {
    setShowCreateModal(false);
    setShowAIModal(false);
    fetchExams();
    fetchStatistics();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Exam Management</h1>
            <p className="text-gray-600 mt-1">Create and manage exams with AI assistance</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Plus size={20} />
              Create Exam
            </button>
            <button
              onClick={() => setShowAIModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition"
            >
              <Brain size={20} />
              AI Generate
            </button>
          </div>
        </div>

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
          {['all', 'Draft', 'Published', 'Archived'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status.toLowerCase())}
              className={`px-4 py-2 rounded-md transition ${
                filterStatus === status.toLowerCase()
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
            <p className="text-gray-400 mt-2">Create your first exam to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exams.map((exam) => (
              <ExamCard
                key={exam.id}
                exam={exam}
                onUpdate={fetchExams}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateExamModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleExamCreated}
        />
      )}
      {showAIModal && (
        <AIGenerateModal
          onClose={() => setShowAIModal(false)}
          onSuccess={handleExamCreated}
        />
      )}
    </div>
  );
};

export default ExamDashboard;
