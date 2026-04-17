import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from '../models/User.js';

dotenv.config();

const ADMIN_EMAIL = 'developeratharva@admin.com';
const ADMIN_PASSWORD = 'atharva24';
const ADMIN_NAME = 'Admin';

async function createOrUpdateAdmin() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined');
    }

    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('[ADMIN_SCRIPT] Connected to MongoDB');

    const existingUser = await User.findOne({ email: ADMIN_EMAIL }).select('+password');

    if (existingUser) {
      existingUser.role = 'admin';
      existingUser.isActive = true;
      await existingUser.save();

      console.log('[ADMIN_SCRIPT] Existing user found and updated as admin');
      console.log(`[ADMIN_SCRIPT] Email: ${existingUser.email}`);
      console.log(`[ADMIN_SCRIPT] Role: ${existingUser.role}`);
      console.log(`[ADMIN_SCRIPT] Active: ${existingUser.isActive}`);
      return;
    }

    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

    await User.insertMany([
      {
        name: ADMIN_NAME,
        email: ADMIN_EMAIL,
        password: hashedPassword,
        role: 'admin',
        isActive: true,
      },
    ]);

    console.log('[ADMIN_SCRIPT] New admin user created');
    console.log(`[ADMIN_SCRIPT] Email: ${ADMIN_EMAIL}`);
    console.log('[ADMIN_SCRIPT] Role: admin');
    console.log('[ADMIN_SCRIPT] Active: true');
  } catch (error) {
    console.error('[ADMIN_SCRIPT] Failed:', error.message);
    process.exitCode = 1;
  } finally {
    try {
      await mongoose.disconnect();
      console.log('[ADMIN_SCRIPT] MongoDB disconnected');
    } catch (disconnectError) {
      console.error('[ADMIN_SCRIPT] Disconnect failed:', disconnectError.message);
      process.exitCode = 1;
    }

    process.exit(process.exitCode || 0);
  }
}

createOrUpdateAdmin();
