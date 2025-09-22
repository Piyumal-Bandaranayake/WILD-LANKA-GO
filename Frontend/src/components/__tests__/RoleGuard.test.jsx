import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import RoleGuard from '../RoleGuard';
import { useAuthContext } from '../../contexts/AuthContext';

// Mock the AuthContext
vi.mock('../../contexts/AuthContext', () => ({
  useAuthContext: vi.fn()
}));

describe('RoleGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render children when user has required role', () => {
    useAuthContext.mockReturnValue({
      backendUser: { role: 'admin' },
      isLoading: false
    });

    render(
      <RoleGuard requiredRole="admin">
        <div>Admin Content</div>
      </RoleGuard>
    );

    expect(screen.getByText('Admin Content')).toBeInTheDocument();
  });

  it('should show access denied when user does not have required role', () => {
    useAuthContext.mockReturnValue({
      backendUser: { role: 'tourist' },
      isLoading: false
    });

    render(
      <RoleGuard requiredRole="admin">
        <div>Admin Content</div>
      </RoleGuard>
    );

    expect(screen.getByText('Access Denied')).toBeInTheDocument();
    expect(screen.getByText('This page is restricted to admin users only.')).toBeInTheDocument();
  });

  it('should render children when user has one of allowed roles', () => {
    useAuthContext.mockReturnValue({
      backendUser: { role: 'vet' },
      isLoading: false
    });

    render(
      <RoleGuard allowedRoles={['admin', 'vet', 'EmergencyOfficer']}>
        <div>Medical Content</div>
      </RoleGuard>
    );

    expect(screen.getByText('Medical Content')).toBeInTheDocument();
  });

  it('should show access denied when user does not have any allowed roles', () => {
    useAuthContext.mockReturnValue({
      backendUser: { role: 'tourist' },
      isLoading: false
    });

    render(
      <RoleGuard allowedRoles={['admin', 'vet', 'EmergencyOfficer']}>
        <div>Medical Content</div>
      </RoleGuard>
    );

    expect(screen.getByText('Access Denied')).toBeInTheDocument();
    expect(screen.getByText('This page is restricted to users with the following roles: admin, vet, EmergencyOfficer.')).toBeInTheDocument();
  });

  it('should show loading state when authentication is in progress', () => {
    useAuthContext.mockReturnValue({
      backendUser: null,
      isLoading: true
    });

    render(
      <RoleGuard requiredRole="admin">
        <div>Admin Content</div>
      </RoleGuard>
    );

    expect(screen.getByText('Verifying access permissions...')).toBeInTheDocument();
  });

  it('should show access denied when no user is authenticated', () => {
    useAuthContext.mockReturnValue({
      backendUser: null,
      isLoading: false
    });

    render(
      <RoleGuard requiredRole="admin">
        <div>Admin Content</div>
      </RoleGuard>
    );

    expect(screen.getByText('Access Denied')).toBeInTheDocument();
    expect(screen.getByText('You must be logged in to access this page.')).toBeInTheDocument();
  });

  it('should render fallback component when provided and access is denied', () => {
    useAuthContext.mockReturnValue({
      backendUser: { role: 'tourist' },
      isLoading: false
    });

    const fallback = <div>Custom Fallback</div>;

    render(
      <RoleGuard requiredRole="admin" fallback={fallback}>
        <div>Admin Content</div>
      </RoleGuard>
    );

    expect(screen.getByText('Custom Fallback')).toBeInTheDocument();
    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument();
  });

  it('should return null when showAccessDenied is false and access is denied', () => {
    useAuthContext.mockReturnValue({
      backendUser: { role: 'tourist' },
      isLoading: false
    });

    const { container } = render(
      <RoleGuard requiredRole="admin" showAccessDenied={false}>
        <div>Admin Content</div>
      </RoleGuard>
    );

    expect(container.firstChild).toBeNull();
  });
});