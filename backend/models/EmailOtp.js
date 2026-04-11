import mongoose from 'mongoose';

const emailOtpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  purpose: {
    type: String,
    enum: ['register', 'login', 'forgot_password', 'update_password'],
    required: true
  },
  otp: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['student', 'faculty', 'admin'],
    default: 'student'
  },
  expiresAt: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

emailOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const EmailOtp = mongoose.model('EmailOtp', emailOtpSchema);

export default EmailOtp;