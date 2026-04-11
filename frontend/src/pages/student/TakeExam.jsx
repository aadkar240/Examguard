import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../utils/api'
import { toast } from 'react-toastify'
import { FiClock, FiChevronLeft, FiChevronRight, FiSend, FiTarget, FiZap, FiCheckCircle } from 'react-icons/fi'

const TakeExam = () => {
  const { examId } = useParams()
  const navigate = useNavigate()

  const [exam, setExam] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [answers, setAnswers] = useState({})
  const [examStartTime, setExamStartTime] = useState(null)
  const [autoSaveStatus, setAutoSaveStatus] = useState('')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [examStarted, setExamStarted] = useState(false)
  const [mediaPermissionGranted, setMediaPermissionGranted] = useState(false)
  const [mediaStream, setMediaStream] = useState(null)
  const [warningCount, setWarningCount] = useState(0)
  const [violationScore, setViolationScore] = useState(0)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [proctoringSessionId, setProctoringSessionId] = useState(null)
  const [autoAdvanceLock, setAutoAdvanceLock] = useState(false)
  const videoRef = useRef(null)
  const autoSubmittingRef = useRef(false)
  const lastViolationRef = useRef(0)
  const mediaRecorderRef = useRef(null)
  const recordedChunksRef = useRef([])
  const recordingStartedAtRef = useRef(null)
  const audioSpikeCountRef = useRef(0)
  const lookingAwayStreakRef = useRef(0)
  const mobileSuspicionStreakRef = useRef(0)
  const rapidAnswerTimestampsRef = useRef([])
  const eventCooldownRef = useRef({})
  const subjectiveAnswerTextareaRef = useRef(null)
  const [isRecording, setIsRecording] = useState(false)
  const algebraToolItems = ['+', '-', '×', '÷', '=', '≠', '≤', '≥', '^', '√', 'π', '(', ')', 'sin()', 'cos()', 'tan()']

  useEffect(() => {
    fetchExam()
  }, [examId])

  // Enter fullscreen when exam starts
  useEffect(() => {
    const enterFullscreen = async () => {
      if (!exam || !examStarted) return
      
      try {
        const elem = document.documentElement
        if (elem.requestFullscreen) {
          await elem.requestFullscreen()
        } else if (elem.webkitRequestFullscreen) {
          await elem.webkitRequestFullscreen()
        } else if (elem.msRequestFullscreen) {
          await elem.msRequestFullscreen()
        }
        setIsFullscreen(true)
        toast.info('🔒 Exam mode activated. Please stay in fullscreen until submission.', {
          autoClose: 5000
        })
      } catch (error) {
        console.log('Fullscreen request failed:', error)
        toast.warning('⚠️ Please allow fullscreen mode for exam integrity.')
      }
    }

    if (exam && examStarted && !loading) {
      enterFullscreen()
    }
  }, [exam, examStarted, loading])

  // Monitor and prevent exiting fullscreen
  useEffect(() => {
    if (!exam || !examStarted) return

    const handleFullscreenChange = async () => {
      const isCurrentlyFullscreen = !!(document.fullscreenElement || 
                                        document.webkitFullscreenElement || 
                                        document.msFullscreenElement)
      
      setIsFullscreen(isCurrentlyFullscreen)
      
      if (!isCurrentlyFullscreen && !submitting && !autoSubmittingRef.current) {
        toast.warning('⚠️ Fullscreen exited. Returning to exam mode...', {
          autoClose: 2000,
          position: 'top-center',
        })
        reportProctoringEvent({
          type: 'TAB_SWITCH',
          severity: 4,
          confidence: 0.8,
          details: { fullscreen: false },
          cooldownMs: 5000,
        })
        
        // Force re-enter fullscreen IMMEDIATELY (no delay - instant re-entry)
        (async () => {
          try {
            const elem = document.documentElement
            if (elem.requestFullscreen) {
              await elem.requestFullscreen({ navigationUI: "hide" })
            } else if (elem.webkitRequestFullscreen) {
              await elem.webkitRequestFullscreen()
            } else if (elem.msRequestFullscreen) {
              await elem.msRequestFullscreen()
            }
            
            // Re-lock keyboard after re-entry
            try {
              if (navigator.keyboard && navigator.keyboard.lock) {
                await navigator.keyboard.lock(['Escape'])
              }
            } catch (error) {
              console.log('Keyboard lock failed on re-entry:', error)
            }
          } catch (error) {
            console.log('Re-enter fullscreen failed:', error)
          }
        })()
      }
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
    document.addEventListener('MSFullscreenChange', handleFullscreenChange)

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange)
      
      // Unlock keyboard on cleanup
      if (navigator.keyboard && navigator.keyboard.unlock) {
        navigator.keyboard.unlock()
      }
    }
  }, [exam, examStarted, submitting])

  // Block ESC key to prevent exiting fullscreen during exam
  useEffect(() => {
    if (!exam || !examStarted || submitting) return

    const blockEscKey = (e) => {
      // Block ESC key (keyCode 27)
      if (e.key === 'Escape' || e.keyCode === 27 || e.which === 27) {
        e.preventDefault()
        e.stopPropagation()
        e.stopImmediatePropagation()
        reportProctoringEvent({
          type: 'ESC_KEY_PRESS',
          severity: 5,
          confidence: 1,
          details: { key: 'Escape' },
          cooldownMs: 0,
        })
        handleForcedSubmit('ESC key pressed during exam')
        return false
      }
      
      // Block F11 (fullscreen toggle)
      if (e.key === 'F11' || e.keyCode === 122 || e.which === 122) {
        e.preventDefault()
        e.stopPropagation()
        e.stopImmediatePropagation()
        toast.warning('🚫 F11 is disabled during the exam.', {
          autoClose: 2000
        })
        return false
      }
      
      // Block Alt+F4 (close window) and Alt+Tab (switch window)
      if (e.altKey && (e.key === 'F4' || e.key === 'Tab')) {
        e.preventDefault()
        e.stopPropagation()
        e.stopImmediatePropagation()
        reportProctoringEvent({
          type: 'TAB_SWITCH',
          severity: 5,
          confidence: 1,
          details: { method: 'Alt key combination' },
          cooldownMs: 0,
        })
        handleForcedSubmit('Window switch attempt detected')
        return false
      }
      
      // Block Ctrl+W and Ctrl+Q (close tab/window)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'w' || e.key === 'q')) {
        e.preventDefault()
        e.stopPropagation()
        e.stopImmediatePropagation()
        reportProctoringEvent({
          type: 'TAB_SWITCH',
          severity: 5,
          confidence: 1,
          details: { method: 'Tab close shortcut' },
          cooldownMs: 0,
        })
        handleForcedSubmit('Tab close attempt detected')
        return false
      }
    }

    // Add multiple listeners at different phases for maximum coverage
    document.addEventListener('keydown', blockEscKey, true)  // Capture phase
    document.addEventListener('keydown', blockEscKey, false) // Bubble phase
    document.addEventListener('keyup', blockEscKey, true)    // Also block keyup
    document.addEventListener('keypress', blockEscKey, true) // And keypress
    window.addEventListener('keydown', blockEscKey, true)
    window.addEventListener('keydown', blockEscKey, false)
    
    // Also add to document.body
    if (document.body) {
      document.body.addEventListener('keydown', blockEscKey, true)
      document.body.addEventListener('keydown', blockEscKey, false)
    }

    return () => {
      document.removeEventListener('keydown', blockEscKey, true)
      document.removeEventListener('keydown', blockEscKey, false)
      document.removeEventListener('keyup', blockEscKey, true)
      document.removeEventListener('keypress', blockEscKey, true)
      window.removeEventListener('keydown', blockEscKey, true)
      window.removeEventListener('keydown', blockEscKey, false)
      if (document.body) {
        document.body.removeEventListener('keydown', blockEscKey, true)
        document.body.removeEventListener('keydown', blockEscKey, false)
      }
    }
  }, [exam, examStarted, submitting])

  // Prevent accidental page close
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      e.preventDefault()
      e.returnValue = 'Your exam is in progress. Are you sure you want to leave?'
      return e.returnValue
    }

    if (!examStarted || submitting) return
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [examStarted, submitting])

  useEffect(() => {
    if (videoRef.current && mediaStream) {
      videoRef.current.srcObject = mediaStream
    }
  }, [mediaStream])

  useEffect(() => {
    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [mediaStream])

  useEffect(() => {
    if (!examStarted || submitting) return

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'hidden' || !document.hasFocus()) {
        reportProctoringEvent({
          type: 'TAB_SWITCH',
          severity: 5,
          confidence: 1,
          details: { visibilityState: document.visibilityState },
          cooldownMs: 0,
        })
        handleForcedSubmit('Tab switch detected')
      }
    }

    const handleWindowBlur = () => {
      reportProctoringEvent({
        type: 'TAB_SWITCH',
        severity: 5,
        confidence: 1,
        details: { visibilityState: document.visibilityState, blur: true },
        cooldownMs: 0,
      })
      handleForcedSubmit('Window focus lost')
    }

    document.addEventListener('visibilitychange', handleVisibilityOrFocus)
    window.addEventListener('blur', handleWindowBlur)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus)
      window.removeEventListener('blur', handleWindowBlur)
    }
  }, [examStarted, submitting])

  useEffect(() => {
    if (!examStarted || !mediaStream || submitting) return

    let audioContext
    let animationFrameId
    let source
    let analyser
    const dataArray = new Uint8Array(1024)
    const frequencyData = new Uint8Array(512)

    const analyze = () => {
      analyser.getByteTimeDomainData(dataArray)
      analyser.getByteFrequencyData(frequencyData)

      let sum = 0
      for (let index = 0; index < dataArray.length; index += 1) {
        const normalized = (dataArray[index] - 128) / 128
        sum += normalized * normalized
      }

      const rms = Math.sqrt(sum / dataArray.length)
      let sumFreq = 0
      for (let index = 0; index < frequencyData.length; index += 1) {
        sumFreq += frequencyData[index]
      }
      const avgFreq = sumFreq / frequencyData.length

      let peakCount = 0
      for (let index = 1; index < frequencyData.length - 1; index += 1) {
        const current = frequencyData[index]
        if (current > avgFreq * 1.6 && current > frequencyData[index - 1] && current > frequencyData[index + 1]) {
          peakCount += 1
          if (peakCount >= 2) break
        }
      }

      const multiSpeakerLikely = rms > 0.18 && peakCount >= 2

      if (multiSpeakerLikely) {
        audioSpikeCountRef.current += 1
        if (audioSpikeCountRef.current >= 5) {
          handleViolationWarning('Overlapping voices detected')
          reportProctoringEvent({
            type: 'BACKGROUND_CONVERSATION',
            severity: 2,
            confidence: 0.6,
            details: { rms, peakCount },
            cooldownMs: 20000,
          })
          audioSpikeCountRef.current = 0
        }
      } else {
        audioSpikeCountRef.current = 0
      }

      animationFrameId = requestAnimationFrame(analyze)
    }

    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)()
      source = audioContext.createMediaStreamSource(mediaStream)
      analyser = audioContext.createAnalyser()
      analyser.fftSize = 1024
      source.connect(analyser)
      analyze()
    } catch (error) {
      console.error('Audio analysis unavailable:', error)
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId)
      if (source) source.disconnect()
      if (analyser) analyser.disconnect()
      if (audioContext) audioContext.close()
    }
  }, [examStarted, mediaStream, submitting])

  useEffect(() => {
    if (!examStarted || submitting) return

    const handleClipboardAttempt = (event) => {
      event.preventDefault()
      reportProctoringEvent({
        type: 'COPY_PASTE_ATTEMPT',
        severity: 4,
        confidence: 0.95,
        details: { action: event.type },
        cooldownMs: 2500,
      })
      handleViolationWarning('Copy/paste action detected')
    }

    document.addEventListener('copy', handleClipboardAttempt)
    document.addEventListener('cut', handleClipboardAttempt)
    document.addEventListener('paste', handleClipboardAttempt)

    return () => {
      document.removeEventListener('copy', handleClipboardAttempt)
      document.removeEventListener('cut', handleClipboardAttempt)
      document.removeEventListener('paste', handleClipboardAttempt)
    }
  }, [examStarted, submitting])

  useEffect(() => {
    if (!examStarted || !mediaPermissionGranted || !videoRef.current || submitting) return

    if (!('FaceDetector' in window)) {
      toast.info('Advanced face tracking is not supported in this browser. Basic proctoring is active.')
      return
    }

    const detector = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 3 })

    const monitorInterval = setInterval(async () => {
      try {
        if (!videoRef.current || videoRef.current.readyState < 2) return
        const faces = await detector.detect(videoRef.current)

        if (!faces.length) {
          handleViolationWarning('Face not detected. Keep your face visible')
          reportProctoringEvent({
            type: 'LOOKING_AWAY_REPEATED',
            severity: 3,
            confidence: 0.7,
            details: { faceVisible: false },
            cooldownMs: 7000,
          })
          return
        }

        if (faces.length > 1) {
          handleViolationWarning('Multiple faces detected in camera')
          reportProctoringEvent({
            type: 'MULTI_FACE',
            severity: 4,
            confidence: 0.9,
            details: { faceCount: faces.length },
            cooldownMs: 8000,
          })
        }

        const face = faces[0].boundingBox
        const cx = (face.x + face.width / 2) / videoRef.current.videoWidth
        const cy = (face.y + face.height / 2) / videoRef.current.videoHeight

        if (cx < 0.25 || cx > 0.75) {
          lookingAwayStreakRef.current += 1
          if (lookingAwayStreakRef.current >= 2) {
            handleViolationWarning('You are not focusing on screen')
            reportProctoringEvent({
              type: 'LOOKING_AWAY_REPEATED',
              severity: 2,
              confidence: 0.75,
              details: { cx },
              cooldownMs: 7000,
            })
            lookingAwayStreakRef.current = 0
          }
        } else {
          lookingAwayStreakRef.current = 0
        }

        if (cy > 0.72) {
          mobileSuspicionStreakRef.current += 1
          if (mobileSuspicionStreakRef.current >= 3) {
            handleViolationWarning('Possible mobile/device usage detected')
            reportProctoringEvent({
              type: 'MOBILE_DEVICE_SUSPECTED',
              severity: 4,
              confidence: 0.65,
              details: { cy },
              cooldownMs: 12000,
            })
            mobileSuspicionStreakRef.current = 0
          }
        } else {
          mobileSuspicionStreakRef.current = 0
        }
      } catch (error) {
        console.log('Face detection error:', error)
      }
    }, 4000)

    return () => clearInterval(monitorInterval)
  }, [examStarted, mediaPermissionGranted, submitting])

  useEffect(() => {
    if (!exam || !examStarted || timeRemaining <= 0) return

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          handleAutoSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeRemaining, exam, examStarted])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Prevent navigation when typing in textarea
      if (e.target.tagName === 'TEXTAREA') return
      
      if (e.key === 'ArrowLeft' && currentQuestionIdx > 0) {
        setCurrentQuestionIdx(prev => prev - 1)
      } else if (e.key === 'ArrowRight' && currentQuestionIdx < exam?.questions.length - 1) {
        setCurrentQuestionIdx(prev => prev + 1)
      }
    }

    if (!examStarted) return
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [currentQuestionIdx, exam, examStarted])

  useEffect(() => {
    if (!examStarted || !exam) return

    const currentQuestion = exam.questions[currentQuestionIdx]
    if (!currentQuestion) return

    const handleQuickAnswer = (e) => {
      if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return
      if (autoAdvanceLock) return

      if (currentQuestion.questionType === 'mcq' && Array.isArray(currentQuestion.options)) {
        const key = e.key.toUpperCase()
        const optionIndex = ['A', 'B', 'C', 'D'].indexOf(key)
        if (optionIndex >= 0 && optionIndex < currentQuestion.options.length) {
          handleObjectiveAnswerSelect(currentQuestion.options[optionIndex])
        }
      }

      if (currentQuestion.questionType === 'true-false') {
        if (e.key.toUpperCase() === 'T') {
          handleObjectiveAnswerSelect('True')
        } else if (e.key.toUpperCase() === 'F') {
          handleObjectiveAnswerSelect('False')
        }
      }
    }

    window.addEventListener('keydown', handleQuickAnswer)
    return () => window.removeEventListener('keydown', handleQuickAnswer)
  }, [examStarted, exam, currentQuestionIdx, autoAdvanceLock])

  const fetchExam = async () => {
    try {
      const response = await api.get(`/exams/${examId}`)
      const examData = response.data.exam
      setExam(examData)
      
      // Initialize timer in seconds
      setTimeRemaining(examData.duration * 60)
      
      // Initialize answers object
      const initialAnswers = {}
      examData.questions.forEach((_, idx) => {
        initialAnswers[idx] = ''
      })
      setAnswers(initialAnswers)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load exam')
      navigate('/student/exams')
    } finally {
      setLoading(false)
    }
  }

  const requestMediaAccess = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      })
      setMediaStream(stream)
      setMediaPermissionGranted(true)
      toast.success('Camera and microphone access granted.')
    } catch (error) {
      toast.error('Camera and microphone permission is required to start exam.')
      setMediaPermissionGranted(false)
    }
  }

  const startBackendProctoringSession = async () => {
    try {
      const response = await api.post('/proctoring/session/start', {
        examId,
        metadata: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
        },
      })

      setProctoringSessionId(response.data.session?._id || null)
      return response.data.session?._id || null
    } catch (error) {
      toast.error('Failed to initialize proctoring session.')
      return null
    }
  }

  const endBackendProctoringSession = async (reason = 'completed', sessionId = proctoringSessionId) => {
    if (!sessionId) return
    try {
      await api.post(`/proctoring/session/${sessionId}/end`, { reason })
    } catch (error) {
      console.error('Failed to end proctoring session:', error)
    }
  }

  const reportProctoringEvent = async ({
    type,
    severity = 2,
    confidence = 0.7,
    details = {},
    cooldownMs = 3000,
  }) => {
    if (!proctoringSessionId || !examStarted) return null

    const now = Date.now()
    const lastEventAt = eventCooldownRef.current[type] || 0
    if (now - lastEventAt < cooldownMs) return null

    eventCooldownRef.current[type] = now

    try {
      const response = await api.post(`/proctoring/session/${proctoringSessionId}/event`, {
        type,
        severity,
        confidence,
        details,
        eventTimestamp: new Date().toISOString(),
      })

      setWarningCount(response.data.warningCount || 0)
      setViolationScore(response.data.violationScore || 0)

      if ((response.data.warningCount || 0) >= 3) {
        handleForcedSubmit('Three warning limit reached')
      }

      return response.data
    } catch (error) {
      console.error('Failed to report proctoring event:', error)
      return null
    }
  }

  const startProctoringRecording = () => {
    if (!mediaStream) {
      toast.error('Camera stream not available for recording.')
      return false
    }

    if (!window.MediaRecorder) {
      toast.error('This browser does not support recording. Please use latest Chrome/Edge.')
      return false
    }

    try {
      recordedChunksRef.current = []

      let recorderOptions = {}
      if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')) {
        recorderOptions = { mimeType: 'video/webm;codecs=vp8,opus' }
      } else if (MediaRecorder.isTypeSupported('video/webm')) {
        recorderOptions = { mimeType: 'video/webm' }
      }

      const recorder = new MediaRecorder(mediaStream, recorderOptions)

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data)
        }
      }

      recorder.start(1000)
      mediaRecorderRef.current = recorder
      recordingStartedAtRef.current = new Date().toISOString()
      setIsRecording(true)
      return true
    } catch (error) {
      toast.error('Unable to start recording.')
      return false
    }
  }

  const stopProctoringRecording = () => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current

      if (!recorder || recorder.state === 'inactive') {
        setIsRecording(false)
        if (recordedChunksRef.current.length > 0) {
          resolve(new Blob(recordedChunksRef.current, { type: 'video/webm' }))
          return
        }
        resolve(null)
        return
      }

      recorder.onstop = () => {
        setIsRecording(false)
        const blob = recordedChunksRef.current.length
          ? new Blob(recordedChunksRef.current, { type: 'video/webm' })
          : null
        resolve(blob)
      }

      recorder.stop()
    })
  }

  const uploadRecording = async (recordingBlob, terminationReason = 'normal-submit') => {
    if (!recordingBlob || recordingBlob.size === 0) return

    const formData = new FormData()
    formData.append('recording', recordingBlob, `exam-${examId}-${Date.now()}.webm`)
    formData.append('examId', examId)
    if (proctoringSessionId) {
      formData.append('sessionId', proctoringSessionId)
    }
    formData.append('warningCount', String(warningCount))
    formData.append('terminationReason', terminationReason)
    if (recordingStartedAtRef.current) {
      formData.append('startedAt', recordingStartedAtRef.current)
    }
    formData.append('endedAt', new Date().toISOString())

    try {
      await api.post('/proctoring/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
    } catch (error) {
      console.error('Recording upload failed:', error)
      toast.warning('Exam submitted, but recording upload failed.')
    }
  }

  const startExamSession = async () => {
    if (!agreedToTerms) {
      toast.warning('Please accept terms and conditions before starting.')
      return
    }

    if (!mediaPermissionGranted) {
      toast.warning('Please enable camera and microphone first.')
      return
    }

    const createdSessionId = await startBackendProctoringSession()
    if (!createdSessionId) return

    const recordingStarted = startProctoringRecording()
    if (!recordingStarted) return

    setExamStartTime(Date.now())
    setExamStarted(true)
    toast.info('Exam started. Stay focused and remain in exam tab.', {
      autoClose: 3000,
    })
  }

  const handleForcedSubmit = async (reason) => {
    if (autoSubmittingRef.current || submitting) return
    autoSubmittingRef.current = true
    toast.error(`${reason}. Auto-submitting exam now...`, {
      autoClose: 2500,
    })
    await submitExamAnswers({ force: true, reason })
  }

  const handleViolationWarning = (reason) => {
    const now = Date.now()
    if (now - lastViolationRef.current < 2500 || autoSubmittingRef.current || submitting) {
      return
    }
    lastViolationRef.current = now
    toast.warning(`Proctoring alert: ${reason}`)
  }

  const handleAutoSubmit = async () => {
    toast.warning('Time is up! Submitting your exam...')
    await submitExamAnswers({ force: true, reason: 'time-up' })
  }

  const handleAnswerChange = (questionIdx, value) => {
    const questionType = exam?.questions?.[questionIdx]?.questionType

    // Do not treat normal typing in subjective text areas as suspicious behavior.
    if (questionType !== 'subjective') {
      const now = Date.now()
      rapidAnswerTimestampsRef.current = [...rapidAnswerTimestampsRef.current, now].filter(
        (timestamp) => now - timestamp <= 10000,
      )

      if (rapidAnswerTimestampsRef.current.length >= 7) {
        reportProctoringEvent({
          type: 'RAPID_ANSWER_ANOMALY',
          severity: 2,
          confidence: 0.7,
          details: {
            actionsIn10Seconds: rapidAnswerTimestampsRef.current.length,
          },
          cooldownMs: 12000,
        })
        handleViolationWarning('Rapid answer pattern detected')
        rapidAnswerTimestampsRef.current = []
      }
    } else {
      rapidAnswerTimestampsRef.current = []
    }

    setAnswers(prev => ({
      ...prev,
      [questionIdx]: value
    }))
    
    // Show auto-save indicator
    setAutoSaveStatus('Saving...')
    setTimeout(() => {
      setAutoSaveStatus('Saved ✓')
      setTimeout(() => setAutoSaveStatus(''), 2000)
    }, 500)
  }

  const insertIntoSubjectiveAnswer = (valueToInsert) => {
    const textarea = subjectiveAnswerTextareaRef.current
    const currentText = answers[currentQuestionIdx] || ''

    if (!textarea) {
      handleAnswerChange(currentQuestionIdx, `${currentText}${valueToInsert}`)
      return
    }

    const selectionStart = textarea.selectionStart ?? currentText.length
    const selectionEnd = textarea.selectionEnd ?? selectionStart
    const updatedText = `${currentText.slice(0, selectionStart)}${valueToInsert}${currentText.slice(selectionEnd)}`
    const caretPosition = selectionStart + valueToInsert.length

    handleAnswerChange(currentQuestionIdx, updatedText)

    requestAnimationFrame(() => {
      textarea.focus()
      textarea.setSelectionRange(caretPosition, caretPosition)
    })
  }

  const goToNextQuestion = () => {
    if (!exam) return
    setCurrentQuestionIdx((prev) => Math.min(exam.questions.length - 1, prev + 1))
  }

  const handleObjectiveAnswerSelect = (value) => {
    if (autoAdvanceLock) return
    handleAnswerChange(currentQuestionIdx, value)

    if (!exam || currentQuestionIdx >= exam.questions.length - 1) {
      return
    }

    setAutoAdvanceLock(true)
    setTimeout(() => {
      goToNextQuestion()
      setAutoAdvanceLock(false)
    }, 250)
  }

  const submitExamAnswers = async ({ force = false, reason = 'normal-submit' } = {}) => {
    if (!exam || submitting) return

    // Count unanswered questions
    const unansweredCount = exam.questions.length - answeredCount

    if (!force && unansweredCount > 0) {
      const confirmSubmit = window.confirm(
        `You have ${unansweredCount} unanswered question(s). Are you sure you want to submit?`
      )
      if (!confirmSubmit) return
    } else if (!force) {
      const confirmSubmit = window.confirm(
        `Are you ready to submit your exam? You cannot change your answers after submission.`
      )
      if (!confirmSubmit) return
    }

    setSubmitting(true)
    try {
      const examAnswers = exam.questions.map((question, idx) => ({
        questionNumber: idx + 1,
        questionText: question.questionText,
        questionType: question.questionType,
        answer: answers[idx] || '',
        maxMarks: question.marks
      }))

      const response = await api.post(`/exams/${examId}/submit`, {
        answers: examAnswers,
        timeTaken: examStartTime ? Math.floor((Date.now() - examStartTime) / 60000) : 0,
      })

      if (response.data.success) {
        try {
          const recordingBlob = await stopProctoringRecording()
          await uploadRecording(recordingBlob, reason)
          await endBackendProctoringSession(reason === 'normal-submit' ? 'completed' : 'terminated')

          if (document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement) {
            try {
              if (navigator.keyboard && navigator.keyboard.unlock) {
                navigator.keyboard.unlock()
              }

              if (document.exitFullscreen) {
                await document.exitFullscreen()
              } else if (document.webkitExitFullscreen) {
                await document.webkitExitFullscreen()
              } else if (document.msExitFullscreen) {
                await document.msExitFullscreen()
              }
            } catch (error) {
              console.log('Exit fullscreen error:', error)
            }
          }

          if (mediaStream) {
            mediaStream.getTracks().forEach((track) => track.stop())
          }
        } catch (cleanupError) {
          console.error('Post-submit cleanup failed:', cleanupError)
        }

        toast.success('Exam submitted successfully! 🎉', {
          autoClose: 2000
        })
        sessionStorage.setItem('pendingExamFeedback', JSON.stringify({
          examId,
          createdAt: Date.now(),
        }))
        navigate('/student/exams', {
          state: {
            openFeedback: true,
            examId,
          }
        })
      }
    } catch (error) {
      await endBackendProctoringSession('terminated')
      const errorMessage = error.response?.data?.message || 'Error submitting exam'

      if (errorMessage.toLowerCase().includes('already submitted')) {
        toast.info('This exam is already submitted. Please share your feedback.')
        sessionStorage.setItem('pendingExamFeedback', JSON.stringify({
          examId,
          createdAt: Date.now(),
        }))
        navigate('/student/exams', {
          state: {
            openFeedback: true,
            examId,
          }
        })
      } else {
        toast.error(errorMessage)
      }
    } finally {
      autoSubmittingRef.current = false
      setSubmitting(false)
    }
  }

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!exam || exam.questions.length === 0) {
    return (
      <div className="card text-center">
        <p className="text-gray-600">No questions found in this exam</p>
      </div>
    )
  }

  if (!examStarted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="card">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">{exam.title}</h1>
            <p className="text-gray-600 mb-6">Read and accept the exam terms before starting.</p>

            <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-yellow-800 mb-3">Exam Terms & Conditions</h3>
              <ul className="text-sm text-yellow-900 space-y-2 list-disc pl-5">
                <li>Camera and microphone must remain ON throughout the exam.</li>
                <li>Your face should stay visible and focused on the screen.</li>
                <li>If focus violations are detected, warnings will be issued.</li>
                <li>After 3 warnings, the exam is automatically submitted.</li>
                <li>Pressing ESC key will auto-submit your exam immediately.</li>
                <li>Switching tabs/windows will auto-submit your exam immediately.</li>
                <li>Do not exit fullscreen until you submit the exam.</li>
              </ul>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Identity Check</h4>
                <div className="bg-black rounded-lg overflow-hidden h-56 flex items-center justify-center">
                  {mediaPermissionGranted ? (
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                  ) : (
                    <p className="text-gray-300 text-sm">Enable camera and microphone to continue</p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <button
                  onClick={requestMediaAccess}
                  className="w-full btn btn-primary py-3"
                >
                  {mediaPermissionGranted ? 'Camera & Audio Enabled ✓' : 'Enable Camera & Audio'}
                </button>

                <label className="flex items-start gap-3 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="mt-1"
                  />
                  <span>
                    I have read and agree to all exam terms and conditions. I understand violations can auto-submit my exam.
                  </span>
                </label>

                <button
                  onClick={startExamSession}
                  disabled={!agreedToTerms || !mediaPermissionGranted}
                  className="w-full flex items-center justify-center space-x-2 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                >
                  Start Exam
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const currentQuestion = exam.questions[currentQuestionIdx]
  const isTimeWarning = timeRemaining < 300 // Less than 5 minutes
  const answeredCount = Object.values(answers).filter(a => a).length
  const completionPercent = Math.round((answeredCount / exam.questions.length) * 100)
  const remainingQuestions = exam.questions.length - answeredCount

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 via-sky-50 to-white">
      {/* Fullscreen Warning Banner */}
      {!isFullscreen && exam && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white px-4 py-3 text-center font-semibold shadow-lg animate-pulse">
          ⚠️ ATTENTION: You must remain in fullscreen mode during the exam!
        </div>
      )}
      
      {/* Fullscreen Indicator */}
      {isFullscreen && (
        <div className="fixed top-4 right-4 z-50">
          <div className="bg-green-600 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg flex items-center gap-2 mb-2">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
            🔒 Exam Mode Active
          </div>
          <div className="bg-blue-700 text-white px-3 py-1 rounded-lg text-xs font-semibold shadow-lg mb-2">
            {isRecording ? '🎥 Recording Active' : '🎥 Recording Inactive'}
          </div>
          <div className="bg-red-600 text-white px-3 py-1 rounded-lg text-xs font-semibold shadow-lg">
            ⚠️ Warnings: {warningCount}/3
          </div>
          <div className="bg-purple-700 text-white px-3 py-1 rounded-lg text-xs font-semibold shadow-lg mt-2">
            📊 Violation Score: {violationScore.toFixed(2)}
          </div>
          <div className="bg-red-700 text-white px-3 py-1 rounded-lg text-xs font-semibold shadow-lg mt-2">
            ESC / Tab switch = Auto Submit
          </div>
        </div>
      )}
      
      {/* Header */}
      <div className={`${isTimeWarning ? 'bg-red-50 border-b-2 border-red-500' : 'bg-white border-b'} sticky top-0 z-40 shadow-md ${!isFullscreen ? 'mt-12' : ''}`}>
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{exam.title}</h1>
              <p className="text-sm text-gray-600">{exam.subject} • Classic Game Mode</p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-full px-3 py-1 text-xs font-semibold text-indigo-700">
                <FiTarget />
                <span>{answeredCount}/{exam.questions.length} Answered</span>
              </div>
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-full px-3 py-1 text-xs font-semibold text-amber-700">
                <FiZap />
                <span>{remainingQuestions} Remaining</span>
              </div>
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1 text-xs font-semibold text-emerald-700">
                <FiCheckCircle />
                <span>{completionPercent}% Complete</span>
              </div>
            </div>
          </div>

          <div className="mt-3 w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-primary-500 to-primary-700 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${completionPercent}%` }}
            ></div>
          </div>

          <div className={`mt-3 w-fit ml-auto flex items-center space-x-3 px-5 py-3 rounded-lg border-2 ${
            isTimeWarning ? 'bg-red-100 text-red-700 border-red-500 animate-pulse' : 'bg-blue-50 text-blue-700 border-blue-200'
          }`}>
            <FiClock className="text-xl" />
            <div>
              <div className="text-xs font-medium">{isTimeWarning ? '⚠️ Time Running Out!' : 'Time Remaining'}</div>
              <span className="font-mono font-bold text-xl">{formatTime(timeRemaining)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
          {/* Instructions Banner (only show for first question) */}
          {currentQuestionIdx === 0 && (
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">📌 Instructions</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Answer one question at a time</li>
                <li>• For quick play use keys: A/B/C/D or T/F</li>
                <li>• Use ← → arrow keys or buttons to navigate</li>
                <li>• You can switch between questions anytime</li>
                <li>• Your answers are auto-saved</li>
                <li>• <strong>🔒 Exam is locked in fullscreen mode</strong></li>
                <li>• <strong>⚠️ Focus violations trigger warnings</strong> - 3 warnings auto-submit</li>
                <li>• <strong>🚫 ESC or tab switch causes immediate auto-submit</strong></li>
                <li>• Click Submit when all done to exit exam mode</li>
              </ul>
            </div>
          )}
          
          <div className="card border-2 border-primary-100 shadow-xl">
            {/* Question Header */}
            <div className="mb-6 pb-6 border-b">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4">
                <div>
                  <p className="text-xs uppercase tracking-widest text-primary-700 font-bold mb-1">
                    Round {currentQuestionIdx + 1}
                  </p>
                  <h2 className="text-lg font-bold text-gray-800">
                    Question {currentQuestionIdx + 1} of {exam.questions.length}
                  </h2>
                  {autoSaveStatus && (
                    <p className="text-xs text-green-600 mt-1 font-medium">{autoSaveStatus}</p>
                  )}
                </div>
                <span className="text-sm bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-2 rounded-full text-white font-bold shadow-md">
                  {currentQuestion.marks} {currentQuestion.marks === 1 ? 'Mark' : 'Marks'}
                </span>
              </div>
              <p className="text-gray-800 text-xl mb-4 leading-relaxed font-semibold">{currentQuestion.questionText}</p>
              <span className="inline-block text-xs px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">
                {currentQuestion.questionType === 'mcq' ? '🎯 Multiple Choice' :
                 currentQuestion.questionType === 'true-false' ? '✓✗ True/False' :
                 '📝 Subjective'}
              </span>
            </div>

            {/* Answer Input Based on Question Type */}
            <div className="mb-8">
              {currentQuestion.questionType === 'mcq' && (
                <div className="grid grid-cols-1 gap-3">
                  {currentQuestion.options?.map((option, idx) => (
                    <button
                      key={idx} 
                      type="button"
                      onClick={() => handleObjectiveAnswerSelect(option)}
                      className={`w-full text-left flex items-start p-4 border-2 rounded-xl transition ${
                        answers[currentQuestionIdx] === option 
                          ? 'bg-primary-50 border-primary-500 shadow-md scale-[1.01]' 
                          : 'border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                      }`}
                    >
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5 ${
                        answers[currentQuestionIdx] === option ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="text-gray-800 font-semibold">
                        {option}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {currentQuestion.questionType === 'true-false' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {['True', 'False'].map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => handleObjectiveAnswerSelect(option)}
                      className={`flex items-center justify-center p-5 border-2 rounded-xl transition font-semibold ${
                        answers[currentQuestionIdx] === option
                          ? 'bg-primary-50 border-primary-500 text-primary-700 shadow-md scale-[1.01]'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                      }`}
                    >
                      {option} <span className="ml-2 text-xs opacity-75">({option === 'True' ? 'T' : 'F'})</span>
                    </button>
                  ))}
                </div>
              )}

              {currentQuestion.questionType === 'subjective' && (
                <div>
                  <textarea
                    ref={subjectiveAnswerTextareaRef}
                    value={answers[currentQuestionIdx] || ''}
                    onChange={(e) => handleAnswerChange(currentQuestionIdx, e.target.value)}
                    placeholder="Type your detailed answer here... Be clear and concise."
                    className="input w-full h-64 p-4 border-2 border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <div className="mt-2">
                    <p className="text-xs text-gray-600 mb-2">Algebra toolbox:</p>
                    <div className="flex flex-wrap gap-2">
                      {algebraToolItems.map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => insertIntoSubjectiveAnswer(item)}
                          className="px-2 py-1 text-xs rounded border border-gray-300 bg-white hover:bg-gray-100 text-gray-700"
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>Write your answer in detail</span>
                    <span>{(answers[currentQuestionIdx] || '').length} characters</span>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center pt-6 border-t">
              <button
                onClick={() => setCurrentQuestionIdx(Math.max(0, currentQuestionIdx - 1))}
                disabled={currentQuestionIdx === 0}
                className="flex items-center space-x-2 px-6 py-3 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
              >
                <FiChevronLeft /> <span>Previous</span>
              </button>

              <div className="text-center">
                <span className="text-sm text-gray-600 block">Question</span>
                <span className="text-lg font-bold text-primary-600">{currentQuestionIdx + 1} / {exam.questions.length}</span>
              </div>

              {currentQuestionIdx === exam.questions.length - 1 ? (
                <button
                  onClick={submitExamAnswers}
                  disabled={submitting || autoAdvanceLock}
                  className="flex items-center space-x-2 px-6 py-3 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition font-medium"
                >
                  <FiSend /> <span>Submit</span>
                </button>
              ) : (
                <button
                  onClick={goToNextQuestion}
                  disabled={autoAdvanceLock}
                  className="flex items-center space-x-2 px-6 py-3 rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition font-medium"
                >
                  <span>Next</span> <FiChevronRight />
                </button>
              )}
            </div>

            <div className="mt-6 pt-4 border-t">
              <div className="flex items-center justify-between text-xs text-gray-600 mb-3">
                <span>Jump to question</span>
                <span className="font-semibold">{completionPercent}% complete</span>
              </div>
              <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
                {exam.questions.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setCurrentQuestionIdx(idx)}
                    className={`h-9 rounded-lg text-sm font-semibold transition ${
                      currentQuestionIdx === idx
                        ? 'bg-primary-600 text-white shadow'
                        : answers[idx]
                        ? 'bg-green-500 text-white hover:bg-green-600'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                    title={`Question ${idx + 1}`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-5 flex justify-end">
            <button
              onClick={submitExamAnswers}
              disabled={submitting}
              className="flex items-center justify-center space-x-2 bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-lg hover:from-green-700 hover:to-green-800 transition disabled:opacity-50 font-semibold shadow-lg"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <FiSend /> <span>Submit Exam</span>
                </>
              )}
            </button>
          </div>
      </div>

    </div>
  )
}

export default TakeExam
