import mongoose from 'mongoose';

const proctoringSessionSchema = new mongoose.Schema({
  exam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true,
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'terminated'],
    default: 'active',
  },
  startedAt: {
    type: Date,
    default: Date.now,
  },
  endedAt: {
    type: Date,
  },
  violationScore: {
    type: Number,
    default: 0,
  },
  warningCount: {
    type: Number,
    default: 0,
  },
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low',
  },
  metadata: {
    userAgent: String,
    platform: String,
    ipAddress: String,
  },
}, {
  timestamps: true,
});

proctoringSessionSchema.index({ exam: 1, student: 1, startedAt: -1 });
proctoringSessionSchema.index({ status: 1, violationScore: -1 });

const ProctoringSession = mongoose.model('ProctoringSession', proctoringSessionSchema);

export default ProctoringSession;
