import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/footer';

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
  
  .animate-fade-in-up {
    animation: fade-in-up 0.8s ease-out forwards;
  }
  
  .animation-delay-300 {
    animation-delay: 0.3s;
    opacity: 0;
  }
  
  .animation-delay-600 {
    animation-delay: 0.6s;
    opacity: 0;
  }
`;

// Inject styles into head
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = customStyles;
  document.head.appendChild(styleElement);
}

export default function AboutUs() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Modern Hero Section */}
      <section className="relative h-screen overflow-hidden">
        {/* Background Image with Parallax Effect */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1598387993214-f22e0c2d4523?q=80&w=2070&auto=format&fit=crop"
            alt="Sri Lankan Wildlife"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/80 via-emerald-700/60 to-teal-800/70"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 h-full flex items-center justify-center">
          <div className="container mx-auto px-6 text-center">
            <div className="animate-fade-in-up">
              <h1 className="text-6xl md:text-8xl font-extrabold text-white leading-tight mb-6">
                <span className="bg-gradient-to-r from-emerald-300 to-teal-200 bg-clip-text text-transparent">
                  About
                </span>
                <br />
                <span className="text-white/90 text-4xl md:text-6xl">
                  Wild Lanka Adventures
                </span>
              </h1>
            </div>
            
            <div className="animate-fade-in-up animation-delay-300 mb-8">
              <p className="text-xl md:text-2xl text-white/90 max-w-4xl mx-auto leading-relaxed font-light">
                Dedicated to protecting Sri Lanka's wildlife heritage through sustainable tourism, 
                conservation education, and community empowerment.
              </p>
            </div>

            {/* Stats */}
            <div className="animate-fade-in-up animation-delay-600 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-emerald-300 mb-2">15+</div>
                <div className="text-white/70 text-sm uppercase tracking-wider">Years Experience</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-emerald-300 mb-2">10K+</div>
                <div className="text-white/70 text-sm uppercase tracking-wider">Wildlife Encounters</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-emerald-300 mb-2">25</div>
                <div className="text-white/70 text-sm uppercase tracking-wider">Protected Areas</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-emerald-300 mb-2">98%</div>
                <div className="text-white/70 text-sm uppercase tracking-wider">Satisfaction Rate</div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/70 rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </section>

      {/* Modern Mission & Vision Section */}
      <section className="py-20 bg-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-emerald-100 to-teal-100"></div>
        </div>
        
        <div className="container mx-auto px-6 relative z-10">
          {/* Section Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-3 bg-emerald-100 text-emerald-700 px-6 py-3 rounded-full text-sm font-semibold mb-6">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Our Purpose
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Mission &
              <span className="block text-emerald-600">Vision</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Image */}
            <div className="relative">
              <div className="relative overflow-hidden rounded-2xl shadow-2xl">
                <img
                  className="w-full h-96 object-cover transform hover:scale-105 transition-transform duration-700"
                  src="https://images.unsplash.com/photo-1555212697-194d092e3b8f?q=80&w=800&auto=format&fit=crop"
                  alt="Wildlife in Sri Lanka"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
              </div>
              
              {/* Floating Badge */}
              <div className="absolute -bottom-6 -right-6 bg-white rounded-2xl shadow-xl p-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-emerald-600 mb-1">500+</div>
                  <div className="text-sm text-gray-600">Successful Tours</div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="space-y-8">
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-8 rounded-2xl">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-emerald-700">Our Mission</h3>
                </div>
                <p className="text-gray-700 leading-relaxed">
                  To provide exceptional wildlife experiences that educate, inspire, and contribute
                  to the conservation of Sri Lanka's unique biodiversity while supporting local
                  communities and promoting sustainable tourism practices.
                </p>
              </div>

              <div className="bg-gradient-to-br from-teal-50 to-emerald-50 p-8 rounded-2xl">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-teal-500 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-teal-700">Our Vision</h3>
                </div>
                <p className="text-gray-700 leading-relaxed">
                  To be Sri Lanka's leading wildlife tourism platform that sets the standard for
                  responsible wildlife encounters, conservation education, and community-based
                  eco-tourism initiatives.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modern Achievements Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-emerald-50 relative">
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-200/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-200/20 rounded-full blur-3xl"></div>
        
        <div className="container mx-auto px-6 relative z-10">
          {/* Section Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-3 bg-emerald-100 text-emerald-700 px-6 py-3 rounded-full text-sm font-semibold mb-6">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Achievements
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Our Notable
              <span className="block text-emerald-600">Achievements</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                title: 'Excellence in Wildlife Tourism',
                desc: 'Recognized by Sri Lanka Tourism Board for outstanding contribution to sustainable wildlife tourism',
                year: 2023,
                icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
                color: 'emerald'
              },
              {
                title: 'Conservation Partnership',
                desc: 'Official partner with Department of Wildlife Conservation for responsible tourism practices',
                year: 2022,
                icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
                color: 'teal'
              },
              {
                title: 'International Recognition',
                desc: 'Featured in National Geographic for innovative wildlife conservation approaches',
                year: 2021,
                icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064',
                color: 'blue'
              },
              {
                title: 'Community Impact Award',
                desc: 'Honored for contributions to local community development through eco-tourism',
                year: 2020,
                icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
                color: 'purple'
              },
            ].map((item, i) => (
              <div key={i} className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 p-8 relative overflow-hidden">
                {/* Background Gradient */}
                <div className={`absolute top-0 right-0 w-20 h-20 bg-${item.color}-100 rounded-full blur-xl opacity-50 group-hover:opacity-70 transition-opacity duration-300`}></div>
                
                {/* Icon */}
                <div className={`w-16 h-16 bg-${item.color}-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
                  </svg>
                </div>

                {/* Content */}
                <h3 className={`text-xl font-bold text-${item.color}-700 mb-4 group-hover:text-${item.color}-600 transition-colors duration-300`}>
                  {item.title}
                </h3>
                <p className="text-gray-600 mb-6 leading-relaxed">{item.desc}</p>
                
                {/* Year Badge */}
                <div className={`inline-flex items-center px-4 py-2 bg-${item.color}-100 text-${item.color}-700 rounded-full text-sm font-semibold`}>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {item.year}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modern Team Section */}
      <section className="py-20 bg-white relative overflow-hidden">
        <div className="container mx-auto px-6 relative z-10">
          {/* Section Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-3 bg-emerald-100 text-emerald-700 px-6 py-3 rounded-full text-sm font-semibold mb-6">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Our Team
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Meet Our Expert
              <span className="block text-emerald-600">Wildlife Team</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our passionate team of wildlife experts, conservationists, and guides bring decades of experience 
              to ensure your adventure is both thrilling and educational.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                name: 'Dr. Samantha Perera',
                role: 'Chief Wildlife Veterinarian',
                exp: '15 years experience',
                spec: 'Elephant rehabilitation and care',
                img: 'https://images.unsplash.com/photo-1580136606820-b1c1b5f6c5b6?q=80&w=600',
                social: { linkedin: '#', twitter: '#' }
              },
              {
                name: 'Ruwan Jayasinghe',
                role: 'Senior Wildlife Guide',
                exp: '12 years experience',
                spec: 'Leopard tracking and behavior',
                img: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=600',
                social: { linkedin: '#', twitter: '#' }
              },
              {
                name: 'Priya Wickramasinghe',
                role: 'Conservation Officer',
                exp: '10 years experience',
                spec: 'Marine turtle conservation',
                img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=600',
                social: { linkedin: '#', twitter: '#' }
              },
              {
                name: 'Thilanka Fernando',
                role: 'Photography Instructor',
                exp: '8 years experience',
                spec: 'Wildlife photography techniques',
                img: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=600',
                social: { linkedin: '#', twitter: '#' }
              },
            ].map((member, i) => (
              <div key={i} className="group bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 overflow-hidden">
                {/* Image */}
                <div className="relative overflow-hidden">
                  <img 
                    src={member.img} 
                    alt={member.name} 
                    className="h-64 w-full object-cover group-hover:scale-110 transition-transform duration-700" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  {/* Social Links */}
                  <div className="absolute bottom-4 left-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <a href={member.social.linkedin} className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>
                    </a>
                    <a href={member.social.twitter} className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                      </svg>
                    </a>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-emerald-600 transition-colors duration-300">
                    {member.name}
                  </h3>
                  <p className="text-emerald-600 font-semibold mb-3">{member.role}</p>
                  
                  {/* Experience & Specialty */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {member.exp}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {member.spec}
                    </div>
                  </div>

                  {/* Contact Button */}
                  <button className="w-full bg-emerald-500 text-white py-2 rounded-lg hover:bg-emerald-600 transition-colors duration-300 font-semibold">
                    Connect
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modern CTA Section */}
      <section className="py-20 relative overflow-hidden">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800"></div>
        
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-300/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="container mx-auto px-6 text-center relative z-10">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full mb-8">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>

          {/* Heading */}
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Join Our
            <span className="block bg-gradient-to-r from-emerald-200 to-teal-200 bg-clip-text text-transparent">
              Conservation Mission
            </span>
          </h2>
          
          {/* Subtext */}
          <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto mb-12 leading-relaxed">
            Be part of Sri Lanka's wildlife conservation story. Every tour you book contributes
            directly to protecting endangered species and their habitats.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <button className="group relative px-10 py-4 bg-white text-emerald-700 font-bold text-lg rounded-full shadow-2xl hover:shadow-white/25 transition-all duration-300 transform hover:-translate-y-1 hover:scale-105">
              <span className="relative z-10 flex items-center gap-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Contact Us
              </span>
            </button>
            
            <div className="text-white">
              <p className="text-lg font-semibold">Or call us directly:</p>
              <p className="text-2xl font-bold">+94 77 886 8965</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
