import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Update all exams to 'ongoing' status so students can take them

async function fixExamStatus() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined');
    }
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected');
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
