import mongoose from 'mongoose';
import Exam from './models/Exam.js';
import User from './models/User.js';
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
    // Find the Demo Faculty user
    const faculty = await User.findOne({ email: 'faculty@demo.com' });
    
    if (!faculty) {
      console.log('Faculty user not found!');
      process.exit(1);
    }
    
    console.log(`Found faculty: ${faculty.name} (${faculty._id})\n`);
    
    // Update all exams where createdBy is null or the old ID
    const result = await Exam.updateMany(
      {
        $or: [
          { createdBy: null },
          { createdBy: '6995c985e0ac7f6da5b3a45d' }
        ]
      },
      {
        $set: { createdBy: faculty._id }
      }
    );
    
    console.log(`✅ Updated ${result.modifiedCount} exams\n`);
    
    // Verify
    const exams = await Exam.find().populate('createdBy', 'name email');
    console.log('All exams after update:');
    exams.forEach(exam => {
      console.log(`- ${exam.title} by ${exam.createdBy?.name || 'null'} (${exam.createdBy?._id || 'no ID'})`);
    });
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
