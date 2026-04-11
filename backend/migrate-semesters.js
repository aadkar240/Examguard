import mongoose from 'mongoose';
import Exam from './models/Exam.js';

mongoose.connect('mongodb://localhost:27017/exam-grievance-system')
  .then(async () => {
    console.log('🔄 Starting migration: semester → semesters\n');
    
    // Find all exams
    const exams = await Exam.find();
    console.log(`Found ${exams.length} exams to migrate\n`);
    
    let migrated = 0;
    let skipped = 0;
    
    for (const exam of exams) {
      try {
        // Check if exam has old semester field or new semesters field
        if (exam.semester && (!exam.semesters || exam.semesters.length === 0)) {
          // Migrate from semester to semesters
          await Exam.updateOne(
            { _id: exam._id },
            { 
              $set: { semesters: [exam.semester] },
              $unset: { semester: "" }
            }
          );
          console.log(`✅ Migrated: ${exam.title} - Semester ${exam.semester} → [${exam.semester}]`);
          migrated++;
        } else if (exam.semesters && exam.semesters.length > 0) {
          console.log(`⏭️  Skipped: ${exam.title} - Already has semesters array`);
          skipped++;
        } else {
          // No semester data, set default
          await Exam.updateOne(
            { _id: exam._id },
            { $set: { semesters: [6] } }
          );
          console.log(`🔧 Fixed: ${exam.title} - Set default semester [6]`);
          migrated++;
        }
      } catch (error) {
        console.error(`❌ Error migrating exam ${exam.title}:`, error.message);
      }
    }
    
    console.log(`\n📊 Migration Summary:`);
    console.log(`   ✅ Migrated: ${migrated}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   📝 Total: ${exams.length}\n`);
    
    // Verify
    const verifyExams = await Exam.find();
    console.log('🔍 Verification:');
    for (const exam of verifyExams) {
      const semText = exam.semesters?.length > 1 
        ? `Semesters ${exam.semesters.join(', ')}`
        : `Semester ${exam.semesters?.[0] || 'N/A'}`;
      console.log(`   - ${exam.title}: ${semText}`);
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Migration Error:', err);
    process.exit(1);
  });
