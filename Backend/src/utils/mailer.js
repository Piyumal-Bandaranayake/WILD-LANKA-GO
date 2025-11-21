const nodemailer = require('nodemailer');
const logger = require('../../config/logger');

// Email configuration
const createTransporter = () => {
  // Check if email configuration is available
  const emailConfig = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  };

  // If no email credentials are provided, return null
  if (!emailConfig.auth.user || !emailConfig.auth.pass) {
    logger.warn('Email configuration not found - email functionality will be disabled');
    return null;
  }

  try {
    const transporter = nodemailer.createTransporter(emailConfig);
    logger.info('Email transporter configured successfully');
    return transporter;
  } catch (error) {
    logger.error('Failed to create email transporter:', error.message);
    return null;
  }
};

// Create transporter instance
const transporter = createTransporter();

// Send email function
const sendMail = async (mailOptions) => {
  if (!transporter) {
    throw new Error('Email service not configured');
  }

  try {
    // Set default from address if not provided
    if (!mailOptions.from) {
      mailOptions.from = process.env.SMTP_FROM || process.env.SMTP_USER;
    }

    const result = await transporter.sendMail(mailOptions);
    logger.info(`Email sent successfully to ${mailOptions.to}`, {
      messageId: result.messageId,
      subject: mailOptions.subject
    });
    
    return result;
  } catch (error) {
    logger.error('Failed to send email:', {
      to: mailOptions.to,
      subject: mailOptions.subject,
      error: error.message
    });
    throw error;
  }
};

// Verify email configuration
const verifyEmailConfig = async () => {
  if (!transporter) {
    return false;
  }

  try {
    await transporter.verify();
    logger.info('Email configuration verified successfully');
    return true;
  } catch (error) {
    logger.error('Email configuration verification failed:', error.message);
    return false;
  }
};

// Test email function (for development)
const sendTestEmail = async (to = process.env.SMTP_USER) => {
  if (!transporter) {
    throw new Error('Email service not configured');
  }

  const testMailOptions = {
    to,
    subject: 'Wild Lanka Go - Email Test',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2d5a27;">🦁 Wild Lanka Go - Email Test</h2>
        <p>This is a test email to verify that the email service is working correctly.</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        <p><strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}</p>
        <hr>
        <p style="color: #666; font-size: 12px;">
          If you received this email, the email service is configured and working properly.
        </p>
      </div>
    `
  };

  return await sendMail(testMailOptions);
};

module.exports = {
  sendMail,
  verifyEmailConfig,
  sendTestEmail,
  transporter
};

