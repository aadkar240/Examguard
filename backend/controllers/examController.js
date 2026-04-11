import Exam from '../models/Exam.js';
import Evaluation from '../models/Evaluation.js';
import Grievance from '../models/Grievance.js';
import User from '../models/User.js';
import { evaluateAnswer as aiEvaluateAnswer } from '../services/aiGradingService.js';
import { generateExamWithAI } from '../services/aiExamGenerationService.js';

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

const DEACTIVATED_EXAM_MESSAGE = 'you are temporary deactivated to give exam for some reason';

const isDepartmentMatch = (examDepartment, userDepartment) => {
  const examNormalized = normalizeDepartment(examDepartment);
  const userAliases = getDepartmentAliases(userDepartment);
  return userAliases.includes(examNormalized);
};

const autoPublishDueExams = async () => {
  const dueExams = await Exam.find({
    isPublished: false,
    status: 'scheduled',
    scheduledPublishAt: { $lte: new Date() }
  });

  for (const exam of dueExams) {
    exam.isPublished = true;
    exam.status = 'ongoing';
    exam.scheduledPublishAt = null;
    await exam.save();
    await ensureAutoGrievanceTrackingForPublishedExam(exam);
  }

  return dueExams.length;
};

const ensureAutoGrievanceTrackingForPublishedExam = async (exam) => {
  const students = await User.find({
    role: 'student',
    isActive: true,
    department: buildDepartmentMatcher(exam.department),
    semester: { $in: exam.semesters }
  }).select('_id department semester');

  if (!students.length) {
    return { created: 0, updated: 0, totalStudents: 0 };
  }

  const subject = `Grievance Window: ${exam.title}`;
  let created = 0;
  let updated = 0;

  for (const student of students) {
    const existing = await Grievance.findOne({
      student: student._id,
      relatedExam: exam._id,
      category: 'exam-related',
      problemType: 'other'
    });

    if (!existing) {
      await Grievance.create({
        student: student._id,
        department: student.department,
        semester: Number(student.semester),
        category: 'exam-related',
        problemType: 'other',
        otherProblemText: 'Auto-created grievance tracking entry for published exam',
        relatedExam: exam._id,
        subject,
        description: `Auto-created tracking grievance for published exam "${exam.title}". Student can use this entry to request review or mark changes.`,
        priority: 'low',
        status: 'open',
        assignedTo: exam.createdBy,
        assignedAt: new Date(),
        timeline: [{
          action: 'Auto grievance tracking created on exam publish',
          performedBy: exam.createdBy,
          timestamp: new Date(),
          details: 'Created for exam-level grievance tracking after publish'
        }]
      });
      created += 1;
      continue;
    }

    if (!existing.assignedTo) {
      existing.assignedTo = exam.createdBy;
      existing.assignedAt = new Date();
      existing.timeline.push({
        action: 'Auto-assigned on exam publish',
        performedBy: exam.createdBy,
        timestamp: new Date(),
        details: 'Assigned to exam faculty during publish sync'
      });
      await existing.save();
      updated += 1;
    }
  }

  return { created, updated, totalStudents: students.length };
};

// @desc    Generate exam with AI
// @route   POST /api/exams/ai-generate
// @access  Private (Faculty/Admin)
export const generateAiExam = async (req, res) => {
  try {
    const {
      subject,
      topics,
      total_marks,
      duration,
      exam_type,
      difficulty_distribution,
      marks_structure,
      additional_instructions
    } = req.body;

    if (!subject || !Array.isArray(topics) || topics.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Subject and topics are required for AI generation'
      });
    }

    const generatedExam = await generateExamWithAI({
      subject,
      topics,
      total_marks,
      duration,
      exam_type,
      difficulty_distribution,
      marks_structure,
      additional_instructions
    });

    res.status(200).json({
      success: true,
      exam: generatedExam
    });
  } catch (error) {
    console.error('AI exam generation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate exam with AI'
    });
  }
};

// @desc    Create a new exam
// @route   POST /api/exams
// @access  Private (Faculty/Admin)
export const createExam = async (req, res) => {
  try {
    // Validate semesters
    if (!req.body.semesters || !Array.isArray(req.body.semesters) || req.body.semesters.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please select at least one semester'
      });
    }

    const scheduledPublishAt = req.body.scheduledPublishAt ? new Date(req.body.scheduledPublishAt) : null;

    if (scheduledPublishAt && Number.isNaN(scheduledPublishAt.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid scheduled publish date/time'
      });
    }

    const shouldSchedulePublish = Boolean(scheduledPublishAt && scheduledPublishAt > new Date());

    const examData = {
      ...req.body,
      isPublished: shouldSchedulePublish ? false : Boolean(req.body.isPublished),
      status: shouldSchedulePublish
        ? 'scheduled'
        : (req.body.status || (req.body.isPublished ? 'ongoing' : 'draft')),
      scheduledPublishAt: shouldSchedulePublish ? scheduledPublishAt : null,
      createdBy: req.user.id
    };

    const exam = await Exam.create(examData);

    let grievanceSync = null;
    if (exam.isPublished) {
      grievanceSync = await ensureAutoGrievanceTrackingForPublishedExam(exam);
    }

    res.status(201).json({
      success: true,
      message: shouldSchedulePublish ? 'Exam created and scheduled for publishing' : 'Exam created successfully',
      exam,
      grievanceSync
    });
  } catch (error) {
    console.error('Create exam error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating exam',
      error: error.message
    });
  }
};

// @desc    Get all exams
// @route   GET /api/exams
// @access  Private
export const getAllExams = async (req, res) => {
  try {
    await autoPublishDueExams();

    let query = {};

    // Filter by role
    if (req.user.role === 'student') {
      query = {
        department: buildDepartmentMatcher(req.user.department),
        semesters: { $in: [Number(req.user.semester)] },
        isPublished: true,
        blockedStudents: { $nin: [req.user._id] }
      };
    } else if (req.user.role === 'faculty') {
      query = { createdBy: req.user.id };
    }

    // Additional filters
    if (req.query.status) {
      query.status = req.query.status;
    }
    if (req.query.department) {
      query.department = req.query.department;
    }
    if (req.query.semester) {
      query.semesters = { $in: [Number(req.query.semester)] };
    }

    const exams = await Exam.find(query)
      .populate('createdBy', 'name email')
      .sort({ startTime: -1 });

    res.status(200).json({
      success: true,
      count: exams.length,
      exams
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching exams',
      error: error.message
    });
  }
};

// @desc    Get exam by ID
// @route   GET /api/exams/:id
// @access  Private
export const getExamById = async (req, res) => {
  try {
    if (req.user.role === 'student' && req.user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: DEACTIVATED_EXAM_MESSAGE
      });
    }

    const exam = await Exam.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    // Check authorization
    if (req.user.role === 'student') {
      if (!exam.isPublished) {
        return res.status(403).json({
          success: false,
          message: 'This exam is not published yet'
        });
      }
      if (exam.blockedStudents?.some((studentId) => studentId.toString() === req.user.id)) {
        return res.status(403).json({
          success: false,
          message: 'You are not allowed to take this exam'
        });
      }
      if (!isDepartmentMatch(exam.department, req.user.department) || !exam.semesters.includes(Number(req.user.semester))) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to view this exam'
        });
      }
    }

    res.status(200).json({
      success: true,
      exam
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching exam',
      error: error.message
    });
  }
};

// @desc    Update exam
// @route   PUT /api/exams/:id
// @access  Private (Faculty/Admin)
export const updateExam = async (req, res) => {
  try {
    let exam = await Exam.findById(req.params.id);

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    // Check if user is the creator or admin
    if (exam.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this exam'
      });
    }

    exam = await Exam.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      message: 'Exam updated successfully',
      exam
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating exam',
      error: error.message
    });
  }
};

// @desc    Delete exam
// @route   DELETE /api/exams/:id
// @access  Private (Faculty/Admin)
export const deleteExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    // Check if user is the creator or admin
    if (exam.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this exam'
      });
    }

    await exam.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Exam deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting exam',
      error: error.message
    });
  }
};

// @desc    Publish exam
// @route   PATCH /api/exams/:id/publish
// @access  Private (Faculty/Admin)
export const publishExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    // Check if user is the creator or admin
    if (exam.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to publish this exam'
      });
    }

    exam.isPublished = true;
    exam.status = 'ongoing'; // Changed from 'scheduled' to 'ongoing' so students can take it immediately
    exam.scheduledPublishAt = null;
    await exam.save();

    const grievanceSync = await ensureAutoGrievanceTrackingForPublishedExam(exam);

    res.status(200).json({
      success: true,
      message: 'Exam published successfully',
      exam,
      grievanceSync
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error publishing exam',
      error: error.message
    });
  }
};

// @desc    Get my exams (for students)
// @route   GET /api/exams/my-exams
// @access  Private (Student)
export const getMyExams = async (req, res) => {
  try {
    await autoPublishDueExams();

    // Check if student has semester set
    if (!req.user.semester) {
      return res.status(400).json({
        success: false,
        message: 'Your semester is not set. Please contact admin.'
      });
    }

    // Check if student has department set
    if (!req.user.department) {
      return res.status(400).json({
        success: false,
        message: 'Your department is not set. Please contact admin.'
      });
    }

    const exams = await Exam.find({
      department: buildDepartmentMatcher(req.user.department),
      semesters: { $in: [Number(req.user.semester)] },
      isPublished: true,
      blockedStudents: { $nin: [req.user._id] }
    }).populate('createdBy', 'name');

    // Get evaluations for these exams
    const evaluations = await Evaluation.find({
      student: req.user.id,
      exam: { $in: exams.map(e => e._id) }
    });

    // Combine exam and evaluation data
    const examsWithStatus = exams.map(exam => {
      const evaluation = evaluations.find(e => e.exam.toString() === exam._id.toString());
      return {
        ...exam.toObject(),
        evaluationId: evaluation?._id,
        hasSubmitted: !!evaluation,
        evaluationStatus: evaluation?.status,
        marksObtained: evaluation?.totalMarks,
        submittedAt: evaluation?.submittedAt
      };
    });

    res.status(200).json({
      success: true,
      count: examsWithStatus.length,
      exams: examsWithStatus
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching your exams',
      error: error.message
    });
  }
};

// @desc    Submit exam
// @route   POST /api/exams/:id/submit
// @access  Private (Student)
export const submitExam = async (req, res) => {
  try {
    if (req.user.role === 'student' && req.user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: DEACTIVATED_EXAM_MESSAGE
      });
    }

    const exam = await Exam.findById(req.params.id);

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    if (exam.blockedStudents?.some((studentId) => studentId.toString() === req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Admin has restricted your access to this exam'
      });
    }

    // Check if already submitted
    const existingEvaluation = await Evaluation.findOne({
      exam: exam._id,
      student: req.user.id
    });

    if (existingEvaluation) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted this exam'
      });
    }

    const { answers, timeTaken } = req.body;

    // Auto-evaluate only MCQ and True-False questions
    let totalMarks = 0;
    const evaluatedAnswers = [];
    
    console.log('📝 Processing exam submission...');

    for (let i = 0; i < answers.length; i++) {
      const answer = answers[i];
      const question = exam.questions[i];
      let marksObtained = 0;
      let isCorrect = false;
      let feedback = '';

      // Auto-grade only MCQ and True-False
      if (question.questionType === 'mcq' || question.questionType === 'true-false') {
        isCorrect = answer.answer === question.correctAnswer;
        marksObtained = isCorrect ? question.marks : 0;
        feedback = isCorrect ? 'Correct answer' : 'Incorrect answer';
        totalMarks += marksObtained;
        
        console.log(`✅ MCQ Q${i + 1}: ${marksObtained}/${question.marks} marks`);
      } 
      // Subjective questions - leave for faculty evaluation
      else if (question.questionType === 'subjective') {
        marksObtained = 0;
        feedback = 'Pending faculty evaluation';
        console.log(`📋 Subjective Q${i + 1}: Pending faculty evaluation`);
      }

      evaluatedAnswers.push({
        questionNumber: answer.questionNumber,
        answer: answer.answer,
        marksObtained,
        maxMarks: question.marks,
        isCorrect,
        feedback
      });
    }

    console.log(`📊 Auto-graded marks: ${totalMarks}/${exam.totalMarks} (subjective questions pending)`);

    // Create evaluation with 'under-evaluation' status
    const evaluation = await Evaluation.create({
      exam: exam._id,
      student: req.user.id,
      answers: evaluatedAnswers,
      totalMarks,
      maxMarks: exam.totalMarks,
      timeTaken,
      submittedAt: new Date(),
      isLate: new Date() > exam.endTime,
      status: 'under-evaluation',
      auditLog: [{
        action: 'Exam submitted',
        performedBy: req.user.id,
        timestamp: new Date(),
        details: `Exam submitted. Objective questions auto-graded: ${totalMarks} marks. Subjective questions pending faculty evaluation.`
      }]
    });

    console.log('✅ Evaluation saved successfully');

    res.status(201).json({
      success: true,
      message: 'Exam submitted and graded successfully',
      evaluation
    });
  } catch (error) {
    console.error('Submit exam error:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting exam',
      error: error.message
    });
  }
};

// @desc    Submit feedback for a submitted exam
// @route   POST /api/exams/:id/feedback
// @access  Private (Student)
export const submitExamFeedback = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found'
      });
    }

    const evaluation = await Evaluation.findOne({
      exam: exam._id,
      student: req.user.id
    });

    if (!evaluation) {
      return res.status(400).json({
        success: false,
        message: 'You can submit feedback only after submitting the exam'
      });
    }

    const {
      uiExperienceRating,
      questionClarityRating,
      overallExperienceRating,
      comments = ''
    } = req.body;

    const ratingFields = {
      uiExperienceRating,
      questionClarityRating,
      overallExperienceRating
    };

    for (const [field, value] of Object.entries(ratingFields)) {
      if (!Number.isInteger(value) || value < 1 || value > 5) {
        return res.status(400).json({
          success: false,
          message: `${field} must be an integer between 1 and 5`
        });
      }
    }

    evaluation.examFeedback = {
      uiExperienceRating,
      questionClarityRating,
      overallExperienceRating,
      comments,
      submittedAt: new Date()
    };

    evaluation.auditLog.push({
      action: 'Exam feedback submitted',
      performedBy: req.user.id,
      timestamp: new Date(),
      details: 'Student submitted post-exam experience feedback.'
    });

    await evaluation.save();

    return res.status(200).json({
      success: true,
      message: 'Exam feedback submitted successfully'
    });
  } catch (error) {
    console.error('Submit exam feedback error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error submitting exam feedback',
      error: error.message
    });
  }
};

// @desc    Get upcoming exams
// @route   GET /api/exams/upcoming
// @access  Private
export const getUpcomingExams = async (req, res) => {
  try {
    await autoPublishDueExams();

    let query = {
      startTime: { $gte: new Date() },
      isPublished: true
    };

    if (req.user.role === 'student') {
      query.department = buildDepartmentMatcher(req.user.department);
      query.semesters = { $in: [Number(req.user.semester)] };
      query.blockedStudents = { $nin: [req.user._id] };
    }

    const exams = await Exam.find(query)
      .populate('createdBy', 'name')
      .sort({ startTime: 1 })
      .limit(10);

    res.status(200).json({
      success: true,
      count: exams.length,
      exams
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching upcoming exams',
      error: error.message
    });
  }
};
