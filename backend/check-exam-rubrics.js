import mongoose from 'mongoose';
import Exam from './models/Exam.js';
import dotenv from 'dotenv';

dotenv.config();

const checkExamRubrics = async () => {
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

    const exams = await Exam.find({ isPublished: true })
      .select('title questions')
      .limit(10);

    console.log(`📚 Found ${exams.length} published exams\n`);

    for (const exam of exams) {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`📖 EXAM: ${exam.title}`);
      console.log(`${'='.repeat(80)}`);
      
      if (!exam.questions || exam.questions.length === 0) {
        console.log('  ⚠️ No questions found in this exam\n');
        continue;
      }

      exam.questions.forEach((q, index) => {
        console.log(`\n  Question ${index + 1}:`);
        console.log(`    Type: ${q.questionType}`);
        console.log(`    Marks: ${q.marks}`);
        console.log(`    Question: "${q.questionText?.substring(0, 80)}..."`);
        
        if (q.questionType === 'subjective') {
          console.log(`    ✅ Rubric: ${q.rubric ? `"${q.rubric.substring(0, 100)}..."` : '❌ NOT SET'}`);
          console.log(`    ℹ️ CorrectAnswer: ${q.correctAnswer ? `"${q.correctAnswer.substring(0, 80)}..."` : 'NOT SET'}`);
          
          if (!q.rubric && !q.correctAnswer) {
            console.log(`    🚨 WARNING: This subjective question has NO rubric or correct answer!`);
            console.log(`    🚨 AI grading will FAIL for this question!`);
          }
        } else if (q.questionType === 'mcq') {
          console.log(`    Correct Answer: ${q.correctAnswer}`);
          console.log(`    Options: ${q.options?.join(', ')}`);
        }
      });
    }

    console.log(`\n\n${'='.repeat(80)}`);
    console.log('💡 SOLUTION: If subjective questions are missing rubrics:');
    console.log('   1. Edit the exam in the faculty dashboard');
    console.log('   2. Add rubric/expected answer for each subjective question');
    console.log('   3. Save the exam');
    console.log('   4. Try AI grading again');
    console.log(`${'='.repeat(80)}\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

checkExamRubrics();
