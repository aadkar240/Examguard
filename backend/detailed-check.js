import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function detailedExamCheck() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/exam-grievance-system');
    console.log('✓ Connected to MongoDB\n');

    const Exam = mongoose.connection.collection('exams');
    const exams = await Exam.find({}).toArray();

    console.log(`Total exams: ${exams.length}\n`);

    exams.forEach((exam, idx) => {
      console.log(`\n===== Exam ${idx + 1} =====`);
      console.log(`ID: ${exam._id}`);
      console.log(`Title: ${exam.title}`);
      console.log(`Subject: ${exam.subject}`);
      console.log(`Department: ${exam.department || 'NOT SET'}`);
      console.log(`Semester: ${exam.semester || 'NOT SET'}`);
      console.log(`Status: ${exam.status}`);
      console.log(`Published: ${exam.isPublished}`);
      console.log(`Total Marks: ${exam.totalMarks}`);
      console.log(`Questions: ${exam.questions?.length || 0}`);
      console.log(`Created By: ${exam.createdBy}`);
    });

    console.log('\n\n--- Demo Student Info ---');
    const User = mongoose.connection.collection('users');
    const student = await User.findOne({ email: 'student@demo.com' });
    if (student) {
      console.log(`Name: ${student.name}`);
      console.log(`Department: ${student.department}`);
      console.log(`Semester: ${student.semester}`);
    } else {
      console.log('Student not found!');
    }

    await mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

detailedExamCheck();
