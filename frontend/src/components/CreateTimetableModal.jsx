import React, { useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../utils/api';

const emptyEntry = {
  examTitle: '',
  examType: 'midterm',
  subject: '',
  examDate: '',
  startTime: '',
  durationMinutes: 60
};

const CreateTimetableModal = ({ onClose, onSuccess }) => {
  const [title, setTitle] = useState('Exam Timetable');
  const [academicYear, setAcademicYear] = useState('');
  const [semesterLabel, setSemesterLabel] = useState('');
  const [entries, setEntries] = useState([{ ...emptyEntry }]);
  const [submitting, setSubmitting] = useState(false);

  const handleEntryChange = (index, field, value) => {
    setEntries((prev) => prev.map((entry, idx) => (
      idx === index ? { ...entry, [field]: value } : entry
    )));
  };

  const addEntry = () => {
    setEntries((prev) => [...prev, { ...emptyEntry }]);
  };

  const removeEntry = (index) => {
    setEntries((prev) => prev.filter((_, idx) => idx !== index));
  };

  const validate = () => {
    if (!title.trim()) return 'Title is required';
    if (!entries.length) return 'At least one timetable row is required';

    const invalid = entries.some((entry) => (
      !entry.examTitle.trim() ||
      !entry.examType.trim() ||
      !entry.subject.trim() ||
      !entry.examDate ||
      !entry.startTime ||
      Number(entry.durationMinutes) <= 0
    ));

    if (invalid) return 'Please fill all required fields in each row';
    return '';
  };

  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) {
      toast.warning(validationError);
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/timetables', {
        title,
        academicYear,
        semesterLabel,
        entries: entries.map((entry) => ({
          ...entry,
          durationMinutes: Number(entry.durationMinutes)
        }))
      });
      toast.success('Timetable created and published for students.');
      onSuccess?.();
      onClose?.();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create timetable');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Create Exam Timetable</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={22} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Timetable title"
            className="input w-full"
          />
          <input
            type="text"
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
            placeholder="Academic year (e.g. 2026-2027)"
            className="input w-full"
          />
          <input
            type="text"
            value={semesterLabel}
            onChange={(e) => setSemesterLabel(e.target.value)}
            placeholder="Semester label (e.g. Semester 4)"
            className="input w-full"
          />
        </div>

        <div className="space-y-3">
          {entries.map((entry, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-800">Exam Row {index + 1}</h3>
                {entries.length > 1 && (
                  <button
                    onClick={() => removeEntry(index)}
                    className="text-red-600 hover:text-red-700"
                    title="Remove row"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <input
                  type="text"
                  value={entry.examTitle}
                  onChange={(e) => handleEntryChange(index, 'examTitle', e.target.value)}
                  placeholder="Exam title"
                  className="input w-full"
                />
                <select
                  value={entry.examType}
                  onChange={(e) => handleEntryChange(index, 'examType', e.target.value)}
                  className="input w-full"
                >
                  <option value="midterm">Midterm</option>
                  <option value="final">Final</option>
                  <option value="quiz">Quiz</option>
                  <option value="assignment">Assignment</option>
                  <option value="practical">Practical</option>
                  <option value="other">Other</option>
                </select>
                <input
                  type="text"
                  value={entry.subject}
                  onChange={(e) => handleEntryChange(index, 'subject', e.target.value)}
                  placeholder="Subject"
                  className="input w-full"
                />
                <input
                  type="date"
                  value={entry.examDate}
                  onChange={(e) => handleEntryChange(index, 'examDate', e.target.value)}
                  className="input w-full"
                />
                <input
                  type="time"
                  value={entry.startTime}
                  onChange={(e) => handleEntryChange(index, 'startTime', e.target.value)}
                  className="input w-full"
                />
                <input
                  type="number"
                  min="1"
                  value={entry.durationMinutes}
                  onChange={(e) => handleEntryChange(index, 'durationMinutes', e.target.value)}
                  placeholder="Duration (minutes)"
                  className="input w-full"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mt-5">
          <button
            onClick={addEntry}
            className="btn btn-secondary inline-flex items-center gap-2"
          >
            <Plus size={16} />
            Add Row
          </button>

          <div className="flex gap-3">
            <button onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button onClick={handleSubmit} disabled={submitting} className="btn btn-primary">
              {submitting ? 'Publishing...' : 'Publish Timetable'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateTimetableModal;
