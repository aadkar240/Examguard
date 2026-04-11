import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import User from '../models/User.js';
import EmailOtp from '../models/EmailOtp.js';
import { sendOtpEmail, sendAccountStatusEmail } from '../services/emailService.js';

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

const OTP_EXPIRY_MINUTES = Number(process.env.OTP_EXPIRY_MINUTES || 10);

const isFacultyAutoApprovalEnabled = () => {
  return String(process.env.AUTO_APPROVE_FACULTY || 'false').toLowerCase() === 'true';
};

const generateNumericOtp = () => String(Math.floor(100000 + Math.random() * 900000));

const formatUserResponse = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  studentId: user.studentId,
  department: user.department,
  semester: user.semester,
  facultyApprovalStatus: user.facultyApprovalStatus
});

const isFacultyPendingApproval = (user) => {
  return user.role === 'faculty' && user.facultyApprovalStatus !== 'approved';
};

const getFacultyApprovalMessage = (user) => {
  if (user.facultyApprovalStatus === 'rejected') {
    return 'Faculty account request was rejected by admin';
  }
  return 'Faculty account is pending admin approval';
};

export const sendRegistrationOtp = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, role = 'student' } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    const otp = generateNumericOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await EmailOtp.deleteMany({ email, purpose: 'register' });
    await EmailOtp.create({ email, role, purpose: 'register', otp, expiresAt });

    try {
      await sendOtpEmail({ to: email, otp, purpose: 'register' });
    } catch (emailError) {
      if (process.env.NODE_ENV === 'development') {
        return res.status(200).json({
          success: true,
          message: 'OTP generated (email delivery failed in development mode).',
          otp
        });
      }
      throw emailError;
    }

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully to your email'
    });
  } catch (error) {
    console.error('Send registration OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to send OTP. Please verify SMTP configuration.',
      error: error.message
    });
  }
};

export const sendLoginOtp = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found with this email'
      });
    }

    if (isFacultyPendingApproval(user)) {
      return res.status(403).json({
        success: false,
        message: getFacultyApprovalMessage(user)
      });
    }

    const otp = generateNumericOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await EmailOtp.deleteMany({ email, purpose: 'login' });
    await EmailOtp.create({ email, role: user.role, purpose: 'login', otp, expiresAt });

    try {
      await sendOtpEmail({ to: email, otp, purpose: 'login' });
    } catch (emailError) {
      if (process.env.NODE_ENV === 'development') {
        return res.status(200).json({
          success: true,
          message: 'OTP generated (email delivery failed in development mode).',
          otp
        });
      }
      throw emailError;
    }

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully to your email'
    });
  } catch (error) {
    console.error('Send login OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to send OTP. Please verify SMTP configuration.',
      error: error.message
    });
  }
};

export const loginWithOtp = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, otp } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid OTP or email'
      });
    }

    if (isFacultyPendingApproval(user)) {
      return res.status(403).json({
        success: false,
        message: getFacultyApprovalMessage(user)
      });
    }

    const otpDoc = await EmailOtp.findOne({
      email,
      purpose: 'login',
      otp,
      expiresAt: { $gt: new Date() }
    });

    if (!otpDoc) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    await EmailOtp.deleteMany({ email, purpose: 'login' });

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: formatUserResponse(user)
    });
  } catch (error) {
    console.error('Login with OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in with OTP',
      error: error.message
    });
  }
};

export const sendForgotPasswordOtp = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found with this email'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated'
      });
    }

    const otp = generateNumericOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await EmailOtp.deleteMany({ email, purpose: 'forgot_password' });
    await EmailOtp.create({ email, role: user.role, purpose: 'forgot_password', otp, expiresAt });

    try {
      await sendOtpEmail({ to: email, otp, purpose: 'forgot_password' });
    } catch (emailError) {
      if (process.env.NODE_ENV === 'development') {
        return res.status(200).json({
          success: true,
          message: 'OTP generated (email delivery failed in development mode).',
          otp
        });
      }
      throw emailError;
    }

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully to your email'
    });
  } catch (error) {
    console.error('Send forgot password OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to send OTP. Please verify SMTP configuration.',
      error: error.message
    });
  }
};

export const resetPasswordWithOtp = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, otp, newPassword } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found with this email'
      });
    }

    const otpDoc = await EmailOtp.findOne({
      email,
      purpose: 'forgot_password',
      otp,
      expiresAt: { $gt: new Date() }
    });

    if (!otpDoc) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    user.password = newPassword;
    await user.save();
    await EmailOtp.deleteMany({ email, purpose: 'forgot_password' });

    res.status(200).json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting password',
      error: error.message
    });
  }
};

export const sendUpdatePasswordOtp = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const otp = generateNumericOtp();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await EmailOtp.deleteMany({ email: user.email, purpose: 'update_password' });
    await EmailOtp.create({
      email: user.email,
      role: user.role,
      purpose: 'update_password',
      otp,
      expiresAt
    });

    try {
      await sendOtpEmail({ to: user.email, otp, purpose: 'update_password' });
    } catch (emailError) {
      if (process.env.NODE_ENV === 'development') {
        return res.status(200).json({
          success: true,
          message: 'OTP generated (email delivery failed in development mode).',
          otp
        });
      }
      throw emailError;
    }

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully to your email'
    });
  } catch (error) {
    console.error('Send update password OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to send OTP. Please verify SMTP configuration.',
      error: error.message
    });
  }
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { name, email, password, role, studentId, department, semester, phone, otp } = req.body;
    const normalizedStudentId = role === 'student' ? (studentId?.trim() || undefined) : undefined;
    const normalizedSemester = role === 'student' ? semester : undefined;

    if (!otp) {
      return res.status(400).json({
        success: false,
        message: 'OTP is required for registration'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Check if student ID already exists (for students)
    if (role === 'student' && normalizedStudentId) {
      const existingStudentId = await User.findOne({ studentId: normalizedStudentId });
      if (existingStudentId) {
        return res.status(400).json({
          success: false,
          message: 'Student ID already exists'
        });
      }
    }

    const otpDoc = await EmailOtp.findOne({
      email,
      purpose: 'register',
      role,
      otp,
      expiresAt: { $gt: new Date() }
    });

    if (!otpDoc) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    // Create user
    const shouldRequireFacultyApproval = role === 'faculty' && !isFacultyAutoApprovalEnabled();

    const user = await User.create({
      name,
      email,
      password,
      role,
      studentId: normalizedStudentId,
      department,
      semester: normalizedSemester,
      phone,
      facultyApprovalStatus: shouldRequireFacultyApproval ? 'pending' : 'approved',
      facultyApprovedAt: role === 'faculty' && !shouldRequireFacultyApproval ? new Date() : null
    });

    await EmailOtp.deleteMany({ email, purpose: 'register' });

    if (role === 'faculty' && shouldRequireFacultyApproval) {
      let emailSent = false;
      try {
        console.log(`\n[FACULTY_REGISTRATION] ========== REGISTRATION START ==========`);
        console.log(`[FACULTY_REGISTRATION] Faculty Email: ${user.email}`);
        console.log(`[FACULTY_REGISTRATION] Faculty Name: ${user.name}`);
        console.log(`[FACULTY_REGISTRATION] Department: ${user.department}`);
        console.log(`[FACULTY_REGISTRATION] Status: pending (waiting for admin approval)`);
        console.log(`[FACULTY_REGISTRATION] Attempting to send pending status email...`);
        
        await sendAccountStatusEmail({
          to: user.email,
          name: user.name,
          status: 'pending'
        });
        
        emailSent = true;
        console.log(`[FACULTY_REGISTRATION] ✓ Email sent successfully!`);
        console.log(`[FACULTY_REGISTRATION] ========== REGISTRATION COMPLETE ==========\n`);
      } catch (emailError) {
        console.error(`[FACULTY_REGISTRATION] ✗ EMAIL FAILED`);
        console.error(`[FACULTY_REGISTRATION] Email: ${user.email}`);
        console.error(`[FACULTY_REGISTRATION] Error Type: ${emailError.name}`);
        console.error(`[FACULTY_REGISTRATION] Error Message: ${emailError.message}`);
        console.error(`[FACULTY_REGISTRATION] Stack Trace:\n${emailError.stack}`);
        console.warn(`[FACULTY_REGISTRATION] ⚠️  IMPORTANT: Registration succeeded but email delivery failed!`);
        console.warn(`[FACULTY_REGISTRATION] Faculty account IS created in database, but will NOT receive pending notification email.`);
        console.warn(`[FACULTY_REGISTRATION] Troubleshooting: Check SMTP configuration in .env file.`);
        console.log(`[FACULTY_REGISTRATION] ========== REGISTRATION COMPLETE (EMAIL FAILED) ==========\n`);
      }

      return res.status(201).json({
        success: true,
        message: 'Faculty account created. Waiting for admin approval before dashboard access.',
        requiresApproval: true,
        emailSent,
        user: formatUserResponse(user)
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: formatUserResponse(user)
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering user',
      error: error.message
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    if (isFacultyPendingApproval(user)) {
      return res.status(403).json({
        success: false,
        message: getFacultyApprovalMessage(user)
      });
    }

    // Check password
    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: formatUserResponse(user)
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: error.message
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user data',
      error: error.message
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/update-profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const fieldsToUpdate = {
      name: req.body.name,
      phone: req.body.phone,
      department: req.body.department,
      semester: req.body.semester
    };

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
};

// @desc    Update password
// @route   PUT /api/auth/update-password
// @access  Private
export const updatePassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { otp, newPassword } = req.body;

    if (!otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'OTP and new password are required'
      });
    }

    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const otpDoc = await EmailOtp.findOne({
      email: user.email,
      purpose: 'update_password',
      otp,
      expiresAt: { $gt: new Date() }
    });

    if (!otpDoc) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();
    await EmailOtp.deleteMany({ email: user.email, purpose: 'update_password' });

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Password updated successfully',
      token
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating password',
      error: error.message
    });
  }
};
