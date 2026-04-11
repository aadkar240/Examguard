import Result from '../models/Result.js';
import Evaluation from '../models/Evaluation.js';
import Exam from '../models/Exam.js';
import User from '../models/User.js';

// Grade scale: A=4, B=3, C=2, D=1, F=0
const getGradePoints = (grade) => {
  const gradeMap = {
    'A+': 4.0,
    'A': 4.0,
    'B+': 3.5,
    'B': 3.0,
    'C+': 2.5,
    'C': 2.0,
    'D': 1.0,
    'F': 0.0,
    'Pending': 0.0
  };
  return gradeMap[grade] || 0.0;
};

// Thresholds: A (85+), B (75+), C (65+), D (55+), F (<55)
const assignGrade = (percentage) => {
  if (percentage >= 85) return 'A';
  if (percentage >= 75) return 'B+';
  if (percentage >= 65) return 'B';
  if (percentage >= 55) return 'C';
  return 'F';
};

// Credit points: A=4, B+=3.5, B=3, C=2, F=0
const getCreditPoints = (grade) => {
  const creditMap = {
    'A+': 4,
    'A': 4,
    'B+': 3,
    'B': 3,
    'C+': 2,
    'C': 2,
    'D': 1,
    'F': 0
  };
  return creditMap[grade] || 0;
};

const hasSameExamSet = (existingResult, newExamsData) => {
  if (!existingResult || !Array.isArray(existingResult.exams) || existingResult.exams.length !== newExamsData.length) {
    return false;
  }

  return existingResult.exams.every((existingExam, index) => {
    const existingExamId = existingExam?.exam?.toString?.() || existingExam?.exam?._id?.toString?.();
    const newExamId = newExamsData[index]?.exam?.toString?.();
    return existingExamId === newExamId;
  });
};

const getEvaluationSortTimestamp = (evaluation) => {
  const timestamp = evaluation?.evaluatedAt || evaluation?.updatedAt || evaluation?.submittedAt || evaluation?.createdAt;
  return timestamp ? new Date(timestamp).getTime() : 0;
};

const getLatestCompletedEvaluations = async (studentId, limit = 5) => {
  const completedEvaluations = await Evaluation.find({
    student: studentId,
    status: { $in: ['evaluated', 're-evaluated'] }
  })
    .populate('exam', 'title subject maxMarks')
    .lean();

  return completedEvaluations
    .filter((evaluation) => evaluation?.exam)
    .sort((a, b) => getEvaluationSortTimestamp(b) - getEvaluationSortTimestamp(a))
    .slice(0, limit);
};

  const latestResultSort = { generatedAt: -1, createdAt: -1, batchNumber: -1, _id: -1 };

  const toFiniteNumber = (value, fallback = 0) => {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : fallback;
  };

  const deriveMarksFromAnswers = (answers = []) => {
    if (!Array.isArray(answers) || answers.length === 0) {
      return 0;
    }

    return answers.reduce((sum, answer) => sum + toFiniteNumber(answer?.marksObtained, 0), 0);
  };

  const buildExamDataFromEvaluation = (evaluation) => {
    const maxMarks = toFiniteNumber(evaluation?.maxMarks, toFiniteNumber(evaluation?.exam?.maxMarks, 0));
    const recordedTotalMarks = toFiniteNumber(evaluation?.totalMarks, 0);
    const derivedFromAnswers = deriveMarksFromAnswers(evaluation?.answers);
    const totalMarks = recordedTotalMarks > 0 ? recordedTotalMarks : derivedFromAnswers;

    const effectivePercentage = maxMarks > 0
      ? (totalMarks / maxMarks) * 100
      : toFiniteNumber(evaluation?.percentage, 0);

    const grade = evaluation?.grade && evaluation.grade !== 'Pending'
      ? evaluation.grade
      : assignGrade(effectivePercentage);

    return {
      exam: evaluation.exam._id,
      title: evaluation.exam.title,
      subject: evaluation.exam.subject,
      totalMarks,
      maxMarks,
      percentage: Number(effectivePercentage.toFixed(2)),
      grade,
      creditPoints: getCreditPoints(grade)
    };
  };

export const generateResult = async (req, res) => {
  try {
    const studentId = req.user?.id || req.body.studentId;

    if (!studentId) {
      return res.status(400).json({ error: 'Student ID required' });
    }

    // Fetch the 5 most recent completed evaluations for this student
    const evaluations = await getLatestCompletedEvaluations(studentId, 5);

    if (evaluations.length < 5) {
      return res.status(400).json({
        error: `Need at least 5 completed evaluations. Found: ${evaluations.length}`
      });
    }

    const examsData = evaluations.map(buildExamDataFromEvaluation);

    // Calculate aggregate metrics
    const totalObtainedMarks = examsData.reduce((sum, exam) => sum + exam.totalMarks, 0);
    const totalMaxMarks = examsData.reduce((sum, exam) => sum + exam.maxMarks, 0);
    const overallPercentage = (totalObtainedMarks / totalMaxMarks) * 100;

    // Calculate CGPA (average of grade points weighted by credits)
    const totalGradePoints = examsData.reduce((sum, exam) => sum + getGradePoints(exam.grade), 0);
    const cgpa = (totalGradePoints / examsData.length).toFixed(2);

    const totalCredits = examsData.reduce((sum, exam) => sum + exam.creditPoints, 0);

    // Fetch student information for metadata
    const student = await User.findById(studentId).select('name email rollNumber department semester');

    const latestStoredResult = await Result.findOne({ student: studentId })
      .sort(latestResultSort);

    if (hasSameExamSet(latestStoredResult, examsData)) {
      const populatedResult = await Result.findById(latestStoredResult._id)
        .populate('student', 'name email rollNumber department')
        .populate('exams.exam', 'title subject');

      return res.json({
        success: true,
        message: 'Latest 5-exam result is already generated',
        result: {
          ...populatedResult.toObject(),
          studentDetails: student
        }
      });
    }

    const previousResultCount = await Result.countDocuments({ student: studentId });

    // Always create a new result snapshot for each new 5-exam batch
    const resultData = {
      student: studentId,
      batchNumber: previousResultCount + 1,
      exams: examsData,
      cgpa: parseFloat(cgpa),
      totalCredits,
      totalObtainedMarks,
      totalMaxMarks,
      overallPercentage: parseFloat(overallPercentage.toFixed(2)),
      generatedAt: new Date(),
      academicSemester: student?.semester || 'N/A',
      academicYear: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1)
    };

    let result = await Result.create(resultData);
    result = await result.populate('student', 'name email rollNumber department');
    result = await result.populate('exams.exam', 'title subject');

    res.json({
      success: true,
      message: 'Result generated successfully',
      result: {
        ...result.toObject(),
        studentDetails: student
      }
    });
  } catch (error) {
    console.error('Error generating result:', error);
    res.status(500).json({ error: error.message || 'Failed to generate result' });
  }
};

export const getMyResult = async (req, res) => {
  try {
    const studentId = req.user?.id;

    const result = await Result.findOne({ student: studentId })
      .populate('student', 'name email rollNumber department')
      .sort(latestResultSort);

    if (!result) {
      return res.status(404).json({
        error: 'No result found. Generate result first by completing at least 5 exams.'
      });
    }

    res.json({
      success: true,
      result
    });
  } catch (error) {
    console.error('Error fetching result:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch result' });
  }
};

export const getMyResults = async (req, res) => {
  try {
    const studentId = req.user?.id;

    const results = await Result.find({ student: studentId })
      .populate('student', 'name email rollNumber department')
      .sort(latestResultSort);

    if (!results.length) {
      return res.status(404).json({
        error: 'No results found. Generate result first by completing at least 5 exams.'
      });
    }

    res.json({
      success: true,
      results,
      latestResult: results[0]
    });
  } catch (error) {
    console.error('Error fetching result history:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch result history' });
  }
};

export const getLatestResult = async (req, res) => {
  try {
    const studentId = req.user?.id;

    // Fetch the 5 most recent completed evaluations
    const evaluations = await getLatestCompletedEvaluations(studentId, 5);

    if (evaluations.length < 5) {
      return res.json({
        success: false,
        canGenerate: false,
        evaluated: evaluations.length,
        required: 5
      });
    }

    const examsData = evaluations.map(buildExamDataFromEvaluation);

    const totalObtainedMarks = examsData.reduce((sum, exam) => sum + exam.totalMarks, 0);
    const totalMaxMarks = examsData.reduce((sum, exam) => sum + exam.maxMarks, 0);
    const overallPercentage = (totalObtainedMarks / totalMaxMarks) * 100;

    const totalGradePoints = examsData.reduce((sum, exam) => sum + getGradePoints(exam.grade), 0);
    const cgpa = (totalGradePoints / examsData.length).toFixed(2);

    const totalCredits = examsData.reduce((sum, exam) => sum + exam.creditPoints, 0);

    const student = await User.findById(studentId).select('name email rollNumber department semester');

    res.json({
      success: true,
      canGenerate: true,
      evaluated: evaluations.length,
      data: {
        student: studentId,
        exams: examsData,
        cgpa: parseFloat(cgpa),
        totalCredits,
        totalObtainedMarks,
        totalMaxMarks,
        overallPercentage: parseFloat(overallPercentage.toFixed(2)),
        studentDetails: student
      }
    });
  } catch (error) {
    console.error('Error checking result eligibility:', error);
    res.status(500).json({ error: error.message || 'Failed to check result' });
  }
};

export const deleteResult = async (req, res) => {
  try {
    const { resultId } = req.params;
    const studentId = req.user?.id;

    const result = await Result.findById(resultId);
    if (!result || result.student.toString() !== studentId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await Result.deleteOne({ _id: resultId });
    res.json({ success: true, message: 'Result deleted' });
  } catch (error) {
    console.error('Error deleting result:', error);
    res.status(500).json({ error: error.message || 'Failed to delete result' });
  }
};

export default { generateResult, getMyResult, getMyResults, getLatestResult, deleteResult };
