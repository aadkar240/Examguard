import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Debug script to check exams and see what button should appear

async function debugExams() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/exam-grievance-system');
    console.log('✓ Connected to MongoDB\n');

    const Exam = mongoose.connection.collection('exams');
    const exams = await Exam.find({}).toArray();

    console.log('=== EXAM DEBUG INFO ===\n');

    exams.forEach((exam, idx) => {
      console.log(`Exam ${idx + 1}:`);
      console.log(`  ID: ${exam._id}`);
      console.log(`  Title: ${exam.title}`);
      console.log(`  Status: ${exam.status}`);
      console.log(`  Published: ${exam.isPublished}`);
      console.log(`  Department: ${exam.department}`);
      console.log(`  Semester: ${exam.semester}`);
      
      // Check if button should show
      const shouldShowButton = exam.status === 'ongoing' && exam.isPublished === true;
      console.log(`  ✓ Should show "Take Exam" button: ${shouldShowButton ? 'YES' : 'NO'}`);
      console.log('');
    });

    const User = mongoose.connection.collection('users');
    const student = await User.findOne({ email: 'student@demo.com' });
    
    if (student) {
      console.log('=== STUDENT INFO ===');
      console.log(`Name: ${student.name}`);
      console.log(`Department: ${student.department}`);
      console.log(`Semester: ${student.semester}`);
    }

    await mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

debugExams();
