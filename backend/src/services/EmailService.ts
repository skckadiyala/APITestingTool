// Email service for sending password reset emails
// In production, integrate with SendGrid, AWS SES, or similar service

export interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  // For development, just log the email
  if (process.env.NODE_ENV !== 'production') {
    console.log('\n📧 Email would be sent:');
    console.log(`To: ${options.to}`);
    console.log(`Subject: ${options.subject}`);
    console.log(`Text: ${options.text}`);
    console.log('\n');
    return;
  }

  // In production, integrate with email service
  // Example with SendGrid:
  /*
  const sgMail = require('@sendgrid/mail');
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  
  await sgMail.send({
    to: options.to,
    from: process.env.EMAIL_FROM,
    subject: options.subject,
    text: options.text,
    html: options.html,
  });
  */

  throw new Error('Email service not configured for production');
};

export const sendPasswordResetEmail = async (
  email: string,
  resetToken: string
): Promise<void> => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Password Reset Request</h2>
      <p>You requested to reset your password. Click the button below to reset it:</p>
      <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
        Reset Password
      </a>
      <p>Or copy and paste this link into your browser:</p>
      <p style="color: #666; word-break: break-all;">${resetUrl}</p>
      <p>This link will expire in 1 hour.</p>
      <p>If you didn't request this, please ignore this email.</p>
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
      <p style="color: #999; font-size: 12px;">API Testing Tool - Secure API Development</p>
    </div>
  `;

  const text = `
You requested to reset your password. 

Reset your password by visiting this link:
${resetUrl}

This link will expire in 1 hour.

If you didn't request this, please ignore this email.
  `;

  await sendEmail({
    to: email,
    subject: 'Password Reset Request - API Testing Tool',
    text,
    html,
  });
};

export const sendWelcomeEmail = async (
  email: string,
  name: string
): Promise<void> => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Welcome to API Testing Tool!</h2>
      <p>Hi ${name},</p>
      <p>Thank you for signing up! Your account has been successfully created.</p>
      <p>You can now start testing your APIs with our powerful tools:</p>
      <ul>
        <li>Create and organize API requests</li>
        <li>Manage environments and variables</li>
        <li>Run automated tests</li>
        <li>Collaborate with your team</li>
      </ul>
      <a href="${process.env.FRONTEND_URL}/login" style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
        Get Started
      </a>
      <p>Happy testing!</p>
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
      <p style="color: #999; font-size: 12px;">API Testing Tool - Secure API Development</p>
    </div>
  `;

  const text = `
Welcome to API Testing Tool!

Hi ${name},

Thank you for signing up! Your account has been successfully created.

You can now start testing your APIs with our powerful tools.

Get started at: ${process.env.FRONTEND_URL}/login

Happy testing!
  `;

  await sendEmail({
    to: email,
    subject: 'Welcome to API Testing Tool!',
    text,
    html,
  });
};
