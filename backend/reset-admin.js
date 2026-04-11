import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const ADMIN_EMAIL = 'admin@gmail.com';
const ADMIN_PASSWORD = 'admin123';

async function resetToSingleAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/exam-grievance-system');
    console.log('✓ Connected to MongoDB');

    await User.deleteMany({ role: { $ne: 'admin' } });
    console.log('✓ Removed all non-admin users');

    let admin = await User.findOne({ role: 'admin' }).select('+password');

    if (!admin) {
      admin = new User({
        name: 'Admin',
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        role: 'admin',
        department: 'Administration',
        semester: 1,
        phone: '9999999999',
        isActive: true,
        facultyApprovalStatus: 'approved'
      });
      await admin.save();
      console.log('✓ Created new admin account');
    } else {
      admin.name = admin.name || 'Admin';
      admin.email = ADMIN_EMAIL;
      admin.password = ADMIN_PASSWORD;
      admin.role = 'admin';
      admin.department = admin.department || 'Administration';
      admin.semester = admin.semester || 1;
      admin.isActive = true;
      admin.facultyApprovalStatus = 'approved';
      await admin.save();
      console.log('✓ Updated existing admin account credentials');
    }

    await User.deleteMany({ role: 'admin', _id: { $ne: admin._id } });
    console.log('✓ Removed duplicate admin accounts');

    console.log('\n✅ Final admin login:');
    console.log(`   Email: ${ADMIN_EMAIL}`);
    console.log(`   Password: ${ADMIN_PASSWORD}`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Reset failed:', error.message);
    process.exit(1);
  }
}

resetToSingleAdmin();
