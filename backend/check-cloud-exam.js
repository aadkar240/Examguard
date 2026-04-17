import mongoose from 'mongoose';
import Exam from './models/Exam.js';
import dotenv from 'dotenv';

dotenv.config();

const checkCloudExam = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined');
    }
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected');
    console.log('✅ Connected to MongoDB\n');

    const exam = await Exam.findOne({ title: /cloud/i }).select('title questions');
    
    if (!exam) {
      console.log('❌ No Cloud Computing exam found');
      process.exit(0);
    }

    console.log(`\n📖 EXAM: ${exam.title}`);
    console.log(`${'='.repeat(80)}\n`);

    let subjectiveCount = 0;
    let withRubric = 0;
    let withoutRubric = 0;

    exam.questions.forEach((q, index) => {
      if (q.questionType === 'subjective') {
        subjectiveCount++;
        console.log(`\nQuestion ${index + 1} (${q.marks} marks):`);
        console.log(`  "${q.questionText.substring(0, 80)}..."`);
        
        if (q.rubric) {
          console.log(`  ✅ Rubric: "${q.rubric.substring(0, 100)}..."`);
          withRubric++;
        } else if (q.correctAnswer) {
          console.log(`  ✅ CorrectAnswer: "${q.correctAnswer.substring(0, 100)}..."`);
          withRubric++;
        } else {
          console.log(`  ❌ NO RUBRIC OR CORRECT ANSWER SET!`);
          console.log(`  🚨 AI GRADING WILL FAIL - SHOWS 0 MARKS`);
          withoutRubric++;
        }
      }
    });

    console.log(`\n\n${'='.repeat(80)}`);
    console.log(`📊 SUMMARY:`);
    console.log(`  Total subjective questions: ${subjectiveCount}`);
    console.log(`  ✅ With rubric/answer: ${withRubric}`);
    console.log(`  ❌ Without rubric/answer: ${withoutRubric}`);
    console.log(`${'='.repeat(80)}\n`);

    if (withoutRubric > 0) {
      console.log(`\n🔧 HOW TO FIX:`);
      console.log(`  1. AI needs a "model answer" to compare student answers against`);
      console.log(`  2. Without it, AI cannot grade and returns 0 marks`);
      console.log(`  3. The rubric field should contain the expected answer or marking scheme\n`);
      console.log(`💡 TEMPORARY SOLUTION:`);
      console.log(`  The AI can grade WITHOUT a rubric if you want!`);
      console.log(`  It will evaluate based on:`);
      console.log(`    - Content quality and accuracy`);
      console.log(`    - Depth of understanding`);
      console.log(`    - Clarity and completeness`);
      console.log(`    - Originality (plagiarism detection)`);
      console.log(`\n  This is actually BETTER for open-ended questions!`);
      console.log(`  The AI will judge the answer on merit, not just matching keywords.\n`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

checkCloudExam();
