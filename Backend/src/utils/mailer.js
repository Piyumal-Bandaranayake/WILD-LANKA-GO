// utils/mailer.js
import nodemailer from 'nodemailer';

// Configure the transporter (Gmail is used here, but you can switch to another service like SendGrid, Mailgun, etc.)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: '	amasithu11@gmail.com', // Your email address
    pass: 'Amaya@11#' // Your email password or app password
  }
});

// Function to send an email
export const sendMail = async ({ to, subject, html }) => {
  const mailOptions = {
    from: 'amasithu11@gmail.com',
    to,
    subject,
    html
  };

  try {

    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
  }
};
