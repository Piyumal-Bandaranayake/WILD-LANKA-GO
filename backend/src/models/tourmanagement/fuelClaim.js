// src/models/tourmanagement/fuelClaim.js
const mongoose = require('mongoose');

const fuelClaimSchema = new mongoose.Schema({
  // Who & for which tour
  driverId: { 
    type: mongoose.Schema.Types.ObjectId, ref: 'SystemUser', required: true 
},
  tourId:   { 
    type: mongoose.Schema.Types.ObjectId, ref: 'Tour', required: true 
},

  // Odometer readings (required)
  odometerStart: { type: Number, required: true, min: 0 },
  odometerEnd:   { type: Number, required: true, min: 0 },

  // Evidence photos (required: meter before/after)
  startMeterImageUrl: { type: String, required: true }, // before-tour meter photo
  endMeterImageUrl:   { type: String, required: true }, // after-tour meter photo


  // Derived mileage (auto-calculated)
  distanceKm: { type: Number, required: true, min: 0 },

  // Costing inputs (either set liters & pricePerLiter, OR set perKmRate)
  litersFilled:  { type: Number, default: 0, min: 0 },
  pricePerLiter: { type: Number, default: 0, min: 0 },
  perKmRate:     { type: Number, default: 0, min: 0 }, // used if liters/price not supplied

  // Calculated claim (auto-calculated)
  claimAmount: { type: Number, required: true, min: 0 },
  currency:    { type: String, default: 'LKR' },

  // Lifecycle / review
  status:      { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
  submittedAt: { type: Date, default: Date.now },
  reviewedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'WildlifeOfficer', default: null },
  reviewedAt:  { type: Date, default: null },
  reviewNote:  { type: String, default: '' },
}, { timestamps: true });

/**
 * Auto-calc distanceKm and claimAmount.
 * Priority for claimAmount:
 *   1) litersFilled * pricePerLiter  (if both > 0)
 *   2) distanceKm * perKmRate        (if perKmRate > 0)
 * If neither is provided, claimAmount becomes 0.
 */
fuelClaimSchema.pre('validate', function (next) {
  // distance
  const start = Number(this.odometerStart);
  const end = Number(this.odometerEnd);
  const distance = end - start;

  if (isNaN(distance) || distance < 0) {
    return next(new Error('Invalid odometer values: odometerEnd must be greater than odometerStart.'));
  }
  this.distanceKm = distance;

  // cost by liters first
  const liters = Number(this.litersFilled || 0);
  const ppl    = Number(this.pricePerLiter || 0);
  const perKm  = Number(this.perKmRate || 0);

  let amount = 0;
  if (liters > 0 && ppl > 0) {
    amount = liters * ppl;
  } else if (perKm > 0) {
    amount = distance * perKm;
  }
  this.claimAmount = Math.max(0, Number(amount.toFixed(2)));

  next();
});

const FuelClaim = mongoose.model('FuelClaim', fuelClaimSchema);
module.exports = FuelClaim;
