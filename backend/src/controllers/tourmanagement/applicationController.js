const JobApplication = require('../../models/tourmanagement/JobApplication');
const SystemUser = require('../../models/SystemUser');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
// Optional mailer utility - will be handled gracefully if not available
let sendMail = null;
try {
  sendMail = require('../../utils/mailer').sendMail;
} catch (error) {
  console.warn('⚠️ Mailer utility not found - email functionality will be disabled');
}

const genPassword = (len=10) => {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = '';
  for (let i = 0; i < len; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Validation functions
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePhone = (phone) => {
  const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,15}$/;
  return phoneRegex.test(phone);
};

const validateName = (name) => {
  const nameRegex = /^[a-zA-Z\s]{2,50}$/;
  return nameRegex.test(name.trim());
};

const validateRegistrationNumber = (regNo) => {
  const regRegex = /^[A-Za-z0-9\-]{3,20}$/;
  return regRegex.test(regNo);
};

const validateLicenseNumber = (licenseNo) => {
  const licenseRegex = /^[A-Za-z0-9]{5,15}$/;
  return licenseRegex.test(licenseNo);
};

const validateVehicleNumber = (vehicleNo) => {
  const vehicleRegex = /^[A-Za-z0-9\-]{4,15}$/;
  return vehicleRegex.test(vehicleNo);
};

const validateExperience = (experience) => {
  const exp = parseInt(experience);
  return !isNaN(exp) && exp >= 0 && exp <= 50;
};

// Server-side validation
const validateJobApplicationData = (data) => {
  const errors = [];

  // Required fields validation
  if (!data.role || !['TourGuide', 'Driver'].includes(data.role)) {
    errors.push('Valid role (TourGuide or Driver) is required');
  }

  if (!data.firstname || !validateName(data.firstname)) {
    errors.push('Valid first name (2-50 characters, letters only) is required');
  }

  if (!data.lastname || !validateName(data.lastname)) {
    errors.push('Valid last name (2-50 characters, letters only) is required');
  }

  if (!data.email || !validateEmail(data.email)) {
    errors.push('Valid email address is required');
  }

  if (!data.phone || !validatePhone(data.phone)) {
    errors.push('Valid phone number (10-15 digits) is required');
  }

  // Role-specific validation
  if (data.role === 'TourGuide') {
    if (data.Guide_Registration_No && !validateRegistrationNumber(data.Guide_Registration_No)) {
      errors.push('Guide registration number must be 3-20 characters (letters, numbers, hyphens only)');
    }
    if (data.Experience_Year && !validateExperience(data.Experience_Year)) {
      errors.push('Experience must be a number between 0 and 50 years');
    }
  }

  if (data.role === 'Driver') {
    if (data.LicenceNumber && !validateLicenseNumber(data.LicenceNumber)) {
      errors.push('License number must be 5-15 characters (letters and numbers only)');
    }
    if (data.vehicleType && data.vehicleType.length < 2) {
      errors.push('Vehicle type must be at least 2 characters');
    }
    if (data.vehicleNumber && !validateVehicleNumber(data.vehicleNumber)) {
      errors.push('Vehicle number must be 4-15 characters (letters, numbers, hyphens only)');
    }
  }

  return errors;
};

// Submit JobApplication
const submitJobApplication = async (req, res) => {
  try {
    // Server-side validation
    const validationErrors = validateJobApplicationData(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: validationErrors 
      });
    }

    // Check for duplicate email
    const existingJobApplication = await JobApplication.findOne({ email: req.body.email });
    if (existingJobApplication) {
      return res.status(400).json({ 
        message: 'An application with this email already exists',
        error: 'DUPLICATE_EMAIL'
      });
    }

    const appDoc = await JobApplication.create(req.body);
    res.status(201).json({ 
      message: 'JobApplication submitted successfully', 
      application: appDoc 
    });
  } catch (e) {
    console.error('JobApplication submission error:', e);
    res.status(400).json({ 
      message: 'Submit failed', 
      error: e.message 
    });
  }
};

// WPO: approve or reject application and send email
const wpoSetStatus = async (req, res) => {
  try {
    const { id } = req.params;  // application id
    const { action, notes } = req.body;  // action: 'approve' | 'reject'
    const application = await JobApplication.findById(id);
    if (!application) return res.status(404).json({ message: 'JobApplication not found' });

    if (action === 'approve') {
      application.status = 'ApprovedByWPO';
      application.notes = notes || '';
      await application.save();

      // Try to send approval email to the applicant (optional)
      if (sendMail) {
        try {
          await sendMail({
            to: application.email,
            subject: 'JobApplication Status - Approved',
            html: `
              <p>Dear ${application.firstname || ''},</p>
              <p>We are pleased to inform you that your application for ${application.role} has been approved.</p>
              <p>— Wild Park</p>
            `
          });
          console.log('✅ Approval email sent successfully');
        } catch (emailError) {
          console.warn('⚠️ Failed to send approval email:', emailError.message);
          // Don't fail the operation if email sending fails
        }
      } else {
        console.log('📧 Email functionality not available - approval notification skipped');
      }

      return res.json({ message: 'JobApplication approved successfully', application });
    } else if (action === 'reject') {
      application.status = 'RejectedByWPO';
      application.notes = notes || '';
      await application.save();

      // Try to send rejection email to the applicant (optional)
      if (sendMail) {
        try {
          await sendMail({
            to: application.email,
            subject: 'JobApplication Status - Rejected',
            html: `
              <p>Dear ${application.firstname || ''},</p>
              <p>We're sorry to inform you that your application for ${application.role} was rejected.</p>
              ${notes ? `<p>Reason: ${notes}</p>` : ''}
              <p>— Wild Park</p>
            `
          });
          console.log('✅ Rejection email sent successfully');
        } catch (emailError) {
          console.warn('⚠️ Failed to send rejection email:', emailError.message);
          // Don't fail the operation if email sending fails
        }
      } else {
        console.log('📧 Email functionality not available - rejection notification skipped');
      }

      return res.json({ message: 'JobApplication rejected successfully', application });
    }

    return res.status(400).json({ message: 'Invalid action' });
  } catch (e) {
    console.error('❌ Error in wpoSetStatus:', e);
    res.status(500).json({ message: 'Update failed', error: e.message });
  }
};

// Admin: create account (only after ApprovedByWPO)
const adminCreateAccount = async (req, res) => {
  try {
    console.log('Creating account for application ID:', req.params.id);
    const { id } = req.params;  // application id
    const { customPassword } = req.body; // Optional custom password from admin
    const application = await JobApplication.findById(id);
    console.log('Found application:', application);
    
    if (!application) return res.status(404).json({ message: 'JobApplication not found' });
    if (application.status !== 'ApprovedByWPO')
      return res.status(400).json({ message: 'JobApplication not approved by WPO' });

    // Generate username & password
    const usernameBase = (application.email?.split('@')[0] || `${application.firstname}${application.lastname}` || 'user').toLowerCase();
    const Username = `${usernameBase}${Math.floor(Math.random() * 1000)}`;
    const rawPassword = customPassword || genPassword(10); // Use custom password if provided, otherwise generate
    // Note: Don't hash password here - User model's pre('save') middleware will handle it

    let created;
    console.log('Creating system user with role:', application.role);
    console.log('JobApplication data:', JSON.stringify(application, null, 2));
    
    // Create simplified system user data to avoid validation issues
    const userData = {
      firstName: application.firstname || 'Unknown',
      lastName: application.lastname || 'User',
      email: application.email,
      password: rawPassword, // Store raw password - SystemUser model will hash it
      phone: application.phone || '0000000000',
      role: application.role === 'TourGuide' ? 'tourGuide' : 
            application.role === 'Driver' ? 'safariDriver' : 
            'admin',
      status: 'active',
      department: 'tourism_operations',
      position: application.role === 'TourGuide' ? 'Tour Guide' : 
                application.role === 'Driver' ? 'Safari Driver' : 
                'Staff Member',
      hireDate: new Date()
    };
    
    // Add role-specific information only if the role is valid
    if (application.role === 'TourGuide') {
      userData.guideInfo = {
        guideRegistrationNo: application.Guide_Registration_No || null,
        experienceYears: application.Experience_Year || 0,
        languages: ['English', 'Sinhala'],
        specializations: ['Wildlife Tours', 'Nature Conservation'],
        areasOfExpertise: ['Wildlife Photography', 'Bird Watching', 'Nature Interpretation'],
        currentTour: null,
        unavailableDates: [],
        tourHistory: [],
        performance: {
          totalToursCompleted: 0,
          averageRating: 0,
          totalEarnings: 0,
          onTimePercentage: 100,
          knowledgeRating: 0,
          communicationRating: 0,
          safetyRating: 0
        },
        tourMaterials: [],
        availabilitySettings: {
          preferredAreas: ['Yala National Park', 'Wilpattu National Park'],
          maxToursPerDay: 2,
          workingHours: {
            start: '05:00',
            end: '19:00'
          }
        }
      };
    } else if (application.role === 'Driver') {
      userData.driverInfo = {
        licenseNumber: application.LicenceNumber || null,
        licenseType: 'Professional',
        vehicleInfo: {
          vehicleType: application.vehicleType || 'Safari Jeep',
          vehicleNumber: application.vehicleNumber || null,
          vehicleModel: 'Unknown',
          vehicleYear: new Date().getFullYear(),
          capacity: 8,
          fuelType: 'Diesel',
          averageFuelConsumption: 8
        },
        currentTour: null,
        unavailableDates: [],
        tourHistory: [],
        performance: {
          totalToursCompleted: 0,
          averageRating: 0,
          totalEarnings: 0,
          onTimePercentage: 100,
          safetyRecord: {
            accidents: 0,
            violations: 0,
            lastIncident: null
          }
        },
        gpsTracking: {
          isActive: false,
          currentLocation: {
            latitude: null,
            longitude: null,
            lastUpdated: null
          },
          locationHistory: []
        },
        vehicleMaintenance: {
          lastServiceDate: null,
          nextServiceDate: null,
          serviceHistory: [],
          currentMileage: 0,
          maintenanceAlerts: []
        }
      };
    }
    
    console.log('Creating user with simplified data:', JSON.stringify(userData, null, 2));
    console.log('Raw password being stored:', rawPassword);
    
    try {
      created = await SystemUser.create(userData);
      console.log('✅ SystemUser created successfully:', created._id);
      console.log('SystemUser password hash after creation:', created.password ? created.password.substring(0, 20) + '...' : 'No password');
    } catch (userCreationError) {
      console.error('❌ Error creating SystemUser:', userCreationError);
      console.error('❌ SystemUser creation error details:', {
        message: userCreationError.message,
        name: userCreationError.name,
        code: userCreationError.code,
        keyPattern: userCreationError.keyPattern,
        keyValue: userCreationError.keyValue,
        errors: userCreationError.errors
      });
      
      // Return more detailed error information
      return res.status(500).json({ 
        message: 'Failed to create system user account', 
        error: userCreationError.message,
        details: {
          name: userCreationError.name,
          code: userCreationError.code,
          keyPattern: userCreationError.keyPattern,
          keyValue: userCreationError.keyValue,
          errors: userCreationError.errors
        }
      });
    }

    // Try to send welcome email to applicant (optional)
    let emailSent = false;
    let emailError = null;
    
    if (sendMail) {
      try {
        console.log('📧 Attempting to send welcome email to:', application.email);
        
        const emailResult = await sendMail({
        to: application.email,
        subject: `🎉 Welcome to Wild Lanka Go - Your ${application.role} Account is Ready!`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
            <div style="background-color: #2d5a27; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; font-size: 24px;">🦁 Wild Lanka Go</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px;">Your Account is Ready!</p>
            </div>
            
            <div style="background-color: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <h2 style="color: #2d5a27; margin-top: 0;">Welcome ${application.firstname || 'there'}!</h2>
              
              <p>Congratulations! Your <strong>${application.role}</strong> account has been successfully created and approved.</p>
              
              <div style="background-color: #f0f8f0; border: 2px solid #2d5a27; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #2d5a27; margin-top: 0;">🔑 Your Login Credentials</h3>
                <p><strong>Username:</strong> <code style="background-color: #e8f5e8; padding: 4px 8px; border-radius: 4px;">${Username}</code></p>
                <p><strong>Temporary Password:</strong> <code style="background-color: #e8f5e8; padding: 4px 8px; border-radius: 4px; font-weight: bold;">${rawPassword}</code></p>
              </div>
              
              <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin: 20px 0;">
                <h4 style="color: #856404; margin-top: 0;">⚠️ Important Security Notice</h4>
                <p style="margin: 0; color: #856404;">Please log in immediately and change your temporary password to a secure one of your choice.</p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="http://localhost:5173/login" style="background-color: #2d5a27; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">🚀 Login to Your Account</a>
              </div>
              
              <p style="color: #666; font-size: 14px; margin-top: 30px;">
                If you have any questions or need assistance, please contact our support team.
              </p>
              
              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
              
              <p style="color: #888; font-size: 12px; text-align: center; margin: 0;">
                © 2025 Wild Lanka Go. All rights reserved.<br>
                This is an automated message. Please do not reply to this email.
              </p>
            </div>
          </div>
        `
      });
      
      emailSent = true;
      console.log('✅ Email sent successfully to:', application.email);
      console.log('📧 Message ID:', emailResult.messageId);
      
      } catch (emailError) {
        console.warn('⚠️ Failed to send welcome email:', emailError.message);
        console.warn('⚠️ Email error details:', {
          message: emailError.message,
          code: emailError.code,
          command: emailError.command
        });
        // Don't fail the operation if email sending fails
      }
    } else {
      console.log('📧 Email functionality not available - welcome email skipped');
    }

    application.status = 'AccountCreated';
    await application.save();

    res.json({ 
      message: emailSent ? 'System user account created & credentials emailed' : 'System user account created but email failed to send',
      systemUser: created, 
      application,
      emailStatus: {
        sent: emailSent,
        error: emailError?.message || null
      },
      credentials: {
        username: Username,
        password: rawPassword,
        role: application.role,
        department: userData.department,
        position: userData.position
      }
    });
  } catch (e) {
    console.error('❌ Account creation error:', e);
    console.error('❌ Error stack:', e.stack);
    console.error('❌ Error details:', {
      name: e.name,
      message: e.message,
      code: e.code,
      keyPattern: e.keyPattern,
      keyValue: e.keyValue,
      errors: e.errors
    });
    
    res.status(500).json({ 
      message: 'Account creation failed', 
      error: e.message, 
      details: {
        name: e.name,
        code: e.code,
        keyPattern: e.keyPattern,
        keyValue: e.keyValue,
        errors: e.errors
      }
    });
  }
};

// Lists (for dashboards)
const listJobApplications = async (req, res) => {
  try {
    const { status, role } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (role) filter.role = role;
    
    const apps = await JobApplication.find(filter).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      message: 'Job applications retrieved successfully',
      data: apps,
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    console.error('❌ Error in listJobApplications:', e);
    res.status(500).json({ 
      success: false,
      message: 'Fetch failed', 
      error: e.message,
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = {
  submitJobApplication,
  wpoSetStatus,
  adminCreateAccount,
  listJobApplications
};
