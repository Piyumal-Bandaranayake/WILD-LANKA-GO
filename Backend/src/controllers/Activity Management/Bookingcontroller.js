import Booking from '../../models/Activity Management/Booking.js';
import Activity from '../../models/Activity Management/Activity.js'; 

export const createBooking = async (req, res) => {
  const { 
    userId, 
    activityId, 
    bookingDate, 
    numberOfParticipants, 
    participants, // Frontend sends 'participants'
    requestTourGuide, 
    preferredDate,
    date, // Frontend sends 'date'
    touristEmail,
    touristName,
    touristPhone,
    specialRequests,
    totalAmount
  } = req.body;

  // Map frontend fields to backend schema
  const participantCount = numberOfParticipants || participants;
  const bookingPreferredDate = preferredDate || date;

  try {
    // 1. Check if the activity exists
    const activity = await Activity.findById(activityId);
    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    // 2. Check if the preferred date has available slots
    const availableSlotsForDate = activity.availableSlotsByDate.get(bookingPreferredDate) || 0;
    if (availableSlotsForDate === undefined || availableSlotsForDate < participantCount) {
      return res.status(400).json({ message: 'Not enough available slots for this preferred date. Please select another date.' });
    }

    // 3. Create the booking
    const newBooking = new Booking({
      userId: userId || null, // Allow null for anonymous bookings
      activityId,
      bookingDate: bookingDate || Date.now(),
      numberOfParticipants: participantCount,
      requestTourGuide,
      preferredDate: bookingPreferredDate,
      touristName,
      touristEmail,
      touristPhone,
      specialRequests,
      totalAmount,
    });

    // 4. Save the booking
    await newBooking.save();

    // 5. Update the available slots for the activity on the preferred date
    activity.availableSlotsByDate.set(bookingPreferredDate, availableSlotsForDate - participantCount);
    await activity.save();

    res.status(201).json({ message: 'Booking created successfully', booking: newBooking });
  } catch (error) {
    res.status(500).json({ message: 'Error creating booking', error: error.message });
  }
};


// Get all bookings (for officers/admins to manage)
export const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find().populate('userId', 'activityId');
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching bookings', error: error.message });
  }
};


// Get a single booking by ID
export const getBookingById = async (req, res) => {
  const { id } = req.params;  // Get the booking ID from the URL parameter

  try {
    // 1. Find the booking by ID
    const booking = await Booking.findById(id).populate('userId', 'activityId');
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // 2. Return the booking details
    res.status(200).json(booking);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching booking', error: error.message });
  }
};