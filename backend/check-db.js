import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function checkDatabase() {
  try {
    console.log('[DB_CHECK] Connecting to MongoDB...');
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined');
    }
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected');
    console.log('[DB_CHECK] ✅ Connected to MongoDB');

    // Get the EmailOtp model
    const emailOtpSchema = new mongoose.Schema({
      email: { type: String, index: true },
      otp: String,
      purpose: { type: String, enum: ['register', 'login', 'forgot_password', 'update_password'] },
      createdAt: { type: Date, default: Date.now, index: { expires: 600 } } // 10 minutes
    });

    const EmailOtp = mongoose.model('EmailOtp', emailOtpSchema);

    // Find OTP for test email
    console.log('\n[DB_CHECK] Looking for OTP records for testfaculty2025@test.com...');
    const otps = await EmailOtp.find({ email: 'testfaculty2025@test.com' });
    
    if (otps.length === 0) {
      console.log('[DB_CHECK] ❌ No OTP found for this email');
    } else {
      console.log(`[DB_CHECK] ✅ Found ${otps.length} OTP record(s):`);
      otps.forEach((record, i) => {
        console.log(`\n[DB_CHECK] Record ${i + 1}:`);
        console.log('  Email:', record.email);
        console.log('  OTP:', record.otp);
        console.log('  Purpose:', record.purpose);
        console.log('  Created:', record.createdAt);
      });
    }

    // Also check if user exists
    console.log('\n[DB_CHECK] Checking User collection...');
    const userSchema = new mongoose.Schema({ email: String }, { strict: false });
    const User = mongoose.model('User', userSchema);
    const user = await User.findOne({ email: 'testfaculty2025@test.com' });
    
    if (user) {
      console.log('[DB_CHECK] ✅ User found:', user.email);
    } else {
      console.log('[DB_CHECK] ❌ No user found for this email');
    }

    await mongoose.disconnect();
    console.log('\n[DB_CHECK] ✅ Done\n');
  } catch (error) {
    console.error('[DB_CHECK] ❌ Error:', error.message);
    process.exit(1);
  }
}

checkDatabase();
