const fs = require('fs');
const path = require('path');

const createEnvFile = () => {
  const envContent = `# Database Configuration
MONGO_URI=mongodb://localhost:27017/wildlankago

# Server Configuration
PORT=5001
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here-change-in-production
JWT_EXPIRE=7d

# Cloudinary Configuration (Optional - for image uploads)
# CLOUDINARY_CLOUD_NAME=your-cloud-name
# CLOUDINARY_API_KEY=your-api-key
# CLOUDINARY_API_SECRET=your-api-secret

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost:5174,http://localhost:4173
`;

  const envPath = path.join(__dirname, '.env');
  
  if (fs.existsSync(envPath)) {
    console.log('⚠️  .env file already exists');
    console.log('Please check your existing .env file for required variables');
  } else {
    fs.writeFileSync(envPath, envContent);
    console.log('✅ .env file created successfully!');
    console.log('📝 Please update the values in .env file as needed');
  }
  
  console.log('\n🔧 Required environment variables:');
  console.log('- MONGO_URI: MongoDB connection string');
  console.log('- JWT_SECRET: Secret key for JWT tokens');
  console.log('- CLOUDINARY_*: Optional, for image uploads');
  
  console.log('\n🚀 To start the server:');
  console.log('npm run dev');
  
  console.log('\n🧪 To test database connection:');
  console.log('node test-connection.js');
};

createEnvFile();
