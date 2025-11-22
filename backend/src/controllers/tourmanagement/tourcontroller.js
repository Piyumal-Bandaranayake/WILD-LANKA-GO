const mongoose = require('mongoose');
const Tour = require('../../models/tourmanagement/tour');
const User = require('../../models/User');
const Tourist = require('../../models/Tourist');
const Notification = require('../../models/tourmanagement/tourGuideNotification');
const Booking = require('../../models/Booking');
const SystemUser = require('../../models/SystemUser');


// Create tour (DEPRECATED - Use createTourWithAssignment instead)
const createTour = async (req, res) => {
  try {
    return res.status(400).json({ 
      message: 'Tour creation without driver assignment is not allowed. Please use /create-with-assignment endpoint with mandatory driver assignment.' 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error while creating tour', error: error.message });
  }
};

// Create tour with driver and guide assignment (Wildlife Officer Dashboard)
const createTourWithAssignment = async (req, res) => {
  try {
    console.log('🔄 Tour creation request received:', req.body);
    
    const { 
      bookingId, 
      preferredDate, 
      assignedTourGuide, 
      assignedDriver,
      tourNotes 
    } = req.body;

    // Validate required fields
    if (!bookingId || !preferredDate) {
      return res.status(400).json({ 
        message: 'Booking ID and Preferred Date are required' 
      });
    }

    // Enforce that driver assignment is mandatory
    if (!assignedDriver) {
      return res.status(400).json({ 
        message: 'Driver assignment is mandatory to create a tour' 
      });
    }

    // Check if booking date is not in the past (allow future bookings)
    const today = new Date();
    const bookingDate = new Date(preferredDate);
    const todayString = today.toISOString().split('T')[0]; // YYYY-MM-DD
    const bookingDateString = bookingDate.toISOString().split('T')[0]; // YYYY-MM-DD

    if (bookingDateString < todayString) {
      return res.status(400).json({ 
        message: 'Cannot assign drivers and guides for past bookings' 
      });
    }

    // Check if booking exists and is in correct status
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      console.log('❌ Booking not found:', bookingId);
      return res.status(404).json({ message: 'Booking not found' });
    }

    console.log('🔍 Booking found:', {
      id: booking._id,
      status: booking.status,
      bookingDate: booking.bookingDate,
      type: booking.type
    });

    if (booking.status === 'Cancelled') {
      console.log('❌ Booking is cancelled:', booking.status);
      return res.status(400).json({ 
        message: 'Cannot create tour for cancelled bookings' 
      });
    }

    // Check if tour already exists for this booking
    const existingTour = await Tour.findOne({ bookingId });
    if (existingTour) {
      return res.status(400).json({ message: 'Tour already exists for this booking' });
    }

    // Validate tour guide if provided
    if (assignedTourGuide) {
      console.log('🔍 Validating tour guide:', assignedTourGuide);
      const guideDoc = await SystemUser.findById(assignedTourGuide);
      if (!guideDoc) {
        console.log('❌ Tour guide not found:', assignedTourGuide);
        return res.status(404).json({ message: 'Assigned tour guide not found' });
      }
      console.log('🔍 Tour guide found:', {
        id: guideDoc._id,
        role: guideDoc.role,
        isAvailable: guideDoc.isAvailable,
        firstName: guideDoc.firstName,
        lastName: guideDoc.lastName
      });
      if (guideDoc.role !== 'tourGuide') {
        console.log('❌ User is not a tour guide:', guideDoc.role);
        return res.status(400).json({ 
          message: 'Assigned user is not a tour guide' 
        });
      }
      // Check if guide is available for the specific date
      const isAvailableForDate = guideDoc.isAvailableForDate(preferredDate);
      if (!isAvailableForDate) {
        console.log('❌ Tour guide is not available for this date:', preferredDate);
        return res.status(400).json({ 
          message: 'Tour guide is not available for this date' 
        });
      }

      // Check for existing guide assignments on the same date
      const tourDate = new Date(preferredDate);
      const startOfDay = new Date(tourDate.getFullYear(), tourDate.getMonth(), tourDate.getDate());
      const endOfDay = new Date(tourDate.getFullYear(), tourDate.getMonth(), tourDate.getDate() + 1);

      const existingGuideTour = await Tour.findOne({
        assignedTourGuide: assignedTourGuide,
        preferredDate: {
          $gte: startOfDay,
          $lt: endOfDay
        },
        status: { $in: ['Confirmed', 'Processing', 'Started'] }
      });

      if (existingGuideTour) {
        return res.status(400).json({ 
          message: 'Tour guide is already assigned to another booking on this date' 
        });
      }
    }

    // Validate driver if provided
    if (assignedDriver) {
      console.log('🔍 Validating driver:', assignedDriver);
      const driverDoc = await SystemUser.findById(assignedDriver);
      if (!driverDoc) {
        console.log('❌ Driver not found:', assignedDriver);
        return res.status(404).json({ message: 'Assigned driver not found' });
      }
      console.log('🔍 Driver found:', {
        id: driverDoc._id,
        role: driverDoc.role,
        isAvailable: driverDoc.isAvailable,
        firstName: driverDoc.firstName,
        lastName: driverDoc.lastName
      });
      if (driverDoc.role !== 'safariDriver') {
        console.log('❌ User is not a safari driver:', driverDoc.role);
        return res.status(400).json({ 
          message: 'Assigned user is not a safari driver' 
        });
      }
      // Check if driver is available for the specific date
      const isAvailableForDate = driverDoc.isAvailableForDate(preferredDate);
      if (!isAvailableForDate) {
        console.log('❌ Driver is not available for this date:', preferredDate);
        return res.status(400).json({ 
          message: 'Driver is not available for this date' 
        });
      }

      // Check for existing driver assignments on the same date
      const tourDate = new Date(preferredDate);
      const startOfDay = new Date(tourDate.getFullYear(), tourDate.getMonth(), tourDate.getDate());
      const endOfDay = new Date(tourDate.getFullYear(), tourDate.getMonth(), tourDate.getDate() + 1);

      const existingDriverTour = await Tour.findOne({
        assignedDriver: assignedDriver,
        preferredDate: {
          $gte: startOfDay,
          $lt: endOfDay
        },
        status: { $in: ['Confirmed', 'Processing', 'Started'] }
      });

      if (existingDriverTour) {
        return res.status(400).json({ 
          message: 'Driver is already assigned to another booking on this date' 
        });
      }
    }

    // Create the tour with assignments
    const newTour = new Tour({
      bookingId,
      preferredDate: new Date(preferredDate),
      tourDate: new Date(preferredDate), // Set tourDate to the same as preferredDate initially
        assignedTourGuide: assignedTourGuide || null,
        assignedDriver: assignedDriver || null,
        status: 'Pending', // Start as Pending until driver accepts
        tourNotes: tourNotes || null
    });

    console.log('🔄 Creating tour with data:', {
      bookingId,
      preferredDate: new Date(preferredDate),
        assignedTourGuide,
        assignedDriver,
        status: 'Pending', // Start as Pending until driver accepts
        tourNotes
    });

    await newTour.save();
    console.log('✅ Tour created successfully:', newTour._id);

    // Update booking status (tourId field doesn't exist in Booking model)
    booking.status = 'Confirmed';
    await booking.save();

    // Update tour guide availability and send notification
    if (assignedTourGuide) {
      const guide = await SystemUser.findById(assignedTourGuide);
      if (guide) {
        // Set guide as unavailable for the specific tour date
        await guide.setAvailabilityForDate(preferredDate, false, newTour._id);
        console.log(`✅ Guide ${guide.firstName} ${guide.lastName} marked as unavailable for ${new Date(preferredDate).toLocaleDateString()}`);
      }

      // Create notification for tour guide
      try {
        await Notification.create({
          userId: assignedTourGuide,
          userType: 'TourGuide',
          tourId: newTour._id,
          type: 'ASSIGNED_TOUR',
          title: 'New tour assigned',
          message: `You have been assigned to a new tour for booking ${booking.bookingId} on ${new Date(preferredDate).toLocaleDateString()}.`,
          meta: {
            bookingId: bookingId.toString(),
            activityName: booking.type || 'Wildlife Tour',
            tourDate: preferredDate,
            status: 'Confirmed',
          },
        });
        console.log('✅ Notification created for tour guide');
      } catch (notificationError) {
        console.error('❌ Failed to create notification for tour guide:', notificationError);
        // Don't fail the entire operation if notification creation fails
      }
    }

    // Update driver availability and send notification
    if (assignedDriver) {
      const driver = await SystemUser.findById(assignedDriver);
      if (driver) {
        // Set driver as unavailable for the specific tour date
        await driver.setAvailabilityForDate(preferredDate, false, newTour._id);
        console.log(`✅ Driver ${driver.firstName} ${driver.lastName} marked as unavailable for ${new Date(preferredDate).toLocaleDateString()}`);
      }

      // Create notification for driver
      try {
        await Notification.create({
          userId: assignedDriver,
          userType: 'Driver',
          tourId: newTour._id,
          type: 'ASSIGNED_TOUR',
          title: 'New tour assigned',
          message: `You have been assigned as the safari driver for tour on ${new Date(preferredDate).toLocaleDateString()}.`,
          meta: {
            bookingId: bookingId.toString(),
            activityName: booking.type || 'Wildlife Tour',
            tourDate: preferredDate,
            status: 'Confirmed',
          },
        });
        console.log('✅ Notification created for driver');
      } catch (notificationError) {
        console.error('❌ Failed to create notification for driver:', notificationError);
        // Don't fail the entire operation if notification creation fails
      }
    }

    // Populate the tour with booking details for response
    const populatedTour = await Tour.findById(newTour._id)
      .populate('bookingId')
      .populate('assignedTourGuide', 'firstName lastName email phone')
      .populate('assignedDriver', 'firstName lastName email phone');

    res.status(201).json({
      message: 'Tour created successfully with assignments',
      tour: populatedTour,
      notifications: {
        guide: assignedTourGuide ? 'Notification sent to tour guide' : 'No guide assigned',
        driver: assignedDriver ? 'Notification sent to driver' : 'No driver assigned'
      }
    });

  } catch (error) {
    console.error('❌ Error creating tour:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ 
      message: 'Server error while creating tour with assignments', 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};



// Assign Tour Guide and Driver
const assignDriverAndGuide = async (req, res) => {
  try {
    const { bookingId, assignedTourGuide, assignedDriver } = req.body;

    const tour = await Tour.findOne({ bookingId });
    if (!tour) {
      return res.status(404).json({ message: 'Tour not found for this booking' });
    }

    const [guideDoc, driverDoc] = await Promise.all([
      assignedTourGuide ? SystemUser.findById(assignedTourGuide) : null,
      assignedDriver ? SystemUser.findById(assignedDriver) : null,
    ]);

    if (assignedTourGuide && !guideDoc) {
      return res.status(404).json({ message: 'Assigned tour guide not found' });
    }
    if (assignedDriver && !driverDoc) {
      return res.status(404).json({ message: 'Assigned driver not found' });
    }

    // Check if booking date is today (same day assignment only)
    const today = new Date();
    const bookingDate = new Date(tour.preferredDate);
    const todayString = today.toISOString().split('T')[0]; // YYYY-MM-DD
    const bookingDateString = bookingDate.toISOString().split('T')[0]; // YYYY-MM-DD

    if (bookingDateString !== todayString) {
      return res.status(400).json({ 
        message: 'Drivers and guides can only be assigned on the day of the booking' 
      });
    }

    // Check for double-booking validation
    const tourDate = new Date(tour.preferredDate);
    const startOfDay = new Date(tourDate.getFullYear(), tourDate.getMonth(), tourDate.getDate());
    const endOfDay = new Date(tourDate.getFullYear(), tourDate.getMonth(), tourDate.getDate() + 1);

    // Check for existing guide assignments on the same date
    if (assignedTourGuide) {
      const existingGuideTour = await Tour.findOne({
        assignedTourGuide: assignedTourGuide,
        preferredDate: {
          $gte: startOfDay,
          $lt: endOfDay
        },
        status: { $in: ['Confirmed', 'Processing', 'Started'] },
        _id: { $ne: tour._id } // Exclude current tour
      });

      if (existingGuideTour) {
        return res.status(400).json({ 
          message: 'Tour guide is already assigned to another booking on this date' 
        });
      }
    }

    // Check for existing driver assignments on the same date
    if (assignedDriver) {
      const existingDriverTour = await Tour.findOne({
        assignedDriver: assignedDriver,
        preferredDate: {
          $gte: startOfDay,
          $lt: endOfDay
        },
        status: { $in: ['Confirmed', 'Processing', 'Started'] },
        _id: { $ne: tour._id } // Exclude current tour
      });

      if (existingDriverTour) {
        return res.status(400).json({ 
          message: 'Driver is already assigned to another booking on this date' 
        });
      }
    }

      tour.assignedTourGuide = assignedTourGuide || tour.assignedTourGuide;
      tour.assignedDriver = assignedDriver || tour.assignedDriver;
      // Keep status as Pending until driver accepts
      if (tour.status === 'Pending') {
        // Only change to Confirmed if driver explicitly accepts
        // For now, keep as Pending
      }
      await tour.save();

    // Update Tour Guide
    if (assignedTourGuide) {
      const guide = await SystemUser.findById(assignedTourGuide);
      if (guide) {
        // Set guide as unavailable for the specific tour date
        await guide.setAvailabilityForDate(tour.preferredDate, false, tour._id);
        // Also set global availability to false when assigned
        guide.isAvailable = false;
        await guide.save();
        console.log(`✅ Guide ${guide.firstName} ${guide.lastName} marked as unavailable for ${new Date(tour.preferredDate).toLocaleDateString()}`);
      }

      // ✅ Notify Tour Guide
      await Notification.create({
        userId: assignedTourGuide,
        userType: 'TourGuide',
        tourId: tour._id,
        type: 'ASSIGNED_TOUR',
        title: 'New tour assigned',
        message: `You have been assigned to a new tour (Tour ID: ${tour._id.toString()}).`,
        meta: {
          bookingId: bookingId?.toString?.() || String(bookingId),
          status: tour.status,
        },
      });
    }

    // Update Driver
    if (assignedDriver) {
      const driver = await SystemUser.findById(assignedDriver);
      if (driver) {
        // Set driver as unavailable for the specific tour date
        await driver.setAvailabilityForDate(tour.preferredDate, false, tour._id);
        // Also set global availability to false when assigned
        driver.isAvailable = false;
        await driver.save();
        console.log(`✅ Driver ${driver.firstName} ${driver.lastName} marked as unavailable for ${new Date(tour.preferredDate).toLocaleDateString()}`);
      }

      // ✅ Notify Driver
      await Notification.create({
        userId: assignedDriver,
        userType: 'Driver',
        tourId: tour._id,
        type: 'ASSIGNED_TOUR',
        title: 'New tour assigned',
        message: `You have been assigned as the safari driver for tour (Tour ID: ${tour._id.toString()}).`,
        meta: {
          bookingId: bookingId?.toString?.() || String(bookingId),
          status: tour.status,
        },
      });
    }

    return res.status(200).json({
      message: 'Driver and guide assigned successfully, availability updated, notification sent',
      tour,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Error assigning driver and guide',
      error: error.message,
    });
  }
};

// Get all tours
const getAllTours = async (req, res) => {
  try {
    console.log('🔄 Fetching all tours...');
    
    // First, get tours without population to see raw data
    const rawTours = await Tour.find().sort({ createdAt: -1 });
    console.log('🔍 Raw tours data:', rawTours.map(tour => ({
      id: tour._id,
      bookingId: tour.bookingId,
      assignedTourGuide: tour.assignedTourGuide,
      assignedDriver: tour.assignedDriver,
      status: tour.status
    })));
    
    // Then populate the data
    let tours = await Tour.find()
      .populate('bookingId')
      .populate('assignedTourGuide', 'firstName lastName email phone')
      .populate('assignedDriver', 'firstName lastName email phone')
      .sort({ createdAt: -1 });
    
    // Manual population fallback for failed population
    for (let tour of tours) {
      if (tour.assignedTourGuide && typeof tour.assignedTourGuide === 'object' && !tour.assignedTourGuide.firstName) {
        // Population failed, try manual lookup
        const guide = await SystemUser.findById(tour.assignedTourGuide);
        if (guide) {
          tour.assignedTourGuide = {
            _id: guide._id,
            firstName: guide.firstName,
            lastName: guide.lastName,
            email: guide.email,
            phone: guide.phone
          };
        }
      }
      
      if (tour.assignedDriver && typeof tour.assignedDriver === 'object' && !tour.assignedDriver.firstName) {
        // Population failed, try manual lookup
        const driver = await SystemUser.findById(tour.assignedDriver);
        if (driver) {
          tour.assignedDriver = {
            _id: driver._id,
            firstName: driver.firstName,
            lastName: driver.lastName,
            email: driver.email,
            phone: driver.phone
          };
        }
      }
    }
    
    console.log('🔍 Populated tours data:', tours.map(tour => ({
      id: tour._id,
      bookingId: tour.bookingId,
      assignedTourGuide: tour.assignedTourGuide,
      assignedDriver: tour.assignedDriver,
      status: tour.status
    })));
    
    // Check if SystemUsers exist for the assigned IDs
    const guideIds = rawTours.filter(t => t.assignedTourGuide).map(t => t.assignedTourGuide);
    const driverIds = rawTours.filter(t => t.assignedDriver).map(t => t.assignedDriver);
    
    console.log('🔍 Looking for guide IDs:', guideIds);
    console.log('🔍 Looking for driver IDs:', driverIds);
    
    if (guideIds.length > 0) {
      const existingGuides = await SystemUser.find({ _id: { $in: guideIds } });
      console.log('🔍 Existing guides in SystemUser:', existingGuides.map(g => ({ id: g._id, name: `${g.firstName} ${g.lastName}`, role: g.role })));
      
      // If no guides found, try to find by partial ID match
      if (existingGuides.length === 0) {
        console.log('🔍 No exact matches found, searching for partial matches...');
        const allGuides = await SystemUser.find({ role: 'tourGuide' });
        console.log('🔍 All tour guides in SystemUser:', allGuides.map(g => ({ id: g._id, name: `${g.firstName} ${g.lastName}`, role: g.role })));
      }
    }
    
    if (driverIds.length > 0) {
      const existingDrivers = await SystemUser.find({ _id: { $in: driverIds } });
      console.log('🔍 Existing drivers in SystemUser:', existingDrivers.map(d => ({ id: d._id, name: `${d.firstName} ${d.lastName}`, role: d.role })));
      
      // If no drivers found, try to find by partial ID match
      if (existingDrivers.length === 0) {
        console.log('🔍 No exact matches found, searching for partial matches...');
        const allDrivers = await SystemUser.find({ role: 'safariDriver' });
        console.log('🔍 All safari drivers in SystemUser:', allDrivers.map(d => ({ id: d._id, name: `${d.firstName} ${d.lastName}`, role: d.role })));
      }
    }
    
    res.status(200).json(tours);
  } catch (error) {
    console.error('❌ Error fetching tours:', error);
    res.status(500).json({ message: 'Failed to fetch tours', error: error.message });
  }
};

// Get tour by ID
const getTourById = async (req, res) => {
  try {
    const tour = await Tour.findById(req.params.id).populate('bookingId');
    if (!tour) {
      return res.status(404).json({ message: 'Tour not found' });
    }
    res.status(200).json(tour);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tour', error: error.message });
  }
};

// Get tours by tour guide ID
const getToursByGuide = async (req, res) => {
  try {
    const guideId = req.params.guideId;
    console.log('🔍 getToursByGuide called with guideId:', guideId);
    
    // Validate guideId
    if (!guideId || guideId === 'undefined') {
      return res.status(400).json({ 
        message: 'Invalid guide ID provided',
        guideId: guideId 
      });
    }
    
    // First, let's check all tours to see what's in the database
    const allTours = await Tour.find({}).populate('bookingId');
    console.log('🔍 All tours in database:', allTours.length);
    console.log('🔍 All tours data:', allTours.map(tour => ({
      id: tour._id,
      assignedTourGuide: tour.assignedTourGuide,
      assignedDriver: tour.assignedDriver,
      status: tour.status,
      preferredDate: tour.preferredDate
    })));
    
    // Now search for tours assigned to this specific guide
    // Try different query approaches to handle ObjectId issues
    const tours1 = await Tour.find({ assignedTourGuide: guideId }).populate('bookingId');
    const tours2 = await Tour.find({ assignedTourGuide: new mongoose.Types.ObjectId(guideId) }).populate('bookingId');
    const tours3 = await Tour.find({ assignedTourGuide: { $eq: guideId } }).populate('bookingId');
    
    console.log('🔍 Query 1 (string):', tours1.length);
    console.log('🔍 Query 2 (ObjectId):', tours2.length);
    console.log('🔍 Query 3 ($eq):', tours3.length);
    
    // Use the first non-empty result
    const tours = tours1.length > 0 ? tours1 : tours2.length > 0 ? tours2 : tours3;
    console.log('🔍 Final tours for guide:', tours.length);
    console.log('🔍 Tours data:', tours);
    
    res.status(200).json(tours);
  } catch (error) {
    console.error('❌ Error in getToursByGuide:', error);
    res.status(500).json({ message: 'Failed to fetch guide tours', error: error.message });
  }
};

// Get tours by driver ID
const getToursByDriver = async (req, res) => {
  try {
    console.log('🔍 getToursByDriver function called!');
    const driverId = req.params.driverId;
    console.log('🔍 getToursByDriver - Driver ID:', driverId);
    
    // Validate driverId
    if (!driverId) {
      return res.status(400).json({
        success: false,
        message: 'Driver ID is required'
      });
    }

    // Query tours assigned to this driver
    const tours = await Tour.find({ assignedDriver: driverId })
      .populate({
        path: 'bookingId',
        select: 'bookingId customer type status bookingDate startTime endTime duration numberOfAdults numberOfChildren totalParticipants location route pricing notes',
        populate: {
          path: 'customer',
          model: 'Tourist', // Explicitly specify the Tourist model
          select: 'firstName lastName email phone'
        }
      })
      .populate('assignedTourGuide', 'firstName lastName email phone role')
      .populate('assignedDriver', 'firstName lastName email phone role')
      .sort({ preferredDate: 1, createdAt: -1 });

    // Parse tourist information from booking notes if customer population failed
    tours.forEach(tour => {
      console.log('🔍 Processing tour:', tour._id);
      console.log('🔍 Booking data:', {
        bookingExists: !!tour.bookingId,
        bookingId: tour.bookingId?._id,
        customer: tour.bookingId?.customer,
        notes: tour.bookingId?.notes,
        customerType: typeof tour.bookingId?.customer
      });

      if (tour.bookingId && tour.bookingId.notes) {
        console.log('🔍 Found notes:', tour.bookingId.notes);
        const notes = tour.bookingId.notes;
        const customerMatch = notes.match(/Customer:\s*([^|]+)/);
        const emailMatch = notes.match(/Email:\s*([^|]+)/);
        const phoneMatch = notes.match(/Phone:\s*([^|]+)/);
        
        console.log('🔍 Regex matches:', {
          customerMatch: customerMatch ? customerMatch[1] : null,
          emailMatch: emailMatch ? emailMatch[1] : null,
          phoneMatch: phoneMatch ? phoneMatch[1] : null
        });
        
        if (customerMatch || emailMatch || phoneMatch) {
          // If customer population failed, create tourist info from notes
          if (!tour.bookingId.customer || !tour.bookingId.customer.firstName) {
            console.log('🔍 Creating customer info from notes');
            tour.bookingId.customer = {
              firstName: customerMatch ? customerMatch[1].trim() : 'Unknown',
              lastName: '',
              email: emailMatch ? emailMatch[1].trim() : '',
              phone: phoneMatch ? phoneMatch[1].trim() : ''
            };
            console.log('🔍 Created customer:', tour.bookingId.customer);
          }
        }
      } else {
        console.log('🔍 No booking or notes found');
      }
    });

    console.log('🔍 Found tours for driver:', tours.length);
    console.log('🔍 Tours data:', tours.map(tour => ({
      id: tour._id,
      bookingId: tour.bookingId?._id,
      status: tour.status,
      preferredDate: tour.preferredDate,
      assignedDriver: tour.assignedDriver?._id,
      assignedTourGuide: tour.assignedTourGuide?._id
    })));

    res.status(200).json({
      success: true,
      message: `Found ${tours.length} tours for driver`,
      driverId: driverId,
      data: tours,
      count: tours.length
    });
  } catch (error) {
    console.error('❌ getToursByDriver error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch driver tours',
      error: error.message
    });
  }
};

// Get driver dashboard stats
const getDriverDashboardStats = async (req, res) => {
  try {
    const driverId = req.user.id; // Get from authenticated user
    
    // Verify user is a driver
    const SystemUser = require('../../models/SystemUser');
    const driver = await SystemUser.findById(driverId);
    if (!driver || driver.role !== 'safariDriver') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only safari drivers can access this endpoint.'
      });
    }

    // Get tour statistics
    const tourStats = await Tour.aggregate([
      { $match: { assignedDriver: driver._id } },
      {
        $group: {
          _id: null,
          total_tours: { $sum: 1 },
          pending_tours: {
            $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] }
          },
          confirmed_tours: {
            $sum: { $cond: [{ $eq: ['$status', 'Confirmed'] }, 1, 0] }
          },
          processing_tours: {
            $sum: { $cond: [{ $eq: ['$status', 'Processing'] }, 1, 0] }
          },
          started_tours: {
            $sum: { $cond: [{ $eq: ['$status', 'Started'] }, 1, 0] }
          },
          ended_tours: {
            $sum: { $cond: [{ $eq: ['$status', 'Ended'] }, 1, 0] }
          }
        }
      }
    ]);

    const stats = tourStats[0] || {
      total_tours: 0,
      pending_tours: 0,
      confirmed_tours: 0,
      processing_tours: 0,
      started_tours: 0,
      ended_tours: 0
    };

    // Get today's tours
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const todayTours = await Tour.find({
      assignedDriver: driver._id,
      preferredDate: { $gte: startOfDay, $lt: endOfDay }
    })
    .populate({
      path: 'bookingId',
      populate: {
        path: 'customerId',
        select: 'firstName lastName email phone'
      }
    })
    .populate('assignedTourGuide', 'firstName lastName email phone')
    .sort({ preferredDate: 1 });

    // Get upcoming tours (next 7 days)
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const upcomingTours = await Tour.find({
      assignedDriver: driver._id,
      preferredDate: { $gte: endOfDay, $lte: nextWeek },
      status: { $in: ['Confirmed', 'Processing'] }
    })
    .populate({
      path: 'bookingId',
      populate: {
        path: 'customerId',
        select: 'firstName lastName email phone'
      }
    })
    .populate('assignedTourGuide', 'firstName lastName email phone')
    .sort({ preferredDate: 1 })
    .limit(5);

    // Get recent completed tours
    const recentCompletedTours = await Tour.find({
      assignedDriver: driver._id,
      status: 'Ended'
    })
    .populate({
      path: 'bookingId',
      populate: {
        path: 'customerId',
        select: 'firstName lastName email phone'
      }
    })
    .populate('assignedTourGuide', 'firstName lastName email phone')
    .sort({ updatedAt: -1 })
    .limit(3);

    // Get driver performance metrics from SystemUser model
    const performanceMetrics = {
      total_distance: driver.driverInfo?.performance?.totalDistance || 0,
      average_rating: driver.driverInfo?.performance?.averageRating || 0,
      total_tours_completed: driver.driverInfo?.tourHistory?.length || 0,
      license_status: driver.driverInfo?.licenseExpiryDate ? 
        (new Date(driver.driverInfo.licenseExpiryDate) > new Date() ? 'Valid' : 'Expired') : 'Unknown'
    };

    // Get vehicle information
    const vehicleInfo = driver.driverInfo?.vehicleInfo || {};

    res.json({
      success: true,
      data: {
        driver_info: {
          id: driver._id,
          name: `${driver.firstName} ${driver.lastName}`,
          email: driver.email,
          phone: driver.phone,
          isAvailable: driver.isAvailable,
          license_status: performanceMetrics.license_status
        },
        vehicle_info: vehicleInfo,
        tour_statistics: stats,
        performance_metrics: performanceMetrics,
        today_tours: todayTours,
        upcoming_tours: upcomingTours,
        recent_completed_tours: recentCompletedTours,
        summary: {
          today_tours_count: todayTours.length,
          upcoming_tours_count: upcomingTours.length,
          active_tours: stats.confirmed_tours + stats.processing_tours + stats.started_tours
        }
      }
    });

  } catch (error) {
    console.error('Error fetching driver dashboard stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch driver dashboard stats',
      error: error.message
    });
  }
};

// Update tour status and handle staff availability
const updateTourStatus = async (req, res) => {
  try {
    const { tourId } = req.params;
    const { status } = req.body;

    const tour = await Tour.findById(tourId);
    if (!tour) {
      return res.status(404).json({ message: 'Tour not found' });
    }

    const oldStatus = tour.status;
    
    // Normalize status to proper case
    const statusMap = {
      'pending': 'Pending',
      'confirmed': 'Confirmed',
      'processing': 'Processing',
      'started': 'Started',
      'ended': 'Ended',
      'completed': 'Completed',
      'cancelled': 'Cancelled'
    };
    const normalizedStatus = statusMap[status.toLowerCase()] || status;
    
    tour.status = normalizedStatus;
    await tour.save();

    // If tour is completed, ended, or cancelled, reset staff availability
    if ((normalizedStatus === 'Completed' || normalizedStatus === 'Ended' || normalizedStatus === 'Cancelled') && 
        (oldStatus === 'Confirmed' || oldStatus === 'Processing' || oldStatus === 'Started')) {
      
      try {
        // Reset driver availability
        if (tour.assignedDriver) {
          const driver = await SystemUser.findById(tour.assignedDriver);
          if (driver && typeof driver.setAvailabilityForDate === 'function') {
            // Reset availability for the tour date
            await driver.setAvailabilityForDate(tour.preferredDate, true);
            // Reset global availability to true
            driver.isAvailable = true;
            await driver.save();
            console.log(`✅ Driver ${driver.firstName} ${driver.lastName} availability reset for ${new Date(tour.preferredDate).toLocaleDateString()}`);
          }
        }

        // Reset guide availability
        if (tour.assignedTourGuide) {
          const guide = await SystemUser.findById(tour.assignedTourGuide);
          if (guide && typeof guide.setAvailabilityForDate === 'function') {
            // Reset availability for the tour date
            await guide.setAvailabilityForDate(tour.preferredDate, true);
            // Reset global availability to true
            guide.isAvailable = true;
            await guide.save();
            console.log(`✅ Guide ${guide.firstName} ${guide.lastName} availability reset for ${new Date(tour.preferredDate).toLocaleDateString()}`);
          }
        }
      } catch (availabilityError) {
        console.error('⚠️ Error resetting availability (non-critical):', availabilityError);
        // Don't fail the entire request for availability reset errors
      }
    }

    return res.status(200).json({
      message: 'Tour status updated successfully',
      tour: tour
    });

  } catch (error) {
    console.error('Error updating tour status:', error);
    return res.status(500).json({
      message: 'Error updating tour status',
      error: error.message,
    });
  }
};

// Driver accepts a tour assignment
const acceptTour = async (req, res) => {
  try {
    const { tourId } = req.params;
    const driverId = req.user.id; // Get from authenticated user

    console.log('🔄 Driver accepting tour:', { tourId, driverId });

    // Find the tour
    const tour = await Tour.findById(tourId);
    if (!tour) {
      return res.status(404).json({ 
        success: false,
        message: 'Tour not found' 
      });
    }

    // Verify the driver is assigned to this tour
    if (tour.assignedDriver.toString() !== driverId) {
      return res.status(403).json({ 
        success: false,
        message: 'You are not assigned to this tour' 
      });
    }

    // Check if tour is in Pending status
    if (tour.status !== 'Pending') {
      return res.status(400).json({ 
        success: false,
        message: `Tour is already ${tour.status.toLowerCase()}. Cannot accept.` 
      });
    }

    // Update tour status to Confirmed
    tour.status = 'Confirmed';
    await tour.save();

    console.log('✅ Tour accepted by driver:', {
      tourId: tour._id,
      driverId: driverId,
      status: tour.status
    });

    res.status(200).json({
      success: true,
      message: 'Tour accepted successfully',
      tour: {
        id: tour._id,
        status: tour.status,
        preferredDate: tour.preferredDate,
        tourNotes: tour.tourNotes
      }
    });

  } catch (error) {
    console.error('❌ Error accepting tour:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error accepting tour', 
      error: error.message 
    });
  }
};

// Driver rejects a tour assignment
const rejectTour = async (req, res) => {
  try {
    const { tourId } = req.params;
    const { reason } = req.body;
    const driverId = req.user.id; // Get from authenticated user

    console.log('🔄 Driver rejecting tour:', { tourId, driverId, reason });

    // Find the tour
    const tour = await Tour.findById(tourId);
    if (!tour) {
      return res.status(404).json({ 
        success: false,
        message: 'Tour not found' 
      });
    }

    // Verify the driver is assigned to this tour
    if (tour.assignedDriver.toString() !== driverId) {
      return res.status(403).json({ 
        success: false,
        message: 'You are not assigned to this tour' 
      });
    }

    // Check if tour is in Pending status
    if (tour.status !== 'Pending') {
      return res.status(400).json({ 
        success: false,
        message: `Tour is already ${tour.status.toLowerCase()}. Cannot reject.` 
      });
    }

    // Update tour status to Pending and remove driver assignment
    tour.status = 'Pending';
    tour.assignedDriver = null;
    tour.tourNotes = (tour.tourNotes || '') + ` [Driver rejected: ${reason || 'No reason provided'}]`;
    await tour.save();

    console.log('✅ Tour rejected by driver:', {
      tourId: tour._id,
      driverId: driverId,
      reason: reason
    });

    res.status(200).json({
      success: true,
      message: 'Tour rejected successfully. Wildlife Officer will be notified to reassign.',
      tour: {
        id: tour._id,
        status: tour.status,
        assignedDriver: tour.assignedDriver
      }
    });

  } catch (error) {
    console.error('❌ Error rejecting tour:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error rejecting tour', 
      error: error.message 
    });
  }
};

// Test function to create a tour with tour guide assignment
const createTestTour = async (req, res) => {
  try {
    const { guideId, driverId } = req.body;
    
    // Create a test booking first
    const testBooking = new Booking({
      customerId: new mongoose.Types.ObjectId(), // Dummy customer ID
      activityId: new mongoose.Types.ObjectId(), // Dummy activity ID
      bookingDate: new Date(),
      preferredDate: new Date(),
      preferredTime: '09:00',
      participants: 2,
      totalAmount: 100,
      status: 'Confirmed',
      type: 'Safari Tour'
    });
    
    await testBooking.save();
    console.log('✅ Test booking created:', testBooking._id);
    
    // Create a test tour with guide assignment
    const testTour = new Tour({
      bookingId: testBooking._id,
      preferredDate: new Date(),
      tourDate: new Date(),
      assignedTourGuide: guideId ? new mongoose.Types.ObjectId(guideId) : null,
      assignedDriver: driverId ? new mongoose.Types.ObjectId(driverId) : null,
      status: 'Pending',
      tourNotes: 'Test tour for debugging'
    });
    
    await testTour.save();
    console.log('✅ Test tour created:', testTour._id);
    
    res.status(201).json({
      message: 'Test tour created successfully',
      tour: testTour,
      booking: testBooking
    });
  } catch (error) {
    console.error('❌ Error creating test tour:', error);
    res.status(500).json({ message: 'Failed to create test tour', error: error.message });
  }
};

// Utility function to reset availability for all ended tours
const resetAvailabilityForEndedTours = async (req, res) => {
  try {
    console.log('🔄 Resetting availability for all ended tours...');
    
    // Find all tours with "Ended" status
    const endedTours = await Tour.find({ status: 'Ended' });
    console.log(`📊 Found ${endedTours.length} ended tours`);
    
    let resetCount = 0;
    const resetStaff = [];
    
    for (const tour of endedTours) {
      try {
        // Reset driver availability
        if (tour.assignedDriver) {
          const driver = await SystemUser.findById(tour.assignedDriver);
          if (driver) {
            // Reset both date-specific and global availability
            await driver.setAvailabilityForDate(tour.preferredDate, true);
            driver.isAvailable = true;
            await driver.save();
            console.log(`✅ Driver ${driver.firstName} ${driver.lastName} availability reset for tour ${tour._id}`);
            resetStaff.push({ type: 'driver', name: `${driver.firstName} ${driver.lastName}`, id: driver._id });
            resetCount++;
          }
        }

        // Reset guide availability
        if (tour.assignedTourGuide) {
          const guide = await SystemUser.findById(tour.assignedTourGuide);
          if (guide) {
            // Reset both date-specific and global availability
            await guide.setAvailabilityForDate(tour.preferredDate, true);
            guide.isAvailable = true;
            await guide.save();
            console.log(`✅ Guide ${guide.firstName} ${guide.lastName} availability reset for tour ${tour._id}`);
            resetStaff.push({ type: 'guide', name: `${guide.firstName} ${guide.lastName}`, id: guide._id });
            resetCount++;
          }
        }
      } catch (error) {
        console.error(`⚠️ Error resetting availability for tour ${tour._id}:`, error);
      }
    }
    
    console.log(`✅ Reset availability for ${resetCount} staff members from ${endedTours.length} ended tours`);
    
    return res.status(200).json({
      message: `Successfully reset availability for ${resetCount} staff members from ${endedTours.length} ended tours`,
      endedTours: endedTours.length,
      resetStaff: resetCount,
      staffDetails: resetStaff
    });
  } catch (error) {
    console.error('❌ Error resetting availability for ended tours:', error);
    return res.status(500).json({
      message: 'Error resetting availability for ended tours',
      error: error.message
    });
  }
};

module.exports = {
  createTour,
  createTourWithAssignment,
  assignDriverAndGuide,
  getAllTours,
  getTourById,
  getToursByGuide,
  getToursByDriver,
  getDriverDashboardStats,
  acceptTour,
  rejectTour,
  updateTourStatus,
  createTestTour,
  resetAvailabilityForEndedTours,
};
