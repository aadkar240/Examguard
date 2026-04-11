import React, { useRef, useState } from 'react';
import { X, Eye, Edit2, ChevronUp, ChevronDown, Trash2, CheckCircle } from 'lucide-react';
import api from '../utils/api';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const ReviewExamModal = ({ exam, onClose, onPublish, initialPublishSettings }) => {
  const { user } = useAuth();
  const subjectiveQuestionTextareaRef = useRef(null);
  const [expandedQuestion, setExpandedQuestion] = useState(0);
  const [publishing, setPublishing] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [editData, setEditData] = useState({});
  const [examDetails, setExamDetails] = useState({
    department: user?.department || 'Computer Science',
    semesters: user?.semester ? [user?.semester] : [6],
    publishMode: initialPublishSettings?.publishMode || 'immediate',
    scheduledPublishAt: initialPublishSettings?.scheduledPublishAt || ''
  });

  const algebraToolItems = ['+', '-', '×', '÷', '=', '≠', '≤', '≥', '^', '√', 'π', '(', ')', 'sin()', 'cos()', 'tan()'];
  
  const toggleSemester = (sem) => {
    setExamDetails(prev => {
      const semesters = prev.semesters.includes(sem)
        ? prev.semesters.filter(s => s !== sem)
        : [...prev.semesters, sem];
      return { ...prev, semesters: semesters.length > 0 ? semesters : [sem] };
    });
  };

  const toggleQuestion = (idx) => {
    setExpandedQuestion(expandedQuestion === idx ? -1 : idx);
  };

  const handlePublish = async () => {
    // Validate semester selection
    if (!examDetails.semesters || examDetails.semesters.length === 0) {
      toast.error('Please select at least one semester');
      return;
    }

    const isScheduledPublish = examDetails.publishMode === 'scheduled';

    if (isScheduledPublish && !examDetails.scheduledPublishAt) {
      toast.error('Please select publish date and time');
      return;
    }

    const scheduledPublishDate = isScheduledPublish ? new Date(examDetails.scheduledPublishAt) : null;

    if (isScheduledPublish && Number.isNaN(scheduledPublishDate.getTime())) {
      toast.error('Invalid publish date and time');
      return;
    }

    if (isScheduledPublish && scheduledPublishDate <= new Date()) {
      toast.error('Scheduled publish time must be in the future');
      return;
    }

    setPublishing(true);
    try {
      // Helper function to normalize question type for MongoDB
      const normalizeQuestionType = (type) => {
        const typeStr = String(type).toLowerCase();
        if (typeStr.includes('mcq') || typeStr.includes('multiple')) {
          return 'mcq';
        } else if (typeStr.includes('true') || typeStr.includes('false')) {
          return 'true-false';
        } else {
          return 'subjective';
        }
      };

      const publishBaseTime = isScheduledPublish ? scheduledPublishDate : new Date();

      // Save exam to MongoDB backend
      const examData = {
        title: exam.title || `${exam.subject} Exam`,
        subject: exam.subject,
        department: examDetails.department,
        semesters: examDetails.semesters,
        totalMarks: exam.total_marks,
        passingMarks: Math.floor(exam.total_marks * 0.4),
        duration: exam.duration,
        startTime: publishBaseTime,
        endTime: new Date(new Date(publishBaseTime).getTime() + 30 * 24 * 60 * 60 * 1000),
        questionType: 'hybrid',
        examType: 'midterm',
        instructions: `This is an AI-generated exam on ${exam.subject}. Total marks: ${exam.total_marks}. Duration: ${exam.duration} minutes.`,
        isPublished: !isScheduledPublish,
        status: isScheduledPublish ? 'scheduled' : 'ongoing',
        scheduledPublishAt: isScheduledPublish ? scheduledPublishDate.toISOString() : null,
        questions: exam.questions.map((q, idx) => ({
          questionNumber: idx + 1,
          questionText: q.question_text,
          questionType: normalizeQuestionType(q.question_type),
          marks: q.marks,
          options: q.options || [],
          correctAnswer: q.options ? q.options[0] : q.correct_answer || '',
          rubric: q.explanation || ''
        }))
      };

      const response = await api.post('/exams', examData);
      
      if (response.data.success) {
        // No need to call publish endpoint again since we already set isPublished: true
        const semText = examDetails.semesters.length > 1 ? `Semesters ${examDetails.semesters.join(', ')}` : `Semester ${examDetails.semesters[0]}`;
        if (isScheduledPublish) {
          toast.success(`Exam scheduled successfully for ${examDetails.department} - ${semText}. It will auto-publish on ${scheduledPublishDate.toLocaleString()}.`);
        } else {
          toast.success(`Exam published successfully for ${examDetails.department} - ${semText}!`);
        }
        onPublish(response.data.exam);
      }
    } catch (error) {
      console.error('Publish error:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Error publishing exam';
      toast.error(`Failed to publish exam: ${errorMessage}`);
    } finally {
      setPublishing(false);
    }
  };

  const handleEditQuestion = (idx, question) => {
    setEditingQuestion(idx);
    setEditData({ ...question });
  };

  const insertIntoSubjectiveQuestionText = (valueToInsert) => {
    const textarea = subjectiveQuestionTextareaRef.current;
    if (!textarea) {
      setEditData((prev) => ({ ...prev, question_text: `${prev.question_text || ''}${valueToInsert}` }));
      return;
    }

    const selectionStart = textarea.selectionStart ?? (editData.question_text || '').length;
    const selectionEnd = textarea.selectionEnd ?? selectionStart;
    const currentText = editData.question_text || '';
    const updatedText = `${currentText.slice(0, selectionStart)}${valueToInsert}${currentText.slice(selectionEnd)}`;
    const caretPosition = selectionStart + valueToInsert.length;

    setEditData((prev) => ({ ...prev, question_text: updatedText }));

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(caretPosition, caretPosition);
    });
  };

  const saveEditedQuestion = () => {
    if (editingQuestion !== null) {
      exam.questions[editingQuestion] = editData;
      setEditingQuestion(null);
      toast.success('Question updated');
    }
  };

  const deleteQuestion = (idx) => {
    exam.questions.splice(idx, 1);
    setExpandedQuestion(-1);
    toast.info('Question removed');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">📋 Review AI Generated Exam</h2>
            <p className="text-blue-100 mt-1">Review questions before publishing to students</p>
          </div>
          <button
            onClick={onClose}
            disabled={publishing}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Exam Summary */}
        <div className="bg-blue-50 border-b border-blue-200 p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-600 font-medium">Subject</p>
              <p className="text-lg font-bold text-gray-800 mt-1">{exam.subject}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Marks</p>
              <p className="text-lg font-bold text-gray-800 mt-1">{exam.total_marks}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Duration</p>
              <p className="text-lg font-bold text-gray-800 mt-1">{exam.duration} min</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Questions</p>
              <p className="text-lg font-bold text-gray-800 mt-1">{exam.questions?.length || 0}</p>
            </div>
          </div>
          
          {/* Target Department & Semester */}
          <div className="border-t border-blue-200 pt-4 mt-4">
            <p className="text-sm font-semibold text-gray-700 mb-3">📚 Publish To:</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Department</label>
                <select
                  value={examDetails.department}
                  onChange={(e) => setExamDetails({...examDetails, department: e.target.value})}
                  className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                  disabled={publishing}
                >
                  <option value="Computer Science">Computer Science</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Electronics and Communication">Electronics and Communication</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                  <option value="Civil Engineering">Civil Engineering</option>
                  <option value="Electrical Engineering">Electrical Engineering</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-2">Semesters (Click to select multiple)</label>
                <div className="flex flex-wrap gap-2">
                  {[1,2,3,4,5,6,7,8].map(sem => (
                    <button
                      key={sem}
                      type="button"
                      onClick={() => toggleSemester(sem)}
                      disabled={publishing}
                      className={`px-3 py-1 text-sm rounded-lg border-2 transition ${
                        examDetails.semesters.includes(sem)
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'bg-white border-gray-300 text-gray-700 hover:border-blue-400'
                      } disabled:opacity-50`}
                    >
                      Sem {sem}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1">Publish Mode</label>
                <select
                  value={examDetails.publishMode}
                  onChange={(e) => setExamDetails({ ...examDetails, publishMode: e.target.value })}
                  className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                  disabled={publishing}
                >
                  <option value="immediate">Publish Now (Surprise Exam)</option>
                  <option value="scheduled">Schedule Publish</option>
                </select>
              </div>

              {examDetails.publishMode === 'scheduled' && (
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Publish Date & Time</label>
                  <input
                    type="datetime-local"
                    value={examDetails.scheduledPublishAt}
                    onChange={(e) => setExamDetails({ ...examDetails, scheduledPublishAt: e.target.value })}
                    className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white text-sm"
                    disabled={publishing}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Questions List */}
        <div className="p-6 space-y-4">
          {!exam.questions || exam.questions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No questions generated. Please try again.</p>
            </div>
          ) : (
            exam.questions.map((question, idx) => (
              <div
                key={idx}
                className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition"
              >
                {/* Question Header */}
                <div
                  onClick={() => !editingQuestion && toggleQuestion(idx)}
                  className="bg-gray-50 p-4 cursor-pointer hover:bg-gray-100 transition flex items-start justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-primary-600 bg-primary-100 px-3 py-1 rounded-full">
                        Q{idx + 1}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded font-medium ${
                        question.question_type === 'mcq' ? 'bg-blue-100 text-blue-700' :
                        question.question_type === 'true-false' ? 'bg-green-100 text-green-700' :
                        'bg-orange-100 text-orange-700'
                      }`}>
                        {question.question_type === 'mcq' ? 'MCQ' :
                         question.question_type === 'true-false' ? 'T/F' :
                         'Subjective'}
                      </span>
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded font-medium">
                        {question.marks} marks
                      </span>
                    </div>
                    <p className="text-gray-800 font-medium mt-2">{question.question_text}</p>
                  </div>
                  <div className="ml-4">
                    {expandedQuestion === idx ? (
                      <ChevronUp className="text-gray-400" />
                    ) : (
                      <ChevronDown className="text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Content */}
                {expandedQuestion === idx && (
                  <div className="border-t border-gray-200 p-4 bg-white space-y-4">
                    {editingQuestion === idx ? (
                      // Edit Mode
                      <div className="space-y-4 bg-blue-50 p-4 rounded-lg">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Question Text
                          </label>
                          <textarea
                            ref={editData.question_type === 'subjective' ? subjectiveQuestionTextareaRef : null}
                            value={editData.question_text || ''}
                            onChange={(e) => setEditData({ ...editData, question_text: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-primary-500"
                            rows="3"
                          />
                          {editData.question_type === 'subjective' && (
                            <div className="mt-2">
                              <p className="text-xs text-gray-600 mb-2">Algebra toolbox:</p>
                              <div className="flex flex-wrap gap-2">
                                {algebraToolItems.map((item) => (
                                  <button
                                    key={item}
                                    type="button"
                                    onClick={() => insertIntoSubjectiveQuestionText(item)}
                                    className="px-2 py-1 text-xs rounded border border-gray-300 bg-white hover:bg-gray-100 text-gray-700"
                                  >
                                    {item}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {editData.question_type === 'mcq' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Options (one per line)
                            </label>
                            <textarea
                              value={(editData.options || []).join('\n')}
                              onChange={(e) => setEditData({ ...editData, options: e.target.value.split('\n') })}
                              className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-primary-500"
                              rows="4"
                            />
                          </div>
                        )}

                        <div className="flex gap-2">
                          <button
                            onClick={saveEditedQuestion}
                            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                          >
                            Save Changes
                          </button>
                          <button
                            onClick={() => setEditingQuestion(null)}
                            className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      // View Mode
                      <>
                        {question.question_type === 'mcq' && question.options && (
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">Options:</p>
                            <div className="space-y-2 pl-4">
                              {question.options.map((option, optIdx) => (
                                <div
                                  key={optIdx}
                                  className={`text-sm p-2 rounded ${
                                    option === question.correct_answer
                                      ? 'bg-green-100 text-green-800 border-l-4 border-green-600'
                                      : 'text-gray-700'
                                  }`}
                                >
                                  {String.fromCharCode(65 + optIdx)}) {option}
                                  {option === question.correct_answer && (
                                    <span className="ml-2 text-xs font-bold">✓ CORRECT</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {question.question_type === 'true-false' && (
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">Answer:</p>
                            <div className={`text-sm p-2 rounded bg-green-100 text-green-800 border-l-4 border-green-600`}>
                              {question.correct_answer}
                            </div>
                          </div>
                        )}

                        {question.explanation && (
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">Explanation/Rubric:</p>
                            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded italic">
                              {question.explanation}
                            </p>
                          </div>
                        )}

                        <div className="flex gap-2 pt-2 border-t">
                          <button
                            onClick={() => handleEditQuestion(idx, question)}
                            className="flex items-center gap-1 px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
                          >
                            <Edit2 size={14} /> Edit
                          </button>
                          <button
                            onClick={() => deleteQuestion(idx)}
                            className="flex items-center gap-1 px-3 py-2 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition ml-auto"
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      </>
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
            disabled={publishing}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handlePublish}
            disabled={publishing || !exam.questions || exam.questions.length === 0}
            className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {publishing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Publishing...
              </>
            ) : (
              <>
                <CheckCircle size={18} />
                Publish Exam to Students
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewExamModal;
