import mongoose from 'mongoose';
import User from './models/User.js';
import Exam from './models/Exam.js';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.MONGODB_URI) {
  throw new Error('MONGODB_URI is not defined');
}

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('MongoDB connected'))
  .then(async () => {
    console.log('🔍 Checking semester 8 exam access issue...\n');
    
    // Check all students
    const students = await User.find({ role: 'student' });
    console.log(`📚 Total Students: ${students.length}\n`);
    
    console.log('👨‍🎓 Student Details:');
    for (const student of students) {
      console.log(`   - ${student.name}`);
      console.log(`     Email: ${student.email}`);
      console.log(`     Department: ${student.department || 'Not set'}`);
      console.log(`     Semester: ${student.semester || 'Not set'}`);
      console.log('');
    }
    
    // Check semester 8 students specifically
    const sem8Students = await User.find({ role: 'student', semester: 8 });
    console.log(`\n🎓 Semester 8 Students: ${sem8Students.length}`);
    if (sem8Students.length > 0) {
      sem8Students.forEach(s => {
        console.log(`   - ${s.name} (${s.email}) - Dept: ${s.department}`);
      });
    } else {
      console.log('   ⚠️  No students in semester 8 found!');
    }
    
    // Check all exams
    const allExams = await Exam.find();
    console.log(`\n📝 Total Exams: ${allExams.length}\n`);
    
    console.log('📋 Exam Details:');
    for (const exam of allExams) {
      const semText = exam.semesters?.length > 1 
        ? `Semesters ${exam.semesters.join(', ')}`
        : `Semester ${exam.semesters?.[0] || 'N/A'}`;
      console.log(`   - ${exam.title}`);
      console.log(`     Department: ${exam.department}`);
      console.log(`     ${semText}`);
      console.log(`     Published: ${exam.isPublished}`);
      console.log(`     Status: ${exam.status}`);
      console.log('');
    }
    
    // Check exams available for semester 8
    const sem8Exams = await Exam.find({
      semesters: { $in: [8] },
      isPublished: true
    });
    
    console.log(`\n🎯 Exams Available for Semester 8: ${sem8Exams.length}`);
    if (sem8Exams.length > 0) {
      sem8Exams.forEach(exam => {
        console.log(`   - ${exam.title} (${exam.department})`);
      });
    } else {
      console.log('   ⚠️  No exams published for semester 8!');
    }
    
    // Check if Demo Student has semester set
    const demoStudent = await User.findOne({ email: 'student@demo.com' });
    if (demoStudent) {
      console.log('\n👤 Demo Student Account:');
      console.log(`   Name: ${demoStudent.name}`);
      console.log(`   Email: ${demoStudent.email}`);
      console.log(`   Department: ${demoStudent.department || '❌ NOT SET'}`);
      console.log(`   Semester: ${demoStudent.semester || '❌ NOT SET'}`);
      
      if (!demoStudent.semester) {
        console.log('\n⚠️  WARNING: Demo student has no semester assigned!');
        console.log('   This is why they cannot see exams.');
      }
      
      if (!demoStudent.department) {
        console.log('\n⚠️  WARNING: Demo student has no department assigned!');
        console.log('   This is why they cannot see exams.');
      }
    }
    
    console.log('\n💡 Recommendations:');
    if (sem8Students.length === 0) {
      console.log('   1. Create test student with semester 8');
    }
    if (sem8Exams.length === 0) {
      console.log('   2. Publish exams with semester 8 selected');
    }
    console.log('   3. Ensure students have both department and semester set');
    console.log('   4. Ensure exam department matches student department');
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
