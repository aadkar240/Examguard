import mongoose from 'mongoose';

const grievanceSchema = new mongoose.Schema({
  ticketId: {
    type: String,
    unique: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  department: {
    type: String,
    required: true,
    trim: true
  },
  semester: {
    type: Number,
    min: 1,
    max: 8,
    required: true
  },
  problemType: {
    type: String,
    enum: [
      'marks-calculation-error',
      'question-not-evaluated',
      'partiality-issue',
      'answer-key-dispute',
      'technical-upload-issue',
      'attendance-issue',
      'other'
    ],
    required: true
  },
  otherProblemText: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: ['exam-related', 'evaluation-dispute', 'marks-discrepancy', 're-evaluation', 'administrative', 'technical', 'other'],
    required: true
  },
  relatedExam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam'
  },
  relatedEvaluation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Evaluation'
  },
  subject: {
    type: String,
    required: [true, 'Please provide a subject'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please provide a description'],
    minlength: 10
  },
  attachments: [{
    filename: String,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['open', 'in-progress', 'pending-response', 'resolved', 'closed', 'escalated'],
    default: 'open'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedAt: {
    type: Date
  },
  responses: [{
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    message: {
      type: String,
      required: true
    },
    isInternal: {
      type: Boolean,
      default: false
    },
    attachments: [{
      filename: String,
      url: String
    }],
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  resolution: {
    message: String,
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    resolvedAt: Date,
    actionTaken: String
  },
  evaluationReview: {
    previousTotalMarks: Number,
    updatedTotalMarks: Number,
    previousGrade: String,
    updatedGrade: String,
    previousPercentage: Number,
    updatedPercentage: Number,
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: Date,
    remarks: String
  },
  timeline: [{
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
  escalationLevel: {
    type: Number,
    default: 0,
    min: 0,
    max: 3
  },
  escalatedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  satisfaction: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    feedback: String,
    submittedAt: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Auto-generate ticket ID
grievanceSchema.pre('save', async function(next) {
  if (!this.ticketId) {
    const count = await mongoose.model('Grievance').countDocuments();
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    this.ticketId = `GRV${year}${month}${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

// Add to timeline when status changes
grievanceSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    this.timeline.push({
      action: `Status changed to ${this.status}`,
      timestamp: new Date(),
      details: `Grievance status updated to ${this.status}`
    });
  }
  next();
});

// Index for efficient queries
grievanceSchema.index({ student: 1, status: 1 });
grievanceSchema.index({ category: 1 });
grievanceSchema.index({ department: 1, semester: 1, status: 1 });

const Grievance = mongoose.model('Grievance', grievanceSchema);

export default Grievance;
