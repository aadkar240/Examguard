import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Quick script to fix question types in existing exams

async function fixExams() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/exam-grievance-system');
    console.log('✓ Connected to MongoDB');

    // Get Exam collection
    const Exam = mongoose.connection.collection('exams');

    // Find all exams
    const exams = await Exam.find({}).toArray();
    console.log(`Found ${exams.length} exams to check`);

    let fixed = 0;

    for (const exam of exams) {
      let needsUpdate = false;
      const updatedQuestions = exam.questions?.map(q => {
        if (q.questionType) {
          const typeStr = String(q.questionType).toLowerCase();
          let normalizedType;
          
          if (typeStr.includes('mcq') || typeStr.includes('multiple')) {
            normalizedType = 'mcq';
          } else if (typeStr.includes('true') || typeStr.includes('false')) {
            normalizedType = 'true-false';
          } else {
            normalizedType = 'subjective';
          }

          if (q.questionType !== normalizedType) {
            needsUpdate = true;
            return { ...q, questionType: normalizedType };
          }
        }
        return q;
      });

      if (needsUpdate && updatedQuestions) {
        await Exam.updateOne(
          { _id: exam._id },
          { $set: { questions: updatedQuestions } }
        );
        fixed++;
        console.log(`✓ Fixed exam: ${exam.title || exam._id}`);
      }
    }

    console.log(`\n✅ Fixed ${fixed} exams with incorrect question types`);
    
    if (fixed === 0) {
      console.log('No exams needed fixing - all question types are correct!');
    }

    await mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error fixing exams:', error.message);
    process.exit(1);
  }
}

fixExams();
