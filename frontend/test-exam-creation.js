import api from './utils/api.js';

// Test exam creation with semesters
const testExamCreation = async () => {
  try {
    console.log('🧪 Testing exam creation with multi-semester support...\n');

    const testExam = {
      title: 'Test Multi-Semester Exam',
      subject: 'Testing',
      department: 'Computer Science',
      semesters: [3, 5, 7],
      totalMarks: 100,
      passingMarks: 40,
      duration: 60,
      startTime: new Date(),
      endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      questionType: 'hybrid',
      examType: 'midterm',
      instructions: 'This is a test exam',
      isPublished: true,
      status: 'ongoing',
      questions: [
        {
          questionNumber: 1,
          questionText: 'What is 2+2?',
          questionType: 'mcq',
          marks: 10,
          options: ['4', '3', '5', '6'],
          correctAnswer: '4',
          rubric: 'Basic arithmetic'
        }
      ]
    };

    console.log('📤 Sending exam data:', JSON.stringify(testExam, null, 2));
    console.log('\n⏳ Creating exam...\n');

    const response = await api.post('/exams', testExam);

    if (response.data.success) {
      console.log('✅ SUCCESS! Exam created successfully!');
      console.log('📋 Exam Details:');
      console.log('   - Title:', response.data.exam.title);
      console.log('   - Department:', response.data.exam.department);
      console.log('   - Semesters:', response.data.exam.semesters.join(', '));
      console.log('   - ID:', response.data.exam._id);
    } else {
      console.log('❌ FAILED:', response.data.message);
    }
  } catch (error) {
    console.error('❌ ERROR:', error.response?.data || error.message);
    console.error('\nFull error:', error);
  }
};

testExamCreation();
