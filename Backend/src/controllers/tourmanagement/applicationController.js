import Application from '../../models/tourmanagement/Application.js';
import TourGuide from '../../models/User/tourGuide.js';
import SafariDriver from '../../models/User/safariDriver.js';
import bcrypt from 'bcryptjs';
import { sendMail } from '../../utils/mailer.js'; // Import the mailer utility

const genPassword = (len=10) =>
  Array.from(crypto.getRandomValues(new Uint32Array(len)))
    .map(n => "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".charAt(n % 62)).join('');

// Submit Application
export const submitApplication = async (req, res) => {
  try {
    const appDoc = await Application.create(req.body);
    res.status(201).json({ message: 'Application submitted', application: appDoc });
  } catch (e) {
    res.status(400).json({ message: 'Submit failed', error: e.message });
  }
};

// WPO: approve or reject application and send email
export const wpoSetStatus = async (req, res) => {
  try {
    const { id } = req.params;  // application id
    const { action, notes } = req.body;  // action: 'approve' | 'reject'
    const application = await Application.findById(id);
    if (!application) return res.status(404).json({ message: 'Application not found' });

    if (action === 'approve') {
      application.status = 'ApprovedByWPO';
      application.notes = notes || '';
      await application.save();

      // Send approval email to the applicant
      await sendMail({
        to: application.email,
        subject: 'Application Status - Approved',
        html: `
          <p>Dear ${application.firstname || ''},</p>
          <p>We are pleased to inform you that your application for ${application.role} has been approved.</p>
          <p>— Wild Park</p>
        `
      });

      return res.json({ message: 'Approved by WPO & email sent', application });
    } else if (action === 'reject') {
      application.status = 'RejectedByWPO';
      application.notes = notes || '';
      await application.save();

      // Send rejection email to the applicant
      await sendMail({
        to: application.email,
        subject: 'Application Status - Rejected',
        html: `
          <p>Dear ${application.firstname || ''},</p>
          <p>We’re sorry to inform you that your application for ${application.role} was rejected.</p>
          ${notes ? `<p>Reason: ${notes}</p>` : ''}
          <p>— Wild Park</p>
        `
      });

      return res.json({ message: 'Rejected by WPO & email sent', application });
    }

    return res.status(400).json({ message: 'Invalid action' });
  } catch (e) {
    res.status(500).json({ message: 'Update failed', error: e.message });
  }
};

// Admin: create account (only after ApprovedByWPO)
export const adminCreateAccount = async (req, res) => {
  try {
    const { id } = req.params;  // application id
    const application = await Application.findById(id);
    if (!application) return res.status(404).json({ message: 'Application not found' });
    if (application.status !== 'ApprovedByWPO')
      return res.status(400).json({ message: 'Application not approved by WPO' });

    // Generate username & password
    const usernameBase = (application.email?.split('@')[0] || `${application.firstname}${application.lastname}` || 'user').toLowerCase();
    const Username = `${usernameBase}${Math.floor(Math.random() * 1000)}`;
    const rawPassword = genPassword(10);
    const hashed = await bcrypt.hash(rawPassword, 10);

    let created;
    if (application.role === 'TourGuide') {
      created = await TourGuide.create({
        firstname: application.firstname,
        lastname: application.lastname,
        email: application.email,
        Username,
        password: hashed,
        phone: application.phone,
        Guide_Registration_No: application.Guide_Registration_No,
        Experience_Year: application.Experience_Year || 0,
        Status: 'Approved',
        isAvailable: true,
        currentTourStatus: 'Idle',
      });
    } else if (application.role === 'Driver') {
      created = await SafariDriver.create({
        DriverName: `${application.firstname || ''} ${application.lastname || ''}`.trim(),
        Email: application.email,
        PhoneNumber: application.phone,
        username: Username,
        password: hashed,
        LicenceNumber: application.LicenceNumber,
        vehicleType: application.vehicleType,
        vehicleNumber: application.vehicleNumber,
        status: 'approved',
        isAvailable: true,
      });
    } else {
      return res.status(400).json({ message: 'Unsupported role' });
    }

    // Email credentials to applicant
    await sendMail({
      to: application.email,
      subject: `Your ${application.role} account`,
      html: `<p>Dear ${application.firstname || ''},</p>
             <p>Your ${application.role} account has been created.</p>
             <p><b>Username:</b> ${Username}<br/>
                <b>Password:</b> ${rawPassword}</p>
             <p>Please log in and change your password.</p>
             <p>— Wild Park</p>`
    });

    application.status = 'AccountCreated';
    await application.save();

    res.json({ message: 'Account created & credentials emailed', user: created, application });
  } catch (e) {
    res.status(500).json({ message: 'Account creation failed', error: e.message });
  }
};

// Lists (for dashboards)
export const listApplications = async (req, res) => {
  try {
    const { status, role } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (role) filter.role = role;
    const apps = await Application.find(filter).sort({ createdAt: -1 });
    res.json(apps);
  } catch (e) {
    res.status(500).json({ message: 'Fetch failed', error: e.message });
  }
};
