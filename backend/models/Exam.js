import mongoose from 'mongoose';

const examSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide exam title'],
    trim: true
  },
  subject: {
    type: String,
    required: [true, 'Please provide subject'],
    trim: true
  },
  department: {
    type: String,
    required: true,
    trim: true
  },
  semesters: [{
    type: Number,
    required: true,
    min: 1,
    max: 8
  }],
  examType: {
    type: String,
    enum: ['midterm', 'final', 'quiz', 'assignment'],
    default: 'midterm'
  },
  questionType: {
    type: String,
    enum: ['mcq', 'subjective', 'hybrid'],
    default: 'hybrid'
  },
  totalMarks: {
    type: Number,
    required: true,
    min: 0
  },
  passingMarks: {
    type: Number,
    required: true,
    min: 0
  },
  duration: {
    type: Number, // in minutes
    required: true,
    min: 1
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  instructions: {
    type: String,
    default: ''
  },
  questions: [{
    questionNumber: Number,
    questionText: String,
    questionType: {
      type: String,
      enum: ['mcq', 'subjective', 'true-false'],
      default: 'mcq'
    },
    marks: Number,
    options: [String], // For MCQ questions
    correctAnswer: String, // For MCQ questions (index or text)
    rubric: String // Marking scheme for subjective questions
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'ongoing', 'completed', 'cancelled'],
    default: 'draft'
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  scheduledPublishAt: {
    type: Date,
    default: null
  },
  studentsEnrolled: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  blockedStudents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Validation: Ensure at least one semester is provided
examSchema.pre('validate', function(next) {
  if (!this.semesters || this.semesters.length === 0) {
    this.invalidate('semesters', 'At least one semester must be selected');
  }
  next();
});

// Index for efficient queries
examSchema.index({ department: 1, semesters: 1, startTime: 1 });
examSchema.index({ status: 1 });
examSchema.index({ isPublished: 1, scheduledPublishAt: 1, status: 1 });

const Exam = mongoose.model('Exam', examSchema);

export default Exam;
