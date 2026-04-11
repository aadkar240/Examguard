import mongoose from 'mongoose';

const proctoringViolationSchema = new mongoose.Schema({
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProctoringSession',
    required: true,
  },
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
  type: {
    type: String,
    required: true,
    trim: true,
  },
  severity: {
    type: Number,
    min: 1,
    max: 5,
    default: 2,
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1,
    default: 0.7,
  },
  scoreDelta: {
    type: Number,
    default: 0,
  },
  cumulativeScore: {
    type: Number,
    default: 0,
  },
  detailsEncrypted: {
    type: String,
    default: '',
  },
  detailsIv: {
    type: String,
    default: '',
  },
  detailsAuthTag: {
    type: String,
    default: '',
  },
  eventTimestamp: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

proctoringViolationSchema.index({ session: 1, eventTimestamp: -1 });
proctoringViolationSchema.index({ exam: 1, student: 1, eventTimestamp: -1 });

const ProctoringViolation = mongoose.model('ProctoringViolation', proctoringViolationSchema);

export default ProctoringViolation;
