import React, { useState } from 'react';
import { FiX, FiEye, FiClock, FiBook, FiAward, FiChevronDown, FiChevronUp } from 'react-icons/fi';

const ExamDetailsModal = ({ exam, onClose, onStartExam }) => {
  const [expandedQuestion, setExpandedQuestion] = useState(-1);

  const toggleQuestion = (idx) => {
    setExpandedQuestion(expandedQuestion === idx ? -1 : idx);
  };

  const getQuestionTypeColor = (type) => {
    switch(type) {
      case 'mcq': return 'bg-blue-100 text-blue-700';
      case 'true-false': return 'bg-green-100 text-green-700';
      case 'subjective': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getQuestionTypeName = (type) => {
    switch(type) {
      case 'mcq': return 'Multiple Choice';
      case 'true-false': return 'True/False';
      case 'subjective': return 'Subjective';
      default: return type;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">📋 {exam.title}</h2>
            <p className="text-blue-100 mt-1">{exam.subject}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Exam Info Cards */}
        <div className="bg-blue-50 border-b border-blue-200 p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <FiAward size={18} className="text-orange-600" />
                <span className="text-sm text-gray-600 font-medium">Total Marks</span>
              </div>
              <p className="text-2xl font-bold text-gray-800">{exam.totalMarks || exam.total_marks}</p>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <FiClock size={18} className="text-blue-600" />
                <span className="text-sm text-gray-600 font-medium">Duration</span>
              </div>
              <p className="text-2xl font-bold text-gray-800">{exam.duration} min</p>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <FiBook size={18} className="text-green-600" />
                <span className="text-sm text-gray-600 font-medium">Questions</span>
              </div>
              <p className="text-2xl font-bold text-gray-800">{exam.questions?.length || 0}</p>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <FiEye size={18} className="text-purple-600" />
                <span className="text-sm text-gray-600 font-medium">Passing</span>
              </div>
              <p className="text-2xl font-bold text-gray-800">{exam.passingMarks || Math.floor((exam.totalMarks || exam.total_marks) * 0.4)}</p>
            </div>
          </div>

          {exam.instructions && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm font-medium text-yellow-800 mb-2">📌 Instructions:</p>
              <p className="text-sm text-yellow-700">{exam.instructions}</p>
            </div>
          )}
        </div>

        {/* Questions Preview */}
        <div className="p-6 space-y-4">
          <h3 className="text-lg font-bold text-gray-800 mb-4">📚 Question Preview</h3>

          {!exam.questions || exam.questions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No questions in this exam</p>
            </div>
          ) : (
            exam.questions.map((question, idx) => (
              <div
                key={idx}
                className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition"
              >
                {/* Question Header */}
                <div
                  onClick={() => toggleQuestion(idx)}
                  className="bg-gray-50 p-4 cursor-pointer hover:bg-gray-100 transition flex items-start justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-bold text-white bg-blue-600 px-3 py-1 rounded-full">
                        Q{idx + 1}
                      </span>
                      <span className={`text-xs px-3 py-1 rounded-full font-medium ${getQuestionTypeColor(question.questionType)}`}>
                        {getQuestionTypeName(question.questionType)}
                      </span>
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full font-medium">
                        {question.marks} marks
                      </span>
                    </div>
                    <p className="text-gray-800 font-medium text-sm line-clamp-2">{question.questionText}</p>
                  </div>
                  <div className="ml-4 mt-1">
                    {expandedQuestion === idx ? (
                      <FiChevronUp className="text-gray-400" size={20} />
                    ) : (
                      <FiChevronDown className="text-gray-400" size={20} />
                    )}
                  </div>
                </div>

                {/* Expanded Content */}
                {expandedQuestion === idx && (
                  <div className="border-t border-gray-200 p-4 bg-white space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Question:</p>
                      <p className="text-gray-700">{question.questionText}</p>
                    </div>

                    {question.questionType === 'mcq' && question.options && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Options:</p>
                        <div className="space-y-2 pl-4">
                          {question.options.map((option, optIdx) => (
                            <div key={optIdx} className="text-sm text-gray-700">
                              {String.fromCharCode(65 + optIdx)}) {option}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {question.questionType === 'true-false' && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">This is a True/False question</p>
                      </div>
                    )}

                    {question.questionType === 'subjective' && (
                      <div>
                        <p className="text-sm text-yellow-700 bg-yellow-50 p-2 rounded">
                          ℹ️ This is a subjective question - you'll need to write your answer
                        </p>
                      </div>
                    )}

                    {question.rubric && (
                      <div className="bg-blue-50 border border-blue-200 p-3 rounded">
                        <p className="text-xs font-medium text-blue-700 mb-1">Marking Criteria:</p>
                        <p className="text-xs text-blue-600 italic">{question.rubric}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition"
          >
            Close
          </button>
          <button
            onClick={onStartExam}
            className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition"
          >
            <BookOpen size={18} />
            Start Exam
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExamDetailsModal;
