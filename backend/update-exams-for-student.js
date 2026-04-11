import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Update exams to be viewable by demo student (Computer Science, Semester 6)

async function updateExamsForStudent() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/exam-grievance-system');
    console.log('✓ Connected to MongoDB\n');

    const Exam = mongoose.connection.collection('exams');
    
    // Update all exams to Computer Science, Semester 6 so student can see them
    const result = await Exam.updateMany(
      {},
      {
        $set: {
          department: 'Computer Science',
          semester: 6
        }
      }
    );

    console.log(`✅ Updated ${result.modifiedCount} exams`);
    console.log('\nAll exams are now set to:');
    console.log('  Department: Computer Science');
    console.log('  Semester: 6\n');
    console.log('Demo student (student@demo.com) can now see all published exams!');

    await mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

updateExamsForStudent();
