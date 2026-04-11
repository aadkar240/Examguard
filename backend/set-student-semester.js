import mongoose from 'mongoose';
import User from './models/User.js';

mongoose.connect('mongodb://localhost:27017/exam-grievance-system')
  .then(async () => {
    console.log('🔧 Setting student semesters...\n');
    
    // Update Demo Student to semester 8
    const demoStudent = await User.findOneAndUpdate(
      { email: 'student@demo.com' },
      { 
        semester: 8,
        department: 'Computer Science'
      },
      { new: true }
    );
    
    if (demoStudent) {
      console.log('✅ Updated Demo Student:');
      console.log(`   Email: ${demoStudent.email}`);
      console.log(`   Department: ${demoStudent.department}`);
      console.log(`   Semester: ${demoStudent.semester}\n`);
    }
    
    // Show all students
    const students = await User.find({ role: 'student' });
    console.log('📚 All Students:');
    students.forEach(s => {
      console.log(`   - ${s.name}: Semester ${s.semester || 'Not set'}, ${s.department || 'No dept'}`);
    });
    
    console.log('\n💡 Tip: To change a student\'s semester, edit this script and run it again.');
    console.log('   Example: Change email and semester values above.\n');
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
