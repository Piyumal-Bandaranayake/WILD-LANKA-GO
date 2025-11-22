# 🦁 WILD LANKA GO

**Wildlife Tourism Management System**

A comprehensive full-stack web application for managing wildlife tourism operations in Sri Lanka, featuring role-based dashboards, activity booking, animal care tracking, emergency management, and tour coordination.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [User Roles](#user-roles)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)
- [License](#license)

---

## 🌟 Overview

WILD LANKA GO is a modern wildlife tourism management platform designed to streamline operations for wildlife parks, safari tours, and conservation efforts in Sri Lanka. The system provides specialized dashboards for different user roles and enables efficient management of bookings, animal care, emergencies, and tour operations.

### Key Highlights

- **Role-Based Access Control** - 8+ specialized user roles with custom dashboards
- **Real-Time Booking System** - Activity and event booking with payment integration
- **Animal Care Management** - Track animal cases, treatments, and medications
- **Emergency Response** - Emergency reporting and officer dispatch system
- **Tour Management** - Driver and guide assignment, fuel claims, materials tracking
- **Auth0 Integration** - Secure authentication and authorization
- **Modern UI/UX** - Built with React, Tailwind CSS, and Flowbite components

---

## ✨ Features

### For Tourists
- 🎫 Browse and book activities (safaris, wildlife tours, bird watching)
- 🎉 Register for events and workshops
- 💰 Make donations to conservation projects
- 📝 Submit feedback and complaints
- 👤 Manage personal profile and bookings
- 📱 View booking history and QR codes

### For Administrators
- 📊 Comprehensive analytics dashboard
- 👥 User management (all roles)
- 🏢 System configuration
- 📈 Reports and statistics
- 💳 Payment tracking
- 🔐 Role and permission management

### For Wildlife Officers
- 🐘 Animal case management
- 📋 Treatment tracking
- 🚗 Driver management
- 📍 GPS tracking integration
- 📊 Animal health reports

### For Veterinarians
- 💊 Medication management
- 🏥 Treatment scheduling
- 📝 Medical records
- 🔬 Lab result tracking
- 📊 Health analytics

### For Emergency Officers
- 🚨 Emergency response management
- 📞 Call operator coordination
- 🚑 Resource dispatch
- 📍 Location tracking
- 📊 Incident reports

### For Tour Guides & Safari Drivers
- 🗓️ Tour assignment tracking
- ⛽ Fuel claim submission
- 📦 Material requests
- 📅 Availability management
- 📊 Tour history

### For Call Operators
- 📞 Emergency call handling
- 📋 Incident logging
- 👮 Officer dispatch
- 📊 Call statistics

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 18+ with Vite
- **Styling:** Tailwind CSS, Flowbite React
- **State Management:** React Context API
- **Authentication:** Auth0 React SDK
- **HTTP Client:** Axios
- **Routing:** React Router v6
- **Form Handling:** Custom validation utilities
- **UI Components:** Flowbite, Custom components

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** Auth0, JWT
- **File Upload:** Multer, Cloudinary
- **Email Service:** Nodemailer
- **Logging:** Winston
- **Security:** Helmet, CORS, express-validator

### Development Tools
- **Version Control:** Git & GitHub
- **Package Manager:** npm
- **Code Quality:** ESLint
- **API Testing:** Postman (collection available)

---

## 📁 Project Structure

```
WILD-LANKA-GO/
├── backend/                    # Backend application
│   ├── config/                 # Configuration files
│   │   ├── db.js              # Database connection
│   │   ├── cloudinary.js      # Cloudinary setup
│   │   └── logger.js          # Winston logger
│   ├── src/
│   │   ├── controllers/       # Route controllers
│   │   │   ├── authController.js
│   │   │   ├── activityController.js
│   │   │   ├── animalCaseController.js
│   │   │   ├── eventController.js
│   │   │   ├── donationController.js
│   │   │   └── ...
│   │   ├── models/            # Mongoose models
│   │   │   ├── User.js
│   │   │   ├── Activity.js
│   │   │   ├── Booking.js
│   │   │   ├── Event.js
│   │   │   └── ...
│   │   ├── routes/            # API routes
│   │   │   ├── authRoutes.js
│   │   │   ├── activityRoutes.js
│   │   │   ├── animalCaseRoutes.js
│   │   │   └── ...
│   │   ├── middleware/        # Custom middleware
│   │   │   ├── authMiddleware.js
│   │   │   ├── errorHandler.js
│   │   │   └── upload.js
│   │   └── utils/             # Utility functions
│   ├── server.js              # Entry point
│   └── package.json
│
├── frontend/                   # Frontend application
│   ├── src/
│   │   ├── components/        # Reusable components
│   │   │   ├── Navbar.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   ├── RoleGuard.jsx
│   │   │   └── common/        # Common UI components
│   │   ├── pages/             # Page components
│   │   │   ├── home.jsx
│   │   │   ├── admin/
│   │   │   ├── tourist/
│   │   │   ├── vet/
│   │   │   └── ...
│   │   ├── contexts/          # React contexts
│   │   │   ├── AuthContext.jsx
│   │   │   └── NotificationContext.jsx
│   │   ├── services/          # API services
│   │   │   ├── api.js
│   │   │   └── authService.js
│   │   ├── hooks/             # Custom hooks
│   │   ├── utils/             # Utility functions
│   │   ├── config/            # Configuration
│   │   ├── assets/            # Images, icons
│   │   ├── App.jsx            # Main app component
│   │   └── main.jsx           # Entry point
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── .gitignore
├── package.json
└── README.md
```

---

## 🚀 Installation

### Prerequisites

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **MongoDB** (local or Atlas)
- **Auth0 Account** (for authentication)
- **Cloudinary Account** (for image uploads)

### Clone the Repository

```bash
git clone https://github.com/Piyumal-Bandaranayake/WILD-LANKA-GO.git
cd WILD-LANKA-GO
```

### Install Dependencies

#### Backend
```bash
cd backend
npm install
```

#### Frontend
```bash
cd frontend
npm install
```

---

## ⚙️ Configuration

### Backend Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/wildlankago
# OR for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/wildlankago

# Auth0
AUTH0_DOMAIN=your-domain.auth0.com
AUTH0_AUDIENCE=your-api-identifier
AUTH0_ISSUER=https://your-domain.auth0.com/

# JWT
JWT_SECRET=your-jwt-secret-key-here
JWT_EXPIRES_IN=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

### Frontend Environment Variables

Create a `.env` file in the `frontend/` directory:

```env
# API URL
VITE_API_URL=http://localhost:5000/api

# Auth0
VITE_AUTH0_DOMAIN=your-domain.auth0.com
VITE_AUTH0_CLIENT_ID=your-client-id
VITE_AUTH0_AUDIENCE=your-api-identifier
VITE_AUTH0_REDIRECT_URI=http://localhost:5173
```

### Auth0 Configuration

1. Create an Auth0 application (Single Page Application)
2. Create an API in Auth0
3. Configure permissions/scopes:
   - `read:activities`
   - `write:activities`
   - `read:bookings`
   - `write:bookings`
   - `manage:users` (admin only)
   - etc.
4. Add custom claims in Auth0 Actions for user roles

---

## 🏃 Running the Application

### Development Mode

#### Start Backend Server
```bash
cd backend
npm run dev
# Server runs on http://localhost:5000
```

#### Start Frontend Development Server
```bash
cd frontend
npm run dev
# App runs on http://localhost:5173
```

### Production Build

#### Build Frontend
```bash
cd frontend
npm run build
```

#### Start Backend in Production
```bash
cd backend
npm start
```

---

## 👥 User Roles

The system supports the following user roles with specialized dashboards:

| Role | Key Features | Dashboard Access |
|------|-------------|------------------|
| **Tourist** | Book activities, events, donations | Tourist Dashboard |
| **Admin** | Full system access, user management | Admin Dashboard |
| **Vet** | Animal care, medical records | Vet Dashboard |
| **Wildlife Officer** | Animal case management, driver management | Wildlife Officer Dashboard |
| **Emergency Officer** | Emergency response, resource dispatch | Emergency Officer Dashboard |
| **Call Operator** | Handle emergency calls, log incidents | Call Operator Dashboard |
| **Tour Guide** | Tour assignments, material requests | Tour Guide Dashboard |
| **Safari Driver** | Vehicle management, fuel claims | Safari Driver Dashboard |

---

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication
All protected routes require a Bearer token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### Main Endpoints

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

#### Activities
- `GET /api/activities` - Get all activities
- `GET /api/activities/:id` - Get activity by ID
- `POST /api/activities` - Create activity (Admin)
- `PUT /api/activities/:id` - Update activity (Admin)
- `DELETE /api/activities/:id` - Delete activity (Admin)

#### Bookings
- `GET /api/bookings` - Get user bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings/:id` - Get booking details
- `PUT /api/bookings/:id/cancel` - Cancel booking

#### Events
- `GET /api/events` - Get all events
- `POST /api/events` - Create event (Admin)
- `POST /api/events/:id/register` - Register for event

#### Donations
- `GET /api/donations` - Get all donations
- `POST /api/donations` - Make donation

#### Animal Cases
- `GET /api/animal-cases` - Get all cases (Officer/Vet)
- `POST /api/animal-cases` - Create case
- `PUT /api/animal-cases/:id` - Update case

#### Emergency
- `GET /api/emergency` - Get emergencies
- `POST /api/emergency` - Report emergency
- `PUT /api/emergency/:id/assign` - Assign officer

*For complete API documentation, refer to the Postman collection (coming soon)*

---

## 🚀 Deployment

### Deploying to Vercel

This project is configured for deployment to Vercel with a monorepo structure.

#### Prerequisites
- [Vercel Account](https://vercel.com/signup)
- [Vercel CLI](https://vercel.com/download) installed globally
- MongoDB Atlas database (production)
- All required API keys and secrets

#### Quick Deploy

**Option 1: Using Deployment Scripts**

For Windows:
```bash
.\deploy.bat
```

For Unix/Linux/macOS:
```bash
chmod +x deploy.sh
./deploy.sh
```

**Option 2: Manual Deployment**

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy from project root:
```bash
vercel
```

4. Follow the prompts:
   - Set up and deploy? **Y**
   - Which scope? Select your account
   - Link to existing project? **N** (first time)
   - What's your project's name? **wild-lanka-go**
   - In which directory is your code located? **/**

#### Environment Variables

After deployment, configure these environment variables in the Vercel dashboard:

**Required Backend Variables:**
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/wildlankago
JWT_SECRET=your-super-secret-jwt-key
CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
AUTH0_DOMAIN=your-domain.auth0.com
AUTH0_CLIENT_ID=your-auth0-client-id
AUTH0_CLIENT_SECRET=your-auth0-client-secret
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password
```

**Required Frontend Variables:**
```
VITE_API_URL=https://your-app.vercel.app/api
VITE_AUTH0_DOMAIN=your-domain.auth0.com
VITE_AUTH0_CLIENT_ID=your-auth0-client-id
VITE_AUTH0_AUDIENCE=your-api-audience
```

**To add environment variables:**
1. Go to your project in [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable with appropriate values
4. Redeploy to apply changes

#### Testing Deployment

1. **Frontend Testing:**
   - Navigate to `https://your-app.vercel.app`
   - Test user registration and login
   - Verify all pages load correctly
   - Check responsive design on mobile

2. **Backend API Testing:**
   - Test health endpoint: `GET https://your-app.vercel.app/api/health`
   - Test authentication: `POST https://your-app.vercel.app/api/auth/login`
   - Verify database connectivity
   - Check file uploads (Cloudinary)

3. **Common Issues:**
   - **500 Error:** Check environment variables are set correctly
   - **Database connection failed:** Verify MONGODB_URI and IP whitelist
   - **CORS errors:** Ensure frontend URL is in backend CORS configuration
   - **Static files 404:** Check build output directory matches vercel.json

#### Monitoring

- View logs in Vercel Dashboard → Your Project → Logs
- Monitor performance in Analytics tab
- Set up error tracking (optional): Integrate Sentry or similar

#### CI/CD with GitHub

Vercel automatically deploys on every push:
- **Production:** Pushes to `main` branch
- **Preview:** Pushes to other branches

To disable auto-deployments:
1. Go to Project Settings → Git
2. Configure deployment branches

For detailed deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md).

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Coding Standards
- Follow existing code style
- Write meaningful commit messages
- Add comments for complex logic
- Test your changes before submitting

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Development Team

Developed by the WILD LANKA GO Team

- **Project Lead:** [Piyumal Bandaranayake]
- **Contributors:** Check [Contributors](https://github.com/Piyumal-Bandaranayake/WILD-LANKA-GO/graphs/contributors)

---

## 📞 Support

For support, email: [your-email@example.com]

For bugs and feature requests, please [create an issue](https://github.com/Piyumal-Bandaranayake/WILD-LANKA-GO/issues).

---

## 🙏 Acknowledgments

- Auth0 for authentication services
- Cloudinary for media management
- MongoDB for database services
- All open-source contributors

---

**⭐ If you like this project, please give it a star on GitHub! ⭐**

---

*Last Updated: November 22, 2025*
