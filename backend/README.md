# Wild Lanka Go - Backend API

A comprehensive wildlife management system backend built with Node.js, Express, and MongoDB.

## 🚀 Features

- **Complete Authentication System** with JWT tokens and role-based access control
- **User Management** with 8 different roles (Admin, Wildlife Officer, Vet, Tour Guide, Safari Driver, Tourist, Call Operator, Emergency Officer)
- **Booking Management** for wildlife tours and activities
- **Animal Care Management** for rescued wildlife tracking
- **Report Management** for wildlife incidents and sightings
- **Vehicle Management** for fleet tracking
- **File Upload Support** with Cloudinary integration
- **Comprehensive Logging** with Winston
- **Input Validation** with Joi
- **Security Features** (Rate limiting, CORS, XSS protection, etc.)

## 📁 Project Structure

```
backend/
├── server.js                # Main entry point
├── .env                     # Environment variables
├── package.json            # Dependencies
│
├── config/
│   ├── db.js               # MongoDB connection
│   ├── logger.js           # Winston logging configuration
│   └── cloudinary.js       # Cloudinary setup (optional)
│
├── src/
│   ├── models/             # Mongoose schemas
│   │   ├── User.js         # User model with all roles
│   │   ├── Booking.js      # Tour booking model
│   │   ├── Animal.js       # Animal care model
│   │   ├── Report.js       # Incident report model
│   │   └── Vehicle.js      # Vehicle management model
│   │
│   ├── controllers/        # Request handlers
│   │   └── authController.js
│   │
│   ├── routes/             # Express routes
│   │   └── authRoutes.js
│   │
│   ├── middleware/         
│   │   ├── authMiddleware.js    # JWT authentication & authorization
│   │   ├── errorHandler.js      # Global error handling
│   │   └── validate.js          # Joi validation middleware
│   │
│   ├── utils/              # Helper functions
│   │   ├── generateToken.js     # JWT token utilities
│   │   ├── response.js          # Standardized API responses
│   │   └── constants.js         # Application constants
│   │
│   └── seed/               # Database seeders
│       └── seedUsers.js         # Create default users
│
└── logs/                   # Application logs (auto-created)
```

## 🛠️ Installation & Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Copy the `.env` file and update the values:

```env
# Server Configuration
PORT=5001
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/wild-lanka-go

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d

# CORS Configuration
FRONTEND_URL=http://localhost:5173

# Email Configuration (Optional - for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=Wild Lanka Go <noreply@wildlankago.com>
```

### 3. Start MongoDB
Make sure MongoDB is running on your system:
```bash
# Windows (if MongoDB is installed as service)
net start MongoDB

# macOS/Linux
sudo systemctl start mongod
```

### 4. Seed Database (Optional)
Create default users for testing:
```bash
npm run seed
```

### 5. Start the Server
```bash
# Development mode (with nodemon)
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:5001`

### 6. Email Configuration (Optional)
To enable email notifications (for job applications, account creation, etc.), configure the SMTP settings in your `.env` file:

```env
# Gmail SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=Wild Lanka Go <noreply@wildlankago.com>
```

**Note:** For Gmail, you'll need to:
1. Enable 2-factor authentication
2. Generate an "App Password" for the application
3. Use the app password (not your regular password) in `SMTP_PASS`

If email configuration is not provided, the system will work normally but email notifications will be disabled.

## 🔐 Default User Accounts

After running the seed command, you'll have these default accounts:

| Role              | Email                     | Password     |
|-------------------|---------------------------|--------------|
| Admin             | admin@wildlankago.com     | admin123     |
| Wildlife Officer  | officer@wildlankago.com   | officer123   |
| Veterinarian      | vet@wildlankago.com       | vet123       |
| Tour Guide        | guide@wildlankago.com     | guide123     |
| Safari Driver     | driver@wildlankago.com    | driver123    |
| Tourist           | tourist@example.com       | tourist123   |
| Call Operator     | operator@wildlankago.com  | operator123  |
| Emergency Officer | emergency@wildlankago.com | emergency123 |

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile (protected)
- `PUT /api/auth/profile` - Update profile (protected)
- `PUT /api/auth/change-password` - Change password (protected)
- `POST /api/auth/logout` - Logout (protected)
- `GET /api/auth/validate` - Validate token (protected)

### Health Check
- `GET /api/health` - Server health status
- `GET /` - API welcome message

## 🔒 Role-Based Access Control

The system supports 8 different user roles with specific permissions:

### Admin
- Full system access
- User management
- All CRUD operations

### Wildlife Officer
- Booking management
- Report management
- Animal case management
- Vehicle management

### Veterinarian
- Animal case management
- Treatment records
- Medical reports

### Tour Guide
- View assigned bookings
- Manage tour materials
- Update availability

### Safari Driver
- View assigned bookings
- Vehicle maintenance logs
- Fuel management

### Tourist
- Create bookings
- Submit reports
- View own bookings

### Call Operator
- Emergency call management
- Create incident reports

### Emergency Officer
- Emergency response coordination
- Incident management

## 🛡️ Security Features

- **JWT Authentication** with access and refresh tokens
- **Rate Limiting** to prevent abuse
- **Input Validation** with Joi schemas
- **XSS Protection** with xss-clean
- **NoSQL Injection Protection** with express-mongo-sanitize
- **CORS Configuration** for cross-origin requests
- **Helmet** for security headers
- **Password Hashing** with bcryptjs

## 📝 Logging

The application uses Winston for comprehensive logging:
- **Error logs**: `logs/error.log`
- **Combined logs**: `logs/combined.log`
- **Console output** in development mode

## 🧪 Testing the API

### Using curl:
```bash
# Health check
curl http://localhost:5001/api/health

# Register user
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "phone": "+94771234567",
    "password": "password123",
    "role": "tourist"
  }'

# Login
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

## 🔧 Development

### Adding New Routes
1. Create controller in `src/controllers/`
2. Create route file in `src/routes/`
3. Add route to `server.js`

### Adding New Models
1. Create model in `src/models/`
2. Follow existing patterns for validation and middleware

### Environment Variables
All configuration is done through environment variables in `.env` file.

## 📦 Dependencies

### Production Dependencies
- **express** - Web framework
- **mongoose** - MongoDB ODM
- **bcryptjs** - Password hashing
- **jsonwebtoken** - JWT implementation
- **joi** - Input validation
- **winston** - Logging
- **helmet** - Security headers
- **cors** - Cross-origin resource sharing
- **express-rate-limit** - Rate limiting
- **multer** - File uploads
- **cloudinary** - Image storage (optional)

### Development Dependencies
- **nodemon** - Development server with auto-restart

## 🚀 Deployment

1. Set `NODE_ENV=production` in environment
2. Update MongoDB URI for production database
3. Set strong JWT secrets
4. Configure proper CORS origins
5. Set up process manager (PM2 recommended)

## 📄 License

MIT License - see LICENSE file for details.

---

**Wild Lanka Go Backend API** - Built with ❤️ for wildlife conservation in Sri Lanka.
