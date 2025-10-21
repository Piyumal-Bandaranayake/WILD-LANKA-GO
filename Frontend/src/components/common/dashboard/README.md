# Standardized Dashboard System

This directory contains standardized components for creating consistent dashboard experiences across all role-based dashboards in the Wild Lanka application.

## Components Overview

### Core Layout Components

- **DashboardLayout**: Main layout wrapper with navbar and footer
- **DashboardHeader**: Consistent greeting banner with role-specific styling
- **DashboardSidebar**: Navigation sidebar with role-appropriate menu items
- **DashboardGrid**: 3-column responsive grid layout (sidebar, main, right panel)

### UI Components

- **StatCard**: Standardized metric display cards
- **TabNavigation**: Consistent tab interface
- **ActionButton**: Standardized button with variants
- **DataTable**: Responsive data table with loading and empty states
- **ErrorMessage**: Consistent error display with retry functionality
- **LoadingSpinner**: Standardized loading states

## Usage Examples

### Basic Dashboard Structure

```jsx
import React from 'react';
import { 
  DashboardLayout, 
  DashboardHeader, 
  DashboardSidebar, 
  DashboardGrid,
  StatCard, 
  LoadingSpinner, 
  ErrorMessage 
} from '../../components/common/dashboard';
import { useDashboard } from '../../hooks/useDashboard';
import { getDashboardConfig, getGreetingMessage } from '../../utils/dashboardUtils';

const MyRoleDashboard = () => {
  const { backendUser, user } = useAuthContext();
  const { activeTab, setActiveTab, loading, error, handleError } = useDashboard('overview');
  
  // Get role-specific configuration
  const dashboardConfig = getDashboardConfig('myRole');
  const { greeting, subtitle } = getGreetingMessage(user?.name, 'myRole', stats);

  if (loading) {
    return (
      <RoleGuard requiredRole="myRole">
        <LoadingSpinner message="Loading dashboard..." />
      </RoleGuard>
    );
  }

  return (
    <RoleGuard requiredRole="myRole">
      <DashboardLayout>
        {/* Header */}
        <DashboardHeader
          userName={user?.name}
          userRole="My Role"
          greeting={greeting}
          subtitle={subtitle}
          bgColor={dashboardConfig.colors.primary}
          onActionClick={() => setActiveTab('main-action')}
        />

        {/* Error Display */}
        {error && <ErrorMessage message={error} onRetry={fetchData} />}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Total Items"
            value={stats.total}
            color="blue"
            iconPath="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </div>

        {/* Main Content Grid */}
        <DashboardGrid
          sidebar={
            <DashboardSidebar
              title={dashboardConfig.title}
              icon={dashboardConfig.colors.icon}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              menuItems={dashboardConfig.navigation}
            />
          }
          main={
            <div>
              {/* Main dashboard content */}
            </div>
          }
          rightPanel={
            <div>
              {/* Optional right panel content */}
            </div>
          }
        />
      </DashboardLayout>
    </RoleGuard>
  );
};
```

### Using StatCard

```jsx
<StatCard
  title="Active Cases"
  value={42}
  color="green"
  iconPath="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
  subtitle="Last 30 days"
  trend={{ direction: 'up', value: '+12%' }}
  onClick={() => setActiveTab('cases')}
/>
```

### Using DataTable

```jsx
const columns = [
  { key: 'name', title: 'Name' },
  { key: 'status', title: 'Status', render: (status) => (
    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(status)}`}>
      {status}
    </span>
  )},
  { key: 'date', title: 'Date', render: (date) => formatDate(date) }
];

<DataTable
  columns={columns}
  data={items}
  loading={loading}
  emptyMessage="No items found"
  onRowClick={(item) => handleItemClick(item)}
/>
```

### Using TabNavigation

```jsx
const tabs = [
  { key: 'overview', label: 'Overview', icon: '📊' },
  { key: 'details', label: 'Details', icon: '📋', count: 5 }
];

<TabNavigation
  tabs={tabs}
  activeTab={activeTab}
  onTabChange={setActiveTab}
  variant="pills"
/>
```

## Configuration

### Dashboard Colors

Each role has predefined colors in `dashboardConfig.js`:

```javascript
export const DASHBOARD_COLORS = {
  admin: {
    primary: 'bg-indigo-600',
    secondary: 'bg-indigo-50',
    accent: 'text-indigo-700',
    icon: 'H'
  },
  // ... other roles
};
```

### Navigation Items

Role-specific navigation is defined in `DASHBOARD_NAVIGATION`:

```javascript
export const DASHBOARD_NAVIGATION = {
  admin: [
    { key: 'overview', label: 'Dashboard', icon: DASHBOARD_ICONS.overview },
    { key: 'users', label: 'Users', icon: DASHBOARD_ICONS.users },
    // ... other items
  ]
};
```

## Responsive Design

All components are built with responsive design in mind:

- **Mobile First**: Components stack vertically on mobile
- **Breakpoints**: Uses Tailwind's responsive prefixes (sm, md, lg, xl)
- **Flexible Grids**: Grid layouts adapt to screen size
- **Touch Friendly**: Buttons and interactive elements are appropriately sized

### Responsive Utilities

Use `ResponsiveContainer` for custom responsive behavior:

```jsx
<ResponsiveContainer 
  breakpoint="md" 
  mobileLayout="scroll"
  className="overflow-x-auto"
>
  <DataTable columns={columns} data={data} />
</ResponsiveContainer>
```

## Hooks

### useDashboard

Provides standardized state management:

```jsx
const { 
  activeTab, 
  setActiveTab, 
  loading, 
  setLoading, 
  error, 
  handleError,
  data,
  updateData 
} = useDashboard('overview');
```

### useDashboardStats

Manages statistics with auto-refresh:

```jsx
const { stats, loading, error, refresh } = useDashboardStats(
  fetchStatsFunction,
  30000 // refresh every 30 seconds
);
```

## Utilities

### Dashboard Utils

- `getDashboardConfig(role)`: Get role-specific configuration
- `getGreetingMessage(userName, role, stats)`: Generate greeting
- `formatStatValue(value, type)`: Format numbers for display
- `getStatusColor(status)`: Get status badge colors
- `formatDate(date, format)`: Format dates consistently

## Best Practices

1. **Consistent Loading States**: Always use `LoadingSpinner` for loading states
2. **Error Handling**: Use `ErrorMessage` with retry functionality
3. **Responsive Design**: Test on mobile devices and use responsive utilities
4. **Accessibility**: Ensure proper ARIA labels and keyboard navigation
5. **Performance**: Use React.memo for expensive components
6. **Type Safety**: Add PropTypes or TypeScript for better development experience

## Migration Guide

To migrate existing dashboards to the standardized system:

1. Replace custom layout with `DashboardLayout`
2. Use `DashboardHeader` instead of custom headers
3. Replace stat cards with `StatCard` component
4. Use `DashboardSidebar` for navigation
5. Implement `useDashboard` hook for state management
6. Use utility functions for consistent formatting

## Testing

Components include proper test IDs and ARIA labels for testing:

```jsx
// Example test
test('renders dashboard with correct stats', () => {
  render(<MyDashboard />);
  expect(screen.getByTestId('stat-card-total')).toHaveTextContent('42');
});
```