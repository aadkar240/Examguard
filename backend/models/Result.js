import mongoose from 'mongoose';

const resultSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  batchNumber: {
    type: Number,
    default: 1
  },
  exams: [{
    exam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam'
    },
    title: String,
    subject: String,
    totalMarks: Number,
    maxMarks: Number,
    percentage: Number,
    grade: String,
    creditPoints: Number
  }],
  cgpa: {
    type: Number,
    default: 0
  },
  totalCredits: {
    type: Number,
    default: 0
  },
  totalObtainedMarks: {
    type: Number,
    default: 0
  },
  totalMaxMarks: {
    type: Number,
    default: 0
  },
  overallPercentage: {
    type: Number,
    default: 0
  },
  generatedAt: {
    type: Date,
    default: Date.now
  },
  academicSemester: String, // e.g., "Spring 2024"
  academicYear: String // e.g., "2023-2024"
}, {
  timestamps: true
});

export default mongoose.model('Result', resultSchema);
