# Tourist Frontend Integration Guide

## Overview
This guide explains how to connect your frontend to all the tourist endpoints available in your backend. The backend provides comprehensive tourist functionality including bookings, events, donations, feedback, complaints, and emergency reporting.

## Available Tourist Endpoints

### 📊 Dashboard & User Data
- `GET /tourist/dashboard/stats` - Get dashboard statistics
- `GET /tourist/my-bookings` - Get user's bookings
- `GET /tourist/my-registrations` - Get user's event registrations
- `GET /tourist/my-donations` - Get user's donations
- `GET /tourist/my-feedback` - Get user's feedback
- `GET /tourist/my-complaints` - Get user's complaints

### 🎯 Activity Booking Management
- `GET /tourist/activities/check-slots` - Check available slots for activity
- `POST /tourist/bookings` - Create new booking
- `PUT /tourist/bookings/:id/cancel` - Cancel booking (legacy)

### 🎪 Event Registration Management
- `POST /tourist/registrations` - Register for event
- `PUT /tourist/registrations/:id` - Modify registration
- `DELETE /tourist/registrations/:id` - Cancel registration

### 💝 Donation Management
- `POST /tourist/donations` - Create donation
- `PUT /tourist/donations/:id/message` - Update donation message

### 💬 Feedback Management (CRUD)
- `GET /tourist/feedback/all` - Get all feedback (with pagination)
- `POST /tourist/feedback` - Create feedback
- `PUT /tourist/feedback/:id` - Update own feedback
- `DELETE /tourist/feedback/:id` - Delete own feedback

### 📝 Complaint Management (CRUD)
- `POST /tourist/complaints` - Create complaint
- `PUT /tourist/complaints/:id` - Update own complaint
- `DELETE /tourist/complaints/:id` - Delete own complaint

### 🚨 Emergency Reporting
- `POST /tourist/emergency` - Report emergency

## Frontend Integration

### 1. Import the Tourist Service
```javascript
import { touristService } from '../services/touristService.js';
```

### 2. Use React Hooks for State Management
```javascript
import { useTouristData } from '../hooks/useTourist.js';

const MyComponent = () => {
  const { dashboard, bookings, actions, isLoading } = useTouristData();
  
  if (isLoading) return <div>Loading...</div>;
  
  return (
    <div>
      <h1>Total Bookings: {dashboard?.stats?.totalBookings}</h1>
      {/* Your component content */}
    </div>
  );
};
```

### 3. Individual Hook Usage
```javascript
// For specific functionality
import { 
  useTouristBookings, 
  useTouristFeedback,
  useTouristEmergency 
} from '../hooks/useTourist.js';

const BookingComponent = () => {
  const { bookings, createBooking, checkSlots } = useTouristBookings();
  
  const handleBooking = async (activityId, date, participants) => {
    try {
      // Check availability first
      const slots = await checkSlots(activityId, date);
      if (slots.availableSlots >= participants) {
        await createBooking({
          activityId,
          bookingDate: date,
          numberOfParticipants: participants
        });
        alert('Booking successful!');
      } else {
        alert('Not enough slots available');
      }
    } catch (error) {
      alert('Booking failed: ' + error.message);
    }
  };
  
  return (
    <div>
      {bookings.map(booking => (
        <div key={booking._id}>
          <h3>{booking.activityId?.name}</h3>
          <p>Status: {booking.status}</p>
        </div>
      ))}
    </div>
  );
};
```

## API Response Formats

### Dashboard Stats Response
```javascript
{
  success: true,
  data: {
    stats: {
      totalBookings: 5,
      totalRegistrations: 3,
      totalDonations: 2,
      totalFeedback: 4,
      totalComplaints: 1
    },
    recentActivity: {
      bookings: [...],
      donations: [...]
    }
  }
}
```

### Booking Response
```javascript
{
  success: true,
  data: {
    booking: {
      _id: "...",
      userId: "...",
      activityId: {
        name: "Safari Tour",
        price: 5000,
        ...
      },
      bookingDate: "2025-01-15",
      numberOfParticipants: 2,
      status: "Pending"
    },
    payment: {
      totalAmount: 11500, // 5000 * 2 + 1500 (tour guide)
      basePrice: 10000,
      tourGuidePrice: 1500,
      currency: "LKR"
    },
    availableSlots: 8
  }
}
```

### Check Slots Response
```javascript
{
  success: true,
  data: {
    activityId: "...",
    date: "2025-01-15",
    totalCapacity: 10,
    bookedSlots: 2,
    availableSlots: 8,
    activityName: "Safari Tour",
    price: 5000
  }
}
```

## Error Handling

### Using the Error Handler
```javascript
import { handleTouristApiError } from '../services/touristService.js';

try {
  await touristService.createBooking(bookingData);
} catch (error) {
  const errorMessage = handleTouristApiError(error);
  alert(errorMessage); // User-friendly error message
}
```

### Common Error Types
- `400` - Invalid request data (e.g., invalid date, no slots available)
- `401` - Authentication required
- `404` - Resource not found (e.g., activity doesn't exist)
- `500` - Server error

### Validation Errors
The frontend includes comprehensive validation to prevent common errors:

```javascript
import { validateTouristData } from '../services/touristService.js';

// Validate booking data before sending
const errors = validateTouristData.booking(bookingData);
if (errors.length > 0) {
  console.error('Validation errors:', errors);
  return;
}
```

### Data Type Issues
**IMPORTANT**: The validation errors you encountered were due to data type mismatches. The frontend now automatically converts:

- `numberOfParticipants` to integer using `parseInt()`
- `amount` to float using `parseFloat()`
- `requestTourGuide` to boolean using `Boolean()`

```javascript
// ❌ This will cause validation errors
const bookingData = {
  numberOfParticipants: "2", // String instead of number
  requestTourGuide: "true"   // String instead of boolean
};

// ✅ This is automatically handled by the service
const bookingData = {
  numberOfParticipants: 2,   // Converted to number
  requestTourGuide: true     // Converted to boolean
};
```

## Configuration Options

### Import Tourist Config
```javascript
import { touristConfig } from '../services/touristService.js';

// Use predefined options
const donationCategories = touristConfig.donationCategories;
const emergencyTypes = touristConfig.emergencyTypes;
const activityTypes = touristConfig.activityTypes;
```

### Available Configurations
```javascript
touristConfig = {
  donationCategories: [
    'General Wildlife Conservation',
    'Animal Rescue & Rehabilitation',
    'Habitat Protection',
    // ...
  ],
  emergencyTypes: [
    'Wildlife Encounter',
    'Medical Emergency',
    'Vehicle Breakdown',
    // ...
  ],
  emergencySeverityLevels: ['Low', 'Medium', 'High', 'Critical'],
  activityTypes: ['Safari Tour', 'Nature Walk', 'Bird Watching', ...],
  eventTypes: ['Wildlife Conservation Workshop', 'Educational Seminar', ...]
}
```

## Authentication Requirements

All tourist endpoints require authentication. Make sure your authentication service is properly configured:

```javascript
// In your authService.js, ensure the token provider is set
import { setTokenProvider } from '../services/authService.js';

// Set your token provider function
setTokenProvider(async () => {
  // Return your access token here
  return await getAccessTokenSilently();
});
```

## Complete Integration Example

```javascript
import React, { useState } from 'react';
import { useTouristData } from '../hooks/useTourist.js';
import { touristConfig } from '../services/touristService.js';

const TouristPage = () => {
  const {
    dashboard,
    bookings,
    registrations,
    donations,
    feedback,
    complaints,
    isLoading,
    actions
  } = useTouristData();

  const [activeTab, setActiveTab] = useState('dashboard');

  if (isLoading) {
    return <div className="loading">Loading your data...</div>;
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <div>
            <h2>Dashboard</h2>
            <div className="stats-grid">
              <div className="stat">Bookings: {dashboard?.stats?.totalBookings}</div>
              <div className="stat">Events: {dashboard?.stats?.totalRegistrations}</div>
              <div className="stat">Donations: {dashboard?.stats?.totalDonations}</div>
              <div className="stat">Feedback: {dashboard?.stats?.totalFeedback}</div>
            </div>
          </div>
        );
      
      case 'bookings':
        return (
          <div>
            <h2>My Bookings</h2>
            {bookings.map(booking => (
              <div key={booking._id} className="booking-card">
                <h3>{booking.activityId?.name}</h3>
                <p>Date: {new Date(booking.bookingDate).toLocaleDateString()}</p>
                <p>Status: {booking.status}</p>
                <p>Participants: {booking.numberOfParticipants}</p>
                {booking.status !== 'Cancelled' && (
                  <button 
                    onClick={() => actions.cancelBooking(booking._id)}
                    className="cancel-btn"
                  >
                    Cancel Booking
                  </button>
                )}
              </div>
            ))}
          </div>
        );
      
      case 'donations':
        return (
          <div>
            <h2>My Donations</h2>
            {donations.map(donation => (
              <div key={donation._id} className="donation-card">
                <h4>LKR {donation.amount.value}</h4>
                <p>Category: {donation.category}</p>
                <p>Date: {new Date(donation.createdAt).toLocaleDateString()}</p>
                <p>Status: {donation.payment.status}</p>
              </div>
            ))}
          </div>
        );
      
      default:
        return <div>Select a tab</div>;
    }
  };

  return (
    <div className="tourist-page">
      <nav className="tab-nav">
        <button 
          onClick={() => setActiveTab('dashboard')} 
          className={activeTab === 'dashboard' ? 'active' : ''}
        >
          Dashboard
        </button>
        <button 
          onClick={() => setActiveTab('bookings')} 
          className={activeTab === 'bookings' ? 'active' : ''}
        >
          Bookings
        </button>
        <button 
          onClick={() => setActiveTab('donations')} 
          className={activeTab === 'donations' ? 'active' : ''}
        >
          Donations
        </button>
      </nav>
      
      <main className="tab-content">
        {renderTabContent()}
      </main>
    </div>
  );
};

export default TouristPage;
```

## Next Steps

1. **Import the services** into your existing components
2. **Replace direct API calls** with the service methods
3. **Use the React hooks** for state management
4. **Handle errors** using the provided error handler
5. **Test each functionality** with your backend

## Debugging and Testing

### Use the API Tester Component
```javascript
import TouristApiTester from '../components/TouristApiTester.jsx';

// Add this to your app for testing
<TouristApiTester />
```

### Console Debugging
```javascript
import { touristDebugger, debugHelpers } from '../services/touristDebugger.js';

// Setup console testing
debugHelpers.setupConsoleTest();

// Test specific functionality
await touristDebugger.testBooking('your-activity-id');
await touristDebugger.testEventRegistration('your-event-id');
await touristDebugger.runAllTests();
```

### Validation Testing
```javascript
import { testValidation } from '../services/touristDebugger.js';

// Test data validation
testValidation.booking({
  activityId: 'some-id',
  bookingDate: '2025-01-15',
  numberOfParticipants: 2
});
```

### Common Issues and Solutions

**Issue**: `numberOfParticipants` validation error
**Solution**: Ensure the value is sent as a number, not string
```javascript
// ❌ Wrong
{ numberOfParticipants: "2" }

// ✅ Correct
{ numberOfParticipants: 2 }
// or let the service handle conversion
{ numberOfParticipants: parseInt("2") }
```

**Issue**: Booking date validation error
**Solution**: Use proper date format (YYYY-MM-DD)
```javascript
// ❌ Wrong
{ bookingDate: "15/01/2025" }

// ✅ Correct
{ bookingDate: "2025-01-15" }
```

**Issue**: Activity/Event not found
**Solution**: Verify the ObjectId exists in your database
```javascript
// Use valid ObjectIds from your database
const activityId = "507f1f77bcf86cd799439011"; // Example
```

## File Structure
```
src/
├── services/
│   ├── touristService.js      # API service methods + validation
│   ├── touristDebugger.js     # Testing and debugging utilities
│   └── authService.js         # Updated with tourist endpoints
├── hooks/
│   └── useTourist.js          # React hooks for state management
├── components/
│   ├── TouristApiTester.jsx   # Debug/test component
│   └── examples/
│       └── TouristExamples.jsx # Example components
└── config/
    └── api.js                 # Updated API configuration
```

This integration provides a complete, type-safe, and user-friendly way to connect your frontend with all the tourist endpoints in your backend. **The validation issues have been fixed** with proper data type conversion and comprehensive validation functions.