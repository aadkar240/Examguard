import nodemailer from 'nodemailer';

const createTransporter = () => {
  const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASSWORD } = process.env;

  if (!EMAIL_HOST || !EMAIL_PORT || !EMAIL_USER || !EMAIL_PASSWORD) {
    return null;
  }

  return nodemailer.createTransport({
    host: EMAIL_HOST,
    port: Number(EMAIL_PORT),
    secure: Number(EMAIL_PORT) === 465,
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASSWORD
    }
  });
};

export const sendOtpEmail = async ({ to, otp, purpose }) => {
  const transporter = createTransporter();

  if (!transporter) {
    throw new Error('SMTP is not configured. Set EMAIL_HOST, EMAIL_PORT, EMAIL_USER, and EMAIL_PASSWORD.');
  }

  const appName = 'Transparent Exam & Grievance Management System';
  const purposeTextMap = {
    register: 'account registration',
    login: 'login',
    forgot_password: 'password reset',
    update_password: 'password update'
  };
  const actionText = purposeTextMap[purpose] || 'verification';

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to,
    subject: `${appName} OTP for ${actionText}`,
    text: `Your OTP for ${actionText} is ${otp}. It is valid for ${process.env.OTP_EXPIRY_MINUTES || 10} minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 16px; border: 1px solid #e5e7eb; border-radius: 8px;">
        <h2 style="margin: 0 0 12px;">OTP Verification</h2>
        <p style="margin: 0 0 12px;">Use the OTP below to complete your ${actionText}.</p>
        <div style="font-size: 28px; font-weight: 700; letter-spacing: 4px; margin: 16px 0;">${otp}</div>
        <p style="margin: 0; color: #4b5563;">This OTP is valid for ${process.env.OTP_EXPIRY_MINUTES || 10} minutes.</p>
      </div>
    `
  });
};

export const sendAccountStatusEmail = async ({ to, name, status }) => {
  const transporter = createTransporter();

  if (!transporter) {
    const error = 'SMTP is not configured. Set EMAIL_HOST, EMAIL_PORT, EMAIL_USER, and EMAIL_PASSWORD.';
    console.error('[EMAIL_SERVICE]', error);
    throw new Error(error);
  }

  const statusContent = {
    pending: {
      subject: 'Account registration pending admin approval',
      text: 'Your faculty registration is pending admin approval. You will be notified once approved.',
      html: `
        <p>Hi ${name || 'Faculty'},</p>
        <p>Your faculty registration is currently <strong>pending admin approval</strong>.</p>
        <p>Once approved, we will notify you by email.</p>
      `
    },
    approved: {
      subject: 'Your faculty account is approved',
      text: 'Your faculty account has been approved. You can now log in and access your dashboard.',
      html: `
        <p>Hi ${name || 'Faculty'},</p>
        <p>Your faculty account has been <strong>approved</strong>.</p>
        <p>You can now log in and access your dashboard.</p>
      `
    },
    rejected: {
      subject: 'Your faculty account request was rejected',
      text: 'Your faculty account request has been rejected. Please contact admin for details.',
      html: `
        <p>Hi ${name || 'Faculty'},</p>
        <p>Your faculty account request has been <strong>rejected</strong>.</p>
        <p>Please contact the administrator for more details.</p>
      `
    }
  };

  const content = statusContent[status];
  if (!content) {
    console.error(`[EMAIL_SERVICE] Unknown status: ${status}`);
    return;
  }

  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject: content.subject,
      text: content.text,
      html: `<div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 16px; border: 1px solid #e5e7eb; border-radius: 8px;">${content.html}</div>`
    };
    
    console.log(`[EMAIL_SERVICE] Attempting to send ${status} email to ${to}`);
    await transporter.sendMail(mailOptions);
    console.log(`[EMAIL_SERVICE] Successfully sent ${status} email to ${to}`);
  } catch (error) {
    console.error(`[EMAIL_SERVICE] Failed to send email to ${to}:`, error.message);
    throw error;
  }
};