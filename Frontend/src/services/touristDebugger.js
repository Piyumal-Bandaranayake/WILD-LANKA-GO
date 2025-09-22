import { touristService, validateTouristData } from './touristService.js';

/**
 * Tourist API Testing and Debugging Utilities
 * Use these functions to test and debug your tourist API calls
 */

export const touristDebugger = {
  /**
   * Test booking creation with sample data
   */
  testBooking: async (activityId = '507f1f77bcf86cd799439011') => {
    const sampleBookingData = {
      activityId: activityId,
      bookingDate: '2025-01-15',
      numberOfParticipants: 2,
      requestTourGuide: true
    };

    console.log('Testing booking with data:', sampleBookingData);
    
    // Validate data first
    const validationErrors = validateTouristData.booking(sampleBookingData);
    if (validationErrors.length > 0) {
      console.error('Validation errors:', validationErrors);
      return { success: false, errors: validationErrors };
    }

    try {
      const response = await touristService.createBooking(sampleBookingData);
      console.log('Booking success:', response.data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Booking error:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Test event registration with sample data
   */
  testEventRegistration: async (eventId = '507f1f77bcf86cd799439011') => {
    const sampleRegistrationData = {
      eventId: eventId,
      numberOfParticipants: 3
    };

    console.log('Testing event registration with data:', sampleRegistrationData);
    
    // Validate data first
    const validationErrors = validateTouristData.eventRegistration(sampleRegistrationData);
    if (validationErrors.length > 0) {
      console.error('Validation errors:', validationErrors);
      return { success: false, errors: validationErrors };
    }

    try {
      const response = await touristService.registerForEvent(sampleRegistrationData);
      console.log('Event registration success:', response.data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Event registration error:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Test donation creation with sample data
   */
  testDonation: async () => {
    const sampleDonationData = {
      amount: 1000,
      message: 'Supporting wildlife conservation efforts',
      category: 'General Wildlife Conservation',
      isAnonymous: false
    };

    console.log('Testing donation with data:', sampleDonationData);
    
    try {
      const response = await touristService.createDonation(sampleDonationData);
      console.log('Donation success:', response.data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Donation error:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Test feedback creation with sample data
   */
  testFeedback: async () => {
    const sampleFeedbackData = {
      message: 'Amazing safari experience! The wildlife was incredible and our guide was very knowledgeable.',
      tourGuideName: 'John Doe',
      activityType: 'Safari Tour',
      eventType: ''
    };

    console.log('Testing feedback with data:', sampleFeedbackData);
    
    try {
      const response = await touristService.createFeedback(sampleFeedbackData);
      console.log('Feedback success:', response.data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Feedback error:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Test complaint creation with sample data
   */
  testComplaint: async () => {
    const sampleComplaintData = {
      message: 'The booking process was confusing and there were delays in confirmation.',
      location: 'Yala National Park'
    };

    console.log('Testing complaint with data:', sampleComplaintData);
    
    try {
      const response = await touristService.createComplaint(sampleComplaintData);
      console.log('Complaint success:', response.data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Complaint error:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Test emergency reporting with sample data
   */
  testEmergency: async () => {
    const sampleEmergencyData = {
      emergencyType: 'Medical Emergency',
      description: 'Tourist injured during safari tour, needs immediate medical attention',
      location: 'Yala National Park, Zone 1',
      severity: 'High',
      contactNumber: '+94771234567'
    };

    console.log('Testing emergency with data:', sampleEmergencyData);
    
    try {
      const response = await touristService.reportEmergency(sampleEmergencyData);
      console.log('Emergency report success:', response.data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Emergency report error:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Test all dashboard data retrieval
   */
  testDashboardData: async () => {
    console.log('Testing dashboard data retrieval...');
    
    try {
      const [
        dashboardStats,
        bookings,
        registrations,
        donations,
        feedback,
        complaints
      ] = await Promise.all([
        touristService.getDashboardStats(),
        touristService.getMyBookings(),
        touristService.getMyEventRegistrations(),
        touristService.getMyDonations(),
        touristService.getMyFeedback(),
        touristService.getMyComplaints()
      ]);

      const results = {
        dashboardStats: dashboardStats.data,
        bookings: bookings.data,
        registrations: registrations.data,
        donations: donations.data,
        feedback: feedback.data,
        complaints: complaints.data
      };

      console.log('Dashboard data success:', results);
      return { success: true, data: results };
    } catch (error) {
      console.error('Dashboard data error:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Test slots checking functionality
   */
  testCheckSlots: async (activityId = '507f1f77bcf86cd799439011', date = '2025-01-15') => {
    console.log(`Testing slot checking for activity ${activityId} on ${date}...`);
    
    try {
      const response = await touristService.checkAvailableSlots(activityId, date);
      console.log('Slot check success:', response.data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Slot check error:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Run all tests
   */
  runAllTests: async () => {
    console.log('🧪 Running all tourist API tests...');
    
    const results = {
      dashboardData: await touristDebugger.testDashboardData(),
      checkSlots: await touristDebugger.testCheckSlots(),
      // Note: Uncomment these when you have valid IDs
      // booking: await touristDebugger.testBooking('your-activity-id'),
      // eventRegistration: await touristDebugger.testEventRegistration('your-event-id'),
      donation: await touristDebugger.testDonation(),
      feedback: await touristDebugger.testFeedback(),
      complaint: await touristDebugger.testComplaint(),
      // emergency: await touristDebugger.testEmergency(), // Be careful with this one!
    };

    console.log('🧪 All tests completed:', results);
    return results;
  }
};

/**
 * Quick validation tester
 */
export const testValidation = {
  /**
   * Test booking validation
   */
  booking: (data) => {
    console.log('Testing booking validation for:', data);
    const errors = validateTouristData.booking(data);
    
    if (errors.length === 0) {
      console.log('✅ Booking data is valid');
    } else {
      console.log('❌ Booking validation errors:', errors);
    }
    
    return errors;
  },

  /**
   * Test event registration validation
   */
  eventRegistration: (data) => {
    console.log('Testing event registration validation for:', data);
    const errors = validateTouristData.eventRegistration(data);
    
    if (errors.length === 0) {
      console.log('✅ Event registration data is valid');
    } else {
      console.log('❌ Event registration validation errors:', errors);
    }
    
    return errors;
  },

  /**
   * Test all validation scenarios
   */
  runValidationTests: () => {
    console.log('🔍 Running validation tests...');
    
    // Test valid booking
    testValidation.booking({
      activityId: '507f1f77bcf86cd799439011',
      bookingDate: '2025-01-15',
      numberOfParticipants: 2
    });

    // Test invalid booking
    testValidation.booking({
      activityId: '',
      bookingDate: '2024-01-01', // Past date
      numberOfParticipants: 0
    });

    // Test valid event registration
    testValidation.eventRegistration({
      eventId: '507f1f77bcf86cd799439011',
      numberOfParticipants: 3
    });

    // Test invalid event registration
    testValidation.eventRegistration({
      eventId: '',
      numberOfParticipants: 'invalid'
    });

    console.log('🔍 Validation tests completed');
  }
};

/**
 * Console helpers for debugging
 */
export const debugHelpers = {
  /**
   * Log the current tourist service configuration
   */
  logConfig: () => {
    console.log('🔧 Tourist Service Configuration:', {
      donationCategories: validateTouristData.donationCategories,
      emergencyTypes: validateTouristData.emergencyTypes,
      activityTypes: validateTouristData.activityTypes,
      eventTypes: validateTouristData.eventTypes
    });
  },

  /**
   * Log sample data structures
   */
  logSampleData: () => {
    console.log('📋 Sample Data Structures:');
    
    console.log('Booking Data:', {
      activityId: 'string (ObjectId)',
      bookingDate: 'YYYY-MM-DD',
      numberOfParticipants: 'number',
      requestTourGuide: 'boolean (optional)',
      preferredDate: 'YYYY-MM-DD (optional)'
    });

    console.log('Event Registration Data:', {
      eventId: 'string (ObjectId)',
      numberOfParticipants: 'number'
    });

    console.log('Donation Data:', {
      amount: 'number (minimum 100)',
      message: 'string (optional)',
      category: 'string (from donationCategories)',
      isAnonymous: 'boolean (optional)'
    });
  },

  /**
   * Quick setup for testing in browser console
   */
  setupConsoleTest: () => {
    console.log('🚀 Setting up console testing...');
    console.log('Available functions:');
    console.log('- touristDebugger.testBooking(activityId)');
    console.log('- touristDebugger.testEventRegistration(eventId)');
    console.log('- touristDebugger.testDonation()');
    console.log('- touristDebugger.testFeedback()');
    console.log('- touristDebugger.testComplaint()');
    console.log('- touristDebugger.testDashboardData()');
    console.log('- touristDebugger.runAllTests()');
    console.log('- testValidation.runValidationTests()');
    
    // Make available globally for console testing
    window.touristDebugger = touristDebugger;
    window.testValidation = testValidation;
    window.debugHelpers = debugHelpers;
    
    console.log('✅ Debug functions are now available in console');
  }
};

export default touristDebugger;