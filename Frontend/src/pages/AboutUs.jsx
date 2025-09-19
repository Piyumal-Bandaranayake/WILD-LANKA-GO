import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/footer';

export default function AboutUs() {
  return (
    <>
      <Navbar />

      {/* Hero Section */}
      <section
        className="relative h-[70vh] bg-cover bg-center flex items-center justify-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1598387993214-f22e0c2d4523?q=80&w=1200&auto=format&fit=crop')",
        }}
      >
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="relative text-center text-white max-w-3xl">
          <h1 className="text-5xl font-bold mb-4">About WildLankaGo</h1>
          <p className="text-lg">
            Dedicated to protecting Sri Lanka's wildlife heritage through sustainable tourism and conservation education
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6 md:px-12">
          <h2 className="text-3xl font-semibold text-green-800 text-center mb-12">
            Our Mission & Vision
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div>
              <img
                className="rounded-xl shadow-lg"
                src="https://images.unsplash.com/photo-1555212697-194d092e3b8f?q=80&w=800&auto=format&fit=crop"
                alt="Wildlife in Sri Lanka"
              />
            </div>
            <div>
              <div className="mb-8">
                <h3 className="text-2xl font-semibold text-green-700 mb-3">Mission</h3>
                <p className="text-gray-700">
                  To provide exceptional wildlife experiences that educate, inspire, and contribute
                  to the conservation of Sri Lanka's unique biodiversity while supporting local
                  communities and promoting sustainable tourism practices.
                </p>
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-green-700 mb-3">Vision</h3>
                <p className="text-gray-700">
                  To be Sri Lanka's leading wildlife tourism platform that sets the standard for
                  responsible wildlife encounters, conservation education, and community-based
                  eco-tourism initiatives.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Achievements */}
      <section className="py-16 bg-green-50">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-semibold text-green-800 text-center mb-12">
            Our Achievements
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                title: 'Excellence in Wildlife Tourism',
                desc: 'Recognized by Sri Lanka Tourism Board for outstanding contribution to sustainable wildlife tourism',
                year: 2023,
              },
              {
                title: 'Conservation Partnership',
                desc: 'Official partner with Department of Wildlife Conservation for responsible tourism practices',
                year: 2022,
              },
              {
                title: 'International Recognition',
                desc: 'Featured in National Geographic for innovative wildlife conservation approaches',
                year: 2021,
              },
              {
                title: 'Community Impact Award',
                desc: 'Honored for contributions to local community development through eco-tourism',
                year: 2020,
              },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-green-800 mb-2">{item.title}</h3>
                <p className="text-gray-600 mb-4">{item.desc}</p>
                <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                  {item.year}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Impact in Numbers */}
      <section className="py-16 bg-green-800 text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-semibold mb-12">Our Impact in Numbers</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
            {[
              { number: '10K+', label: 'Wildlife Encounters' },
              { number: '500+', label: 'Successful Tours' },
              { number: '25', label: 'Protected Areas' },
              { number: '50+', label: 'Expert Team' },
              { number: '98%', label: 'Customer Satisfaction' },
              { number: '15', label: 'Years Experience' },
            ].map((stat, i) => (
              <div key={i}>
                <p className="text-3xl font-bold">{stat.number}</p>
                <p className="text-green-200">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Expert Team */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-semibold text-green-800 text-center mb-12">
            Meet Our Expert Team
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                name: 'Dr. Samantha Perera',
                role: 'Chief Wildlife Veterinarian',
                exp: '15 years experience',
                spec: 'Elephant rehabilitation and care',
                img: 'https://images.unsplash.com/photo-1580136606820-b1c1b5f6c5b6?q=80&w=600',
              },
              {
                name: 'Ruwan Jayasinghe',
                role: 'Senior Wildlife Guide',
                exp: '12 years experience',
                spec: 'Leopard tracking and behavior',
                img: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=600',
              },
              {
                name: 'Priya Wickramasinghe',
                role: 'Conservation Officer',
                exp: '10 years experience',
                spec: 'Marine turtle conservation',
                img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=600',
              },
              {
                name: 'Thilanka Fernando',
                role: 'Photography Instructor',
                exp: '8 years experience',
                spec: 'Wildlife photography techniques',
                img: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=600',
              },
            ].map((member, i) => (
              <div key={i} className="bg-green-50 rounded-lg shadow-lg overflow-hidden">
                <img src={member.img} alt={member.name} className="h-56 w-full object-cover" />
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-green-800">{member.name}</h3>
                  <p className="text-green-600">{member.role}</p>
                  <p className="text-sm text-gray-600 mt-2">⏳ {member.exp}</p>
                  <p className="text-sm text-gray-600">⭐ {member.spec}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-green-600 text-white text-center">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-semibold mb-4">Join Our Conservation Mission</h2>
          <p className="mb-6 max-w-2xl mx-auto">
            Be part of Sri Lanka's wildlife conservation story. Every tour you book contributes
            directly to protecting endangered species and their habitats.
          </p>
          <button className="bg-white text-green-700 font-semibold px-6 py-3 rounded-lg shadow hover:bg-gray-100 transition">
            📞 Contact Us
          </button>
        </div>
      </section>

      <Footer />
    </>
  );
}
