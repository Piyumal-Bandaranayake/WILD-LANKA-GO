import express from 'express';
import {
  getMyBookings,
  getMyEventRegistrations,
  getMyDonations,
  getMyFeedback,
  getMyComplaints,
  createBooking,
  registerForEvent,
  createDonation,
  createFeedback,
  createComplaint,
  getDashboardStats,
  cancelBooking,
  cancelEventRegistration,
  checkAvailableSlots,
  modifyEventRegistration,
  updateDonationMessage,
  updateFeedback,
  deleteFeedback,
  getAllFeedback,
  updateComplaint,
  deleteComplaint,
  reportEmergency
} from '../controllers/tourist/touristController.js';

const router = express.Router();

// Tourist dashboard routes
router.get('/dashboard/stats', getDashboardStats);

// Tourist data retrieval routes  
router.get('/my-bookings', getMyBookings);
router.get('/my-registrations', getMyEventRegistrations);
router.get('/my-donations', getMyDonations);
router.get('/my-feedback', getMyFeedback);
router.get('/my-complaints', getMyComplaints);

// Activity booking routes
router.post('/bookings', createBooking);
router.get('/activities/check-slots', checkAvailableSlots); // Check available slots for activity on specific date

// Event registration routes
router.post('/registrations', registerForEvent);
router.put('/registrations/:registrationId', modifyEventRegistration); // Modify participant count
router.delete('/registrations/:registrationId', cancelEventRegistration); // Cancel registration

// Donation routes
router.post('/donations', createDonation);
router.put('/donations/:donationId/message', updateDonationMessage); // Update donation message

// Feedback routes (CRUD operations)
router.post('/feedback', createFeedback);
router.get('/feedback/all', getAllFeedback); // View all feedback
router.put('/feedback/:feedbackId', updateFeedback); // Update own feedback
router.delete('/feedback/:feedbackId', deleteFeedback); // Delete own feedback

// Complaint routes (CRUD operations)
router.post('/complaints', createComplaint);
router.put('/complaints/:complaintId', updateComplaint); // Update own complaint
router.delete('/complaints/:complaintId', deleteComplaint); // Delete own complaint

// Emergency reporting
router.post('/emergency', reportEmergency);

// Legacy cancellation route (kept for backward compatibility)
router.put('/bookings/:bookingId/cancel', cancelBooking);

export default router;