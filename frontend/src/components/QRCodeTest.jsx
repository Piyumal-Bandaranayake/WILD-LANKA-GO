import React, { useState } from 'react';
import EventRegistrationQRCode from './EventRegistrationQRCode';

/**
 * Test component for QR Code functionality
 * This can be used to test the QR code generation
 */
const QRCodeTest = () => {
  const [showQRCode, setShowQRCode] = useState(false);

  // Mock data for testing
  const mockRegistration = {
    _id: 'test-registration-123',
    registrationId: 'EVT-20241201-1234',
    participants: 2,
    status: 'registered',
    registrationDate: new Date().toISOString(),
    contactInfo: {
      email: 'test@example.com',
      phone: '+94 77 123 4567'
    },
    user: {
      firstName: 'John',
      lastName: 'Doe'
    }
  };

  const mockEvent = {
    _id: 'test-event-456',
    title: 'Wildlife Photography Workshop',
    date: '2024-12-15',
    time: '09:00 AM',
    location: 'Yala National Park',
    description: 'Learn wildlife photography techniques in the heart of nature'
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">
          QR Code Test Component
        </h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Data</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Registration Details:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li><strong>ID:</strong> {mockRegistration.registrationId}</li>
                <li><strong>Participants:</strong> {mockRegistration.participants}</li>
                <li><strong>Status:</strong> {mockRegistration.status}</li>
                <li><strong>Email:</strong> {mockRegistration.contactInfo.email}</li>
                <li><strong>Phone:</strong> {mockRegistration.contactInfo.phone}</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Event Details:</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li><strong>Title:</strong> {mockEvent.title}</li>
                <li><strong>Date:</strong> {mockEvent.date}</li>
                <li><strong>Time:</strong> {mockEvent.time}</li>
                <li><strong>Location:</strong> {mockEvent.location}</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={() => setShowQRCode(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            🧪 Test QR Code Generation
          </button>
        </div>

        {showQRCode && (
          <EventRegistrationQRCode
            registration={mockRegistration}
            event={mockEvent}
            onClose={() => setShowQRCode(false)}
          />
        )}
      </div>
    </div>
  );
};

export default QRCodeTest;
