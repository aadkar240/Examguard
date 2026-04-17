import mongoose from 'mongoose';
import User from './models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const DEMO_CREDENTIALS = [
  {
    name: 'Demo Student',
    email: 'student@demo.com',
    password: 'Student@123',
    role: 'student',
    studentId: 'DEMO_STU_001',
    department: 'Computer Science',
    semester: 6,
    phone: '9999999001'
  },
  {
    name: 'Demo Faculty',
    email: 'faculty@demo.com',
    password: 'Faculty@123',
    role: 'faculty',
    studentId: 'DEMO_FAC_001',
    department: 'Computer Science',
    semester: 1,
    phone: '9999999002'
  },
  {
    name: 'Demo Admin',
    email: 'admin@demo.com',
    password: 'Admin@123',
    role: 'admin',
    studentId: 'DEMO_ADMIN_001',
    department: 'Administration',
    semester: 1,
    phone: '9999999003'
  }
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined');
    }
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected');
    console.log('✓ Connected to MongoDB');

    // Delete existing demo users
    const demoEmails = DEMO_CREDENTIALS.map(cred => cred.email);
    await User.deleteMany({ email: { $in: demoEmails } });
    console.log('✓ Cleared existing demo users');

    // Create new demo users
    for (const cred of DEMO_CREDENTIALS) {
      // Don't hash here - the User model's pre-save hook will handle it
      const user = new User({
        name: cred.name,
        email: cred.email,
        password: cred.password, // Plain password - will be hashed by hook
        role: cred.role,
        studentId: cred.studentId,
        department: cred.department,
        semester: cred.semester,
        phone: cred.phone,
        isActive: true
      });

      await user.save();
      console.log(`✓ Created demo user: ${cred.email}`);
    }

    console.log('\n📋 DEMO CREDENTIALS FOR TESTING:\n');
    console.log('━'.repeat(50));
    DEMO_CREDENTIALS.forEach(cred => {
      console.log(`\n Role: ${cred.role.toUpperCase()}`);
      console.log(`  Email:    ${cred.email}`);
      console.log(`  Password: ${cred.password}`);
      console.log(`  StudentId: ${cred.studentId}`);
    });
    console.log('\n' + '━'.repeat(50));
    console.log('\n✅ Database seeded successfully!\n');

    await mongoose.connection.close();
    process.exit(0);

  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
}

seedDatabase();
