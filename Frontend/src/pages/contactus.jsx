import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/footer';

const ContactUs = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section
        className="relative h-[60vh] bg-cover bg-center flex items-center justify-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?q=80&w=1200&auto=format&fit=crop')",
        }}
      >
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="relative text-center text-white">
          <h1 className="text-5xl font-bold mb-4">Get In Touch</h1>
          <p className="text-lg max-w-2xl mx-auto">
            Have questions about our wildlife tours? Need help planning your
            adventure? We’re here to help you every step of the way.
          </p>
        </div>
      </section>

      {/* Contact Form & Info */}
      <main className="container mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 gap-12">
          {/* Form */}
          <div className="bg-white p-8 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Send Us a Message
            </h2>
            <form className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="+94 XX XXX XXXX"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-1">
                    Preferred Contact Method
                  </label>
                  <select className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
                    <option>Email</option>
                    <option>Phone</option>
                    <option>WhatsApp</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">
                  Subject *
                </label>
                <select className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option>Select a subject</option>
                  <option>Tour Bookings</option>
                  <option>Wildlife Emergency</option>
                  <option>Conservation Programs</option>
                  <option>General Inquiry</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1">
                  Message *
                </label>
                <textarea
                  rows="5"
                  maxLength={500}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Tell us how we can help you..."
                ></textarea>
                <p className="text-sm text-gray-500 mt-1">
                  0/500 characters
                </p>
              </div>

              <button
                type="submit"
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                ✉️ Send Message
              </button>
            </form>
          </div>

          {/* Contact Information */}
          <div className="bg-white p-8 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Contact Information
            </h2>
            <div className="space-y-6">
              <div className="p-4 border rounded-lg flex items-start gap-4">
                <span className="text-green-600 text-2xl">📞</span>
                <div>
                  <h3 className="font-semibold">Phone Numbers</h3>
                  <p>+94 11 123 4567</p>
                  <p>+94 77 123 4567</p>
                  <p className="text-sm text-gray-500">
                    Available 24/7 for emergencies
                  </p>
                </div>
              </div>
              <div className="p-4 border rounded-lg flex items-start gap-4">
                <span className="text-green-600 text-2xl">📧</span>
                <div>
                  <h3 className="font-semibold">Email Addresses</h3>
                  <p>info@wildlankago.lk</p>
                  <p>bookings@wildlankago.lk</p>
                  <p className="text-sm text-gray-500">
                    Response within 24 hours
                  </p>
                </div>
              </div>
              <div className="p-4 border rounded-lg flex items-start gap-4">
                <span className="text-green-600 text-2xl">📍</span>
                <div>
                  <h3 className="font-semibold">Office Location</h3>
                  <p>123 Wildlife Avenue</p>
                  <p>Colombo 03, Sri Lanka</p>
                  <p className="text-sm text-gray-500">
                    Mon-Fri: 8AM-6PM, Sat: 8AM-4PM
                  </p>
                </div>
              </div>
              <div className="p-4 border rounded-lg flex items-start gap-4">
                <span className="text-green-600 text-2xl">🚨</span>
                <div>
                  <h3 className="font-semibold">Emergency Hotline</h3>
                  <p>+94 70 WILDLIFE</p>
                  <p>(+94 70 945 354 33)</p>
                  <p className="text-sm text-gray-500">
                    For wildlife emergencies only
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Department Contacts */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Department Contacts
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                name: 'General Inquiries',
                email: 'info@wildlankago.lk',
                phone: '+94 11 123 4567',
              },
              {
                name: 'Tour Bookings',
                email: 'bookings@wildlankago.lk',
                phone: '+94 11 123 4568',
              },
              {
                name: 'Wildlife Emergencies',
                email: 'emergency@wildlankago.lk',
                phone: '+94 70 945 354 33',
              },
              {
                name: 'Conservation Programs',
                email: 'conservation@wildlankago.lk',
                phone: '+94 11 123 4569',
              },
            ].map((dept, i) => (
              <div
                key={i}
                className="border-l-4 border-green-600 pl-4 py-2 bg-gray-50 rounded"
              >
                <h3 className="font-semibold text-green-800">{dept.name}</h3>
                <p className="text-sm text-gray-700">{dept.email}</p>
                <p className="text-sm text-gray-700">{dept.phone}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Map Section */}
      <section className="py-16 bg-gray-100">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-green-800 mb-6">
            Visit Our Office
          </h2>
          <p className="text-gray-600 mb-8">
            Located in the heart of Colombo, easily accessible by public transport
          </p>
          <div className="rounded-lg overflow-hidden shadow-lg">
            <iframe
              title="WildLankaGo Office"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d63314.60646530615!2d79.821185!3d6.927078!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ae2595f38f7f5a1%3A0x85a7b58c5b0f3c6!2sColombo!5e0!3m2!1sen!2slk!4v1676549876543!5m2!1sen!2slk"
              width="100%"
              height="450"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ContactUs;
