import React, { useState } from 'react';
import { X, Brain, Loader, AlertCircle } from 'lucide-react';
import ReviewExamModal from './ReviewExamModal';
import api from '../utils/api';

const AIGenerateExamModal = ({ onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedExam, setGeneratedExam] = useState(null);
  const [showReview, setShowReview] = useState(false);
  const [formData, setFormData] = useState({
    subject: '',
    topics: '',
    total_marks: 100,
    duration: 120,
    exam_type: 'Internal',
    difficulty_easy: 30,
    difficulty_medium: 50,
    difficulty_hard: 20,
    marks_mcq: 30,
    marks_short: 40,
    marks_long: 30,
    additional_instructions: '',
    publishMode: 'immediate',
    scheduledPublishAt: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('marks') || name.includes('difficulty') || name === 'total_marks' || name === 'duration'
        ? parseInt(value) || 0
        : value
    }));
  };

  const validateForm = () => {
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

    const marksTotal = formData.marks_mcq + formData.marks_short + formData.marks_long;
    if (marksTotal !== formData.total_marks) {
      setError(`Marks distribution must equal total marks (${formData.total_marks})`);
      return false;
    }

    if (formData.publishMode === 'scheduled') {
      if (!formData.scheduledPublishAt) {
        setError('Please select scheduled publish date and time');
        return false;
      }

      const scheduledDate = new Date(formData.scheduledPublishAt);
      if (Number.isNaN(scheduledDate.getTime()) || scheduledDate <= new Date()) {
        setError('Scheduled publish date/time must be in the future');
        return false;
      }
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
      const requestData = {
        subject: formData.subject,
        topics: formData.topics.split(',').map(t => t.trim()),
        total_marks: formData.total_marks,
        duration: formData.duration,
        exam_type: formData.exam_type,
        difficulty_distribution: {
          easy: formData.difficulty_easy,
          medium: formData.difficulty_medium,
          hard: formData.difficulty_hard
        },
        marks_structure: {
          mcq: formData.marks_mcq,
          short: formData.marks_short,
          long: formData.marks_long
        },
        additional_instructions: formData.additional_instructions || null
      };

      const response = await api.post('/exams/ai-generate', requestData);
      const data = response?.data?.exam || response?.data;

      if (!data || !Array.isArray(data.questions) || data.questions.length === 0) {
        throw new Error('AI service returned an invalid exam response');
      }

      // Store generated exam and show review modal
      setGeneratedExam(data);
      setShowReview(true);
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Failed to generate exam';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handlePublishExam = (publishedExam) => {
    onSuccess();
    onClose();
  };

  const difficultyTotal = formData.difficulty_easy + formData.difficulty_medium + formData.difficulty_hard;
  const marksTotal = formData.marks_mcq + formData.marks_short + formData.marks_long;

  // Show review modal if exam was generated
  if (showReview && generatedExam) {
    return (
      <ReviewExamModal
        exam={generatedExam}
        onClose={() => onClose()}
        onPublish={handlePublishExam}
        initialPublishSettings={{
          publishMode: formData.publishMode,
          scheduledPublishAt: formData.scheduledPublishAt
        }}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Brain size={28} />
            <div>
              <h2 className="text-2xl font-bold">AI Exam Generation</h2>
              <p className="text-purple-100 text-sm">Powered by Groq Llama 3.1</p>
            </div>
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="e.g., Arrays, Linked Lists, Trees, Graphs"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Marks
              </label>
              <input
                type="number"
                name="total_marks"
                value={formData.total_marks}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                min="1"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                min="1"
                required
              />
            </div>
          </div>

          {/* Publish Settings */}
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h3 className="font-semibold text-gray-800 mb-3">Publish Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Publish Mode</label>
                <select
                  name="publishMode"
                  value={formData.publishMode}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                >
                  <option value="immediate">Publish Now (Surprise Exam)</option>
                  <option value="scheduled">Schedule Publish</option>
                </select>
              </div>

              {formData.publishMode === 'scheduled' && (
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Publish Date & Time</label>
                  <input
                    type="datetime-local"
                    name="scheduledPublishAt"
                    value={formData.scheduledPublishAt}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                  />
                </div>
              )}
            </div>
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
              <span className={`text-sm ${marksTotal === formData.total_marks ? 'text-green-600' : 'text-red-600'}`}>
                Total: {marksTotal} / {formData.total_marks}
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

          {/* Additional Instructions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Instructions (Optional)
            </label>
            <textarea
              name="additional_instructions"
              value={formData.additional_instructions}
              onChange={handleChange}
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Any specific requirements or focus areas..."
            />
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
              className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader className="animate-spin" size={20} />
                  Generating...
                </>
              ) : (
                <>
                  <Brain size={20} />
                  Generate Exam
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AIGenerateExamModal;
