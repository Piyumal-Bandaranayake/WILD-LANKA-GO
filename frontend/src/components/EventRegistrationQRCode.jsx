import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';

/**
 * QR Code Generator Component for Event Registrations
 */
const EventRegistrationQRCode = ({ registration, event, onClose }) => {
  const [qrCodeDataURL, setQrCodeDataURL] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    generateQRCode();
  }, [registration, event]);

  const generateQRCode = async () => {
    try {
      setLoading(true);
      setError(null);

      // Create QR code data with registration information
      const qrData = {
        type: 'event_registration',
        registrationId: registration.registrationId,
        eventId: event._id,
        eventTitle: event.title,
        eventDate: event.date,
        eventTime: event.time,
        eventLocation: event.location,
        participantName: registration.user?.firstName + ' ' + registration.user?.lastName,
        participantEmail: registration.contactInfo?.email,
        participants: registration.participants,
        registrationDate: registration.registrationDate,
        status: registration.status,
        // Add verification URL for scanning
        verificationUrl: `${window.location.origin}/verify-registration/${registration.registrationId}`,
        // Add timestamp for freshness
        generatedAt: new Date().toISOString()
      };

      // Convert to JSON string
      const qrString = JSON.stringify(qrData);

      // Generate QR code as data URL
      const dataURL = await QRCode.toDataURL(qrString, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      });

      setQrCodeDataURL(dataURL);
    } catch (err) {
      console.error('Error generating QR code:', err);
      setError('Failed to generate QR code');
    } finally {
      setLoading(false);
    }
  };

  const downloadQRCode = () => {
    if (!qrCodeDataURL) return;

    const link = document.createElement('a');
    link.download = `event-registration-${registration.registrationId}.png`;
    link.href = qrCodeDataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printQRCode = () => {
    if (!qrCodeDataURL) return;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Event Registration QR Code</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              text-align: center; 
              padding: 20px;
              margin: 0;
            }
            .qr-container { 
              max-width: 400px; 
              margin: 0 auto; 
              border: 2px solid #333; 
              padding: 20px; 
              border-radius: 10px;
            }
            .qr-image { 
              max-width: 100%; 
              height: auto; 
            }
            .registration-info {
              margin-top: 15px;
              text-align: left;
            }
            .info-row {
              margin: 5px 0;
              font-size: 14px;
            }
            .label {
              font-weight: bold;
              color: #333;
            }
            @media print {
              body { margin: 0; padding: 10px; }
              .qr-container { border: 1px solid #000; }
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <h2>Event Registration QR Code</h2>
            <img src="${qrCodeDataURL}" alt="QR Code" class="qr-image" />
            <div class="registration-info">
              <div class="info-row"><span class="label">Registration ID:</span> ${registration.registrationId}</div>
              <div class="info-row"><span class="label">Event:</span> ${event.title}</div>
              <div class="info-row"><span class="label">Date:</span> ${new Date(event.date).toLocaleDateString()}</div>
              <div class="info-row"><span class="label">Time:</span> ${event.time}</div>
              <div class="info-row"><span class="label">Location:</span> ${event.location}</div>
              <div class="info-row"><span class="label">Participants:</span> ${registration.participants}</div>
              <div class="info-row"><span class="label">Status:</span> ${registration.status}</div>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Generating QR Code</h3>
            <p className="text-gray-600">Please wait while we create your registration QR code...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">❌</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Error Generating QR Code</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="flex gap-3">
              <button
                onClick={generateQRCode}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={onClose}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-emerald-600 text-5xl mb-3">📱</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Registration QR Code</h2>
          <p className="text-gray-600">Scan this QR code for event check-in</p>
        </div>

        {/* QR Code Display */}
        <div className="text-center mb-6">
          <div className="bg-white p-4 rounded-xl border-2 border-gray-200 inline-block">
            <img 
              src={qrCodeDataURL} 
              alt="Event Registration QR Code" 
              className="w-64 h-64 mx-auto"
            />
          </div>
        </div>

        {/* Registration Details */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <h3 className="font-semibold text-gray-800 mb-3">Registration Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Registration ID:</span>
              <span className="font-medium text-gray-800">{registration.registrationId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Event:</span>
              <span className="font-medium text-gray-800">{event.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Date:</span>
              <span className="font-medium text-gray-800">{new Date(event.date).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Time:</span>
              <span className="font-medium text-gray-800">{event.time}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Participants:</span>
              <span className="font-medium text-gray-800">{registration.participants}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className={`font-medium px-2 py-1 rounded-full text-xs ${
                registration.status === 'registered' ? 'bg-green-100 text-green-800' :
                registration.status === 'attended' ? 'bg-blue-100 text-blue-800' :
                registration.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {registration.status}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={downloadQRCode}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <span>📥</span>
            Download
          </button>
          <button
            onClick={printQRCode}
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <span>🖨️</span>
            Print
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-3 rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>

        {/* Instructions */}
        <div className="mt-6 p-4 bg-blue-50 rounded-xl">
          <h4 className="font-semibold text-blue-800 mb-2">📋 How to Use This QR Code:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Present this QR code at event check-in</li>
            <li>• Event staff will scan it to verify your registration</li>
            <li>• Keep this QR code safe until the event date</li>
            <li>• You can download or print it for offline access</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default EventRegistrationQRCode;
