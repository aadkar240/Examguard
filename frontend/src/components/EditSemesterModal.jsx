import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import api from '../utils/api';
import { toast } from 'react-toastify';

const EditSemesterModal = ({ exam, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [examDetails, setExamDetails] = useState({
    department: '',
    semesters: []
  });

  useEffect(() => {
    // Fetch exam details from MongoDB backend
    const fetchExamDetails = async () => {
      try {
        const examId = exam._id || exam.id;
        const response = await api.get(`/exams/${examId}`);
        if (response.data.success) {
          const examData = response.data.exam;
          setExamDetails({
            department: examData.department || 'Computer Science',
            semesters: examData.semesters || (examData.semester ? [examData.semester] : [])
          });
        }
      } catch (error) {
        console.error('Failed to fetch exam details:', error);
        // Use defaults if fetch fails
        setExamDetails({
          department: 'Computer Science',
          semesters: []
        });
      }
    };

    if (exam?._id || exam?.id) {
      fetchExamDetails();
    }
  }, [exam]);

  const toggleSemester = (sem) => {
    setExamDetails(prev => {
      const semesters = prev.semesters.includes(sem)
        ? prev.semesters.filter(s => s !== sem)
        : [...prev.semesters, sem];
      return { ...prev, semesters: semesters.length > 0 ? semesters : [sem] };
    });
  };

  const handleSave = async () => {
    if (examDetails.semesters.length === 0) {
      toast.error('Please select at least one semester');
      return;
    }

    setLoading(true);
    try {
      const examId = exam._id || exam.id;
      const response = await api.put(`/exams/${examId}`, {
        department: examDetails.department,
        semesters: examDetails.semesters
      });

      if (response.data.success) {
        const semText = examDetails.semesters.length > 1 
          ? `Semesters ${examDetails.semesters.join(', ')}` 
          : `Semester ${examDetails.semesters[0]}`;
        toast.success(`Exam updated successfully for ${examDetails.department} - ${semText}!`);
        onSuccess();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update exam');
      console.error('Update error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex justify-between items-center rounded-t-lg">
          <div>
            <h2 className="text-xl font-bold">✏️ Edit Exam Distribution</h2>
            <p className="text-blue-100 text-sm mt-1">Update department and semesters</p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Exam Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-1">{exam?.title || 'Exam Title'}</h3>
            <p className="text-sm text-gray-600">{exam?.subject || 'Subject'}</p>
          </div>

          {/* Department Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
            <select
              value={examDetails.department}
              onChange={(e) => setExamDetails({...examDetails, department: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            >
              <option value="Computer Science">Computer Science</option>
              <option value="Information Technology">Information Technology</option>
              <option value="Electronics and Communication">Electronics and Communication</option>
              <option value="Mechanical Engineering">Mechanical Engineering</option>
              <option value="Civil Engineering">Civil Engineering</option>
              <option value="Electrical Engineering">Electrical Engineering</option>
            </select>
          </div>

          {/* Semester Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Semesters (Click to select multiple)
            </label>
            <div className="flex flex-wrap gap-2">
              {[1,2,3,4,5,6,7,8].map(sem => (
                <button
                  key={sem}
                  type="button"
                  onClick={() => toggleSemester(sem)}
                  disabled={loading}
                  className={`px-4 py-2 text-sm font-medium rounded-lg border-2 transition ${
                    examDetails.semesters.includes(sem)
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white border-gray-300 text-gray-700 hover:border-blue-400'
                  } disabled:opacity-50`}
                >
                  Semester {sem}
                </button>
              ))}
            </div>
            {examDetails.semesters.length === 0 && (
              <div className="flex items-center gap-2 mt-3 text-amber-600 text-sm">
                <AlertCircle size={16} />
                <span>Please select at least one semester</span>
              </div>
            )}
          </div>

          {/* Selected Summary */}
          {examDetails.semesters.length > 0 && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">Selected:</span> {examDetails.department} - {' '}
                {examDetails.semesters.length > 1 
                  ? `Semesters ${examDetails.semesters.sort((a, b) => a - b).join(', ')}`
                  : `Semester ${examDetails.semesters[0]}`
                }
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 rounded-b-lg">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading || examDetails.semesters.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              <>
                <Save size={16} />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditSemesterModal;
