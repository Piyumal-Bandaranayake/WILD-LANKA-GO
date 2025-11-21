require('dotenv').config();
const mongoose = require('mongoose');
const Tourist = require('./src/models/Tourist');
const SystemUser = require('./src/models/SystemUser');

async function checkDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Count documents in each collection
    const touristCount = await Tourist.countDocuments();
    const systemUserCount = await SystemUser.countDocuments();
    
    console.log(`\n📊 Database Counts:`);
    console.log(`- Tourists: ${touristCount}`);
    console.log(`- System Users: ${systemUserCount}`);
    console.log(`- Total: ${touristCount + systemUserCount}`);

    // Get sample data from each collection
    console.log(`\n👥 Sample Tourists:`);
    const sampleTourists = await Tourist.find().limit(3).select('firstName lastName email');
    sampleTourists.forEach(tourist => {
      console.log(`  - ${tourist.firstName} ${tourist.lastName} (${tourist.email})`);
    });

    console.log(`\n🏢 Sample System Users:`);
    const sampleSystemUsers = await SystemUser.find().limit(5).select('firstName lastName email role');
    sampleSystemUsers.forEach(user => {
      console.log(`  - ${user.firstName} ${user.lastName} (${user.email}) - ${user.role}`);
    });

    // Check collection names in database
    console.log(`\n📋 Available Collections:`);
    const collections = await mongoose.connection.db.listCollections().toArray();
    collections.forEach(collection => {
      console.log(`  - ${collection.name}`);
    });

  } catch (error) {
    console.error('❌ Database check failed:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

checkDatabase();
