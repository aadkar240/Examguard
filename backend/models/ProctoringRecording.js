import mongoose from 'mongoose';

const proctoringRecordingSchema = new mongoose.Schema({
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProctoringSession',
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
  fileName: {
    type: String,
    required: true,
  },
  filePath: {
    type: String,
    required: true,
  },
  isEncrypted: {
    type: Boolean,
    default: true,
  },
  encryptionIv: {
    type: String,
    default: '',
  },
  encryptionAuthTag: {
    type: String,
    default: '',
  },
  mimeType: {
    type: String,
    default: 'video/webm',
  },
  fileSize: {
    type: Number,
    default: 0,
  },
  warningCount: {
    type: Number,
    default: 0,
  },
  terminationReason: {
    type: String,
    default: 'normal-submit',
  },
  startedAt: {
    type: Date,
  },
  endedAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

proctoringRecordingSchema.index({ exam: 1, student: 1, createdAt: -1 });

const ProctoringRecording = mongoose.model('ProctoringRecording', proctoringRecordingSchema);

export default ProctoringRecording;
