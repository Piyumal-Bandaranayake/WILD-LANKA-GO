import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import RoleBasedFeature, { useRoleBasedVisibility } from '../RoleBasedFeature';
import { useAuthContext } from '../../contexts/AuthContext';

// Mock the AuthContext and useRoleAccess
vi.mock('../../contexts/AuthContext', () => ({
  useAuthContext: vi.fn()
}));

vi.mock('../../hooks/useRoleAccess', () => ({
  default: vi.fn(() => ({
    hasRole: vi.fn(),
    hasAnyRole: vi.fn()
  }))
}));

describe('RoleBasedFeature', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render children when user has required role', () => {
    useAuthContext.mockReturnValue({
      backendUser: { role: 'admin' }
    });

    const mockUseRoleAccess = require('../../hooks/useRoleAccess').default;
    mockUseRoleAccess.mockReturnValue({
      hasRole: vi.fn((role) => role === 'admin'),
      hasAnyRole: vi.fn()
    });

    render(
      <RoleBasedFeature requiredRole="admin">
        <div>Admin Feature</div>
      </RoleBasedFeature>
    );

    expect(screen.getByText('Admin Feature')).toBeInTheDocument();
  });

  it('should not render children when user does not have required role', () => {
    useAuthContext.mockReturnValue({
      backendUser: { role: 'tourist' }
    });

    const mockUseRoleAccess = require('../../hooks/useRoleAccess').default;
    mockUseRoleAccess.mockReturnValue({
      hasRole: vi.fn((role) => role === 'tourist'),
      hasAnyRole: vi.fn()
    });

    render(
      <RoleBasedFeature requiredRole="admin">
        <div>Admin Feature</div>
      </RoleBasedFeature>
    );

    expect(screen.queryByText('Admin Feature')).not.toBeInTheDocument();
  });

  it('should render children when user has one of allowed roles', () => {
    useAuthContext.mockReturnValue({
      backendUser: { role: 'vet' }
    });

    const mockUseRoleAccess = require('../../hooks/useRoleAccess').default;
    mockUseRoleAccess.mockReturnValue({
      hasRole: vi.fn(),
      hasAnyRole: vi.fn((roles) => roles.includes('vet'))
    });

    render(
      <RoleBasedFeature allowedRoles={['admin', 'vet']}>
        <div>Medical Feature</div>
      </RoleBasedFeature>
    );

    expect(screen.getByText('Medical Feature')).toBeInTheDocument();
  });

  it('should render fallback when provided and access is denied', () => {
    useAuthContext.mockReturnValue({
      backendUser: { role: 'tourist' }
    });

    const mockUseRoleAccess = require('../../hooks/useRoleAccess').default;
    mockUseRoleAccess.mockReturnValue({
      hasRole: vi.fn(() => false),
      hasAnyRole: vi.fn(() => false)
    });

    render(
      <RoleBasedFeature 
        requiredRole="admin" 
        fallback={<div>No Access</div>}
        hideIfNoAccess={false}
      >
        <div>Admin Feature</div>
      </RoleBasedFeature>
    );

    expect(screen.getByText('No Access')).toBeInTheDocument();
    expect(screen.queryByText('Admin Feature')).not.toBeInTheDocument();
  });

  it('should not render anything when no user is authenticated', () => {
    useAuthContext.mockReturnValue({
      backendUser: null
    });

    const { container } = render(
      <RoleBasedFeature requiredRole="admin">
        <div>Admin Feature</div>
      </RoleBasedFeature>
    );

    expect(container.firstChild).toBeNull();
  });
});

describe('useRoleBasedVisibility', () => {
  it('should return correct visibility for user role', () => {
    useAuthContext.mockReturnValue({
      backendUser: { role: 'admin' }
    });

    const mockUseRoleAccess = require('../../hooks/useRoleAccess').default;
    mockUseRoleAccess.mockReturnValue({
      hasRole: vi.fn((role) => role === 'admin'),
      hasAnyRole: vi.fn((roles) => roles.includes('admin'))
    });

    const TestComponent = () => {
      const { canSee, userRole } = useRoleBasedVisibility();
      
      return (
        <div>
          <div>User Role: {userRole}</div>
          <div>Can See Admin: {canSee([], 'admin') ? 'Yes' : 'No'}</div>
          <div>Can See Tourist: {canSee([], 'tourist') ? 'Yes' : 'No'}</div>
        </div>
      );
    };

    render(<TestComponent />);

    expect(screen.getByText('User Role: admin')).toBeInTheDocument();
    expect(screen.getByText('Can See Admin: Yes')).toBeInTheDocument();
    expect(screen.getByText('Can See Tourist: No')).toBeInTheDocument();
  });
});