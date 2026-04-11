import fs from 'fs';
import path from 'path';
import multer from 'multer';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';
import Exam from '../models/Exam.js';
import User from '../models/User.js';
import ProctoringRecording from '../models/ProctoringRecording.js';
import ProctoringSession from '../models/ProctoringSession.js';
import ProctoringViolation from '../models/ProctoringViolation.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, '..', 'uploads', 'proctoring');

const DEFAULT_ENCRYPTION_SEED = 'examguard-proctoring-default-key';

const getEncryptionKey = () => {
  const source = process.env.PROCTORING_ENCRYPTION_KEY || process.env.JWT_SECRET || DEFAULT_ENCRYPTION_SEED;
  return crypto.createHash('sha256').update(source).digest();
};

const encryptBuffer = (buffer) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
  };
};

const decryptBuffer = (encryptedBuffer, ivBase64, authTagBase64) => {
  const iv = Buffer.from(ivBase64, 'base64');
  const authTag = Buffer.from(authTagBase64, 'base64');
  const decipher = crypto.createDecipheriv('aes-256-gcm', getEncryptionKey(), iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);
};

const encryptDetails = (data) => {
  const payload = Buffer.from(JSON.stringify(data || {}), 'utf-8');
  const { encrypted, iv, authTag } = encryptBuffer(payload);
  return {
    detailsEncrypted: encrypted.toString('base64'),
    detailsIv: iv,
    detailsAuthTag: authTag,
  };
};

const decryptDetails = (record) => {
  if (!record?.detailsEncrypted || !record?.detailsIv || !record?.detailsAuthTag) {
    return {};
  }

  try {
    const decrypted = decryptBuffer(
      Buffer.from(record.detailsEncrypted, 'base64'),
      record.detailsIv,
      record.detailsAuthTag,
    );
    return JSON.parse(decrypted.toString('utf-8'));
  } catch (error) {
    return {};
  }
};

const scoreWeights = {
  MULTI_FACE: 4,
  LOOKING_AWAY_REPEATED: 2,
  MOBILE_DEVICE_SUSPECTED: 4,
  BACKGROUND_CONVERSATION: 3,
  TAB_SWITCH: 5,
  ESC_KEY_PRESS: 5,
  COPY_PASTE_ATTEMPT: 4,
  RAPID_ANSWER_ANOMALY: 2,
};

const warningTypes = new Set([
  'MULTI_FACE',
  'LOOKING_AWAY_REPEATED',
  'MOBILE_DEVICE_SUSPECTED',
  'BACKGROUND_CONVERSATION',
  'RAPID_ANSWER_ANOMALY',
]);

const getRiskLevel = (score) => {
  if (score >= 35) return 'critical';
  if (score >= 22) return 'high';
  if (score >= 10) return 'medium';
  return 'low';
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const examId = req.body.examId || 'exam';
    const studentId = req.user?.id || 'student';
    const ext = path.extname(file.originalname) || '.webm';
    cb(null, `${examId}-${studentId}-${Date.now()}${ext}`);
  },
});

export const uploadRecordingMiddleware = multer({
  storage,
  limits: {
    fileSize: 500 * 1024 * 1024,
  },
}).single('recording');

const getAuthenticatedAdminFromToken = async (req) => {
  const bearerToken = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.split(' ')[1]
    : null;
  const queryToken = req.query?.token;
  const token = bearerToken || queryToken;

  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user || user.role !== 'admin' || !user.isActive) {
      return null;
    }
    return user;
  } catch (error) {
    return null;
  }
};

export const startProctoringSession = async (req, res) => {
  try {
    const { examId, metadata } = req.body;

    if (!examId) {
      return res.status(400).json({
        success: false,
        message: 'examId is required',
      });
    }

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found',
      });
    }

    const session = await ProctoringSession.create({
      exam: examId,
      student: req.user.id,
      metadata: {
        ...(metadata || {}),
        userAgent: req.headers['user-agent'] || metadata?.userAgent,
        ipAddress: req.ip,
      },
    });

    return res.status(201).json({
      success: true,
      session,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to start proctoring session',
      error: error.message,
    });
  }
};

export const logProctoringEvent = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const {
      type,
      severity = 2,
      confidence = 0.7,
      details,
      eventTimestamp,
    } = req.body;

    if (!type) {
      return res.status(400).json({
        success: false,
        message: 'Event type is required',
      });
    }

    const session = await ProctoringSession.findById(sessionId);
    if (!session || session.student.toString() !== req.user.id) {
      return res.status(404).json({
        success: false,
        message: 'Proctoring session not found',
      });
    }

    if (session.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Session is not active',
      });
    }

    const weight = scoreWeights[type] || 2;
    const scoreDelta = Number((weight * Number(severity) * Number(confidence)).toFixed(2));
    const nextScore = Number((session.violationScore + scoreDelta).toFixed(2));
    const nextWarnings = warningTypes.has(type) ? session.warningCount + 1 : session.warningCount;
    const nextRiskLevel = getRiskLevel(nextScore);

    const encryptedDetails = encryptDetails(details || {});

    const violation = await ProctoringViolation.create({
      session: session._id,
      exam: session.exam,
      student: session.student,
      type,
      severity,
      confidence,
      scoreDelta,
      cumulativeScore: nextScore,
      eventTimestamp: eventTimestamp ? new Date(eventTimestamp) : new Date(),
      ...encryptedDetails,
    });

    session.violationScore = nextScore;
    session.warningCount = nextWarnings;
    session.riskLevel = nextRiskLevel;
    await session.save();

    const io = req.app.get('io');
    if (io) {
      io.to('admin-room').emit('proctoring:alert', {
        sessionId: session._id,
        examId: session.exam,
        studentId: session.student,
        type,
        severity,
        confidence,
        scoreDelta,
        violationScore: nextScore,
        warningCount: nextWarnings,
        riskLevel: nextRiskLevel,
        timestamp: violation.eventTimestamp,
      });
    }

    return res.status(201).json({
      success: true,
      violationId: violation._id,
      violationScore: nextScore,
      warningCount: nextWarnings,
      riskLevel: nextRiskLevel,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to log proctoring event',
      error: error.message,
    });
  }
};

export const endProctoringSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { reason = 'completed' } = req.body;

    const session = await ProctoringSession.findById(sessionId);
    if (!session || session.student.toString() !== req.user.id) {
      return res.status(404).json({
        success: false,
        message: 'Proctoring session not found',
      });
    }

    if (session.status !== 'active') {
      return res.status(200).json({
        success: true,
        session,
      });
    }

    session.status = reason === 'completed' ? 'completed' : 'terminated';
    session.endedAt = new Date();
    await session.save();

    return res.status(200).json({
      success: true,
      session,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to end proctoring session',
      error: error.message,
    });
  }
};

export const uploadRecording = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Recording file is required',
      });
    }

    const {
      examId,
      sessionId,
      warningCount,
      terminationReason,
      startedAt,
      endedAt,
    } = req.body;

    if (!examId) {
      return res.status(400).json({
        success: false,
        message: 'examId is required',
      });
    }

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found',
      });
    }

    const plainFilePath = req.file.path;
    const encryptedFileName = `${req.file.filename}.enc`;
    const encryptedAbsolutePath = path.join(uploadDir, encryptedFileName);

    const plainBuffer = fs.readFileSync(plainFilePath);
    const encryptedPayload = encryptBuffer(plainBuffer);
    fs.writeFileSync(encryptedAbsolutePath, encryptedPayload.encrypted);
    fs.unlinkSync(plainFilePath);

    const relativeFilePath = `/uploads/proctoring/${encryptedFileName}`;

    const recording = await ProctoringRecording.create({
      session: sessionId || undefined,
      exam: examId,
      student: req.user.id,
      fileName: encryptedFileName,
      filePath: relativeFilePath,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      isEncrypted: true,
      encryptionIv: encryptedPayload.iv,
      encryptionAuthTag: encryptedPayload.authTag,
      warningCount: Number(warningCount || 0),
      terminationReason: terminationReason || 'normal-submit',
      startedAt: startedAt ? new Date(startedAt) : undefined,
      endedAt: endedAt ? new Date(endedAt) : undefined,
    });

    return res.status(201).json({
      success: true,
      message: 'Recording uploaded successfully',
      recording,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to upload recording',
      error: error.message,
    });
  }
};

export const getAdminRecordings = async (req, res) => {
  try {
    const recordings = await ProctoringRecording.find()
      .populate('session', 'violationScore warningCount riskLevel status')
      .populate('student', 'name email studentId department semester')
      .populate('exam', 'title subject')
      .sort({ createdAt: -1 })
      .limit(200);

    return res.status(200).json({
      success: true,
      count: recordings.length,
      recordings,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch recordings',
      error: error.message,
    });
  }
};

export const streamAdminRecording = async (req, res) => {
  try {
    const admin = await getAuthenticatedAdminFromToken(req);
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const recording = await ProctoringRecording.findById(req.params.id);
    if (!recording) {
      return res.status(404).json({
        success: false,
        message: 'Recording not found',
      });
    }

    const absoluteFilePath = path.join(__dirname, '..', recording.filePath.replace(/^\//, ''));
    if (!fs.existsSync(absoluteFilePath)) {
      return res.status(404).json({
        success: false,
        message: 'Recording file not found',
      });
    }

    const encryptedBuffer = fs.readFileSync(absoluteFilePath);
    const decryptedBuffer = recording.isEncrypted
      ? decryptBuffer(encryptedBuffer, recording.encryptionIv, recording.encryptionAuthTag)
      : encryptedBuffer;

    res.setHeader('Content-Type', recording.mimeType || 'video/webm');
    res.setHeader('Content-Length', decryptedBuffer.length);
    return res.status(200).send(decryptedBuffer);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to stream recording',
      error: error.message,
    });
  }
};

export const getAdminProctoringSessions = async (req, res) => {
  try {
    const sessions = await ProctoringSession.find()
      .populate('student', 'name email studentId department semester')
      .populate('exam', 'title subject')
      .sort({ createdAt: -1 })
      .limit(200);

    return res.status(200).json({
      success: true,
      count: sessions.length,
      sessions,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch proctoring sessions',
      error: error.message,
    });
  }
};

export const getSessionViolations = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const violations = await ProctoringViolation.find({ session: sessionId })
      .sort({ eventTimestamp: -1 })
      .limit(500);

    const decrypted = violations.map((item) => ({
      _id: item._id,
      type: item.type,
      severity: item.severity,
      confidence: item.confidence,
      scoreDelta: item.scoreDelta,
      cumulativeScore: item.cumulativeScore,
      eventTimestamp: item.eventTimestamp,
      details: decryptDetails(item),
    }));

    return res.status(200).json({
      success: true,
      count: decrypted.length,
      violations: decrypted,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch violations',
      error: error.message,
    });
  }
};

export const deleteAdminRecordings = async (req, res) => {
  try {
    const { recordingIds } = req.body;

    if (!Array.isArray(recordingIds) || recordingIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'recordingIds must be a non-empty array',
      });
    }

    const recordings = await ProctoringRecording.find({
      _id: { $in: recordingIds },
    });

    if (!recordings.length) {
      return res.status(404).json({
        success: false,
        message: 'No recordings found for deletion',
      });
    }

    let filesDeleted = 0;

    for (const recording of recordings) {
      if (typeof recording.filePath === 'string' && recording.filePath.startsWith('/uploads/proctoring/')) {
        const absoluteFilePath = path.join(__dirname, '..', recording.filePath.replace(/^\//, ''));

        if (fs.existsSync(absoluteFilePath)) {
          fs.unlinkSync(absoluteFilePath);
          filesDeleted += 1;
        }
      }
    }

    await ProctoringRecording.deleteMany({
      _id: { $in: recordingIds },
    });

    return res.status(200).json({
      success: true,
      message: 'Selected recordings deleted successfully',
      deletedCount: recordings.length,
      filesDeleted,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete recordings',
      error: error.message,
    });
  }
};
