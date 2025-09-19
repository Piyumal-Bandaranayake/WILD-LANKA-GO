# Wild Lanka Go - Role Management System Documentation

## Overview

This document provides comprehensive documentation for the role-based access control (RBAC) system implemented in Wild Lanka Go. The system provides secure, role-specific access to different functionalities across the application.

## Role Definitions

### 🔐 Available Roles

| Role | Code | Description | Access Level |
|------|------|-------------|--------------|
| **Administrator** | `admin` | Full system access and management | Level 10 |
| **Wildlife Officer** | `WildlifeOfficer` | Park operations and booking management | Level 8 |
| **Call Operator** | `callOperator` | Emergency call handling and routing | Level 7 |
| **Emergency Officer** | `EmergencyOfficer` | Emergency response and first-aid | Level 6 |
| **Veterinarian** | `vet` | Animal care and medical management | Level 5 |
| **Tour Guide** | `tourGuide` | Tour management and material handling | Level 4 |
| **Safari Driver** | `safariDriver` | Vehicle operations and fuel management | Level 4 |
| **Tourist** | `tourist` | Activity booking and service access | Level 1 |

## Dashboard Features by Role

### 🦁 Wild Park Officer Dashboard
**Route:** `/dashboard/wildlife-officer`

**Core Features:**
- **Bookings Management**
  - View all tourist bookings
  - Assign drivers from available pool
  - Assign tour guides (when requested)
  - Daily task tracking for assignments

- **Complaints Handling**
  - View, delete, and reply to complaints
  - Mark complaints as "In-Review" or "Resolved"
  - Generate complaint reports
  - Track complaint resolution times

- **Job Applications**
  - Review driver and tour guide applications
  - Approve or reject applications
  - Forward approved applications to admin
  - Maintain workforce records

- **Fuel Claims**
  - Review submitted fuel claims from drivers
  - Approve or reject claims with one-click
  - Track claim amounts and distances
  - Generate fuel expense reports

- **Monthly Reports**
  - Income from bookings and tours
  - Fuel claim expenses
  - Overall financial performance
  - Export as PDF for records

### 🧳 Tourist Portal
**Route:** `/dashboard/tourist`

**Core Features:**
- **Account Management**
  - Secure registration and login
  - Profile management
  - Preference settings

- **Activity Bookings**
  - Browse available activities with date selection
  - Check slot availability in real-time
  - Book with specified number of participants
  - Optional tour guide requests (+$25)
  - **Important:** Bookings cannot be updated or cancelled once confirmed

- **Event Registrations**
  - Register for events based on available slots
  - Modify participant numbers after registration
  - Cancel registrations (flexible unlike activity bookings)
  - Track registration history

- **Donations**
  - Make online donations of any amount
  - Add/update donation messages
  - View complete donation history
  - **Note:** Donations cannot be cancelled once made

- **Feedback & Complaints**
  - Submit feedback with ratings (1-5 stars)
  - Edit and delete own feedback
  - View other tourists' public feedback
  - Submit, edit, and delete complaints

- **Emergency Reporting**
  - Report emergencies during stay
  - Categorized by type (Medical, Animal, Fire, etc.)
  - GPS location integration
  - Direct routing to Emergency Officer dashboard

### 🎯 Tour Guide Dashboard
**Route:** `/dashboard/tour-guide`

**Core Features:**
- **Profile Management**
  - View and update personal profile
  - Display tourist ratings and reviews
  - Track availability status

- **Tour Assignment Panel**
  - Receive notifications for new assignments
  - Accept tours (marks as unavailable)
  - Reject tours with reason (Officer notified for reassignment)
  - View tour details and tourist information

- **Tour Progress Tracker**
  - Download tour materials before starting
  - Track tour status: Start → Break → End
  - Update availability after tour completion
  - Real-time status updates

- **Tour Materials Section**
  - Upload visual/audio materials for tours
  - Download existing tour materials
  - Delete old or outdated materials
  - Organize materials by type and date

- **Tour Reports**
  - Generate weekly/monthly reports
  - Include tour history, feedback, and ratings
  - Export performance summaries
  - Track improvement metrics

### 🚗 Safari Driver Dashboard
**Route:** `/dashboard/safari-driver`

**Core Features:**
- **Profile Management**
  - View and edit personal details
  - Display tourist ratings
  - Availability status management

- **Tour Assignment Panel**
  - Receive assignment notifications
  - Accept tours with odometer readings
  - Reject tours with detailed reasons
  - View pickup/destination details

- **Odometer Tracking & Fuel Claims**
  - **On Tour Start:** Upload start odometer photo + reading
  - **On Tour End:** Upload end odometer photo + reading
  - **Auto-calculation:** System calculates distance and fuel cost
  - **Claim Submission:** Per tour, weekly, or monthly options
  - **Approval Required:** Officer must approve for reimbursement

- **Fuel Claim Status**
  - View pending, approved, and rejected claims
  - Detailed breakdown of kilometers and costs
  - Track reimbursement history
  - Download claim summaries

- **Tour History**
  - Complete log of past tours
  - Generate downloadable reports (weekly/monthly)
  - Fuel claim summary integration
  - Performance analytics

### 🏥 Veterinarian Dashboard
**Route:** `/dashboard/vet`

**Core Features:**
- **Animal Case Management**
  - Register new animal cases with auto-generated IDs
  - Track species, sex, age, condition details
  - Upload multiple images (injuries, scans, x-rays)
  - Manage case status: New → In Treatment → Recovered/Deceased/Transferred
  - Advanced filtering and search capabilities

- **Treatment Plan Management**
  - Create detailed diagnosis and medication plans
  - Track dosage and treatment steps
  - Add surgeries and attach medical reports
  - Log veterinary notes and progress
  - Status tracking: Ongoing, Completed, Paused
  - Attach additional medical documentation

- **Medication Inventory Management**
  - Add new medication stock with batch tracking
  - Auto-deduction when medications are used
  - Low stock and expiry date alerts
  - Submit restock requests to Wildlife Officer
  - Comprehensive inventory logging

- **Vet Collaboration Tools**
  - Share case access with other veterinarians
  - Transfer cases for second opinions
  - Comment system for inter-vet communication
  - Collaboration history tracking
  - Specialized case assignments

- **Reports & Exports**
  - Individual case reports with treatment process (PDF)
  - Weekly/monthly treatment logs
  - Medication usage reports
  - Veterinary activity summaries
  - Recovery rate analytics

### 📞 Call Operator Dashboard
**Route:** `/dashboard/call-operator`

**Core Features:**
- **Emergency Handling**
  - Receive emergencies via direct calls
  - Categorize emergencies:
    - **Human-related** → Forward to Emergency Officer
    - **Animal-related** → Forward to Wildlife Officer
    - **Unethical-related** → Forward to Wildlife Officer
    - **Physical emergencies** → Handle via forms

- **Emergency Forwarding System**
  - Identify available officers before forwarding
  - Share location, incident details, and conditions
  - Track response times and outcomes
  - Maintain emergency database records

- **Emergency Form Management**
  - Handle physical emergency forms from tourists
  - Reply to form submissions
  - Escalate major damages to Wildlife Officer
  - Track form response times

- **Complaint Management**
  - View complaints submitted by tourists/visitors
  - See Wildlife Officer replies
  - Track complaint resolution status
  - Generate complaint reports

- **Daily Operations Summary**
  - Total emergencies received today
  - Emergencies by category breakdown
  - Pending vs resolved emergency counts
  - Response time analytics

### 🚨 Emergency Officer Dashboard
**Route:** `/dashboard/emergency-officer`

**Core Features:**
- **Emergency Response**
  - Receive human-related emergencies from Call Operator
  - Track emergency locations with GPS integration
  - Respond on-site to emergency situations
  - Real-time status updates during response

- **First-Aid Management**
  - Provide first-aid updates to patient crew
  - Document medical interventions
  - Track patient vital signs and condition
  - Coordinate with medical facilities

- **Hospital Coordination**
  - Identify critical health conditions
  - Coordinate with nearest hospitals
  - Track ambulance dispatch and arrival
  - Maintain hospital communication logs

- **Response Documentation**
  - Generate detailed emergency response reports
  - Track response times and outcomes
  - Document lessons learned
  - Maintain response protocol compliance

### 👑 Admin Dashboard
**Route:** `/dashboard/admin`

**Core Features:**
- **Activity Management**
  - Create new activities with pricing and duration
  - Set daily slot availability
  - Edit and delete existing activities
  - Monitor real-time slot reductions from bookings
  - Track activity popularity and revenue

- **Event Management**
  - Create events with fixed capacity and pricing
  - Set registration deadlines and requirements
  - Edit and delete current events
  - Monitor registration progress
  - Track event profitability

- **User Management**
  - View all tourist accounts and details
  - Delete tourist accounts when necessary
  - Create accounts for approved drivers/guides
  - Process Wildlife Officer application approvals
  - Maintain user database integrity

- **Donation Management**
  - View all donations with donor details
  - Track donation amounts, dates, and methods
  - Generate donation reports and analytics
  - Monitor donation trends and patterns
  - Maintain donor privacy and records

- **System Oversight**
  - View all feedback and complaints for insights
  - Monitor system-wide performance metrics
  - Generate comprehensive reports
  - Track user engagement and satisfaction
  - Maintain system security and compliance

## Technical Implementation

### Frontend Architecture

#### 1. Role-Based Routing
```javascript
// App.jsx
<Route path="/dashboard" element={<RoleDashboardRouter />} />
<Route path="/dashboard/admin" element={<AdminDashboard />} />
<Route path="/dashboard/wildlife-officer" element={<WildlifeOfficerDashboard />} />
// ... other role-specific routes
```

#### 2. Protected Route Component
```javascript
// ProtectedRoute.jsx
<ProtectedRoute allowedRoles={['admin', 'WildlifeOfficer']}>
  <SensitiveComponent />
</ProtectedRoute>
```

#### 3. Permission Management
```javascript
// usePermissions hook
const { hasPermission, isAdmin, canAccessRoute } = usePermissions();

// Permission Guard component
<PermissionGuard permissions="view_complaints">
  <ComplaintsList />
</PermissionGuard>
```

### Backend Architecture

#### 1. Role Middleware
```javascript
// Enhanced role middleware with detailed error messages
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    // Admin has access to everything
    if (req.user.role === 'admin') return next();

    // Check specific role permissions
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: 'Insufficient permissions',
        userRole: req.user.role,
        requiredRoles: allowedRoles
      });
    }
    next();
  };
};
```

#### 2. Route Protection Examples
```javascript
// Protect routes with role requirements
router.get('/bookings', authMiddleware, authorizeRoles('admin', 'WildlifeOfficer'), getBookings);
router.post('/emergency', authMiddleware, authorizeRoles('tourist', 'callOperator'), createEmergency);
```

## Security Features

### 1. Authentication Flow
- **Auth0 Integration:** Secure OAuth2 authentication
- **JWT Tokens:** Stateless authentication with refresh capability
- **Backend Validation:** Double verification of user identity
- **Role Assignment:** Secure role assignment during registration

### 2. Authorization Layers
- **Route Level:** Protected routes with role requirements
- **Component Level:** Conditional rendering based on permissions
- **API Level:** Backend endpoint protection
- **Data Level:** User can only access their own data (with admin override)

### 3. Role Hierarchy
- **Admin Override:** Admin role has access to all system functions
- **Level-Based Access:** Higher level roles can manage lower level roles
- **Principle of Least Privilege:** Users only get minimum required permissions
- **Audit Trail:** All role-based actions are logged for security

## Permission Matrix

| Function | Admin | Wildlife Officer | Call Operator | Emergency Officer | Vet | Tour Guide | Safari Driver | Tourist |
|----------|-------|------------------|---------------|-------------------|-----|------------|---------------|---------|
| View All Bookings | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Assign Drivers | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Handle Emergencies | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage Animal Cases | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Book Activities | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Submit Fuel Claims | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Approve Fuel Claims | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Generate Reports | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |

## API Endpoints by Role

### Wildlife Officer Endpoints
```
GET    /api/bookings              - View all bookings
POST   /api/bookings/assign       - Assign driver/guide
GET    /api/complaints            - View complaints
PUT    /api/complaints/:id        - Update complaint status
GET    /api/applications          - View job applications
PUT    /api/applications/:id      - Approve/reject applications
GET    /api/fuel-claims           - View fuel claims
PUT    /api/fuel-claims/:id       - Approve/reject claims
GET    /api/reports/monthly       - Generate monthly reports
```

### Tourist Endpoints
```
GET    /api/activities            - View available activities
POST   /api/bookings              - Book activities
GET    /api/events                - View events
POST   /api/event-registrations   - Register for events
POST   /api/donations             - Make donations
GET    /api/my-donations          - View donation history
POST   /api/feedback              - Submit feedback
POST   /api/complaints            - Submit complaints
POST   /api/emergencies           - Report emergencies
```

### Driver Endpoints
```
GET    /api/tours/assigned        - View assigned tours
PUT    /api/tours/:id/accept      - Accept tour assignment
PUT    /api/tours/:id/reject      - Reject tour assignment
POST   /api/odometer-readings     - Submit odometer readings
POST   /api/fuel-claims           - Submit fuel claims
GET    /api/fuel-claims/status    - View claim status
GET    /api/reports/driver        - Generate driver reports
```

## Testing the Role Management System

### 1. Authentication Testing
```bash
# Test user authentication
curl -H "Authorization: Bearer <token>" http://localhost:5001/api/test/auth

# Test role verification
curl -H "Authorization: Bearer <token>" http://localhost:5001/api/test/role
```

### 2. Role-Based Access Testing

#### Admin Access Test
```bash
# Should succeed - Admin can access everything
curl -H "Authorization: Bearer <admin_token>" \
     http://localhost:5001/api/admin/users

# Should succeed - Admin can manage bookings
curl -H "Authorization: Bearer <admin_token>" \
     http://localhost:5001/api/bookings
```

#### Tourist Access Test
```bash
# Should succeed - Tourist can book activities
curl -X POST -H "Authorization: Bearer <tourist_token>" \
     -H "Content-Type: application/json" \
     -d '{"activityId":"123","date":"2024-01-15","participants":2}' \
     http://localhost:5001/api/bookings

# Should fail - Tourist cannot access admin functions
curl -H "Authorization: Bearer <tourist_token>" \
     http://localhost:5001/api/admin/users
```

#### Wildlife Officer Access Test
```bash
# Should succeed - Officer can view bookings
curl -H "Authorization: Bearer <officer_token>" \
     http://localhost:5001/api/bookings

# Should succeed - Officer can assign drivers
curl -X PUT -H "Authorization: Bearer <officer_token>" \
     -H "Content-Type: application/json" \
     -d '{"driverId":"456"}' \
     http://localhost:5001/api/bookings/123/assign-driver
```

### 3. Frontend Role Testing

#### Dashboard Routing Test
1. Login as Tourist → Should redirect to `/dashboard/tourist`
2. Login as Admin → Should redirect to `/dashboard/admin`
3. Login as Wildlife Officer → Should redirect to `/dashboard/wildlife-officer`

#### Component Visibility Test
```javascript
// Test permission-based component rendering
const TestPermissions = () => {
  return (
    <div>
      <PermissionGuard permissions="view_complaints">
        <div>Only visible to officers and admins</div>
      </PermissionGuard>

      <RoleGuard roles="tourist">
        <div>Only visible to tourists</div>
      </RoleGuard>

      <AdminOnly>
        <div>Only visible to admins</div>
      </AdminOnly>
    </div>
  );
};
```

## Troubleshooting Common Issues

### 1. "Access Denied" Errors
**Problem:** User gets 403 Forbidden errors
**Solutions:**
- Verify user role in database matches expected role
- Check if middleware is properly applied to routes
- Ensure JWT token includes role information
- Verify role spelling and case sensitivity

### 2. Dashboard Not Loading
**Problem:** Role-specific dashboard doesn't render
**Solutions:**
- Check if user is fully authenticated (both Auth0 and backend)
- Verify RoleDashboardRouter is correctly importing dashboard components
- Check browser console for JavaScript errors
- Verify API endpoints are responding correctly

### 3. Permission Components Not Working
**Problem:** PermissionGuard components not showing/hiding content
**Solutions:**
- Verify usePermissions hook is returning correct role information
- Check if permissions are correctly defined in roleUtils.js
- Ensure AuthContext is providing backendUser data
- Test with different user roles to isolate the issue

### 4. Backend Route Protection Issues
**Problem:** Protected routes allow unauthorized access
**Solutions:**
- Verify authMiddleware is applied before authorizeRoles
- Check if JWT token is being passed correctly in headers
- Ensure authorizeRoles middleware is imported and used correctly
- Test middleware with logging to debug role checking

## Best Practices

### 1. Security Best Practices
- Always validate user roles on both frontend and backend
- Use principle of least privilege (minimum required permissions)
- Implement proper error handling without exposing sensitive information
- Regularly audit role assignments and permissions
- Use HTTPS in production for secure token transmission

### 2. Development Best Practices
- Use TypeScript for better type safety with roles and permissions
- Implement comprehensive testing for all role scenarios
- Document role requirements for each component and route
- Use consistent naming conventions for roles and permissions
- Implement logging for security events and role changes

### 3. User Experience Best Practices
- Provide clear feedback when access is denied
- Show appropriate navigation based on user role
- Implement graceful degradation for missing permissions
- Provide contextual help for role-specific features
- Ensure responsive design works across all dashboards

## Future Enhancements

### 1. Advanced Role Features
- **Multi-Role Support:** Users with multiple roles simultaneously
- **Temporary Role Elevation:** Temporary admin access for specific tasks
- **Role Scheduling:** Time-based role assignments
- **Delegation:** Ability to delegate specific permissions temporarily

### 2. Enhanced Security
- **Two-Factor Authentication:** Additional security layer for sensitive roles
- **Session Management:** Advanced session control and timeout
- **Audit Logging:** Comprehensive audit trail for all actions
- **Risk Assessment:** Automated risk scoring for user actions

### 3. Performance Optimizations
- **Role Caching:** Cache user roles and permissions for better performance
- **Lazy Loading:** Load dashboard components only when needed
- **Permission Preloading:** Preload permission data for faster rendering
- **API Optimization:** Optimize API calls based on user permissions

This documentation provides a comprehensive guide to understanding, implementing, and maintaining the role management system in Wild Lanka Go. Regular updates to this documentation should be made as the system evolves.