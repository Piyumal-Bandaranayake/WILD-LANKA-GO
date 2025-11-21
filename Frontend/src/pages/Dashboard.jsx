import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
// import { protectedApi } from '../services/authService'; // Removed - using new auth system
import ProtectedRoute from '../components/ProtectedRoute';
import ProfileImage from '../components/ProfileImage';
import Navbar from '../components/Navbar';
import Footer from '../components/footer';
import { API_BASE_URL } from '../config/api';

const Dashboard = () => {
    const { user } = useAuth();
    const [tours, setTours] = useState([]);
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);

                // Only fetch tours if user has permission (admin or wildlifeOfficer)
                const promises = [];
                
                if (user?.role === 'admin' || user?.role === 'wildlifeOfficer') {
                    promises.push(protectedApi.getTours());
                } else {
                    promises.push(Promise.resolve({ data: [] }));
                }
                
                promises.push(protectedApi.getActivities());

                const [toursResponse, activitiesResponse] = await Promise.all(promises);

                setTours(toursResponse.data || []);
                setActivities(activitiesResponse.data || []);
            } catch (error) {
                console.error('Failed to fetch dashboard data:', error);
                setError('Failed to load dashboard data');
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [user?.role]);

    const handleQuickDonate = async () => {
        try {
            const defaultAmount = 1000; // LKR
            const donorEmail = user?.email || user?.profile?.email || '';
            const donorName = user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Anonymous';
            const resp = await fetch(`${API_BASE_URL}/donations/create-checkout-session`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: defaultAmount,
                    currency: 'lkr',
                    donorEmail,
                    donorName,
                    isMonthly: false,
                }),
                credentials: 'include',
            });
            if (!resp.ok) {
                const err = await resp.json().catch(() => ({}));
                throw new Error(err?.message || 'Failed to start checkout');
            }
            const data = await resp.json();
            const url = data?.data?.url || data?.url;
            if (!url) throw new Error('No checkout URL');
            window.location.href = url;
        } catch (e) {
            alert(e.message || 'Could not start Stripe checkout');
        }
    };

    if (loading) {
        return (
            <ProtectedRoute>
                <div className="flex flex-col min-h-screen">
                    <Navbar />
                    <div className="flex-1 flex items-center justify-center pt-32">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                            <p className="mt-4 text-gray-600">Loading dashboard...</p>
                        </div>
                    </div>
                    <Footer />
                </div>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute>
            <div className="flex flex-col min-h-screen">
                <Navbar />
                <div className="flex-1 pt-32 pb-16">
                    <div className="container mx-auto px-4">
                        {/* Welcome Section */}
                        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg p-8 text-white mb-8">
                            <div className="flex items-center">
                                <ProfileImage
                                    src={user?.picture}
                                    alt={user?.name}
                                    fallbackText={user?.name}
                                    className="w-16 h-16 rounded-full border-4 border-white mr-6"
                                    />
                                <div>
                                    <h1 className="text-3xl font-bold">Welcome back, {user?.name}!</h1>
                                    <p className="text-green-100 mt-2">
                                        Role: {user?.role} | Last login: {new Date().toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                                <div className="flex">
                                    <div className="flex-shrink-0">
                                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm text-red-800">{error}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div className="bg-white rounded-lg shadow p-6">
                                <div className="flex items-center">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">Total Tours</p>
                                        <p className="text-2xl font-semibold text-gray-900">{tours.length}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow p-6">
                                <div className="flex items-center">
                                    <div className="p-2 bg-green-100 rounded-lg">
                                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">Activities</p>
                                        <p className="text-2xl font-semibold text-gray-900">{activities.length}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-lg shadow p-6">
                                <div className="flex items-center">
                                    <div className="p-2 bg-purple-100 rounded-lg">
                                        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">Account Type</p>
                                        <p className="text-2xl font-semibold text-gray-900 capitalize">{user?.role}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <button onClick={handleQuickDonate} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                                    <div className="text-emerald-600 mb-2">
                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 1.343-3 3 0 2.25 3 5 3 5s3-2.75 3-5c0-1.657-1.343-3-3-3zm0-6a9 9 0 100 18 9 9 0 000-18z" />
                                        </svg>
                                    </div>
                                    <h3 className="font-medium text-gray-900">Make Donation</h3>
                                    <p className="text-sm text-gray-600">Quick donate LKR 1,000 via Stripe</p>
                                </button>
                                <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                                    <div className="text-green-600 mb-2">
                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                    </div>
                                    <h3 className="font-medium text-gray-900">New Booking</h3>
                                    <p className="text-sm text-gray-600">Create a new tour booking</p>
                                </button>

                                <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                                    <div className="text-blue-600 mb-2">
                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <h3 className="font-medium text-gray-900">View Calendar</h3>
                                    <p className="text-sm text-gray-600">Check upcoming events</p>
                                </button>

                                <a href="/donation" className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left block">
                                    <div className="text-purple-600 mb-2">
                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                        </svg>
                                    </div>
                                    <h3 className="font-medium text-gray-900">Donate</h3>
                                    <p className="text-sm text-gray-600">Support wildlife conservation</p>
                                </a>

                                <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                                    <div className="text-red-600 mb-2">
                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                        </svg>
                                    </div>
                                    <h3 className="font-medium text-gray-900">Emergency</h3>
                                    <p className="text-sm text-gray-600">Report an emergency</p>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                <Footer />
            </div>
        </ProtectedRoute>
    );
};

export default Dashboard;
