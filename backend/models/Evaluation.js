import mongoose from 'mongoose';

const evaluationSchema = new mongoose.Schema({
  exam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  answers: [{
    questionNumber: Number,
    answer: String,
    questionType: {
      type: String,
      enum: ['mcq', 'subjective'],
      default: 'mcq'
    },
    // For subjective questions - AI generated answer
    aiGeneratedAnswer: String,
    // Keyword extraction for subjective answers
    studentAnswerKeywords: [String],
    aiAnswerKeywords: [String],
    keywordMatchScore: {
      type: Number,
      min: 0,
      max: 100
    },
    // Auto-evaluation
    aiAutoMarks: {
      type: Number,
      default: 0
    },
    aiConfidenceScore: {
      type: Number, // 0-100, how confident is AI in the evaluation
      default: 0
    },
    // Manual review flags
    requiresManualReview: {
      type: Boolean,
      default: false
    },
    manualReviewStatus: {
      type: String,
      enum: ['pending', 'reviewed', 'accepted', 'rejected'],
      default: 'pending'
    },
    manualReviewBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    manualMarksAssigned: {
      type: Number
    },
    manualFeedback: String,
    manualReviewAt: Date,
    // Final marks (either AI or manual)
    marksObtained: {
      type: Number,
      default: 0
    },
    maxMarks: Number,
    feedback: String,
    isCorrect: Boolean, // For MCQ auto-evaluation
    aiDetectionScore: Number, // 0-100, AI-generated content likelihood
    plagiarismFlags: [String] // List of plagiarism indicators
  }],
  totalMarks: {
    type: Number,
    default: 0
  },
  maxMarks: {
    type: Number,
    required: true
  },
  percentage: {
    type: Number,
    default: 0
  },
  grade: {
    type: String,
    enum: ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F', 'Pending'],
    default: 'Pending'
  },
  status: {
    type: String,
    enum: ['submitted', 'under-evaluation', 'evaluated', 're-evaluation-requested', 're-evaluated'],
    default: 'submitted'
  },
  evaluatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  evaluatedAt: {
    type: Date
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  timeTaken: {
    type: Number // in minutes
  },
  isLate: {
    type: Boolean,
    default: false
  },
  examFeedback: {
    uiExperienceRating: {
      type: Number,
      min: 1,
      max: 5
    },
    questionClarityRating: {
      type: Number,
      min: 1,
      max: 5
    },
    overallExperienceRating: {
      type: Number,
      min: 1,
      max: 5
    },
    comments: {
      type: String,
      trim: true,
      maxlength: 1000
    },
    submittedAt: Date
  },
  reEvaluationRequested: {
    type: Boolean,
    default: false
  },
  reEvaluationReason: {
    type: String
  },
  reEvaluationDate: {
    type: Date
  },
  reEvaluationBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reEvaluationComparison: {
    previousTotalMarks: Number,
    updatedTotalMarks: Number,
    previousGrade: String,
    updatedGrade: String,
    previousPercentage: Number,
    updatedPercentage: Number,
    updatedAt: Date
  },
  auditLog: [{
    action: String,
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    details: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Calculate percentage and grade before saving
evaluationSchema.pre('save', function(next) {
  if (this.isModified('totalMarks') || this.isModified('maxMarks')) {
    this.percentage = (this.totalMarks / this.maxMarks) * 100;
    
    // Calculate grade
    if (this.percentage >= 90) this.grade = 'A+';
    else if (this.percentage >= 80) this.grade = 'A';
    else if (this.percentage >= 70) this.grade = 'B+';
    else if (this.percentage >= 60) this.grade = 'B';
    else if (this.percentage >= 50) this.grade = 'C+';
    else if (this.percentage >= 40) this.grade = 'C';
    else if (this.percentage >= 35) this.grade = 'D';
    else this.grade = 'F';
  }
  next();
});

// Index for efficient queries
evaluationSchema.index({ exam: 1, student: 1 }, { unique: true });
evaluationSchema.index({ status: 1 });

const Evaluation = mongoose.model('Evaluation', evaluationSchema);

export default Evaluation;
