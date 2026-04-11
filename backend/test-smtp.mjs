import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: Number(process.env.EMAIL_PORT) === 465,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

console.log('[SMTP_TEST] Testing connection...');
console.log(`[SMTP_TEST] Host: ${process.env.EMAIL_HOST}`);
console.log(`[SMTP_TEST] Port: ${process.env.EMAIL_PORT}`);
console.log(`[SMTP_TEST] User: ${process.env.EMAIL_USER}`);

transporter.verify((error, success) => {
  if (error) {
    console.error('[SMTP_TEST]  Connection Failed:', error.message);
    process.exit(1);
  } else {
    console.log('[SMTP_TEST]  Connection Successful!');
    console.log('[SMTP_TEST] SMTP is working properly');
    process.exit(0);
  }
});
