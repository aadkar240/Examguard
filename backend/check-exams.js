import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function checkExams() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/exam-grievance-system');
    console.log('✓ Connected to MongoDB\n');

    const Exam = mongoose.connection.collection('exams');
    const exams = await Exam.find({}).toArray();

    console.log(`Total exams in database: ${exams.length}\n`);

    exams.forEach((exam, idx) => {
      console.log(`\n--- Exam ${idx + 1} ---`);
      console.log(`Title: ${exam.title}`);
      console.log(`Subject: ${exam.subject}`);
      console.log(`Status: ${exam.status}`);
      console.log(`Published: ${exam.isPublished}`);
      console.log(`Questions: ${exam.questions?.length || 0}`);
      
      if (exam.questions && exam.questions.length > 0) {
        console.log('\nQuestion types:');
        exam.questions.forEach((q, qIdx) => {
          console.log(`  Q${qIdx + 1}: ${q.questionType} (${q.marks} marks)`);
        });
      }
    });

    await mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkExams();
