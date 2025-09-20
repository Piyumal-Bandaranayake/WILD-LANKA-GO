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
                <div className="flex-1 flex items-center justify-center">
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
        <>
            <Navbar />

            {/* Hero Section */}
            <section
                className="relative h-[50vh] bg-cover bg-center flex items-center justify-center"
                style={{
                    backgroundImage:
                        "url('https://images.unsplash.com/photo-1593113646773-028c64a8f1b8?q=80&w=1200&auto=format&fit=crop')",
                }}
            >
                <div className="absolute inset-0 bg-black/40"></div>
                <div className="relative text-center text-white max-w-3xl">
                    <h1 className="text-5xl font-bold mb-4">Support Our Cause</h1>
                    <p className="text-lg">
                        Your contribution helps us protect Sri Lanka's precious wildlife and their habitats.
                    </p>
                </div>
            </section>

            {/* Donations Section */}
            <div className="bg-gray-50 py-16">
                <div className="container mx-auto px-4">
                    {/* Stats Section */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl p-6 text-center shadow-lg">
                            <div className="text-4xl font-bold">${stats.totalAmount.toLocaleString()}</div>
                            <div className="text-green-100 mt-2">Total Raised</div>
                        </div>
                        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl p-6 text-center shadow-lg">
                            <div className="text-4xl font-bold">{stats.totalDonations}</div>
                            <div className="text-blue-100 mt-2">Total Donations</div>
                        </div>
                        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl p-6 text-center shadow-lg">
                            <div className="text-4xl font-bold">${stats.monthlyAmount.toLocaleString()}</div>
                            <div className="text-purple-100 mt-2">This Month</div>
                        </div>
                    </div>

                    {/* Donate Button */}
                    <div className="text-center mb-12">
                        <button
                            onClick={() => setShowDonateModal(true)}
                            className="bg-green-600 text-white px-10 py-4 rounded-full text-lg font-semibold hover:bg-green-700 transition-colors shadow-xl transform hover:scale-105 duration-300"
                        >
                            Make a Donation
                        </button>
                    </div>

                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-8">
                            {error}
                        </div>
                    )}

                    {/* Recent Donations */}
                    <div className="bg-white rounded-2xl shadow-xl p-8">
                        <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Recent Donations</h2>

                        {donations.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-gray-500 text-lg">No donations yet. Be the first to contribute!</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {donations.map((donation) => (
                                    <div key={donation._id} className="border-l-4 border-green-500 bg-green-50/50 p-6 rounded-r-lg transition-shadow duration-300 hover:shadow-md">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-4 mb-2">
                                                    <span className="font-semibold text-xl text-green-800">
                                                        {donation.donorName || 'Anonymous'}
                                                    </span>
                                                    <span className="text-2xl font-bold text-green-600">
                                                        ${donation.amount?.toLocaleString()}
                                                    </span>
                                                </div>
                                                {donation.message && (
                                                    <p className="text-gray-700 italic text-lg">"{donation.message}"</p>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <span className="text-sm text-gray-500">
                                                    {new Date(donation.createdAt).toLocaleDateString()}
                                                </span>
                                                {isAdminOrOfficer && donation.donorEmail && (
                                                    <p className="text-xs text-gray-400 mt-1">{donation.donorEmail}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Donate Modal */}
            {showDonateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-8 w-full max-w-md shadow-xl">
                        <h2 className="text-2xl font-bold mb-6">Make a Donation</h2>
                        <form onSubmit={handleDonate}>
                            {/* Form fields... */}
                        </form>
                    </div>
                </div>
            )}

            <Footer />
        </>
    );
};

export default DonationList;