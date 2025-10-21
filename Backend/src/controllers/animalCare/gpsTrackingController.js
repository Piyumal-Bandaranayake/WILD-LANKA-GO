import AnimalCase from '../../models/Animal Care Management/AnimalCase.js';
import User from '../../models/User.js';

// Update GPS location for an animal case
export const updateGPSLocation = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { latitude, longitude, deviceId, batteryLevel, signalStrength } = req.body;
    const updatedBy = req.user?.sub || req.body.updatedBy || 'system';

    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }

    const animalCase = await AnimalCase.findById(caseId);
    if (!animalCase) {
      return res.status(404).json({ message: 'Animal case not found' });
    }

    // Update GPS tracking data
    animalCase.gpsTracking.lastLocation = {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      timestamp: new Date()
    };

    if (deviceId) {
      animalCase.gpsTracking.deviceId = deviceId;
    }

    // Add to location history
    if (!animalCase.gpsTracking.locationHistory) {
      animalCase.gpsTracking.locationHistory = [];
    }

    animalCase.gpsTracking.locationHistory.push({
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      timestamp: new Date(),
      batteryLevel: batteryLevel || null,
      signalStrength: signalStrength || null,
      recordedBy: updatedBy
    });

    // Keep only last 1000 location points to prevent excessive data growth
    if (animalCase.gpsTracking.locationHistory.length > 1000) {
      animalCase.gpsTracking.locationHistory = animalCase.gpsTracking.locationHistory.slice(-1000);
    }

    // Check geofencing alerts
    const alerts = checkGeofencingAlerts(animalCase);
    
    await animalCase.save();

    res.json({
      message: 'GPS location updated successfully',
      location: animalCase.gpsTracking.lastLocation,
      alerts
    });
  } catch (error) {
    console.error('Error updating GPS location:', error);
    res.status(500).json({ 
      message: 'Failed to update GPS location', 
      error: error.message 
    });
  }
};

// Enable GPS tracking for an animal case
export const enableGPSTracking = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { deviceId, safeZone } = req.body;
    const enabledBy = req.user?.sub || req.body.enabledBy || 'system';

    if (!deviceId) {
      return res.status(400).json({ message: 'Device ID is required' });
    }

    const animalCase = await AnimalCase.findById(caseId);
    if (!animalCase) {
      return res.status(404).json({ message: 'Animal case not found' });
    }

    // Check authorization only if user is authenticated
    if (req.user?.sub) {
      const user = await User.findById(enabledBy);
      const isAuthorized = animalCase.assignedVet && animalCase.assignedVet.toString() === enabledBy ||
                          user?.role === 'wildlifeofficer' || user?.role === 'admin';

      if (!isAuthorized) {
        return res.status(403).json({ 
          message: 'Access denied. Only assigned veterinarian or wildlife officer can enable GPS tracking.' 
        });
      }
    }

    animalCase.gpsTracking.isActive = true;
    animalCase.gpsTracking.deviceId = deviceId;
    animalCase.gpsTracking.enabledAt = new Date();
    animalCase.gpsTracking.enabledBy = enabledBy;

    if (safeZone) {
      animalCase.gpsTracking.safeZone = {
        center: {
          latitude: parseFloat(safeZone.latitude),
          longitude: parseFloat(safeZone.longitude)
        },
        radius: parseInt(safeZone.radius) // in meters
      };
    }

    // Initialize location history if not exists
    if (!animalCase.gpsTracking.locationHistory) {
      animalCase.gpsTracking.locationHistory = [];
    }

    await animalCase.save();

    res.json({
      message: 'GPS tracking enabled successfully',
      tracking: animalCase.gpsTracking
    });
  } catch (error) {
    console.error('Error enabling GPS tracking:', error);
    res.status(500).json({ 
      message: 'Failed to enable GPS tracking', 
      error: error.message 
    });
  }
};

// Disable GPS tracking for an animal case
export const disableGPSTracking = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { reason } = req.body;
    const disabledBy = req.user?.sub || req.body.disabledBy || 'system';

    const animalCase = await AnimalCase.findById(caseId);
    if (!animalCase) {
      return res.status(404).json({ message: 'Animal case not found' });
    }

    // Check authorization only if user is authenticated
    if (req.user?.sub) {
      const user = await User.findById(disabledBy);
      const isAuthorized = animalCase.assignedVet && animalCase.assignedVet.toString() === disabledBy ||
                          user?.role === 'wildlifeofficer' || user?.role === 'admin';

      if (!isAuthorized) {
        return res.status(403).json({ 
          message: 'Access denied. Only assigned veterinarian or wildlife officer can disable GPS tracking.' 
        });
      }
    }

    animalCase.gpsTracking.isActive = false;
    animalCase.gpsTracking.disabledAt = new Date();
    animalCase.gpsTracking.disabledBy = disabledBy;
    animalCase.gpsTracking.disabledReason = reason || 'No reason provided';

    await animalCase.save();

    res.json({
      message: 'GPS tracking disabled successfully',
      tracking: animalCase.gpsTracking
    });
  } catch (error) {
    console.error('Error disabling GPS tracking:', error);
    res.status(500).json({ 
      message: 'Failed to disable GPS tracking', 
      error: error.message 
    });
  }
};

// Get current GPS location for an animal case
export const getGPSLocation = async (req, res) => {
  try {
    const { caseId } = req.params;

    const animalCase = await AnimalCase.findById(caseId)
      .populate('assignedVet', 'name email')
      .populate('gpsTracking.enabledBy', 'name email')
      .populate('gpsTracking.disabledBy', 'name email');

    if (!animalCase) {
      return res.status(404).json({ message: 'Animal case not found' });
    }

    res.json({
      caseId: animalCase.caseId,
      animalType: animalCase.animalType,
      tracking: animalCase.gpsTracking
    });
  } catch (error) {
    console.error('Error fetching GPS location:', error);
    res.status(500).json({ 
      message: 'Failed to fetch GPS location', 
      error: error.message 
    });
  }
};

// Get GPS location history for an animal case
export const getGPSHistory = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { startDate, endDate, limit = 100 } = req.query;

    const animalCase = await AnimalCase.findById(caseId);
    if (!animalCase) {
      return res.status(404).json({ message: 'Animal case not found' });
    }

    let locationHistory = animalCase.gpsTracking.locationHistory || [];

    // Filter by date range if provided
    if (startDate || endDate) {
      locationHistory = locationHistory.filter(location => {
        const locationDate = new Date(location.timestamp);
        if (startDate && locationDate < new Date(startDate)) return false;
        if (endDate && locationDate > new Date(endDate)) return false;
        return true;
      });
    }

    // Limit the number of results
    locationHistory = locationHistory.slice(-parseInt(limit));

    res.json({
      caseId: animalCase.caseId,
      animalType: animalCase.animalType,
      locationHistory,
      totalPoints: locationHistory.length,
      safeZone: animalCase.gpsTracking.safeZone
    });
  } catch (error) {
    console.error('Error fetching GPS history:', error);
    res.status(500).json({ 
      message: 'Failed to fetch GPS history', 
      error: error.message 
    });
  }
};

// Update safe zone for an animal case
export const updateSafeZone = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { latitude, longitude, radius } = req.body;
    const updatedBy = req.user?.sub || req.body.updatedBy || 'system';

    if (!latitude || !longitude || !radius) {
      return res.status(400).json({ 
        message: 'Latitude, longitude, and radius are required' 
      });
    }

    const animalCase = await AnimalCase.findById(caseId);
    if (!animalCase) {
      return res.status(404).json({ message: 'Animal case not found' });
    }

    // Check authorization
    const user = await User.findById(updatedBy);
    const isAuthorized = animalCase.assignedVet && animalCase.assignedVet.toString() === updatedBy ||
                        user.role === 'wildlifeofficer' || user.role === 'admin';

    if (!isAuthorized) {
      return res.status(403).json({ 
        message: 'Access denied. Only assigned veterinarian or wildlife officer can update safe zone.' 
      });
    }

    animalCase.gpsTracking.safeZone = {
      center: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude)
      },
      radius: parseInt(radius)
    };

    await animalCase.save();

    res.json({
      message: 'Safe zone updated successfully',
      safeZone: animalCase.gpsTracking.safeZone
    });
  } catch (error) {
    console.error('Error updating safe zone:', error);
    res.status(500).json({ 
      message: 'Failed to update safe zone', 
      error: error.message 
    });
  }
};

// Get all animals with active GPS tracking
export const getActiveTrackedAnimals = async (req, res) => {
  try {
    const { area, status } = req.query;

    const filter = {
      'gpsTracking.isActive': true
    };

    if (status) {
      filter.status = status;
    }

    const animals = await AnimalCase.find(filter)
      .populate('assignedVet', 'name email')
      .select('caseId animalType speciesScientificName status gpsTracking assignedVet location');

    // Filter by area if provided
    let filteredAnimals = animals;
    if (area) {
      filteredAnimals = animals.filter(animal => 
        animal.location && animal.location.toLowerCase().includes(area.toLowerCase())
      );
    }

    res.json({
      animals: filteredAnimals,
      totalActive: filteredAnimals.length
    });
  } catch (error) {
    console.error('Error fetching active tracked animals:', error);
    res.status(500).json({ 
      message: 'Failed to fetch active tracked animals', 
      error: error.message 
    });
  }
};

// Check for GPS alerts (animals outside safe zone, no movement, etc.)
export const getGPSAlerts = async (req, res) => {
  try {
    const activeAnimals = await AnimalCase.find({
      'gpsTracking.isActive': true
    }).populate('assignedVet', 'name email');

    const alerts = [];
    const now = new Date();

    for (const animal of activeAnimals) {
      const tracking = animal.gpsTracking;
      
      // Check if outside safe zone
      if (tracking.safeZone && tracking.lastLocation) {
        const distance = calculateDistance(
          tracking.lastLocation.latitude,
          tracking.lastLocation.longitude,
          tracking.safeZone.center.latitude,
          tracking.safeZone.center.longitude
        );

        if (distance > tracking.safeZone.radius) {
          alerts.push({
            type: 'outside_safe_zone',
            severity: 'high',
            caseId: animal.caseId,
            animalType: animal.animalType,
            message: `${animal.animalType} is outside the safe zone`,
            distance: Math.round(distance),
            safeZoneRadius: tracking.safeZone.radius,
            lastLocation: tracking.lastLocation,
            assignedVet: animal.assignedVet
          });
        }
      }

      // Check for no movement (no location update in last 6 hours)
      if (tracking.lastLocation) {
        const hoursSinceUpdate = (now - new Date(tracking.lastLocation.timestamp)) / (1000 * 60 * 60);
        if (hoursSinceUpdate > 6) {
          alerts.push({
            type: 'no_movement',
            severity: hoursSinceUpdate > 24 ? 'critical' : 'medium',
            caseId: animal.caseId,
            animalType: animal.animalType,
            message: `No GPS update for ${Math.round(hoursSinceUpdate)} hours`,
            hoursSinceUpdate: Math.round(hoursSinceUpdate),
            lastLocation: tracking.lastLocation,
            assignedVet: animal.assignedVet
          });
        }
      }

      // Check for device issues (low battery, poor signal)
      if (tracking.locationHistory && tracking.locationHistory.length > 0) {
        const latestEntry = tracking.locationHistory[tracking.locationHistory.length - 1];
        if (latestEntry.batteryLevel && latestEntry.batteryLevel < 20) {
          alerts.push({
            type: 'low_battery',
            severity: 'medium',
            caseId: animal.caseId,
            animalType: animal.animalType,
            message: `GPS device battery low: ${latestEntry.batteryLevel}%`,
            batteryLevel: latestEntry.batteryLevel,
            assignedVet: animal.assignedVet
          });
        }
      }
    }

    res.json({
      alerts,
      summary: {
        total: alerts.length,
        critical: alerts.filter(a => a.severity === 'critical').length,
        high: alerts.filter(a => a.severity === 'high').length,
        medium: alerts.filter(a => a.severity === 'medium').length
      }
    });
  } catch (error) {
    console.error('Error fetching GPS alerts:', error);
    res.status(500).json({ 
      message: 'Failed to fetch GPS alerts', 
      error: error.message 
    });
  }
};

// Helper function to calculate distance between two coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in meters
}

// Helper function to check geofencing alerts
function checkGeofencingAlerts(animalCase) {
  const alerts = [];
  const tracking = animalCase.gpsTracking;

  if (tracking.safeZone && tracking.lastLocation) {
    const distance = calculateDistance(
      tracking.lastLocation.latitude,
      tracking.lastLocation.longitude,
      tracking.safeZone.center.latitude,
      tracking.safeZone.center.longitude
    );

    if (distance > tracking.safeZone.radius) {
      alerts.push({
        type: 'geofence_violation',
        message: 'Animal has moved outside the safe zone',
        distance: Math.round(distance),
        safeZoneRadius: tracking.safeZone.radius
      });
    }
  }

  return alerts;
}