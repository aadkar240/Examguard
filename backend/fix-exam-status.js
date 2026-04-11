import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Update all exams to 'ongoing' status so students can take them

async function fixExamStatus() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/exam-grievance-system');
    console.log('✓ Connected to MongoDB\n');

    const Exam = mongoose.connection.collection('exams');
    
    // Update all exams to 'ongoing' status
    const result = await Exam.updateMany(
      { isPublished: true },
      {
        $set: {
          status: 'ongoing'
        }
      }
    );

    console.log(`✅ Updated ${result.modifiedCount} exam(s) to 'ongoing' status`);
    console.log('\nAll published exams are now available for students to take!');

    await mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixExamStatus();
