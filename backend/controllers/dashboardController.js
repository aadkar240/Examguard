import Exam from '../models/Exam.js';
import Evaluation from '../models/Evaluation.js';
import Grievance from '../models/Grievance.js';
import User from '../models/User.js';

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

// @desc    Get dashboard statistics based on role
// @route   GET /api/dashboard/stats
// @access  Private
export const getDashboardStats = async (req, res) => {
  try {
    let stats = {};

    if (req.user.role === 'student') {
      stats = await getStudentStats(req.user.id);
    } else if (req.user.role === 'faculty') {
      stats = await getFacultyStats(req.user.id);
    } else if (req.user.role === 'admin') {
      stats = await getAdminStats();
    }

    res.status(200).json({
      success: true,
      stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard statistics',
      error: error.message
    });
  }
};

// @desc    Get student dashboard
// @route   GET /api/dashboard/student
// @access  Private (Student)
export const getStudentDashboard = async (req, res) => {
  try {
    const stats = await getStudentStats(req.user.id);

    // Get upcoming exams
    const upcomingExams = await Exam.find({
      department: buildDepartmentMatcher(req.user.department),
      semesters: { $in: [Number(req.user.semester)] },
      blockedStudents: { $nin: [req.user._id] },
      startTime: { $gte: new Date() },
      $or: [
        { isPublished: true },
        { status: 'scheduled', scheduledPublishAt: { $gte: new Date() } }
      ]
    })
      .sort({ startTime: 1 })
      .limit(5)
      .select('title subject startTime duration status isPublished scheduledPublishAt');

    // Get recent evaluations
    const recentEvaluations = await Evaluation.find({ student: req.user.id })
      .populate('exam', 'title subject')
      .sort({ evaluatedAt: -1 })
      .limit(5);

    // Get active grievances
    const activeGrievances = await Grievance.find({
      student: req.user.id,
      status: { $in: ['open', 'in-progress', 'pending-response'] }
    })
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      data: {
        stats,
        upcomingExams,
        recentEvaluations,
        activeGrievances
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching student dashboard',
      error: error.message
    });
  }
};

// @desc    Get faculty dashboard
// @route   GET /api/dashboard/faculty
// @access  Private (Faculty)
export const getFacultyDashboard = async (req, res) => {
  try {
    const stats = await getFacultyStats(req.user.id);

    // Get my exams
    const myExams = await Exam.find({ createdBy: req.user.id })
      .sort({ startTime: -1 })
      .limit(5);

    // Get pending evaluations
    const examIds = myExams.map(e => e._id);
    const pendingEvaluations = await Evaluation.find({
      exam: { $in: examIds },
      status: 'under-evaluation'
    })
      .populate('student', 'name studentId')
      .populate('exam', 'title')
      .sort({ submittedAt: 1 })
      .limit(10);

    // Get assigned grievances
    const assignedGrievances = await Grievance.find({
      assignedTo: req.user.id,
      status: { $in: ['open', 'in-progress'] }
    })
      .populate('student', 'name studentId')
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      data: {
        stats,
        myExams,
        pendingEvaluations,
        assignedGrievances
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching faculty dashboard',
      error: error.message
    });
  }
};

// @desc    Get admin dashboard
// @route   GET /api/dashboard/admin
// @access  Private (Admin)
export const getAdminDashboard = async (req, res) => {
  try {
    const stats = await getAdminStats();

    // Get recent exams
    const recentExams = await Exam.find()
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    // Get pending grievances
    const pendingGrievances = await Grievance.find({
      status: { $in: ['open', 'escalated'] }
    })
      .populate('student', 'name studentId')
      .sort({ priority: -1, createdAt: -1 })
      .limit(10);

    // Get system activity (recent evaluations)
    const recentActivity = await Evaluation.find()
      .populate('student', 'name studentId')
      .populate('exam', 'title')
      .sort({ updatedAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      data: {
        stats,
        recentExams,
        pendingGrievances,
        recentActivity
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching admin dashboard',
      error: error.message
    });
  }
};

// Helper function to get student statistics
const getStudentStats = async (studentId) => {
  const totalExams = await Exam.countDocuments({
    isPublished: true
  });

  const completedExams = await Evaluation.countDocuments({
    student: studentId
  });

  const evaluations = await Evaluation.find({ student: studentId });
  const averageScore = evaluations.length > 0
    ? evaluations.reduce((acc, curr) => acc + curr.percentage, 0) / evaluations.length
    : 0;

  const totalGrievances = await Grievance.countDocuments({
    student: studentId
  });

  const resolvedGrievances = await Grievance.countDocuments({
    student: studentId,
    status: { $in: ['resolved', 'closed'] }
  });

  const pendingEvaluations = await Evaluation.countDocuments({
    student: studentId,
    status: { $in: ['submitted', 'under-evaluation'] }
  });

  return {
    totalExams,
    completedExams,
    averageScore: Math.round(averageScore * 100) / 100,
    totalGrievances,
    resolvedGrievances,
    pendingEvaluations
  };
};

// Helper function to get faculty statistics
const getFacultyStats = async (facultyId) => {
  const totalExams = await Exam.countDocuments({
    createdBy: facultyId
  });

  const activeExams = await Exam.countDocuments({
    createdBy: facultyId,
    status: { $in: ['scheduled', 'ongoing'] }
  });

  const examIds = await Exam.find({ createdBy: facultyId }).distinct('_id');
  
  const pendingEvaluations = await Evaluation.countDocuments({
    exam: { $in: examIds },
    status: { $in: ['submitted', 'under-evaluation'] }
  });

  const completedEvaluations = await Evaluation.countDocuments({
    exam: { $in: examIds },
    status: { $in: ['evaluated', 're-evaluated'] }
  });

  const assignedGrievances = await Grievance.countDocuments({
    assignedTo: facultyId
  });

  const resolvedGrievances = await Grievance.countDocuments({
    assignedTo: facultyId,
    status: { $in: ['resolved', 'closed'] }
  });

  return {
    totalExams,
    activeExams,
    pendingEvaluations,
    completedEvaluations,
    assignedGrievances,
    resolvedGrievances
  };
};

// Helper function to get admin statistics
const getAdminStats = async () => {
  const totalUsers = await User.countDocuments();
  const totalStudents = await User.countDocuments({ role: 'student' });
  const totalFaculty = await User.countDocuments({ role: 'faculty' });

  const totalExams = await Exam.countDocuments();
  const activeExams = await Exam.countDocuments({
    status: { $in: ['scheduled', 'ongoing'] }
  });

  const totalEvaluations = await Evaluation.countDocuments();
  const pendingEvaluations = await Evaluation.countDocuments({
    status: { $in: ['submitted', 'under-evaluation'] }
  });

  const totalGrievances = await Grievance.countDocuments();
  const openGrievances = await Grievance.countDocuments({
    status: { $in: ['open', 'in-progress'] }
  });
  const resolvedGrievances = await Grievance.countDocuments({
    status: { $in: ['resolved', 'closed'] }
  });

  // Resolution rate
  const resolutionRate = totalGrievances > 0
    ? Math.round((resolvedGrievances / totalGrievances) * 100)
    : 0;

  return {
    totalUsers,
    totalStudents,
    totalFaculty,
    totalExams,
    activeExams,
    totalEvaluations,
    pendingEvaluations,
    totalGrievances,
    openGrievances,
    resolvedGrievances,
    resolutionRate
  };
};
