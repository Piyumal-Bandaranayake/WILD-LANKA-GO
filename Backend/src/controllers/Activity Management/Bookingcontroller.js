import Booking from '../../models/Activity Management/Booking.js';
import Activity from '../../models/Activity Management/Activity.js'; 

export const createBooking = async (req, res) => {
  const { touristId, activityId,  bookingDate, numberOfParticipants, requestTourGuide, preferredDate } = req.body;

  try {
    // 1. Check if the activity exists
    const activity = await Activity.findById(activityId);
    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    // 2. Check if the preferred date has available slots
    const availableSlotsForDate = activity.availableSlotsByDate.get(preferredDate)|| 0;
    if (availableSlotsForDate === undefined || availableSlotsForDate < numberOfParticipants) {
      return res.status(400).json({ message: 'Not enough available slots for this preferred date. Please select another date.' });
    }

    // 3. Create the booking
    const newBooking = new Booking({
      touristId,
      activityId,
      bookingDate: bookingDate || Date.now(),
      numberOfParticipants,
      requestTourGuide,
      preferredDate,
    });

    // 4. Save the booking
    await newBooking.save();

    // 5. Update the available slots for the activity on the preferred date
    activity.availableSlotsByDate.set(preferredDate, availableSlotsForDate - numberOfParticipants);
    await activity.save();

    res.status(201).json({ message: 'Booking created successfully', booking: newBooking });
  } catch (error) {
    res.status(500).json({ message: 'Error creating booking', error: error.message });
  }
};


// Get all bookings (for officers/admins to manage)
export const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find().populate('touristId', 'activityId');
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
    const booking = await Booking.findById(id).populate('touristId', 'activityId');
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // 2. Return the booking details
    res.status(200).json(booking);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching booking', error: error.message });
  }
};