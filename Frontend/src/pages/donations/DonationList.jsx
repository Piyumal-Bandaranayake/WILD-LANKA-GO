import React, { useState, useEffect } from 'react';
import { protectedApi } from '../../services/authService';
import { useAuthContext } from '../../contexts/AuthContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/footer';

const DonationList = () => {
    const { backendUser, user } = useAuthContext();
    const [donations, setDonations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showDonateModal, setShowDonateModal] = useState(false);
    const [stats, setStats] = useState({
        totalAmount: 0,
        totalDonations: 0,
        monthlyAmount: 0
    });

    const [newDonation, setNewDonation] = useState({
        amount: '',
        message: '',
        isAnonymous: false
    });

    useEffect(() => {
        fetchDonations();
    }, []);

    const fetchDonations = async () => {
        try {
            setLoading(true);
            const response = await protectedApi.getDonations();
            const donationsData = response.data || [];
            setDonations(donationsData);

            // Calculate stats
            const totalAmount = donationsData.reduce((sum, donation) => sum + (donation.amount || 0), 0);
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();
            const monthlyAmount = donationsData
                .filter(donation => {
                    const donationDate = new Date(donation.createdAt);
                    return donationDate.getMonth() === currentMonth && donationDate.getFullYear() === currentYear;
                })
                .reduce((sum, donation) => sum + (donation.amount || 0), 0);

            setStats({
                totalAmount,
                totalDonations: donationsData.length,
                monthlyAmount
            });
        } catch (error) {
            console.error('Failed to fetch donations:', error);
            setError('Failed to load donations');
        } finally {
            setLoading(false);
        }
    };

    const handleDonate = async (e) => {
        e.preventDefault();
        try {
            const donationData = {
                amount: parseFloat(newDonation.amount),
                message: newDonation.message,
                donorName: newDonation.isAnonymous ? 'Anonymous' : (user?.name || 'Anonymous'),
                donorEmail: newDonation.isAnonymous ? '' : (user?.email || ''),
                isAnonymous: newDonation.isAnonymous
            };

            await protectedApi.createDonation(donationData);
            setShowDonateModal(false);
            setNewDonation({
                amount: '',
                message: '',
                isAnonymous: false
            });
            fetchDonations();
        } catch (error) {
            console.error('Failed to process donation:', error);
            setError('Failed to process donation');
        }
    };

    const handleUpdateDonation = async (donationId, updatedMessage) => {
        try {
            await protectedApi.updateDonation(donationId, { message: updatedMessage });
            fetchDonations();
        } catch (error) {
            console.error('Failed to update donation:', error);
            setError('Failed to update donation');
        }
    };

    const isAdminOrOfficer = ['admin', 'wildlifeOfficer'].includes(backendUser?.role);

    if (loading) {
        return (
            <div className="flex flex-col min-h-screen">
                <Navbar />
                <div className="flex-1 flex items-center justify-center pt-32">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading donations...</p>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen">
            <Navbar />
            <div className="flex-1 pt-32 pb-16">
                <div className="container mx-auto px-4">
                    {/* Header */}
                    <div className="text-center mb-12">
                        <h1 className="text-4xl font-bold text-gray-800 mb-4">Support Wildlife Conservation</h1>
                        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                            Your donations help protect Sri Lanka's incredible wildlife and support conservation efforts
                            in our national parks. Every contribution makes a difference in preserving our natural heritage.
                        </p>
                    </div>

                    {/* Stats Section */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-6 text-center">
                            <div className="text-3xl font-bold">${stats.totalAmount.toLocaleString()}</div>
                            <div className="text-green-100">Total Raised</div>
                        </div>
                        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-6 text-center">
                            <div className="text-3xl font-bold">{stats.totalDonations}</div>
                            <div className="text-blue-100">Total Donations</div>
                        </div>
                        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg p-6 text-center">
                            <div className="text-3xl font-bold">${stats.monthlyAmount.toLocaleString()}</div>
                            <div className="text-purple-100">This Month</div>
                        </div>
                    </div>

                    {/* Donate Button */}
                    <div className="text-center mb-8">
                        <button
                            onClick={() => setShowDonateModal(true)}
                            className="bg-green-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-green-700 transition-colors shadow-lg"
                        >
                            Make a Donation
                        </button>
                    </div>

                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                            {error}
                        </div>
                    )}

                    {/* Recent Donations */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">Recent Donations</h2>

                        {donations.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-gray-500 text-lg">No donations yet. Be the first to contribute!</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {donations.map((donation) => (
                                    <div key={donation._id} className="border-l-4 border-green-500 bg-green-50 p-4 rounded-r-lg">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-4 mb-2">
                                                    <span className="font-semibold text-green-800">
                                                        {donation.donorName || 'Anonymous'}
                                                    </span>
                                                    <span className="text-2xl font-bold text-green-600">
                                                        ${donation.amount?.toLocaleString()}
                                                    </span>
                                                    <span className="text-sm text-gray-500">
                                                        {new Date(donation.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                {donation.message && (
                                                    <p className="text-gray-700 italic">"{donation.message}"</p>
                                                )}
                                            </div>
                                            {isAdminOrOfficer && (
                                                <div className="text-sm text-gray-500">
                                                    {donation.donorEmail && (
                                                        <p>Email: {donation.donorEmail}</p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Impact Information */}
                    <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-800 mb-2">Wildlife Protection</h3>
                            <p className="text-gray-600">Your donations help protect endangered species and their habitats.</p>
                        </div>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-800 mb-2">Research & Education</h3>
                            <p className="text-gray-600">Support scientific research and educational programs about conservation.</p>
                        </div>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-800 mb-2">Community Support</h3>
                            <p className="text-gray-600">Help local communities involved in conservation efforts.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Donate Modal */}
            {showDonateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-2xl font-bold mb-4">Make a Donation</h2>
                        <form onSubmit={handleDonate}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Donation Amount ($)</label>
                                    <div className="flex gap-2 mb-2">
                                        {[25, 50, 100, 250].map((amount) => (
                                            <button
                                                key={amount}
                                                type="button"
                                                onClick={() => setNewDonation({...newDonation, amount: amount.toString()})}
                                                className="flex-1 py-2 text-sm border border-green-300 text-green-600 rounded hover:bg-green-50 transition-colors"
                                            >
                                                ${amount}
                                            </button>
                                        ))}
                                    </div>
                                    <input
                                        type="number"
                                        value={newDonation.amount}
                                        onChange={(e) => setNewDonation({...newDonation, amount: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        placeholder="Enter custom amount"
                                        min="1"
                                        step="0.01"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Message (Optional)</label>
                                    <textarea
                                        value={newDonation.message}
                                        onChange={(e) => setNewDonation({...newDonation, message: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        rows="3"
                                        placeholder="Leave a message with your donation..."
                                    />
                                </div>
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="anonymous"
                                        checked={newDonation.isAnonymous}
                                        onChange={(e) => setNewDonation({...newDonation, isAnonymous: e.target.checked})}
                                        className="mr-2"
                                    />
                                    <label htmlFor="anonymous" className="text-sm">Donate anonymously</label>
                                </div>
                            </div>
                            <div className="flex gap-4 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowDonateModal(false)}
                                    className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors"
                                >
                                    Donate ${newDonation.amount || 0}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
};

export default DonationList;