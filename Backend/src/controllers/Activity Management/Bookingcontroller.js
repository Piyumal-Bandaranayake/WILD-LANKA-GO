import Booking from '../../models/Activity Management/Booking.js';
import Activity from '../../models/Activity Management/Activity.js'; 
import TourGuide from '../models/Activity Management/TourGuide.js';
import Driver from '../../models/Activity Management/Driver.js';

// Create a new booking
export const createBooking = async (req, res) => {
  const { touristId, activityId, activityDate, bookingDate,numberOfParticipants,requestTourGuide } = req.body;

  try {
    // 1. Check if the activity exists
    const activity = await Activity.findById(activityId);
    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    // 2. Check if there are enough available slots for the booking
    if (activity.availableSlots < numberOfParticipants) {
      return res.status(400).json({ message: 'Not enough available slots for this activity' });
    }


    // 5. Create the booking
    
   const newBooking = new Booking({
      touristId,
      activityId,
      activityDate,
      bookingDate: bookingDate || Date.now(),
      numberOfParticipants,
      requestTourGuide,  // Record the request for a tour guide
    });
    // 6. Save the booking
    await newBooking.save();

    // 7. Update the available slots for the activity
    activity.availableSlots -= numberOfParticipants;
    await activity.save();

       // 6. Optionally, return the booking details with a message
    res.status(201).json({ message: 'Booking created successfully', booking: newBooking });
  } catch (error) {
    res.status(500).json({ message: 'Error creating booking', error: error.message });
  }
};

// Get all bookings (for officers/admins to manage)
export const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find().populate('touristId activityId tourGuideId driverId');
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching bookings', error: error.message });
  }
};
