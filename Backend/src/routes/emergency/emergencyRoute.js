import express from 'express';
import { reportEmergency, updateEmergencyStatus } from '../../controllers/emergency/emergencyController.js';
import Emergency from '../../models/emergency/emergency.js'; // Import Emergency model

const router = express.Router();

// Endpoint for reporting an emergency (POST)
router.post('/report', reportEmergency);

// Endpoint for getting all emergencies (GET)
router.get('/', async (req, res) => {
  try {
    const emergencies = await Emergency.find(); // Fetch all emergencies
    res.status(200).json(emergencies);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching emergencies', error: error.message });
  }
});

// Endpoint for getting an emergency by _id (GET)
router.get('/:id', async (req, res) => {
  try {
    const emergency = await Emergency.findById(req.params.id); // Using findById for _id
    if (!emergency) {
      return res.status(404).json({ message: 'Emergency not found' });
    }
    res.status(200).json(emergency);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching emergency', error: error.message });
  }
});

// Endpoint for updating the status of an emergency (PUT)
router.put('/update-status', updateEmergencyStatus);

// Endpoint for calculating emergencies by type (GET)
router.get('/calculate/by-type', async (req, res) => {
  try {
    const emergencyStats = await Emergency.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          pending: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          inProgress: {
            $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] }
          },
          resolved: {
            $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          _id: 0,
          type: '$_id',
          total: '$count',
          pending: 1,
          inProgress: 1,
          resolved: 1
        }
      },
      {
        $sort: { total: -1 }
      }
    ]);

    // Calculate overall totals
    const overallStats = await Emergency.aggregate([
      {
        $group: {
          _id: null,
          totalEmergencies: { $sum: 1 },
          totalPending: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          totalInProgress: {
            $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] }
          },
          totalResolved: {
            $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
          }
        }
      }
    ]);

    res.status(200).json({
      message: 'Emergency statistics calculated successfully',
      byType: emergencyStats,
      overall: overallStats[0] || {
        totalEmergencies: 0,
        totalPending: 0,
        totalInProgress: 0,
        totalResolved: 0
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error calculating emergency statistics', error: error.message });
  }
});

export default router;