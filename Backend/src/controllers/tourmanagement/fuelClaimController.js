// src/controllers/tourmanagement/fuelClaimController.js

import FuelClaim from '../../models/tourmanagement/fuelClaim.js';

// POST: Submit a fuel claim
export const submitFuelClaim = async (req, res) => {
  try {
    const {
      tourId,
      driverId,
      odometerStart,
      odometerEnd,
      startMeterImageUrl,
      endMeterImageUrl,
      litersFilled,
      pricePerLiter,
      perKmRate
    } = req.body;

    // Validate required fields
    if (
      !tourId || !driverId ||
      odometerStart == null || odometerEnd == null ||
      !startMeterImageUrl || !endMeterImageUrl
    ) {
      return res.status(400).json({ message: 'All required fields must be provided.' });
    }

    // Create a new fuel claim document
    const newClaim = new FuelClaim({
      tourId,
      driverId,
      odometerStart,
      odometerEnd,
      startMeterImageUrl,
      endMeterImageUrl,
      litersFilled,
      pricePerLiter,
      perKmRate
    });

    // Save to DB (will trigger pre-validation hook for calculation)
    await newClaim.save();

    res.status(201).json({
      message: 'Fuel claim submitted successfully.',
      fuelClaim: newClaim
    });

  } catch (error) {
    res.status(500).json({ message: 'Error submitting fuel claim', error: error.message });
  }
};

// GET: All fuel claims
export const getAllFuelClaims = async (req, res) => {
  try {
    const claims = await FuelClaim.find()
      .populate('tourId')
      .populate('driverId');
    res.status(200).json(claims);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching fuel claims', error: error.message });
  }
};

// GET: Claims by driver
export const getFuelClaimsByDriver = async (req, res) => {
  try {
    const claims = await FuelClaim.find({ driverId: req.params.driverId })
      .populate('tourId');
    res.status(200).json(claims);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching driver claims', error: error.message });
  }
};
