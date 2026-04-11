import React, { useState } from 'react';
import { Calendar, Clock, FileText, Brain, Eye, Archive, CheckCircle, Trash2 } from 'lucide-react';
import api from '../utils/api';

const ExamCardComponent = ({ exam, onUpdate }) => {
  const [loading, setLoading] = useState(false);

  const handlePublish = async () => {
    if (!window.confirm('Are you sure you want to publish this exam?')) return;
    
    setLoading(true);
    try {
      await api.patch(`/exams/${exam.id}/publish`);
      onUpdate();
    } catch (error) {
      console.error('Failed to publish exam:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async () => {
    if (!window.confirm('Are you sure you want to archive this exam?')) return;
    
    setLoading(true);
    try {
      await api.put(`/exams/${exam.id}`, {
        status: 'completed',
        isPublished: false
      });
      onUpdate();
    } catch (error) {
      console.error('Failed to archive exam:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to DELETE this exam? This action cannot be undone.')) return;
    
    setLoading(true);
    try {
      await api.delete(`/exams/${exam.id}`);
      onUpdate();
    } catch (error) {
      console.error('Failed to delete exam:', error);
      alert('Error deleting exam');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'Published':
        return 'bg-green-100 text-green-800';
      case 'Archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-lg transition p-6 border border-gray-200">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-800 mb-1">{exam.title}</h3>
          <p className="text-sm text-gray-600">{exam.subject}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(exam.status)}`}>
            {exam.status}
          </span>
          {exam.is_ai_generated && (
            <Brain className="text-purple-600" size={20} title="AI Generated" />
          )}
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <FileText size={16} />
          <span>{exam.question_count || 0} Questions</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <CheckCircle size={16} />
          <span>{exam.total_marks} Marks</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Clock size={16} />
          <span>{exam.duration} min</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar size={16} />
          <span>{exam.exam_type}</span>
        </div>
      </div>

      {/* Topics */}
      {exam.topics && exam.topics.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {exam.topics.slice(0, 3).map((topic, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded"
              >
                {topic}
              </span>
            ))}
            {exam.topics.length > 3 && (
              <span className="px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded">
                +{exam.topics.length - 3} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-4 border-t border-gray-200">
        <button
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
        >
          <Eye size={16} />
          View
        </button>
        
        {exam.status === 'Draft' && (
          <button
            onClick={handlePublish}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm disabled:opacity-50"
          >
            <CheckCircle size={16} />
            Publish
          </button>
        )}
        
        {exam.status !== 'Archived' && (
          <button
            onClick={handleArchive}
            disabled={loading}
            className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition text-sm"
            title="Archive"
          >
            <Archive size={16} />
          </button>
        )}

        <button
          onClick={handleDelete}
          disabled={loading}
          className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm disabled:opacity-50"
          title="Delete Exam"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Date */}
      <div className="mt-3 text-xs text-gray-500">
        Created {new Date(exam.created_at || Date.now()).toLocaleDateString()}
      </div>
    </div>
  );
};

export default ExamCardComponent;
