const TourRejection = require('../../models/tourmanagement/tourRejection');
const Tour = require('../../models/tourmanagement/tour');

const submitRejection = async (req, res) => {
  try {
    const { tourId, tourGuideId, reason } = req.body;

    // Create rejection record
    const rejection = new TourRejection({ tourId, tourGuideId, reason });
    await rejection.save();

    // Update tour status to Pending so WPOC can reassign
    await Tour.findByIdAndUpdate(tourId, {
      status: 'Pending',
      assignedTourGuide: null
    });

    res.status(201).json({ message: 'Tour rejection submitted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error submitting rejection', error: error.message });
  }
};

module.exports = {
  submitRejection
};
