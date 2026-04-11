import Grievance from '../models/Grievance.js';
import Evaluation from '../models/Evaluation.js';
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

const notifyFacultyInDepartment = async (io, grievance, event, payload) => {
  if (!io || !grievance?.department) {
    return;
  }

  const faculty = await User.find({
    role: 'faculty',
    isActive: true,
    facultyApprovalStatus: 'approved',
    department: buildDepartmentMatcher(grievance.department)
  }).select('_id');

  faculty.forEach((member) => {
    io.to(`user-${member._id}`).emit(event, payload);
  });
};

// @desc    Create new grievance
// @route   POST /api/grievances
// @access  Private (Student)
export const createGrievance = async (req, res) => {
  try {
    const {
      category,
      problemType,
      otherProblemText,
      department,
      semester,
      relatedExam,
      relatedEvaluation,
      subject,
      description,
      priority
    } = req.body;

    if (!subject || !description || !problemType) {
      return res.status(400).json({
        success: false,
        message: 'Please provide subject, description and problem type'
      });
    }

    if (problemType === 'other' && (!otherProblemText || !otherProblemText.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Please provide details for other problem type'
      });
    }

    let grievanceDepartment = (department || req.user.department || '').trim();
    let grievanceSemester = Number(semester || req.user.semester);
    let grievanceRelatedExam = relatedExam;
    let grievanceRelatedEvaluation = relatedEvaluation;

    if (relatedEvaluation) {
      const evaluation = await Evaluation.findById(relatedEvaluation).populate({
        path: 'exam',
        select: 'department semesters createdBy title subject'
      });

      if (!evaluation) {
        return res.status(404).json({
          success: false,
          message: 'Related evaluation not found'
        });
      }

      if (evaluation.student.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'You can only raise grievance for your own evaluation'
        });
      }

      if (evaluation.exam) {
        grievanceDepartment = evaluation.exam.department || grievanceDepartment;
        grievanceSemester = Number(req.user.semester || grievanceSemester);
        grievanceRelatedExam = evaluation.exam._id;
      }

      grievanceRelatedEvaluation = evaluation._id;
    }

    if (!grievanceDepartment || !grievanceSemester) {
      return res.status(400).json({
        success: false,
        message: 'Department and semester are required'
      });
    }

    const grievance = await Grievance.create({
      student: req.user.id,
      department: grievanceDepartment,
      semester: grievanceSemester,
      category,
      problemType,
      otherProblemText,
      relatedExam: grievanceRelatedExam,
      relatedEvaluation: grievanceRelatedEvaluation,
      subject,
      description,
      priority: priority || 'medium',
      timeline: [{
        action: 'Grievance created',
        performedBy: req.user.id,
        timestamp: new Date(),
        details: 'Student submitted a new grievance'
      }]
    });

    const populatedGrievance = await Grievance.findById(grievance._id)
      .populate('student', 'name email studentId department semester')
      .populate('relatedExam', 'title subject')
      .populate('relatedEvaluation');

    // Notify admins via Socket.IO
    const io = req.app.get('io');
    io.emit('new-grievance', {
      message: 'New grievance submitted',
      grievanceId: grievance._id
    });
    await notifyFacultyInDepartment(io, grievance, 'new-grievance', {
      message: 'New grievance submitted in your department',
      grievanceId: grievance._id,
      department: grievance.department,
      semester: grievance.semester
    });

    res.status(201).json({
      success: true,
      message: 'Grievance submitted successfully',
      grievance: populatedGrievance
    });
  } catch (error) {
    console.error('Create grievance error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating grievance',
      error: error.message
    });
  }
};

// @desc    Get all grievances
// @route   GET /api/grievances
// @access  Private (Faculty/Admin)
export const getGrievances = async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'faculty' && req.user.department) {
      query.department = buildDepartmentMatcher(req.user.department);
    }

    if (req.query.semester) {
      query.semester = Number(req.query.semester);
    }

    // Filter by status
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Filter by category
    if (req.query.category) {
      query.category = req.query.category;
    }

    // Filter by priority
    if (req.query.priority) {
      query.priority = req.query.priority;
    }

    // Filter by assigned
    if (req.query.assignedToMe === 'true') {
      query.assignedTo = req.user.id;
    }

    const grievances = await Grievance.find(query)
      .populate('student', 'name email studentId department semester')
      .populate('relatedExam', 'title subject')
      .populate('relatedEvaluation', 'totalMarks maxMarks percentage grade status updatedAt')
      .populate('assignedTo', 'name')
      .populate('evaluationReview.reviewedBy', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: grievances.length,
      grievances
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching grievances',
      error: error.message
    });
  }
};

// @desc    Get grievance by ID
// @route   GET /api/grievances/:id
// @access  Private
export const getGrievanceById = async (req, res) => {
  try {
    const grievance = await Grievance.findById(req.params.id)
      .populate('student', 'name email studentId department semester')
      .populate('relatedExam', 'title subject')
      .populate('relatedEvaluation')
      .populate('assignedTo', 'name email')
      .populate('responses.respondedBy', 'name role')
      .populate('resolution.resolvedBy', 'name')
      .populate('evaluationReview.reviewedBy', 'name')
      .populate('timeline.performedBy', 'name');

    if (!grievance) {
      return res.status(404).json({
        success: false,
        message: 'Grievance not found'
      });
    }

    // Check authorization
    if (req.user.role === 'student' && grievance.student._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this grievance'
      });
    }

    res.status(200).json({
      success: true,
      grievance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching grievance',
      error: error.message
    });
  }
};

// @desc    Update grievance status
// @route   PATCH /api/grievances/:id/status
// @access  Private (Faculty/Admin)
export const updateGrievanceStatus = async (req, res) => {
  try {
    const { status, assignedTo } = req.body;

    const grievance = await Grievance.findById(req.params.id);

    if (!grievance) {
      return res.status(404).json({
        success: false,
        message: 'Grievance not found'
      });
    }

    if (status) {
      grievance.status = status;
    }

    if (assignedTo) {
      grievance.assignedTo = assignedTo;
      grievance.assignedAt = new Date();
      grievance.timeline.push({
        action: 'Grievance assigned',
        performedBy: req.user.id,
        timestamp: new Date(),
        details: `Grievance assigned to faculty/admin`
      });
    }

    await grievance.save();

    // Notify student
    const io = req.app.get('io');
    io.to(`user-${grievance.student}`).emit('grievance-updated', {
      message: 'Your grievance status has been updated',
      grievanceId: grievance._id,
      status: grievance.status
    });
    await notifyFacultyInDepartment(io, grievance, 'grievance-updated', {
      message: 'Grievance status updated',
      grievanceId: grievance._id,
      status: grievance.status
    });

    res.status(200).json({
      success: true,
      message: 'Grievance updated successfully',
      grievance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating grievance',
      error: error.message
    });
  }
};

// @desc    Respond to grievance
// @route   POST /api/grievances/:id/respond
// @access  Private (Faculty/Admin)
export const respondToGrievance = async (req, res) => {
  try {
    const { message, isInternal } = req.body;

    if (!message || message.trim().length < 1) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a response message'
      });
    }

    const grievance = await Grievance.findById(req.params.id);

    if (!grievance) {
      return res.status(404).json({
        success: false,
        message: 'Grievance not found'
      });
    }

    grievance.responses.push({
      respondedBy: req.user.id,
      message,
      isInternal: isInternal || false,
      timestamp: new Date()
    });

    grievance.status = 'in-progress';
    grievance.timeline.push({
      action: 'Response added',
      performedBy: req.user.id,
      timestamp: new Date(),
      details: isInternal ? 'Internal note added' : 'Response sent to student'
    });

    await grievance.save();

    // Notify student if not internal
    if (!isInternal) {
      const io = req.app.get('io');
      io.to(`user-${grievance.student}`).emit('grievance-response', {
        message: 'New response on your grievance',
        grievanceId: grievance._id
      });
      await notifyFacultyInDepartment(io, grievance, 'grievance-response', {
        message: 'A grievance response was added',
        grievanceId: grievance._id
      });
    }

    res.status(200).json({
      success: true,
      message: 'Response added successfully',
      grievance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error responding to grievance',
      error: error.message
    });
  }
};

// @desc    Resolve grievance
// @route   POST /api/grievances/:id/resolve
// @access  Private (Faculty/Admin)
export const resolveGrievance = async (req, res) => {
  try {
    const { message, actionTaken } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Please provide resolution details'
      });
    }

    const grievance = await Grievance.findById(req.params.id);

    if (!grievance) {
      return res.status(404).json({
        success: false,
        message: 'Grievance not found'
      });
    }

    grievance.resolution = {
      message,
      resolvedBy: req.user.id,
      resolvedAt: new Date(),
      actionTaken
    };

    grievance.status = 'resolved';
    grievance.timeline.push({
      action: 'Grievance resolved',
      performedBy: req.user.id,
      timestamp: new Date(),
      details: 'Grievance marked as resolved'
    });

    await grievance.save();

    // Notify student
    const io = req.app.get('io');
    io.to(`user-${grievance.student}`).emit('grievance-resolved', {
      message: 'Your grievance has been resolved',
      grievanceId: grievance._id
    });
    await notifyFacultyInDepartment(io, grievance, 'grievance-resolved', {
      message: 'A grievance has been resolved',
      grievanceId: grievance._id
    });

    res.status(200).json({
      success: true,
      message: 'Grievance resolved successfully',
      grievance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error resolving grievance',
      error: error.message
    });
  }
};

// @desc    Escalate grievance
// @route   POST /api/grievances/:id/escalate
// @access  Private (Faculty/Admin)
export const escalateGrievance = async (req, res) => {
  try {
    const { escalatedTo, reason } = req.body;

    const grievance = await Grievance.findById(req.params.id);

    if (!grievance) {
      return res.status(404).json({
        success: false,
        message: 'Grievance not found'
      });
    }

    grievance.escalationLevel += 1;
    grievance.escalatedTo = escalatedTo;
    grievance.status = 'escalated';
    grievance.timeline.push({
      action: `Grievance escalated (Level ${grievance.escalationLevel})`,
      performedBy: req.user.id,
      timestamp: new Date(),
      details: reason || 'Grievance escalated to higher authority'
    });

    await grievance.save();

    // Notify escalated person
    const io = req.app.get('io');
    io.to(`user-${escalatedTo}`).emit('grievance-escalated', {
      message: 'A grievance has been escalated to you',
      grievanceId: grievance._id
    });

    res.status(200).json({
      success: true,
      message: 'Grievance escalated successfully',
      grievance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error escalating grievance',
      error: error.message
    });
  }
};

// @desc    Get my grievances (for students)
// @route   GET /api/grievances/my-grievances
// @access  Private (Student)
export const getMyGrievances = async (req, res) => {
  try {
    const grievances = await Grievance.find({ student: req.user.id })
      .populate('relatedExam', 'title subject')
      .populate('relatedEvaluation', 'totalMarks maxMarks percentage grade status updatedAt')
      .populate('assignedTo', 'name')
      .populate('evaluationReview.reviewedBy', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: grievances.length,
      grievances
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching your grievances',
      error: error.message
    });
  }
};

// @desc    Submit feedback on resolved grievance
// @route   POST /api/grievances/:id/feedback
// @access  Private (Student)
export const submitFeedback = async (req, res) => {
  try {
    const { rating, feedback } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a rating between 1 and 5'
      });
    }

    const grievance = await Grievance.findById(req.params.id);

    if (!grievance) {
      return res.status(404).json({
        success: false,
        message: 'Grievance not found'
      });
    }

    if (grievance.student.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    if (grievance.status !== 'resolved') {
      return res.status(400).json({
        success: false,
        message: 'Can only provide feedback on resolved grievances'
      });
    }

    grievance.satisfaction = {
      rating,
      feedback,
      submittedAt: new Date()
    };

    grievance.status = 'closed';
    await grievance.save();

    res.status(200).json({
      success: true,
      message: 'Feedback submitted successfully',
      grievance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error submitting feedback',
      error: error.message
    });
  }
};

// @desc    Faculty/Admin review grievance and update evaluation marks
// @route   POST /api/grievances/:id/review-evaluation
// @access  Private (Faculty/Admin)
export const reviewGrievanceEvaluation = async (req, res) => {
  try {
    const { updatedTotalMarks, remarks } = req.body;

    const grievance = await Grievance.findById(req.params.id)
      .populate('student', 'name')
      .populate('relatedEvaluation');

    if (!grievance) {
      return res.status(404).json({
        success: false,
        message: 'Grievance not found'
      });
    }

    let evaluation;

    if (grievance.relatedEvaluation) {
      evaluation = await Evaluation.findById(grievance.relatedEvaluation._id);
    }

    if (!evaluation && grievance.relatedExam) {
      evaluation = await Evaluation.findOne({
        exam: grievance.relatedExam,
        student: grievance.student._id
      });

      if (evaluation) {
        grievance.relatedEvaluation = evaluation._id;
      }
    }

    if (!evaluation) {
      return res.status(400).json({
        success: false,
        message: 'No related evaluation linked to this grievance yet'
      });
    }

    if (!evaluation) {
      return res.status(404).json({
        success: false,
        message: 'Related evaluation not found'
      });
    }

    const numericUpdatedMarks = Number(updatedTotalMarks);

    if (Number.isNaN(numericUpdatedMarks) || numericUpdatedMarks < 0 || numericUpdatedMarks > evaluation.maxMarks) {
      return res.status(400).json({
        success: false,
        message: `Updated marks should be between 0 and ${evaluation.maxMarks}`
      });
    }

    const previousTotalMarks = evaluation.totalMarks;
    const previousGrade = evaluation.grade;
    const previousPercentage = evaluation.percentage;

    evaluation.totalMarks = numericUpdatedMarks;
    evaluation.status = 're-evaluated';
    evaluation.reEvaluationRequested = false;
    evaluation.reEvaluationBy = req.user.id;
    evaluation.reEvaluationDate = new Date();
    evaluation.reEvaluationComparison = {
      previousTotalMarks,
      updatedTotalMarks: numericUpdatedMarks,
      previousGrade,
      updatedGrade: previousGrade,
      previousPercentage,
      updatedPercentage: previousPercentage,
      updatedAt: new Date()
    };
    evaluation.auditLog.push({
      action: 'Grievance re-evaluation completed',
      performedBy: req.user.id,
      timestamp: new Date(),
      details: remarks || 'Marks updated after grievance review'
    });
    await evaluation.save();

    evaluation.reEvaluationComparison.updatedGrade = evaluation.grade;
    evaluation.reEvaluationComparison.updatedPercentage = evaluation.percentage;
    await evaluation.save();

    grievance.status = 'resolved';
    grievance.evaluationReview = {
      previousTotalMarks,
      updatedTotalMarks: evaluation.totalMarks,
      previousGrade,
      updatedGrade: evaluation.grade,
      previousPercentage,
      updatedPercentage: evaluation.percentage,
      reviewedBy: req.user.id,
      reviewedAt: new Date(),
      remarks
    };
    grievance.resolution = {
      message: 'Paper rechecked by faculty and marks updated.',
      resolvedBy: req.user.id,
      resolvedAt: new Date(),
      actionTaken: remarks || 'Re-evaluation completed and result updated'
    };
    grievance.timeline.push({
      action: 'Evaluation reviewed and marks updated',
      performedBy: req.user.id,
      timestamp: new Date(),
      details: `Marks changed from ${previousTotalMarks} to ${evaluation.totalMarks}`
    });
    await grievance.save();

    const io = req.app.get('io');
    io.to(`user-${evaluation.student}`).emit('evaluation-updated-after-grievance', {
      message: 'Your result has been updated after grievance review',
      evaluationId: evaluation._id,
      grievanceId: grievance._id
    });
    io.to(`user-${evaluation.student}`).emit('grievance-resolved', {
      message: 'Your grievance has been resolved and marks updated',
      grievanceId: grievance._id
    });
    await notifyFacultyInDepartment(io, grievance, 'grievance-evaluation-reviewed', {
      message: 'Grievance evaluation updated',
      grievanceId: grievance._id,
      evaluationId: evaluation._id
    });

    return res.status(200).json({
      success: true,
      message: 'Grievance reviewed and marks updated successfully',
      grievance,
      evaluation
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error reviewing grievance evaluation',
      error: error.message
    });
  }
};
