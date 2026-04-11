import mongoose from 'mongoose';
import Evaluation from './models/Evaluation.js';
import Exam from './models/Exam.js';
import User from './models/User.js';

mongoose.connect('mongodb://localhost:27017/exam-grievance-system')
  .then(async () => {
    console.log('\n=== CHECKING SUBMISSIONS ===\n');
    
    // Check evaluations
    const evaluations = await Evaluation.find()
      .populate('student', 'name email')
      .populate('exam', 'title createdBy');
    
    console.log(`Total Submissions: ${evaluations.length}\n`);
    
    if (evaluations.length === 0) {
      console.log('❌ No submissions found in database!\n');
    } else {
      evaluations.forEach((evaluation, idx) => {
        console.log(`${idx + 1}. Student: ${evaluation.student?.name || 'Unknown'}`);
        console.log(`   Exam: ${evaluation.exam?.title || 'Unknown'}`);
        console.log(`   Status: ${evaluation.status}`);
        console.log(`   Exam Creator: ${evaluation.exam?.createdBy}`);
        console.log('');
      });
    }
    
    // Check faculty
    const faculty = await User.find({ role: 'faculty' });
    console.log(`\nFaculty Users: ${faculty.length}`);
    faculty.forEach(f => {
      console.log(`- ${f.name} (${f.email})`);
    });
    
    // Check exams by faculty
    const exams = await Exam.find().populate('createdBy', 'name email');
    console.log(`\nTotal Exams: ${exams.length}`);
    exams.forEach(exam => {
      console.log(`- ${exam.title} by ${exam.createdBy?.name || exam.createdBy}`);
    });
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
