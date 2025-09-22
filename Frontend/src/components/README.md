# Role-Based Access Control Components

This directory contains components and utilities for implementing role-based access control (RBAC) throughout the application.

## Components

### RoleGuard

A wrapper component that protects entire pages or large sections based on user roles.

**Usage:**
```jsx
import RoleGuard from '../components/RoleGuard';

// Protect a page for a specific role
<RoleGuard requiredRole="admin">
  <AdminDashboard />
</RoleGuard>

// Protect a page for multiple roles
<RoleGuard allowedRoles={['admin', 'vet', 'EmergencyOfficer']}>
  <MedicalDashboard />
</RoleGuard>

// With custom fallback
<RoleGuard 
  requiredRole="admin" 
  fallback={<CustomAccessDenied />}
>
  <AdminPanel />
</RoleGuard>
```

**Props:**
- `children`: Content to render when access is granted
- `allowedRoles`: Array of roles that can access the content
- `requiredRole`: Single role required to access the content
- `fallback`: Custom component to render when access is denied
- `showAccessDenied`: Whether to show the default access denied page (default: true)

### RoleBasedFeature

A component for conditional rendering of features within pages based on user roles.

**Usage:**
```jsx
import RoleBasedFeature from '../components/RoleBasedFeature';

// Hide feature for unauthorized users
<RoleBasedFeature requiredRole="admin">
  <button onClick={deleteUser}>Delete User</button>
</RoleBasedFeature>

// Show fallback for unauthorized users
<RoleBasedFeature 
  requiredRole="admin"
  fallback={<span className="text-gray-400">No permissions</span>}
  hideIfNoAccess={false}
>
  <button onClick={editUser}>Edit User</button>
</RoleBasedFeature>

// Multiple roles
<RoleBasedFeature allowedRoles={['admin', 'vet']}>
  <MedicalActions />
</RoleBasedFeature>
```

**Props:**
- `children`: Content to render when access is granted
- `allowedRoles`: Array of roles that can access the feature
- `requiredRole`: Single role required to access the feature
- `fallback`: Component to render when access is denied
- `hideIfNoAccess`: Whether to hide the feature completely when access is denied (default: true)

### AccessDenied

A standardized access denied page component.

**Usage:**
```jsx
import AccessDenied from '../components/AccessDenied';

<AccessDenied 
  requiredRole="admin"
  userRole="tourist"
  message="You need administrator privileges to access this page."
  showContactInfo={true}
/>
```

**Props:**
- `requiredRole`: The role required to access the page
- `userRole`: The user's current role
- `message`: Custom access denied message
- `showContactInfo`: Whether to show contact information (default: true)

## Hooks

### useRoleAccess

A hook that provides role-based access control utilities.

**Usage:**
```jsx
import useRoleAccess from '../hooks/useRoleAccess';

const MyComponent = () => {
  const { 
    userRole, 
    hasRole, 
    hasAnyRole, 
    canAccessAdmin,
    canManageUsers,
    getRoleNavigation,
    getDashboardFeatures 
  } = useRoleAccess();

  if (hasRole('admin')) {
    return <AdminFeatures />;
  }

  if (hasAnyRole(['vet', 'EmergencyOfficer'])) {
    return <MedicalFeatures />;
  }

  return <DefaultFeatures />;
};
```

**Returns:**
- `userRole`: Current user's role
- `hasRole(role)`: Check if user has specific role
- `hasAnyRole(roles)`: Check if user has any of the specified roles
- `canAccessAdmin()`: Check if user can access admin features
- `canManageUsers()`: Check if user can manage other users
- `canHandleEmergencies()`: Check if user can handle emergencies
- `canManageAnimalCases()`: Check if user can manage animal cases
- `canManageTours()`: Check if user can manage tours
- `canViewReports()`: Check if user can view reports
- `canMakeBookings()`: Check if user can make bookings
- `getRoleNavigation()`: Get role-specific navigation items
- `getDashboardFeatures()`: Get role-specific dashboard features

### useRoleBasedVisibility

A hook for conditional rendering based on roles.

**Usage:**
```jsx
import { useRoleBasedVisibility } from '../components/RoleBasedFeature';

const MyComponent = () => {
  const { canSee, userRole } = useRoleBasedVisibility();

  return (
    <div>
      <h1>Welcome, {userRole}!</h1>
      {canSee(['admin']) && <AdminPanel />}
      {canSee(['admin', 'vet']) && <MedicalPanel />}
      {canSee([], 'tourist') && <TouristPanel />}
    </div>
  );
};
```

## Role Definitions

The application supports the following roles:

- **admin**: Full system access, user management, system configuration
- **vet**: Animal case management, treatment tracking, medication inventory
- **tourist**: Activity booking, event registration, donations, feedback
- **EmergencyOfficer**: Emergency response, incident management, hospital coordination
- **callOperator**: Emergency call handling, case assignment, complaint management
- **safariDriver**: Tour assignments, vehicle management, fuel claims
- **tourGuide**: Tour assignments, client management, availability management
- **WildlifeOfficer**: Wildlife monitoring, conservation activities, field reporting

## Implementation Examples

### Dashboard Protection

```jsx
// pages/admin/AdminDashboard.jsx
import RoleGuard from '../../components/RoleGuard';

const AdminDashboard = () => {
  return (
    <RoleGuard requiredRole="admin">
      <div className="admin-dashboard">
        {/* Dashboard content */}
      </div>
    </RoleGuard>
  );
};
```

### Feature-Level Protection

```jsx
// Within a dashboard component
import RoleBasedFeature from '../../components/RoleBasedFeature';

const UserManagement = () => {
  return (
    <div>
      <h2>Users</h2>
      <RoleBasedFeature requiredRole="admin">
        <button onClick={createUser}>Create User</button>
      </RoleBasedFeature>
      
      <RoleBasedFeature 
        allowedRoles={['admin']}
        fallback={<span className="text-gray-400">View only</span>}
        hideIfNoAccess={false}
      >
        <button onClick={deleteUser}>Delete User</button>
      </RoleBasedFeature>
    </div>
  );
};
```

### Navigation Protection

```jsx
// components/Navbar.jsx
import useRoleAccess from '../hooks/useRoleAccess';

const Navbar = () => {
  const { getRoleNavigation } = useRoleAccess();
  const navigationItems = getRoleNavigation();

  return (
    <nav>
      {navigationItems.map(item => (
        <Link key={item.key} to={item.path}>
          {item.label}
        </Link>
      ))}
    </nav>
  );
};
```

## Testing

Role-based access control components include comprehensive tests:

- `RoleGuard.test.jsx`: Tests for page-level protection
- `RoleBasedFeature.test.jsx`: Tests for feature-level protection

Run tests with:
```bash
npm test -- --run components/__tests__/Role*
```

## Best Practices

1. **Use RoleGuard for page-level protection**: Wrap entire dashboard components with RoleGuard
2. **Use RoleBasedFeature for granular control**: Hide/show specific features within pages
3. **Provide meaningful fallbacks**: Show appropriate messages when access is denied
4. **Test role combinations**: Ensure all role scenarios are covered
5. **Keep role logic centralized**: Use the useRoleAccess hook for consistent role checking
6. **Document role requirements**: Clearly specify which roles can access which features
7. **Handle loading states**: Show appropriate loading indicators during authentication
8. **Graceful degradation**: Provide fallback content when features are not accessible

## Security Considerations

- **Frontend protection is not security**: Always validate permissions on the backend
- **Role verification**: Ensure roles are verified on every API request
- **Token validation**: Validate authentication tokens server-side
- **Audit logging**: Log role-based access attempts for security monitoring
- **Principle of least privilege**: Grant minimum necessary permissions for each role