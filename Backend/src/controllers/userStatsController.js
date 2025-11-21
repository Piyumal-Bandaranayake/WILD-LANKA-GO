const Tourist = require('../models/Tourist');
const SystemUser = require('../models/SystemUser');
const { sendSuccess, sendError } = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../../config/logger');

/**
 * Get user statistics for both collections
 * GET /api/users/stats
 */
const getUserStats = asyncHandler(async (req, res) => {
  try {
    // Get tourist statistics
    const touristStats = await Tourist.aggregate([
      {
        $group: {
          _id: null,
          totalTourists: { $sum: 1 },
          activeTourists: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          totalBookings: { $sum: '$totalBookings' },
          totalRevenue: { $sum: '$totalSpent' },
          averageSpent: { $avg: '$totalSpent' },
          totalLoyaltyPoints: { $sum: '$loyaltyPoints' }
        }
      }
    ]);

    // Get tourist nationality breakdown
    const nationalityBreakdown = await Tourist.aggregate([
      { $match: { status: 'active' } },
      {
        $group: {
          _id: '$nationality',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get system user statistics
    const systemUserStats = await SystemUser.aggregate([
      {
        $group: {
          _id: null,
          totalSystemUsers: { $sum: 1 },
          activeSystemUsers: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          availableUsers: {
            $sum: { $cond: [{ $and: [{ $eq: ['$status', 'active'] }, { $eq: ['$isAvailable', true] }] }, 1, 0] }
          },
          averagePerformance: { $avg: '$performanceRating' },
          totalCompletedTasks: { $sum: '$completedTasks' }
        }
      }
    ]);

    // Get system user role breakdown
    const roleBreakdown = await SystemUser.aggregate([
      { $match: { status: 'active' } },
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
          available: {
            $sum: { $cond: [{ $eq: ['$isAvailable', true] }, 1, 0] }
          }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get department breakdown
    const departmentBreakdown = await SystemUser.aggregate([
      { $match: { status: 'active' } },
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 },
          averagePerformance: { $avg: '$performanceRating' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Recent registrations (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentTourists = await Tourist.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    const recentSystemUsers = await SystemUser.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    const stats = {
      tourists: {
        ...touristStats[0] || {
          totalTourists: 0,
          activeTourists: 0,
          totalBookings: 0,
          totalRevenue: 0,
          averageSpent: 0,
          totalLoyaltyPoints: 0
        },
        nationalityBreakdown,
        recentRegistrations: recentTourists
      },
      systemUsers: {
        ...systemUserStats[0] || {
          totalSystemUsers: 0,
          activeSystemUsers: 0,
          availableUsers: 0,
          averagePerformance: 0,
          totalCompletedTasks: 0
        },
        roleBreakdown,
        departmentBreakdown,
        recentRegistrations: recentSystemUsers
      },
      summary: {
        totalUsers: (touristStats[0]?.totalTourists || 0) + (systemUserStats[0]?.totalSystemUsers || 0),
        totalActiveUsers: (touristStats[0]?.activeTourists || 0) + (systemUserStats[0]?.activeSystemUsers || 0),
        recentRegistrations: recentTourists + recentSystemUsers
      }
    };

    logger.info('User statistics retrieved successfully');

    return sendSuccess(res, stats, 'User statistics retrieved successfully');
  } catch (error) {
    logger.error('Error retrieving user statistics:', error);
    return sendError(res, 'Failed to retrieve user statistics', 500);
  }
});

/**
 * Get tourist-specific statistics
 * GET /api/users/tourists/stats
 */
const getTouristStats = asyncHandler(async (req, res) => {
  try {
    const stats = await Tourist.aggregate([
      {
        $facet: {
          overview: [
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
                totalSpent: { $sum: '$totalSpent' },
                totalBookings: { $sum: '$totalBookings' },
                averageSpent: { $avg: '$totalSpent' },
                totalLoyaltyPoints: { $sum: '$loyaltyPoints' }
              }
            }
          ],
          byNationality: [
            { $match: { status: 'active' } },
            { $group: { _id: '$nationality', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
          ],
          byInterests: [
            { $match: { status: 'active' } },
            { $unwind: '$interests' },
            { $group: { _id: '$interests', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
          ],
          topSpenders: [
            { $match: { status: 'active' } },
            { $sort: { totalSpent: -1 } },
            { $limit: 10 },
            {
              $project: {
                fullName: { $concat: ['$firstName', ' ', '$lastName'] },
                email: 1,
                totalSpent: 1,
                totalBookings: 1,
                loyaltyPoints: 1
              }
            }
          ]
        }
      }
    ]);

    return sendSuccess(res, stats[0], 'Tourist statistics retrieved successfully');
  } catch (error) {
    logger.error('Error retrieving tourist statistics:', error);
    return sendError(res, 'Failed to retrieve tourist statistics', 500);
  }
});

/**
 * Get system user-specific statistics
 * GET /api/users/system/stats
 */
const getSystemUserStats = asyncHandler(async (req, res) => {
  try {
    const stats = await SystemUser.aggregate([
      {
        $facet: {
          overview: [
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                active: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
                available: { $sum: { $cond: [{ $and: [{ $eq: ['$status', 'active'] }, { $eq: ['$isAvailable', true] }] }, 1, 0] } },
                averagePerformance: { $avg: '$performanceRating' },
                totalTasks: { $sum: '$completedTasks' }
              }
            }
          ],
          byRole: [
            { $match: { status: 'active' } },
            {
              $group: {
                _id: '$role',
                count: { $sum: 1 },
                available: { $sum: { $cond: [{ $eq: ['$isAvailable', true] }, 1, 0] } },
                averagePerformance: { $avg: '$performanceRating' }
              }
            },
            { $sort: { count: -1 } }
          ],
          byDepartment: [
            { $match: { status: 'active' } },
            {
              $group: {
                _id: '$department',
                count: { $sum: 1 },
                averagePerformance: { $avg: '$performanceRating' },
                totalTasks: { $sum: '$completedTasks' }
              }
            },
            { $sort: { count: -1 } }
          ],
          topPerformers: [
            { $match: { status: 'active' } },
            { $sort: { performanceRating: -1, completedTasks: -1 } },
            { $limit: 10 },
            {
              $project: {
                fullName: { $concat: ['$firstName', ' ', '$lastName'] },
                email: 1,
                role: 1,
                department: 1,
                performanceRating: 1,
                completedTasks: 1,
                employeeId: 1
              }
            }
          ]
        }
      }
    ]);

    return sendSuccess(res, stats[0], 'System user statistics retrieved successfully');
  } catch (error) {
    logger.error('Error retrieving system user statistics:', error);
    return sendError(res, 'Failed to retrieve system user statistics', 500);
  }
});

/**
 * Get available staff by role
 * GET /api/users/available-staff
 */
const getAvailableStaff = asyncHandler(async (req, res) => {
  try {
    const { role, isAvailable, date, includeInactive } = req.query;
    
    console.log('🔍 getAvailableStaff called with params:', { role, isAvailable, date, includeInactive });
    
    // Build query
    const query = {};
    
    // For emergency assignment, include both active and inactive vets/emergency officers
    if (includeInactive === 'true' || (role && ['vet', 'emergencyOfficer'].includes(role))) {
      query.status = { $in: ['active', 'inactive'] };
    } else {
      query.status = 'active';
    }
    
    if (role && role !== 'all') {
      query.role = role;
    }
    if (isAvailable === 'true') {
      query.isAvailable = true;
    }
    
    console.log('🔍 Query built:', query);
    
    const staff = await SystemUser.find(query)
      .select('firstName lastName email phone role status isAvailable dailyAvailability')
      .sort({ firstName: 1 });
    
    console.log('📊 Total staff found:', staff.length);
    console.log('👥 Staff roles:', staff.map(s => ({ name: `${s.firstName} ${s.lastName}`, role: s.role, isAvailable: s.isAvailable })));
    
    // If a specific date is provided, filter staff based on date-specific availability
    let availableStaff = staff;
    if (date) {
      const targetDate = new Date(date);
      const dateString = targetDate.toISOString().split('T')[0]; // YYYY-MM-DD
      
      console.log(`🔍 Filtering staff for date: ${dateString}`);
      console.log(`📊 Total staff before filtering: ${staff.length}`);
      
      // Get existing tour assignments for this date
      const Tour = require('../models/tourmanagement/tour');
      const existingTours = await Tour.find({
        preferredDate: {
          $gte: new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()),
          $lt: new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate() + 1)
        },
        status: { $in: ['Confirmed', 'Processing', 'Started'] }
      }).select('assignedDriver assignedTourGuide');
      
      console.log(`🚌 Existing tours on ${dateString}: ${existingTours.length}`);
      
      // Extract assigned staff IDs
      const assignedDriverIds = existingTours.map(tour => tour.assignedDriver?.toString()).filter(Boolean);
      const assignedGuideIds = existingTours.map(tour => tour.assignedTourGuide?.toString()).filter(Boolean);
      
      console.log(`👨‍💼 Assigned drivers: ${assignedDriverIds.length}`, assignedDriverIds);
      console.log(`👩‍💼 Assigned guides: ${assignedGuideIds.length}`, assignedGuideIds);
      
      availableStaff = staff.filter(member => {
        // Check general availability
        if (!member.isAvailable) {
          return false;
        }
        
        // Check if already assigned to a tour on this date
        if (member.role === 'safariDriver' && assignedDriverIds.includes(member._id.toString())) {
          return false;
        }
        if (member.role === 'tourGuide' && assignedGuideIds.includes(member._id.toString())) {
          return false;
        }
        
        // Check date-specific availability
        if (member.dailyAvailability && member.dailyAvailability.size > 0) {
          const dailyData = member.dailyAvailability.get(dateString);
          if (dailyData && !dailyData.isAvailable) {
            return false;
          }
        }
        
        return true;
      });
    }
    
    // Remove dailyAvailability from response to keep it clean
    const cleanStaff = availableStaff.map(member => {
      const { dailyAvailability, ...cleanMember } = member.toObject();
      return cleanMember;
    });
    
    console.log(`✅ Final available staff: ${cleanStaff.length} (${cleanStaff.filter(s => s.role === 'safariDriver').length} drivers, ${cleanStaff.filter(s => s.role === 'tourGuide').length} guides, ${cleanStaff.filter(s => s.role === 'vet').length} vets, ${cleanStaff.filter(s => s.role === 'emergencyOfficer').length} emergency officers)`);
    
    return sendSuccess(res, cleanStaff, 'Available staff retrieved successfully');
  } catch (error) {
    logger.error('Error getting available staff:', error);
    return sendError(res, 'Failed to retrieve available staff', 500);
  }
});

// Manual reset availability for ended tours (admin utility)
const resetEndedToursAvailability = asyncHandler(async (req, res) => {
  try {
    console.log('🔄 Manual reset of availability for ended tours...');
    
    const Tour = require('../models/tourmanagement/tour');
    
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
          if (driver && !driver.isAvailable) {
            await driver.setAvailabilityForDate(tour.preferredDate, true);
            driver.isAvailable = true;
            await driver.save();
            console.log(`✅ Driver ${driver.firstName} ${driver.lastName} availability reset`);
            resetStaff.push({ type: 'driver', name: `${driver.firstName} ${driver.lastName}`, id: driver._id });
            resetCount++;
          }
        }

        // Reset guide availability
        if (tour.assignedTourGuide) {
          const guide = await SystemUser.findById(tour.assignedTourGuide);
          if (guide && !guide.isAvailable) {
            await guide.setAvailabilityForDate(tour.preferredDate, true);
            guide.isAvailable = true;
            await guide.save();
            console.log(`✅ Guide ${guide.firstName} ${guide.lastName} availability reset`);
            resetStaff.push({ type: 'guide', name: `${guide.firstName} ${guide.lastName}`, id: guide._id });
            resetCount++;
          }
        }
      } catch (error) {
        console.error(`⚠️ Error resetting availability for tour ${tour._id}:`, error);
      }
    }
    
    console.log(`✅ Manual reset completed: ${resetCount} staff members availability reset from ${endedTours.length} ended tours`);
    
    return sendSuccess(res, {
      message: `Successfully reset availability for ${resetCount} staff members from ${endedTours.length} ended tours`,
      endedTours: endedTours.length,
      resetStaff: resetCount,
      staffDetails: resetStaff
    }, 'Availability reset completed successfully');
  } catch (error) {
    logger.error('Error in manual reset availability for ended tours:', error);
    return sendError(res, 'Failed to reset availability for ended tours', 500);
  }
});

module.exports = {
  getUserStats,
  getTouristStats,
  getSystemUserStats,
  getAvailableStaff,
  resetEndedToursAvailability,
};
