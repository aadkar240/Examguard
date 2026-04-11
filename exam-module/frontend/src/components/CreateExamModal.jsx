import React, { useState } from 'react';
import { X, Plus, Trash2, AlertCircle } from 'lucide-react';

const CreateExamModal = ({ onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    duration: 120,
    exam_type: 'Internal',
    topics: '',
    difficulty_easy: 30,
    difficulty_medium: 50,
    difficulty_hard: 20,
    marks_mcq: 30,
    marks_short: 40,
    marks_long: 30,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('marks') || name.includes('difficulty') || name === 'duration'
        ? parseInt(value) || 0
        : value
    }));
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      setError('Title is required');
      return false;
    }
    if (!formData.subject.trim()) {
      setError('Subject is required');
      return false;
    }
    if (!formData.topics.trim()) {
      setError('Topics are required');
      return false;
    }
    
    const difficultyTotal = formData.difficulty_easy + formData.difficulty_medium + formData.difficulty_hard;
    if (difficultyTotal !== 100) {
      setError('Difficulty distribution must total 100%');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const totalMarks = formData.marks_mcq + formData.marks_short + formData.marks_long;
      
      const requestData = {
        title: formData.title,
        subject: formData.subject,
        duration: formData.duration,
        exam_type: formData.exam_type,
        topics: formData.topics.split(',').map(t => t.trim()),
        difficulty_distribution: {
          easy: formData.difficulty_easy,
          medium: formData.difficulty_medium,
          hard: formData.difficulty_hard
        },
        marks_structure: {
          mcq: formData.marks_mcq,
          short: formData.marks_short,
          long: formData.marks_long
        }
      };

      const response = await fetch('http://localhost:8000/api/exams/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to create exam');
      }

      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const difficultyTotal = formData.difficulty_easy + formData.difficulty_medium + formData.difficulty_hard;
  const marksTotal = formData.marks_mcq + formData.marks_short + formData.marks_long;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-blue-600 text-white p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Create Exam</h2>
            <p className="text-blue-100 text-sm">Manual exam creation</p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
              <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Basic Info */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Exam Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Mid-Term Examination - Data Structures"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject *
              </label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Data Structures"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Exam Type
              </label>
              <select
                name="exam_type"
                value={formData.exam_type}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Internal">Internal</option>
                <option value="Semester">Semester</option>
                <option value="MCQ">MCQ</option>
                <option value="Practical">Practical</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Topics * (comma-separated)
            </label>
            <input
              type="text"
              name="topics"
              value={formData.topics}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Arrays, Linked Lists, Trees"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duration (minutes)
            </label>
            <input
              type="number"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="1"
              required
            />
          </div>

          {/* Difficulty Distribution */}
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center justify-between">
              Difficulty Distribution
              <span className={`text-sm ${difficultyTotal === 100 ? 'text-green-600' : 'text-red-600'}`}>
                Total: {difficultyTotal}%
              </span>
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Easy (%)</label>
                <input
                  type="number"
                  name="difficulty_easy"
                  value={formData.difficulty_easy}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-purple-200 rounded-lg"
                  min="0"
                  max="100"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Medium (%)</label>
                <input
                  type="number"
                  name="difficulty_medium"
                  value={formData.difficulty_medium}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-purple-200 rounded-lg"
                  min="0"
                  max="100"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Hard (%)</label>
                <input
                  type="number"
                  name="difficulty_hard"
                  value={formData.difficulty_hard}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-purple-200 rounded-lg"
                  min="0"
                  max="100"
                />
              </div>
            </div>
          </div>

          {/* Marks Structure */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center justify-between">
              Marks Structure
              <span className="text-sm text-gray-600">
                Total: {marksTotal}
              </span>
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">MCQ</label>
                <input
                  type="number"
                  name="marks_mcq"
                  value={formData.marks_mcq}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-blue-200 rounded-lg"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Short Answer</label>
                <input
                  type="number"
                  name="marks_short"
                  value={formData.marks_short}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-blue-200 rounded-lg"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Long Answer</label>
                <input
                  type="number"
                  name="marks_long"
                  value={formData.marks_long}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-blue-200 rounded-lg"
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Exam'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateExamModal;
