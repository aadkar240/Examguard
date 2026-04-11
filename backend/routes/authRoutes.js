import express from 'express';
import { body } from 'express-validator';
import {
  register,
  login,
  getMe,
  updateProfile,
  updatePassword,
  sendRegistrationOtp,
  sendLoginOtp,
  loginWithOtp,
  sendForgotPasswordOtp,
  resetPasswordWithOtp,
  sendUpdatePasswordOtp
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Validation rules
const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['student', 'faculty', 'admin']).withMessage('Invalid role'),
  body('department').custom((value, { req }) => {
    // Department is required for faculty and students
    if ((req.body.role === 'faculty' || req.body.role === 'student') && (!value || !value.trim())) {
      throw new Error('Department is required');
    }
    return true;
  }),
  body('studentId').custom((value, { req }) => {
    // Student ID is required for students
    if (req.body.role === 'student' && (!value || !value.trim())) {
      throw new Error('Student ID is required');
    }
    return true;
  }),
  body('semester').custom((value, { req }) => {
    // Semester is required for students
    if (req.body.role === 'student' && !value) {
      throw new Error('Semester is required');
    }
    return true;
  })
];

const sendOtpValidation = [
  body('email').isEmail().withMessage('Please provide a valid email')
];

const sendRegistrationOtpValidation = [
  ...sendOtpValidation,
  body('role').optional().isIn(['student', 'faculty', 'admin']).withMessage('Invalid role')
];

const loginValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
];

const otpLoginValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
];

const resetPasswordValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

const updatePasswordValidation = [
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

// Public routes
router.post('/send-registration-otp', sendRegistrationOtpValidation, sendRegistrationOtp);
router.post('/send-login-otp', sendOtpValidation, sendLoginOtp);
router.post('/send-forgot-password-otp', sendOtpValidation, sendForgotPasswordOtp);
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/login-otp', otpLoginValidation, loginWithOtp);
router.post('/reset-password', resetPasswordValidation, resetPasswordWithOtp);

// Protected routes
router.get('/me', protect, getMe);
router.put('/update-profile', protect, updateProfile);
router.post('/send-update-password-otp', protect, sendUpdatePasswordOtp);
router.put('/update-password', protect, updatePasswordValidation, updatePassword);

export default router;
