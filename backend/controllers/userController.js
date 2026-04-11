import User from '../models/User.js';
import Exam from '../models/Exam.js';
import Evaluation from '../models/Evaluation.js';
import { sendAccountStatusEmail } from '../services/emailService.js';

const normalizeDepartment = (value = '') => String(value).trim().toLowerCase().replace(/\s+/g, ' ');

const getDepartmentAliases = (department) => {
  const normalized = normalizeDepartment(department);
  const aliasMap = {
    'computer science': ['computer science', 'cs', 'cse'],
    'computer scinece': ['computer science', 'computer scinece', 'cs', 'cse'],
    cs: ['computer science', 'cs', 'cse'],
    cse: ['computer science', 'cs', 'cse'],
    'information technology': ['information technology', 'it'],
    it: ['information technology', 'it']
  };

  return aliasMap[normalized] || [normalized];
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildDepartmentMatcher = (department) => {
  const aliases = getDepartmentAliases(department)
    .filter(Boolean)
    .map((alias) => alias.trim())
    .filter((alias) => alias.length > 0);

  const patterns = aliases.map((alias) => `^${escapeRegex(alias)}$`);
  return { $regex: patterns.join('|'), $options: 'i' };
};

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin)
export const getAllUsers = async (req, res) => {
  try {
    let query = {};

    // Filter by role
    if (req.query.role) {
      query.role = req.query.role;
    }

    // Filter by department
    if (req.query.department) {
      query.department = req.query.department;
    }

    // Filter by semester
    if (req.query.semester) {
      query.semester = req.query.semester;
    }

    // Filter by faculty approval status
    if (req.query.facultyApprovalStatus) {
      query.facultyApprovalStatus = req.query.facultyApprovalStatus;
    }

    const users = await User.find(query).select('-password').sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private (Admin)
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message
    });
  }
};

// @desc    Create user (admin)
// @route   POST /api/users
// @access  Private (Admin)
export const createUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      studentId,
      department,
      semester,
      phone
    } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, password and role are required'
      });
    }

    if (!['student', 'faculty', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    if ((role === 'student' || role === 'faculty') && !department) {
      return res.status(400).json({
        success: false,
        message: 'Department is required for students and faculty'
      });
    }

    if (role === 'student' && !studentId) {
      return res.status(400).json({
        success: false,
        message: 'Student ID is required for students'
      });
    }

    if (role === 'student' && !semester) {
      return res.status(400).json({
        success: false,
        message: 'Semester is required for students'
      });
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    if (role === 'student' && studentId) {
      const existingStudent = await User.findOne({ studentId: studentId.trim() });
      if (existingStudent) {
        return res.status(400).json({
          success: false,
          message: 'Student ID already exists'
        });
      }
    }

    const user = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      role,
      studentId: role === 'student' ? studentId?.trim() : undefined,
      department: department?.trim(),
      semester: role === 'student' ? Number(semester) : undefined,
      phone,
      facultyApprovalStatus: role === 'faculty' ? 'approved' : 'approved',
      facultyApprovedAt: role === 'faculty' ? new Date() : null
    });

    const createdUser = await User.findById(user._id).select('-password');

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: createdUser
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating user',
      error: error.message
    });
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (Admin)
export const updateUser = async (req, res) => {
  try {
    const existingUser = await User.findById(req.params.id).select('-password');

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const statusBefore = existingUser.facultyApprovalStatus;

    const updates = {
      name: req.body.name,
      email: req.body.email,
      role: req.body.role,
      department: req.body.department,
      semester: req.body.semester,
      phone: req.body.phone,
      isActive: req.body.isActive,
      facultyApprovalStatus: req.body.facultyApprovalStatus
    };

    if (req.body.facultyApprovalStatus === 'approved') {
      updates.facultyApprovedAt = new Date();
    }

    const allowedFields = {
      ...updates
    };

    Object.keys(allowedFields).forEach((key) => {
      if (allowedFields[key] === undefined) {
        delete allowedFields[key];
      }
    });

    const user = await User.findByIdAndUpdate(req.params.id, allowedFields, {
      new: true,
      runValidators: true
    }).select('-password');

    const statusAfter = user.facultyApprovalStatus;

    if (
      user.role === 'faculty' &&
      statusAfter &&
      statusAfter !== statusBefore &&
      ['approved', 'rejected'].includes(statusAfter)
    ) {
      try {
        console.log(`\n[FACULTY_APPROVAL] ========== APPROVAL ACTION ==========`);
        console.log(`[FACULTY_APPROVAL] Faculty Email: ${user.email}`);
        console.log(`[FACULTY_APPROVAL] Faculty Name: ${user.name}`);
        console.log(`[FACULTY_APPROVAL] Previous Status: ${statusBefore || 'undefined'}`);
        console.log(`[FACULTY_APPROVAL] New Status: ${statusAfter}`);
        console.log(`[FACULTY_APPROVAL] Sending ${statusAfter} email...`);
        
        await sendAccountStatusEmail({
          to: user.email,
          name: user.name,
          status: statusAfter
        });
        
        console.log(`[FACULTY_APPROVAL] ✓ Email sent successfully!`);
        console.log(`[FACULTY_APPROVAL] ========== APPROVAL COMPLETE ==========\n`);
      } catch (emailError) {
        console.error(`[FACULTY_APPROVAL] ✗ EMAIL FAILED`);
        console.error(`[FACULTY_APPROVAL] Email: ${user.email}`);
        console.error(`[FACULTY_APPROVAL] Error: ${emailError.message}`);
        console.error(`[FACULTY_APPROVAL] Stack: ${emailError.stack}`);
        console.warn(`[FACULTY_APPROVAL] ⚠️  Status updated in database but email notification failed!`);
        console.log(`[FACULTY_APPROVAL] ========== APPROVAL COMPLETE (EMAIL FAILED) ==========\n`);
        // Email failure should not block approval, but we log it for debugging
      }
    }

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating user',
      error: error.message
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Admin)
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await user.deleteOne();

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting user',
      error: error.message
    });
  }
};

// @desc    Get registered users with published exam access summary
// @route   GET /api/users/registry
// @access  Private (Admin)
export const getRegisteredUsersRegistry = async (req, res) => {
  try {
    const roleFilter = req.query.role;
    const query = {};

    if (roleFilter && ['student', 'faculty'].includes(roleFilter)) {
      query.role = roleFilter;
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 });

    const studentUsers = users.filter((user) => user.role === 'student');

    const publishedExams = await Exam.find({ isPublished: true })
      .select('title subject department semesters status blockedStudents createdAt')
      .sort({ createdAt: -1 })
      .limit(200);

    const studentIds = studentUsers.map((student) => student._id);
    const examIds = publishedExams.map((exam) => exam._id);
    const evaluations = await Evaluation.find({
      student: { $in: studentIds },
      exam: { $in: examIds }
    }).select('student exam status submittedAt totalMarks maxMarks');

    const evaluationMap = new Map(
      evaluations.map((evaluation) => [`${evaluation.student.toString()}-${evaluation.exam.toString()}`, evaluation])
    );

    const studentsWithExamAccess = studentUsers
      .map((student) => {
        const eligibleExams = publishedExams.filter((exam) => {
          const matchesDepartment = getDepartmentAliases(student.department || '').includes(normalizeDepartment(exam.department || ''));
          const matchesSemester = exam.semesters?.includes(Number(student.semester));
          return matchesDepartment && matchesSemester;
        });

        const exams = eligibleExams.map((exam) => ({
          ...(function() {
            const evalData = evaluationMap.get(`${student._id.toString()}-${exam._id.toString()}`);
            return {
              hasSubmitted: Boolean(evalData),
              evaluationStatus: evalData?.status || null,
              submittedAt: evalData?.submittedAt || null,
              totalMarks: evalData?.totalMarks ?? null,
              maxMarks: evalData?.maxMarks ?? null
            };
          })(),
          _id: exam._id,
          title: exam.title,
          subject: exam.subject,
          department: exam.department,
          semesters: exam.semesters,
          status: exam.status,
          isBlocked: exam.blockedStudents?.some((id) => id.toString() === student._id.toString()) || false
        }));

        return {
          studentId: student._id,
          exams
        };
      });

    res.status(200).json({
      success: true,
      count: users.length,
      users,
      studentsWithExamAccess
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching registered users data',
      error: error.message
    });
  }
};

// @desc    Reschedule/retest a published exam for a student
// @route   PATCH /api/users/student-exam-reschedule
// @access  Private (Admin)
export const rescheduleStudentExam = async (req, res) => {
  try {
    const { studentId, examId } = req.body;

    if (!studentId || !examId) {
      return res.status(400).json({
        success: false,
        message: 'studentId and examId are required'
      });
    }

    const student = await User.findById(studentId).select('role');
    if (!student || student.role !== 'student') {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    exam.blockedStudents = (exam.blockedStudents || []).filter(
      (id) => id.toString() !== student._id.toString()
    );
    await exam.save();

    const deletedEvaluations = await Evaluation.deleteMany({
      student: student._id,
      exam: exam._id
    });

    return res.status(200).json({
      success: true,
      message: 'Exam rescheduled for student. Previous attempt cleared.',
      studentId,
      examId,
      deletedAttempts: deletedEvaluations.deletedCount || 0
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error rescheduling exam for student',
      error: error.message
    });
  }
};

// @desc    Allow/Block student access to a published exam
// @route   PATCH /api/users/student-exam-access
// @access  Private (Admin)
export const updateStudentExamAccess = async (req, res) => {
  try {
    const { studentId, examId, allowAccess } = req.body;

    if (!studentId || !examId || typeof allowAccess !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'studentId, examId and allowAccess are required'
      });
    }

    const student = await User.findById(studentId).select('role department semester');
    if (!student || student.role !== 'student') {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    const studentObjectId = student._id;
    let clearedEvaluations = 0;

    if (allowAccess) {
      exam.blockedStudents = (exam.blockedStudents || []).filter(
        (id) => id.toString() !== studentObjectId.toString()
      );

      const deletedEvaluations = await Evaluation.deleteMany({
        student: studentObjectId,
        exam: exam._id
      });
      clearedEvaluations = deletedEvaluations.deletedCount || 0;
    } else if (!(exam.blockedStudents || []).some((id) => id.toString() === studentObjectId.toString())) {
      exam.blockedStudents = [...(exam.blockedStudents || []), studentObjectId];
    }

    await exam.save();

    return res.status(200).json({
      success: true,
      message: allowAccess
        ? (clearedEvaluations > 0
          ? 'Student can access this exam now. Previous attempt cleared and evaluation re-activated.'
          : 'Student can access this exam now')
        : 'Exam removed from student dashboard',
      examId: exam._id,
      studentId: student._id,
      allowAccess,
      clearedEvaluations,
      evaluationReactivated: allowAccess && clearedEvaluations > 0
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error updating student exam access',
      error: error.message
    });
  }
};
