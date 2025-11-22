import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/footer';
// Uncomment these lines when you add your local images:

// Stripe Integration
// This component integrates with Stripe for secure payment processing
// Backend API endpoint: /api/create-payment-intent
// Currency: LKR (Sri Lankan Rupees)
// Minimum donation: LKR 200

// Subcomponents
const AmountPicker = ({ amounts, selectedAmount, onAmountSelect, customAmount, onCustomAmountChange, minAmount = 200 }) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Choose Amount (LKR)</label>
        <div className="grid grid-cols-2 gap-3">
          {amounts.map((amount) => (
            <button
              key={amount}
              type="button"
              onClick={() => onAmountSelect(amount)}
              className={`px-4 py-3 rounded-xl border-2 font-semibold transition-all duration-200 ${
                selectedAmount === amount
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-md'
                  : 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50 text-gray-700'
              }`}
            >
              LKR {amount.toLocaleString()}
            </button>
          ))}
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Custom Amount</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500 text-sm">LKR</span>
          </div>
          <input
            type="number"
            value={customAmount}
            onChange={(e) => onCustomAmountChange(e.target.value)}
            min={minAmount}
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
            placeholder={`Minimum ${minAmount}`}
          />
        </div>
        {customAmount && customAmount < minAmount && (
          <p className="text-red-500 text-xs mt-1">Minimum amount is LKR {minAmount}</p>
        )}
      </div>
    </div>
  );
};

const ProgressBar = ({ raised, goal, className = "" }) => {
  const percentage = Math.min((raised / goal) * 100, 100);
  
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">Raised</span>
        <span className="font-semibold text-emerald-600">LKR {raised.toLocaleString()}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-500">
        <span>Goal: LKR {goal.toLocaleString()}</span>
        <span>{percentage.toFixed(1)}%</span>
      </div>
    </div>
  );
};

const ImpactCard = ({ icon, title, text, className = "" }) => (
  <div className={`bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 ${className}`}>
    <div className="flex items-center space-x-4">
      <div className="flex-shrink-0 w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
        {icon}
      </div>
      <div>
        <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
        <p className="text-sm text-gray-600">{text}</p>
      </div>
    </div>
  </div>
);

const FAQItem = ({ question, answer, isOpen, onToggle }) => (
  <div className="border border-gray-200 rounded-xl overflow-hidden">
    <button
      onClick={onToggle}
      className="w-full px-6 py-4 text-left bg-white hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
    >
      <div className="flex justify-between items-center">
        <span className="font-medium text-gray-900">{question}</span>
        <svg
          className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </button>
    {isOpen && (
      <div className="px-6 pb-4 bg-gray-50">
        <p className="text-gray-700 leading-relaxed">{answer}</p>
      </div>
    )}
  </div>
);

const TestimonialCard = ({ name, role, quote, avatar }) => (
  <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
    <div className="flex items-center space-x-4 mb-4">
      <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
        <span className="text-emerald-600 font-semibold text-lg">{avatar}</span>
      </div>
      <div>
        <h4 className="font-semibold text-gray-900">{name}</h4>
        <p className="text-sm text-gray-600">{role}</p>
      </div>
    </div>
    <p className="text-gray-700 italic">"{quote}"</p>
  </div>
);

// Main DonationPage Component
const DonationPage = ({
  hero = {
    title: "Protect Sri Lanka's Wildlife",
    subtitle: "Your donation helps fund conservation efforts, rescue operations, and community education programs across the island."
  },
  amounts = [1000, 2500, 5000, 10000],
  minAmount = 200,
  monthlyDefault = false,
  progress = { raised: 125000, goal: 500000 },
  stats = [
    { label: "Supporters", value: "15,000+" },
    { label: "Projects Completed", value: "98%" },
    { label: "Animals Rescued", value: "2,500+" }
  ],
  impacts = [
    {
      icon: <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
      title: "Fund Ranger Patrols",
      text: "Support daily patrols to protect wildlife from poaching and habitat destruction."
    },
    {
      icon: <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>,
      title: "Rescue & Rehabilitation",
      text: "Provide medical care and rehabilitation for injured and orphaned animals."
    },
    {
      icon: <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
      title: "Community Education",
      text: "Educate local communities about wildlife conservation and sustainable practices."
    }
  ],
  faqs = [
    {
      q: "How is my donation used?",
      a: "Your donation directly funds wildlife conservation projects, rescue operations, ranger patrols, and community education programs. We maintain full transparency with detailed reports on fund usage."
    },
    {
      q: "Is my donation tax-deductible?",
      a: "Yes, all donations to our wildlife conservation fund are tax-deductible. You'll receive a receipt for your records."
    },
    {
      q: "Can I make a monthly donation?",
      a: "Absolutely! Monthly donations provide consistent support for our ongoing conservation efforts. You can cancel or modify your monthly donation at any time."
    },
    {
      q: "What payment methods do you accept?",
      a: "We accept all major credit cards (Visa, Mastercard, American Express) through our secure Stripe payment system."
    }
  ],
  onSubmit,
  projectsHref = "/activities",
  transparencyHref = "/about"
}) => {
  const [selectedAmount, setSelectedAmount] = useState(null);
  const [customAmount, setCustomAmount] = useState('');
  const [isMonthly, setIsMonthly] = useState(monthlyDefault);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');
  const [openFAQ, setOpenFAQ] = useState(null);

  const currentAmount = selectedAmount || (customAmount ? parseInt(customAmount) : 0);
  const isValidAmount = currentAmount >= minAmount;

  const getImpactText = (amount) => {
    if (amount >= 10000) return `LKR ${amount.toLocaleString()} funds a ranger patrol for 1 month`;
    if (amount >= 5000) return `LKR ${amount.toLocaleString()} rescues and rehabilitates 1 animal`;
    if (amount >= 2500) return `LKR ${amount.toLocaleString()} feeds 1 rescued animal for 3 days`;
    if (amount >= 1000) return `LKR ${amount.toLocaleString()} provides medical supplies for 1 week`;
    return `LKR ${amount.toLocaleString()} supports our conservation efforts`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValidAmount || !email) return;

    setIsProcessing(true);
    setError('');

    try {
      // Call backend to create Stripe Checkout session and redirect
      const apiBase = (import.meta?.env?.VITE_API_BASE_URL || 'http://localhost:5001/api');
      const resp = await fetch(`${apiBase}/donations/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: currentAmount,
          currency: 'lkr',
          donorEmail: email,
          donorName: name || 'Anonymous',
          isMonthly,
        }),
        credentials: 'include',
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err?.message || 'Failed to initiate checkout');
      }

      const data = await resp.json();
      const checkoutUrl = data?.data?.url || data?.url;
      if (!checkoutUrl) throw new Error('No checkout URL returned');

      window.location.href = checkoutUrl;
    } catch (err) {
      setError('Payment failed. Please try again or contact support.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50 relative overflow-hidden">
        <Navbar />
        
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-200 rounded-full opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-teal-200 rounded-full opacity-20 animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-green-200 rounded-full opacity-10 animate-pulse delay-500"></div>
        </div>

        <div className="pt-20 pb-16 relative z-10">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Main Thank You Card */}
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-8 md:p-12 text-center relative overflow-hidden">
              {/* Decorative Elements */}
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-green-500"></div>
              <div className="absolute top-4 right-4 w-16 h-16 bg-emerald-100 rounded-full opacity-50"></div>
              <div className="absolute bottom-4 left-4 w-12 h-12 bg-teal-100 rounded-full opacity-50"></div>
              
              {/* Success Animation */}
              <div className="relative mb-8">
                <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg animate-bounce">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="absolute inset-0 w-24 h-24 border-4 border-emerald-300 rounded-full mx-auto animate-ping"></div>
              </div>

              {/* Thank You Message */}
              <div className="space-y-6">
                <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  Thank You! 🙏
                </h2>
                
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-200">
                  <p className="text-xl text-gray-700 mb-4">
                    Your generous donation of <span className="font-bold text-emerald-600 text-2xl">LKR {currentAmount.toLocaleString()}</span> has been processed successfully!
                  </p>
                  {isMonthly && (
                    <p className="text-lg text-teal-700 font-medium">
                      🌟 Your monthly donation will help us plan long-term conservation projects and make a lasting impact!
                    </p>
                  )}
                </div>

                {/* Impact Preview */}
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Impact</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-emerald-50 rounded-xl">
                      <div className="text-2xl mb-2">🦁</div>
                      <div className="text-sm font-medium text-emerald-700">Wildlife Protection</div>
                    </div>
                    <div className="text-center p-4 bg-teal-50 rounded-xl">
                      <div className="text-2xl mb-2">🌱</div>
                      <div className="text-sm font-medium text-teal-700">Habitat Conservation</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-xl">
                      <div className="text-2xl mb-2">👥</div>
                      <div className="text-sm font-medium text-green-700">Community Education</div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
                  <a
                    href="/projects"
                    className="group bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
                  >
                    <span>See Our Projects</span>
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                  <button
                    onClick={() => setShowSuccess(false)}
                    className="group border-2 border-gray-300 hover:border-emerald-400 hover:bg-emerald-50 text-gray-700 hover:text-emerald-700 px-8 py-4 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 flex items-center justify-center space-x-2"
                  >
                    <span>Make Another Donation</span>
                    <svg className="w-5 h-5 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                </div>

                {/* Social Sharing */}
                <div className="pt-6 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-4">Help us spread the word!</p>
                  <div className="flex justify-center space-x-4">
                    <button className="w-10 h-10 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center transition-colors">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                      </svg>
                    </button>
                    <button className="w-10 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center transition-colors">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
                      </svg>
                    </button>
                    <button className="w-10 h-10 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center transition-colors">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
      <Navbar />

      {/* Hero Section */}
      <div className="pt-20 pb-16 relative overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?ixlib=rb-4.1.0&auto=format&fit=crop&w=2074&q=80"
            // src={donationHero} // Uncomment this line and comment out the line above when you add local image
            alt="Donation and Charity"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/80 via-emerald-700/60 to-teal-800/70"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Hero Content */}
            <div className="space-y-6">
              <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight">
                {hero.title}
              </h1>
              <p className="text-xl text-emerald-100 leading-relaxed">
                {hero.subtitle}
              </p>
            </div>

            {/* Right: Donation Card */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Make a Donation</h2>
                
                <AmountPicker
                  amounts={amounts}
                  selectedAmount={selectedAmount}
                  onAmountSelect={setSelectedAmount}
                  customAmount={customAmount}
                  onCustomAmountChange={setCustomAmount}
                  minAmount={minAmount}
                />

                {/* Impact Text */}
                {isValidAmount && (
                  <div className="bg-emerald-50 rounded-xl p-4">
                    <p className="text-sm text-emerald-700 font-medium">
                      {getImpactText(currentAmount)}
                    </p>
                  </div>
                )}

                {/* Monthly/One-time Toggle */}
                <div className="flex bg-gray-100 rounded-xl p-1">
                  <button
                    type="button"
                    onClick={() => setIsMonthly(false)}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                      !isMonthly
                        ? 'bg-white text-emerald-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    One-time
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsMonthly(true)}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                      isMonthly
                        ? 'bg-white text-emerald-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Monthly
                  </button>
                </div>

                {/* Contact Information */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                      placeholder="your@email.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                      placeholder="Your name"
                    />
                  </div>
                </div>
                
                {/* Stripe Card Element Placeholder */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Information
                  </label>
                  <div className="border border-gray-300 rounded-xl p-4 bg-gray-50">
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="w-8 h-5 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold">VISA</div>
                      <div className="w-8 h-5 bg-red-600 rounded text-white text-xs flex items-center justify-center font-bold">MC</div>
                      <div className="w-8 h-5 bg-blue-500 rounded text-white text-xs flex items-center justify-center font-bold">AMEX</div>
                    </div>
                    <div className="text-sm text-gray-500">
                      Card details will be processed securely by Stripe
                    </div>
                    {/* TODO: Replace with actual Stripe CardElement */}
                    <div className="mt-3 p-3 bg-white border border-gray-200 rounded-lg">
                      <div className="text-gray-400 text-sm">Card Element will be mounted here</div>
                    </div>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={!isValidAmount || !email || isProcessing}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-4 px-6 rounded-xl font-semibold text-lg transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                >
                  {isProcessing ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Processing...</span>
                    </div>
                  ) : (
                    `Donate LKR ${currentAmount.toLocaleString()}${isMonthly ? ' Monthly' : ''}`
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Progress & Stats Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-gray-900">Our Progress</h3>
              <ProgressBar raised={progress.raised} goal={progress.goal} />
              <div className="grid grid-cols-3 gap-4">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="text-2xl font-bold text-emerald-600">{stat.value}</div>
                    <div className="text-sm text-gray-600">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-gray-900">What Our Supporters Say</h3>
              <div className="space-y-4">
                <TestimonialCard
                  name="Sarah Johnson"
                  role="Wildlife Photographer"
                  quote="Seeing the direct impact of my donations on conservation efforts has been incredibly rewarding."
                  avatar="SJ"
                />
                <TestimonialCard
                  name="Dr. Raj Patel"
                  role="Conservation Biologist"
                  quote="The transparency and effectiveness of this organization is unmatched in the field."
                  avatar="RP"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
        
      {/* Impact Grid */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">Your Impact</h3>
            <p className="text-lg text-gray-600">See how your donations make a difference</p>
          </div>
          
          {/* Optional: Add a hero image for the impact section */}
          <div className="mb-12 rounded-2xl overflow-hidden shadow-lg">
            <img
              src="https://plus.unsplash.com/premium_photo-1722054522000-fa09766a6529?ixlib=rb-4.1.0&auto=format&fit=crop&w=2074&q=80"
              // src={impactImage} // Uncomment this line and comment out the line above when you add local image
              alt="Conservation Volunteers and Animals"
              className="w-full h-80 object-cover"
            />
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {impacts.map((impact, index) => (
              <ImpactCard
                key={index}
                icon={impact.icon}
                title={impact.title}
                text={impact.text}
              />
            ))}
          </div>
        </div>
      </div>
        
      {/* FAQ Section */}
      <div className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h3>
            <p className="text-lg text-gray-600">Everything you need to know about donating</p>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <FAQItem
                key={index}
                question={faq.q}
                answer={faq.a}
                isOpen={openFAQ === index}
                onToggle={() => setOpenFAQ(openFAQ === index ? null : index)}
              />
            ))}
          </div>
        </div>
      </div>
        
      {/* Projects Showcase Section */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">See Our Projects in Action</h3>
            <p className="text-lg text-gray-600 mb-8">
              Discover how your donations are making a real difference in wildlife conservation
            </p>
            <a
              href="/projects"
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-8 py-4 rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <span>View All Projects</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
          
          {/* Quick Project Preview */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-200">
              <div className="text-3xl mb-3">🦁</div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Elephant Corridor Protection</h4>
              <p className="text-gray-600 text-sm mb-4">Creating safe passage routes for elephants between national parks</p>
              <div className="text-emerald-600 font-semibold">75% Funded</div>
            </div>
            <div className="bg-gradient-to-br from-teal-50 to-green-50 rounded-2xl p-6 border border-teal-200">
              <div className="text-3xl mb-3">🐢</div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Marine Turtle Conservation</h4>
              <p className="text-gray-600 text-sm mb-4">Protecting nesting beaches and monitoring sea turtle populations</p>
              <div className="text-teal-600 font-semibold">64% Funded</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
              <div className="text-3xl mb-3">🌱</div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Forest Restoration</h4>
              <p className="text-gray-600 text-sm mb-4">Replanting native trees and restoring degraded forest areas</p>
              <div className="text-green-600 font-semibold">50% Funded</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="py-12 bg-emerald-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-2xl font-bold text-white mb-4">Prefer Bank Transfer?</h3>
          <p className="text-emerald-100 mb-6">
            We also accept direct bank transfers for larger donations
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={transparencyHref}
              className="bg-white hover:bg-gray-50 text-emerald-600 px-6 py-3 rounded-xl font-semibold transition-colors"
            >
              Learn How Funds Are Used
            </a>
            <button className="border border-emerald-300 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors">
              Contact Us for Bank Details
            </button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

// Main component export
const DonationList = () => {
  const handleSubmit = async (payload) => {
    try {
      
      // Create Stripe payment intent
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(payload.amount * 100), // Convert to cents
          currency: 'lkr',
          donorName: payload.name,
          donorEmail: payload.email,
          isMonthly: payload.isMonthly,
          message: payload.message || ''
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      const { clientSecret, paymentIntentId } = await response.json();
      
      // For demo purposes, simulate successful payment
      // In production, you would redirect to Stripe Checkout or use Stripe Elements
      
      // Simulate successful payment processing
      alert(`Thank you for your donation of LKR ${payload.amount.toLocaleString()}! Your payment has been processed successfully.`);
      
      // In production, you would handle the actual Stripe payment confirmation here
      // Example with Stripe.js:
      // const { error } = await stripe.confirmCardPayment(clientSecret, {
      //   payment_method: {
      //     card: cardElement,
      //     billing_details: {
      //       name: payload.name,
      //       email: payload.email,
      //     },
      //   },
      // });
      
    } catch (error) {
      console.error('Stripe payment error:', error);
      alert('Payment processing failed. Please try again.');
    }
  };

  return (
    <DonationPage
      onSubmit={handleSubmit}
      projectsHref="/activities"
      transparencyHref="/about"
    />
  );
};

export default DonationList;
