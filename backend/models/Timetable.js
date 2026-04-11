import mongoose from 'mongoose';

const timetableEntrySchema = new mongoose.Schema({
  examTitle: {
    type: String,
    required: true,
    trim: true
  },
  examType: {
    type: String,
    required: true,
    trim: true
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  examDate: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    required: true,
    trim: true
  },
  durationMinutes: {
    type: Number,
    required: true,
    min: 1
  }
}, { _id: false });

const timetableSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 150
  },
  academicYear: {
    type: String,
    trim: true,
    default: ''
  },
  semesterLabel: {
    type: String,
    trim: true,
    default: ''
  },
  entries: {
    type: [timetableEntrySchema],
    validate: {
      validator: (value) => Array.isArray(value) && value.length > 0,
      message: 'At least one timetable entry is required.'
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

timetableSchema.index({ isActive: 1, createdAt: -1 });

export default mongoose.model('Timetable', timetableSchema);
