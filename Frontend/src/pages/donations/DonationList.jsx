import React, { useState, useEffect } from 'react';
import { protectedApi } from '../../services/authService';
import { useAuthContext } from '../../contexts/AuthContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/footer';

// Add custom styles for animations
const customStyles = `
  @keyframes fade-in-up {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes slide-in-left {
    from {
      opacity: 0;
      transform: translateX(-30px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes scale-up {
    from {
      opacity: 0;
      transform: scale(0.9);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  @keyframes float {
    0%, 100% {
      transform: translateY(0px);
    }
    50% {
      transform: translateY(-10px);
    }
  }

  @keyframes heartbeat {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.1);
    }
  }
  
  .animate-fade-in-up {
    animation: fade-in-up 0.8s ease-out forwards;
  }
  
  .animate-slide-in-left {
    animation: slide-in-left 0.8s ease-out forwards;
  }

  .animate-scale-up {
    animation: scale-up 0.6s ease-out forwards;
  }

  .animate-float {
    animation: float 3s ease-in-out infinite;
  }

  .animate-heartbeat {
    animation: heartbeat 1.5s ease-in-out infinite;
  }
  
  .animation-delay-300 {
    animation-delay: 0.3s;
    opacity: 0;
  }
  
  .animation-delay-600 {
    animation-delay: 0.6s;
    opacity: 0;
  }
  
  .animation-delay-900 {
    animation-delay: 0.9s;
    opacity: 0;
  }

  .donation-card {
    transition: all 0.3s ease;
    background: linear-gradient(145deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.9) 100%);
    backdrop-filter: blur(10px);
  }

  .donation-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  }

  .stats-card {
    background: linear-gradient(135deg, var(--tw-gradient-from) 0%, var(--tw-gradient-to) 100%);
    position: relative;
    overflow: hidden;
  }

  .stats-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
    backdrop-filter: blur(10px);
  }

  .stats-card > * {
    position: relative;
    z-index: 1;
  }
`;

// Inject styles into head
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = customStyles;
  document.head.appendChild(styleElement);
}

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

    const predefinedAmounts = [25, 50, 100, 250, 500];

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

    const handleAmountSelect = (amount) => {
        setNewDonation({ ...newDonation, amount: amount.toString() });
    };

    const isAdminOrOfficer = ['admin', 'wildlifeOfficer'].includes(backendUser?.role);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
                <Navbar />
                <div className="flex-1 flex items-center justify-center min-h-[80vh]">
                    <div className="text-center">
                        <div className="relative">
                            <div className="animate-spin rounded-full h-20 w-20 border-4 border-emerald-200 mx-auto"></div>
                            <div className="animate-spin rounded-full h-20 w-20 border-4 border-emerald-600 border-t-transparent absolute top-0 left-1/2 transform -translate-x-1/2"></div>
                        </div>
                        <div className="animate-heartbeat mt-6">
                            <p className="text-xl text-gray-600 font-medium">Loading donations...</p>
                            <p className="text-emerald-600">Every contribution makes a difference ❤️</p>
                        </div>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            {/* Modern Hero Section */}
            <section className="relative h-screen overflow-hidden">
                {/* Background Image */}
                <div className="absolute inset-0">
                    <img
                        src="https://images.unsplash.com/photo-1593113646773-028c64a8f1b8?q=80&w=2070&auto=format&fit=crop"
                        alt="Wildlife Conservation"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/85 via-emerald-700/70 to-teal-800/80"></div>
                </div>

                {/* Hero Content */}
                <div className="relative z-10 h-full flex items-center justify-center">
                    <div className="container mx-auto px-6 text-center">
                        <div className="animate-fade-in-up">
                            <h1 className="text-6xl md:text-8xl font-extrabold text-white leading-tight mb-6">
                                <span className="bg-gradient-to-r from-emerald-300 to-teal-200 bg-clip-text text-transparent">
                                    Support
                                </span>
                                <br />
                                <span className="text-white/90 text-4xl md:text-6xl">
                                    Wildlife
                                </span>
                            </h1>
                        </div>
                        
                        <div className="animate-fade-in-up animation-delay-300 mb-8">
                            <p className="text-xl md:text-2xl text-white/90 max-w-4xl mx-auto leading-relaxed font-light">
                                Your contribution helps us protect Sri Lanka's precious wildlife and their habitats. 
                                Every donation creates a lasting impact.
                            </p>
                        </div>

                        {/* Impact Preview */}
                        <div className="animate-fade-in-up animation-delay-600 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-8">
                            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                                <div className="text-3xl mb-2">🐘</div>
                                <div className="text-white font-bold">Protect Elephants</div>
                                <div className="text-emerald-200 text-sm">$50 feeds a family for a week</div>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                                <div className="text-3xl mb-2">🌱</div>
                                <div className="text-white font-bold">Plant Trees</div>
                                <div className="text-emerald-200 text-sm">$25 plants 10 native trees</div>
                            </div>
                            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                                <div className="text-3xl mb-2">🔬</div>
                                <div className="text-white font-bold">Fund Research</div>
                                <div className="text-emerald-200 text-sm">$100 supports research for a month</div>
                            </div>
                        </div>

                        <div className="animate-fade-in-up animation-delay-900">
                            <button
                                onClick={() => setShowDonateModal(true)}
                                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-12 py-5 rounded-2xl text-xl font-bold transition-all transform hover:scale-105 hover:shadow-2xl animate-heartbeat flex items-center gap-3 mx-auto"
                            >
                                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                                Make a Donation
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="relative -mt-32 z-10 py-20">
                <div className="container mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                        <div className="stats-card from-emerald-500 to-emerald-600 text-white rounded-3xl p-8 text-center shadow-2xl animate-fade-in-up">
                            <div className="animate-float">
                                <div className="text-5xl font-extrabold mb-2">${stats.totalAmount.toLocaleString()}</div>
                                <div className="text-emerald-100 text-lg font-medium">Total Raised</div>
                                <div className="mt-4 text-sm text-emerald-200">Making real impact together</div>
                            </div>
                        </div>
                        
                        <div className="stats-card from-blue-500 to-indigo-600 text-white rounded-3xl p-8 text-center shadow-2xl animate-fade-in-up animation-delay-300">
                            <div className="animate-float" style={{ animationDelay: '0.5s' }}>
                                <div className="text-5xl font-extrabold mb-2">{stats.totalDonations}</div>
                                <div className="text-blue-100 text-lg font-medium">Generous Donors</div>
                                <div className="mt-4 text-sm text-blue-200">Heroes of conservation</div>
                            </div>
                        </div>
                        
                        <div className="stats-card from-purple-500 to-pink-600 text-white rounded-3xl p-8 text-center shadow-2xl animate-fade-in-up animation-delay-600">
                            <div className="animate-float" style={{ animationDelay: '1s' }}>
                                <div className="text-5xl font-extrabold mb-2">${stats.monthlyAmount.toLocaleString()}</div>
                                <div className="text-purple-100 text-lg font-medium">This Month</div>
                                <div className="mt-4 text-sm text-purple-200">Current momentum</div>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg mb-8 animate-scale-up">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <svg className="h-6 w-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p className="text-red-700 font-medium">{error}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Recent Donations */}
                    <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20 animate-fade-in-up animation-delay-900">
                        <div className="text-center mb-12">
                            <h2 className="text-4xl font-bold text-gray-800 mb-4">
                                <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                                    Recent Donations
                                </span>
                            </h2>
                            <p className="text-xl text-gray-600">
                                See how our community is making a difference
                            </p>
                        </div>

                        {donations.length === 0 ? (
                            <div className="text-center py-20">
                                <div className="max-w-md mx-auto">
                                    <div className="w-24 h-24 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <svg className="w-12 h-12 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-800 mb-4">Be the First Hero!</h3>
                                    <p className="text-gray-600 text-lg leading-relaxed mb-8">
                                        No donations yet. Be the first to make a difference and start the conservation journey!
                                    </p>
                                    <button
                                        onClick={() => setShowDonateModal(true)}
                                        className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-8 py-4 rounded-2xl font-bold transition-all transform hover:scale-105"
                                    >
                                        Make the First Donation
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {donations.map((donation, index) => (
                                    <div 
                                        key={donation._id} 
                                        className="donation-card border-l-4 border-emerald-500 p-6 rounded-r-2xl animate-fade-in-up"
                                        style={{ animationDelay: `${index * 0.1}s` }}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-4 mb-3">
                                                    <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold">
                                                        {donation.donorName ? donation.donorName.charAt(0) : 'A'}
                                                    </div>
                                                    <div>
                                                        <span className="font-bold text-xl text-gray-800">
                                                            {donation.donorName || 'Anonymous'}
                                                        </span>
                                                        <div className="text-sm text-gray-500">
                                                            {new Date(donation.createdAt).toLocaleDateString('en-US', { 
                                                                year: 'numeric', 
                                                                month: 'long', 
                                                                day: 'numeric' 
                                                            })}
                                                        </div>
                                                    </div>
                                                    <div className="ml-auto">
                                                        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-2 rounded-full">
                                                            <span className="text-xl font-bold">
                                                                ${donation.amount?.toLocaleString()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                {donation.message && (
                                                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-100">
                                                        <p className="text-gray-700 italic text-lg leading-relaxed">
                                                            "{donation.message}"
                                                        </p>
                                                    </div>
                                                )}
                                                {isAdminOrOfficer && donation.donorEmail && (
                                                    <p className="text-xs text-gray-400 mt-2">{donation.donorEmail}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Donate Modal */}
            {showDonateModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-up border border-gray-200">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-3xl font-bold text-gray-800">Make a Donation</h2>
                            <button
                                onClick={() => setShowDonateModal(false)}
                                className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
                            >
                                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        
                        <form onSubmit={handleDonate} className="space-y-6">
                            <div>
                                <label className="block text-gray-700 font-semibold mb-3">Choose Amount</label>
                                <div className="grid grid-cols-3 gap-3 mb-4">
                                    {predefinedAmounts.map((amount) => (
                                        <button
                                            key={amount}
                                            type="button"
                                            onClick={() => handleAmountSelect(amount)}
                                            className={`px-4 py-3 rounded-xl border-2 font-bold transition-all ${
                                                newDonation.amount === amount.toString()
                                                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                                    : 'border-gray-200 hover:border-emerald-300 text-gray-700'
                                            }`}
                                        >
                                            ${amount}
                                        </button>
                                    ))}
                                </div>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="1"
                                    value={newDonation.amount}
                                    onChange={(e) => setNewDonation({ ...newDonation, amount: e.target.value })}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
                                    placeholder="Enter custom amount"
                                    required
                                />
                            </div>
                            
                            <div>
                                <label className="block text-gray-700 font-semibold mb-2">Message (Optional)</label>
                                <textarea
                                    value={newDonation.message}
                                    onChange={(e) => setNewDonation({ ...newDonation, message: e.target.value })}
                                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all resize-none"
                                    rows="4"
                                    placeholder="Share why you're supporting wildlife conservation..."
                                />
                            </div>
                            
                            <div className="flex items-center p-4 bg-blue-50 rounded-xl border border-blue-100">
                                <input
                                    type="checkbox"
                                    id="isAnonymous"
                                    checked={newDonation.isAnonymous}
                                    onChange={(e) => setNewDonation({ ...newDonation, isAnonymous: e.target.checked })}
                                    className="w-5 h-5 text-blue-600 border-2 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <label htmlFor="isAnonymous" className="ml-3 text-blue-800 font-medium">
                                    Make this donation anonymous
                                </label>
                            </div>
                            
                            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-100">
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-emerald-800 mb-2">
                                        ${parseFloat(newDonation.amount || 0).toFixed(2)}
                                    </div>
                                    <div className="text-emerald-600 font-medium">
                                        Thank you for supporting wildlife conservation!
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowDonateModal(false)}
                                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-6 py-3 rounded-xl font-bold transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                    Donate Now
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