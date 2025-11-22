/**
 * Migration script to move users to the new unified discriminator model
 * This script handles migration from the old User model to the new UserBase discriminator approach
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { User, Tourist, Employee } = require('../models/UserBase');

// Import old User model for migration
const OldUser = require('../models/User');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    
    if (!mongoUri) {
      throw new Error('MongoDB connection string not found in environment variables');
    }
    
    const dbName = 'wildlankago';
    const finalUri = mongoUri.includes('mongodb.net/') && !mongoUri.includes('mongodb.net/' + dbName) 
      ? mongoUri.replace('mongodb.net/', `mongodb.net/${dbName}`)
      : mongoUri;
    
    await mongoose.connect(finalUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB for migration');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};

const migrateToUnifiedModel = async () => {
  try {
    console.log('🚀 Starting migration to unified user model...');
    
    // Check if we already have users in the new format
    const existingUsers = await User.find({});
    if (existingUsers.length > 0) {
      console.log(`⚠️  Found ${existingUsers.length} users already in unified format`);
      console.log('Migration may have already been run. Proceeding with caution...');
    }
    
    // Get all users from old format (if any)
    const oldUsers = await OldUser.find({});
    console.log(`📊 Found ${oldUsers.length} users in old format to migrate`);
    
    let touristCount = 0;
    let employeeCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    
    for (const oldUser of oldUsers) {
      try {
        // Check if user already exists in new format
        const existingUser = await User.findOne({ email: oldUser.email });
        if (existingUser) {
          console.log(`⚠️  User already exists in new format: ${oldUser.email}`);
          skippedCount++;
          continue;
        }
        
        const userData = oldUser.toObject();
        delete userData._id; // Let MongoDB generate new IDs
        delete userData.__v;
        
        let newUser;
        
        if (oldUser.role === 'tourist') {
          // Create as Tourist discriminator
          newUser = new Tourist({
            ...userData,
            // Add tourist-specific defaults
            nationality: userData.nationality || 'Sri Lankan',
            interests: userData.interests || [],
            totalBookings: userData.totalBookings || 0,
            totalSpent: userData.totalSpent || 0,
            loyaltyPoints: userData.loyaltyPoints || 0,
            marketingOptIn: false,
          });
          touristCount++;
        } else {
          // Create as Employee discriminator
          newUser = new Employee({
            ...userData,
            // Add employee-specific defaults
            department: getDepartmentByRole(oldUser.role),
            position: getPositionByRole(oldUser.role),
            hireDate: userData.createdAt || new Date(),
            isAvailable: true,
            performanceRating: 3,
            completedTasks: 0,
            accessLevel: getAccessLevelByRole(oldUser.role),
          });
          employeeCount++;
        }
        
        await newUser.save();
        console.log(`✅ Migrated ${oldUser.role}: ${oldUser.email}`);
        
      } catch (error) {
        console.error(`❌ Error migrating user ${oldUser.email}:`, error.message);
        errorCount++;
      }
    }
    
    console.log('\n📈 Migration Summary:');
    console.log(`👥 Total users processed: ${oldUsers.length}`);
    console.log(`🏖️  Tourists migrated: ${touristCount}`);
    console.log(`🏢 Employees migrated: ${employeeCount}`);
    console.log(`⏭️  Skipped (already exists): ${skippedCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    
    // Verify the migration
    const finalTourists = await Tourist.countDocuments();
    const finalEmployees = await Employee.countDocuments();
    const totalUsers = await User.countDocuments();
    
    console.log('\n🔍 Post-migration verification:');
    console.log(`🏖️  Total tourists in database: ${finalTourists}`);
    console.log(`🏢 Total employees in database: ${finalEmployees}`);
    console.log(`👥 Total users in unified collection: ${totalUsers}`);
    
    if (errorCount === 0) {
      console.log('\n✅ Migration completed successfully!');
      console.log('\n⚠️  IMPORTANT: After verifying the migration:');
      console.log('1. Test login functionality with both user types');
      console.log('2. Verify all user data is correctly migrated');
      console.log('3. Test user registration for both tourists and employees');
      console.log('4. Consider backing up the old users collection');
      console.log('5. You may want to drop the old users collection after verification');
    } else {
      console.log('\n⚠️  Migration completed with errors. Please review the error messages above.');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

// Helper functions
const getDepartmentByRole = (role) => {
  const departmentMap = {
    admin: 'administration',
    wildlifeOfficer: 'wildlife_conservation',
    vet: 'veterinary_services',
    tourGuide: 'tourism_operations',
    safariDriver: 'tourism_operations',
    callOperator: 'call_center',
    emergencyOfficer: 'emergency_services',
  };
  return departmentMap[role] || 'field_operations';
};

const getPositionByRole = (role) => {
  const positionMap = {
    admin: 'System Administrator',
    wildlifeOfficer: 'Wildlife Conservation Officer',
    vet: 'Veterinarian',
    tourGuide: 'Tour Guide',
    safariDriver: 'Safari Driver',
    callOperator: 'Call Center Operator',
    emergencyOfficer: 'Emergency Response Officer',
  };
  return positionMap[role] || 'Staff Member';
};

const getAccessLevelByRole = (role) => {
  const accessLevelMap = {
    admin: 10,
    wildlifeOfficer: 7,
    vet: 6,
    emergencyOfficer: 5,
    callOperator: 4,
    tourGuide: 3,
    safariDriver: 3,
  };
  return accessLevelMap[role] || 1;
};

// Run migration
const runMigration = async () => {
  await connectDB();
  await migrateToUnifiedModel();
  await mongoose.connection.close();
  console.log('🔌 Database connection closed');
  process.exit(0);
};

// Handle script execution
if (require.main === module) {
  runMigration().catch((error) => {
    console.error('❌ Migration script failed:', error);
    process.exit(1);
  });
}

module.exports = { migrateToUnifiedModel, connectDB };
