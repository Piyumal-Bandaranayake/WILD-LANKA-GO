// src/controllers/tourmanagement/fuelClaimController.js

const FuelClaim = require('../../models/tourmanagement/fuelClaim');
const OdometerReading = require('../../models/tourmanagement/OdometerReading');

// POST: Submit a fuel claim
const submitFuelClaim = async (req, res) => {
  try {
    console.log('🚀 Fuel claim submission received:', {
      body: req.body,
      user: req.user,
      headers: req.headers
    });

    const {
      tourId,
      startOdometer,
      endOdometer,
      totalDistance,
      calculatedFuelCost,
      notes,
      submittedBy,
      submissionDate,
      status
    } = req.body;

    // Handle uploaded odometer images (optional for new format)
    let startMeterImageUrl = '';
    let endMeterImageUrl = '';

    if (req.files) {
      if (req.files.startMeterImage && req.files.startMeterImage[0]) {
        startMeterImageUrl = `/uploads/odometer-readings/${req.files.startMeterImage[0].filename}`;
      }
      if (req.files.endMeterImage && req.files.endMeterImage[0]) {
        endMeterImageUrl = `/uploads/odometer-readings/${req.files.endMeterImage[0].filename}`;
      }
    }

    // Validate required fields
    if (!tourId || startOdometer == null || endOdometer == null) {
      return res.status(400).json({ 
        message: 'Tour ID, start odometer, and end odometer are required.',
        required: {
          tourId: !!tourId,
          startOdometer: startOdometer != null,
          endOdometer: endOdometer != null
        }
      });
    }

    // Calculate distance if not provided
    const calculatedDistance = totalDistance || (endOdometer - startOdometer);
    const calculatedCost = calculatedFuelCost || (calculatedDistance * 0.15); // Default rate

    // Create a new fuel claim document
    const newClaim = new FuelClaim({
      tourId,
      driverId: req.user.id, // Use authenticated user ID
      odometerStart: startOdometer,
      odometerEnd: endOdometer,
      startMeterImageUrl: startMeterImageUrl || '/uploads/placeholder-start.jpg', // Placeholder if no image
      endMeterImageUrl: endMeterImageUrl || '/uploads/placeholder-end.jpg', // Placeholder if no image
      // Use model's field names
      distanceKm: calculatedDistance,
      claimAmount: calculatedCost,
      // Set perKmRate to calculate claimAmount
      perKmRate: 0.15,
      // Status mapping
      status: status === 'pending' ? 'Pending' : (status === 'approved' ? 'Approved' : 'Rejected'),
      submittedAt: submissionDate || new Date(),
      // Additional fields
      reviewNote: notes || ''
    });

    // Save to DB
    await newClaim.save();

    console.log('✅ Fuel claim saved:', newClaim);

    res.status(201).json({
      message: 'Fuel claim submitted successfully.',
      fuelClaim: {
        _id: newClaim._id,
        tourId: newClaim.tourId,
        totalDistance: newClaim.distanceKm,
        calculatedFuelCost: newClaim.claimAmount,
        status: newClaim.status,
        submittedAt: newClaim.submittedAt
      }
    });

  } catch (error) {
    console.error('❌ Error submitting fuel claim:', error);
    res.status(500).json({ 
      message: 'Error submitting fuel claim',
      error: error.message 
    });
  }
};

// POST: Submit individual odometer reading
const submitOdometerReading = async (req, res) => {
  try {
    console.log('🚀 Odometer reading submission received:', {
      body: req.body,
      files: req.files,
      file: req.file,
      user: req.user,
      headers: req.headers
    });

    const {
      reading,
      type, // 'start' or 'end'
      tourId
    } = req.body;

    // Check if the tour exists
    const Tour = require('../../models/tourmanagement/tour');
    const existingTour = await Tour.findById(tourId);
    console.log('🔍 Tour lookup result:', existingTour ? 'Found' : 'Not found', { tourId });

    // Handle uploaded odometer image
    let imageUrl = '';
    console.log('📁 Files received:', req.files);
    console.log('📁 File object:', req.file);
    
    if (req.file) {
      imageUrl = `/uploads/odometer-readings/${req.file.filename}`;
      console.log('✅ Image URL set:', imageUrl);
    } else if (req.files && req.files.image && req.files.image[0]) {
      imageUrl = `/uploads/odometer-readings/${req.files.image[0].filename}`;
      console.log('✅ Image URL set from files:', imageUrl);
    } else {
      console.log('❌ No image file found');
    }

    // Validate required fields
    if (!reading || !type || !tourId || !imageUrl) {
      return res.status(400).json({ 
        message: 'All required fields must be provided including odometer image.',
        required: {
          reading: !!reading,
          type: !!type,
          tourId: !!tourId,
          image: !!imageUrl
        }
      });
    }

    // Validate type
    if (!['start', 'end'].includes(type)) {
      return res.status(400).json({ 
        message: 'Type must be either "start" or "end".' 
      });
    }

    // Validate reading is a positive number
    const readingNum = Number(reading);
    if (isNaN(readingNum) || readingNum < 0) {
      return res.status(400).json({ 
        message: 'Reading must be a valid positive number.' 
      });
    }

    // Create and save odometer reading record
    const odometerReading = new OdometerReading({
      driverId: req.user.id,
      tourId,
      reading: readingNum,
      type,
      imageUrl,
      status: 'submitted'
    });

    await odometerReading.save();

    console.log('✅ Odometer reading saved:', odometerReading);

    res.status(201).json({
      message: 'Odometer reading submitted successfully.',
      odometerReading: {
        _id: odometerReading._id,
        reading: odometerReading.reading,
        type: odometerReading.type,
        imageUrl: odometerReading.imageUrl,
        submittedAt: odometerReading.submittedAt,
        status: odometerReading.status
      }
    });

  } catch (error) {
    res.status(500).json({ message: 'Error submitting odometer reading', error: error.message });
  }
};

// GET: Odometer readings by driver
const getOdometerReadingsByDriver = async (req, res) => {
  try {
    const { driverId } = req.params;
    
    // If no driverId provided, use the authenticated user's ID
    const targetDriverId = driverId || req.user.id;
    
    const readings = await OdometerReading.find({ driverId: targetDriverId })
      .populate({
        path: 'tourId',
        select: 'bookingId status preferredDate tourDate',
        populate: {
          path: 'bookingId',
          select: 'type location numberOfAdults numberOfChildren bookingDate startTime'
        }
      })
      .sort({ submittedAt: -1 })
      .limit(50); // Limit to last 50 readings
    
    console.log('📊 Retrieved odometer readings:', readings.length);
    if (readings.length > 0) {
      console.log('📋 Sample reading:', JSON.stringify(readings[0], null, 2));
    }

    res.status(200).json({
      message: 'Odometer readings retrieved successfully.',
      readings
    });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving odometer readings', error: error.message });
  }
};

// GET: All fuel claims
const getAllFuelClaims = async (req, res) => {
  try {
    console.log('🔄 Fetching all fuel claims...');
    const claims = await FuelClaim.find()
      .populate({
        path: 'tourId',
        select: 'bookingId status preferredDate'
      })
      .populate({
        path: 'driverId',
        select: 'firstName lastName name email phone role'
      })
      .sort({ submittedAt: -1 });
    
    console.log('✅ Retrieved fuel claims:', claims.length);
    if (claims.length > 0) {
      console.log('📋 Sample claim:', JSON.stringify(claims[0], null, 2));
    }
    
    res.status(200).json(claims);
  } catch (error) {
    console.error('❌ Error fetching fuel claims:', error);
    res.status(500).json({ message: 'Error fetching fuel claims', error: error.message });
  }
};

// GET: Claims by driver
const getFuelClaimsByDriver = async (req, res) => {
  try {
    const claims = await FuelClaim.find({ driverId: req.params.driverId })
      .populate('tourId');
    res.status(200).json(claims);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching driver claims', error: error.message });
  }
};

// PUT: Update fuel claim status
const updateFuelClaimStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    console.log('🔄 Updating fuel claim status:', { id, status });
    
    // Validate status
    if (!['pending', 'approved', 'rejected', 'Pending', 'Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ 
        message: 'Invalid status. Must be pending, approved, or rejected.' 
      });
    }
    
    // Map lowercase to capitalized for database
    const dbStatus = status === 'pending' ? 'Pending' : 
                    status === 'approved' ? 'Approved' : 
                    status === 'rejected' ? 'Rejected' : status;
    
    const updatedClaim = await FuelClaim.findByIdAndUpdate(
      id,
      { 
        status: dbStatus,
        reviewedBy: req.user.id,
        reviewedAt: new Date()
      },
      { new: true }
    ).populate('driverId', 'firstName lastName name email');
    
    if (!updatedClaim) {
      return res.status(404).json({ message: 'Fuel claim not found' });
    }
    
    console.log('✅ Fuel claim status updated:', updatedClaim);
    
    res.status(200).json({
      message: 'Fuel claim status updated successfully',
      fuelClaim: updatedClaim
    });
    
  } catch (error) {
    console.error('❌ Error updating fuel claim status:', error);
    res.status(500).json({ 
      message: 'Error updating fuel claim status', 
      error: error.message 
    });
  }
};

//Driver can upload a image for odometer reading

module.exports = {
  submitFuelClaim,
  submitOdometerReading,
  getOdometerReadingsByDriver,
  getAllFuelClaims,
  getFuelClaimsByDriver,
  updateFuelClaimStatus
};
