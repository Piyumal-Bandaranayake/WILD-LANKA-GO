import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/footer';
import { API_BASE_URL } from '../config/api';
import jsPDF from 'jspdf';
import logoImage from '../assets/logo.png';

const BookingSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [paymentRecorded, setPaymentRecorded] = useState(false);
  const [bookingData, setBookingData] = useState(null);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (!sessionId) {
      navigate('/');
      return;
    }

    const run = async () => {
      try {
        setDownloading(true);
        
        // Get session details from Stripe
        const resp = await fetch(`${API_BASE_URL}/donations/session/${sessionId}`);
        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}));
          throw new Error(err?.message || 'Failed to verify payment');
        }
        const data = await resp.json();
        const session = data?.data?.session || data?.session;
        
        // Generate booking confirmation PDF
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 20;
        const now = new Date();
        const amountTotal = (session?.amount_total ?? 0) / (session?.currency && ['bif','clp','djf','gnf','jpy','kmf','krw','mga','pyg','rwf','ugx','vnd','vuv','xaf','xof','xpf'].includes(session.currency) ? 1 : 100);
        
        // Create formal header
        const createFormalHeader = (doc, title) => {
          // Header background with gradient effect
          doc.setFillColor(30, 64, 175); // Blue-800
          doc.rect(0, 0, pageWidth, 60, 'F');
          
          // Add actual logo
          try {
            // Add logo image (resize to fit nicely in header)
            doc.addImage(logoImage, 'PNG', 15, 10, 35, 35);
          } catch (error) {
            console.warn('Could not load logo image, using text fallback:', error);
            // Fallback to text logo if image fails
            doc.setFillColor(255, 255, 255);
            doc.circle(32, 27, 15, 'F');
            doc.setTextColor(30, 64, 175);
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('WLG', 27, 32, { align: 'center' });
          }
          
          // Company name - positioned after logo
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(18);
          doc.setFont('helvetica', 'bold');
          doc.text('Wild Lanka Go', 60, 25);
          doc.setFontSize(11);
          doc.setFont('helvetica', 'normal');
          doc.text('Wildlife Conservation Portal', 60, 35);
          
          // Contact info on the right - properly spaced
          doc.setFontSize(9);
          doc.text('123 Wildlife Sanctuary Road', pageWidth - margin, 20, { align: 'right' });
          doc.text('Colombo, Sri Lanka', pageWidth - margin, 28, { align: 'right' });
          doc.text('info@wildlankago.com', pageWidth - margin, 36, { align: 'right' });
          doc.text('+94 11 234 5678', pageWidth - margin, 44, { align: 'right' });
          
          // Document title section - positioned below header with proper spacing
          doc.setTextColor(55, 65, 81); // Gray-700
          doc.setFontSize(20);
          doc.setFont('helvetica', 'bold');
          doc.text(title, margin, 85);
          
          // Date and invoice info - positioned on the right side with proper spacing
          doc.setFontSize(10);
          doc.text(`Generated on: ${now.toLocaleDateString()}`, pageWidth - margin, 85, { align: 'right' });
          
          // Invoice number - positioned below date
          doc.setFontSize(10);
          doc.text(`Booking #: ${session?.id || 'N/A'}`, pageWidth - margin, 100, { align: 'right' });
          
          // Line separator - positioned below all content with more space
          doc.setDrawColor(200, 200, 200);
          doc.setLineWidth(0.5);
          doc.line(margin, 115, pageWidth - margin, 115);
          
          return 125; // Return Y position for content with proper spacing
        };
        
        let yPosition = createFormalHeader(doc, 'Booking Confirmation');
        
        // Customer Information Section
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 64, 175);
        doc.text('Customer Information', margin, yPosition);
        
        yPosition += 15;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(55, 65, 81);
        
        const customerInfo = [
          ['Name:', session?.customer_details?.name || session?.metadata?.customerName || 'N/A'],
          ['Email:', session?.customer_details?.email || session?.customer_email || 'N/A'],
          ['Phone:', session?.customer_details?.phone || 'N/A']
        ];
        
        customerInfo.forEach(([label, value]) => {
          doc.setFont('helvetica', 'bold');
          doc.text(label, margin, yPosition);
          doc.setFont('helvetica', 'normal');
          doc.text(value, margin + 30, yPosition);
          yPosition += 8;
        });
        
        yPosition += 15;
        
        // Booking Details Section
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 64, 175);
        doc.text('Booking Details', margin, yPosition);
        
        yPosition += 15;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(55, 65, 81);
        
        const bookingInfo = [
          ['Activity:', session?.metadata?.activityTitle || 'Activity Booking'],
          ['Date:', session?.metadata?.bookingDate ? new Date(session.metadata.bookingDate).toLocaleDateString() : 'N/A'],
          ['Participants:', session?.metadata?.participants || 'N/A'],
          ['Location:', session?.metadata?.location || 'Wildlife Sanctuary']
        ];
        
        bookingInfo.forEach(([label, value]) => {
          doc.setFont('helvetica', 'bold');
          doc.text(label, margin, yPosition);
          doc.setFont('helvetica', 'normal');
          doc.text(value, margin + 40, yPosition);
          yPosition += 8;
        });
        
        yPosition += 20;
        
        // Payment Details Section
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 64, 175);
        doc.text('Payment Details', margin, yPosition);
        
        yPosition += 15;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(55, 65, 81);
        
        const paymentInfo = [
          ['Amount:', `${amountTotal.toLocaleString()} ${session?.currency?.toUpperCase() || 'USD'}`],
          ['Status:', session?.payment_status || 'paid'],
          ['Payment Method:', 'Credit/Debit Card'],
          ['Transaction ID:', session?.id || 'N/A']
        ];
        
        paymentInfo.forEach(([label, value]) => {
          doc.setFont('helvetica', 'bold');
          doc.text(label, margin, yPosition);
          doc.setFont('helvetica', 'normal');
          doc.text(value, margin + 40, yPosition);
          yPosition += 8;
        });
        
        yPosition += 20;
        
        // Thank you message
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 64, 175);
        doc.text('Thank You!', margin, yPosition);
        yPosition += 15;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(55, 65, 81);
        const thankYouText = 'Thank you for booking with Wild Lanka Go! We look forward to providing you with an amazing wildlife experience. Please arrive 15 minutes before your scheduled time.';
        const splitText = doc.splitTextToSize(thankYouText, pageWidth - 2 * margin);
        doc.text(splitText, margin, yPosition);
        yPosition += splitText.length * 5 + 10;
        
        // Transaction ID section with proper spacing
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 64, 175);
        doc.text('Transaction Reference:', margin, yPosition);
        yPosition += 8;
        
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text(session?.id || 'N/A', margin, yPosition);
        
        const fileName = `booking-confirmation-${session?.id?.slice(-8) || 'unknown'}.pdf`;
        doc.save(fileName);

        // Record the booking payment
        if (!paymentRecorded) {
          try {
            const recordResp = await fetch(`${API_BASE_URL}/bookings/record-payment`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ sessionId }),
            });
            
            if (!recordResp.ok) {
              const recordErr = await recordResp.json().catch(() => ({}));
              console.warn('Failed to record booking payment:', recordErr?.message || 'Unknown error');
            } else {
              setPaymentRecorded(true);
              const bookingData = await recordResp.json();
              setBookingData(bookingData.data);
            }
          } catch (recordError) {
            console.warn('Error recording booking payment:', recordError.message);
          }
        }

        setTimeout(() => navigate('/dashboard'), 2000);
      } catch (e) {
        setError(e.message || 'Failed to generate confirmation');
      } finally {
        setDownloading(false);
      }
    };

    run();
  }, [searchParams, navigate, paymentRecorded]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
      <Navbar />
      <div className="pt-20 pb-16">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-emerald-700 mb-3">Booking Confirmed!</h1>
              <p className="text-gray-600 mb-4">
                {downloading ? 'Preparing your confirmation...' : 'Your booking confirmation should download automatically.'}
              </p>
              {paymentRecorded && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <p className="text-green-800 text-sm">
                    ✅ Payment recorded successfully! Your booking is now confirmed.
                  </p>
                </div>
              )}
            </div>
            
            {error && (
              <div className="mt-4 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg p-4">
                {error}
              </div>
            )}
            
            <div className="mt-6">
              <p className="text-sm text-gray-500 mb-4">
                You will be redirected to your dashboard shortly...
              </p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  Go to Dashboard
                </button>
                <button
                  onClick={() => navigate('/my-bookings')}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  View My Bookings
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default BookingSuccess;
