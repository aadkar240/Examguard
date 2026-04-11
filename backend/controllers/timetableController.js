import Timetable from '../models/Timetable.js';

export const createTimetable = async (req, res) => {
  try {
    const { title, academicYear, semesterLabel, entries } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }

    if (!Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one timetable entry is required' });
    }

    const normalizedEntries = entries.map((entry) => ({
      examTitle: String(entry.examTitle || '').trim(),
      examType: String(entry.examType || '').trim(),
      subject: String(entry.subject || '').trim(),
      examDate: entry.examDate,
      startTime: String(entry.startTime || '').trim(),
      durationMinutes: Number(entry.durationMinutes) || 0,
      venue: String(entry.venue || 'TBA').trim()
    }));

    const hasInvalid = normalizedEntries.some((entry) => (
      !entry.examTitle ||
      !entry.examType ||
      !entry.subject ||
      !entry.examDate ||
      !entry.startTime ||
      entry.durationMinutes <= 0
    ));

    if (hasInvalid) {
      return res.status(400).json({
        success: false,
        message: 'Each timetable row requires exam title, type, subject, date, start time, and valid duration.'
      });
    }

    await Timetable.updateMany({ isActive: true }, { $set: { isActive: false } });

    const timetable = await Timetable.create({
      title: title.trim(),
      academicYear: String(academicYear || '').trim(),
      semesterLabel: String(semesterLabel || '').trim(),
      entries: normalizedEntries,
      createdBy: req.user.id,
      isActive: true
    });

    const populated = await Timetable.findById(timetable._id).populate('createdBy', 'name role');

    return res.status(201).json({
      success: true,
      message: 'Exam timetable created successfully',
      timetable: populated
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error creating timetable',
      error: error.message
    });
  }
};

export const getLatestTimetable = async (req, res) => {
  try {
    const timetable = await Timetable.findOne({ isActive: true })
      .populate('createdBy', 'name role')
      .sort({ createdAt: -1 });

    if (!timetable) {
      return res.status(404).json({ success: false, message: 'No timetable published yet' });
    }

    return res.status(200).json({ success: true, timetable });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching timetable',
      error: error.message
    });
  }
};

export const deleteTimetable = async (req, res) => {
  try {
    const { id } = req.params;

    const timetable = await Timetable.findById(id);

    if (!timetable) {
      return res.status(404).json({ success: false, message: 'Timetable not found' });
    }

    await Timetable.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Timetable deleted successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error deleting timetable',
      error: error.message
    });
  }
};

export default { createTimetable, getLatestTimetable, deleteTimetable };
