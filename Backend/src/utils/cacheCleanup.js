import cron from 'node-cron';
import fetch from 'node-fetch';

// Schedule cache cleanup to run daily at 2 AM
const scheduleCleanup = () => {
  cron.schedule('0 2 * * *', async () => {
    try {
      console.log('🧹 Starting scheduled cache cleanup...');
      
      const response = await fetch(`http://localhost:${process.env.PORT || 5001}/api/profile-image/cleanup-cache`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Cache cleanup completed:', result);
      } else {
        console.error('❌ Cache cleanup failed:', response.status);
      }
    } catch (error) {
      console.error('❌ Cache cleanup error:', error);
    }
  });
  
  console.log('📅 Cache cleanup scheduled for daily 2 AM');
};

export { scheduleCleanup };