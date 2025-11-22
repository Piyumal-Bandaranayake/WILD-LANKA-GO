import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/footer';
import { API_BASE_URL } from '../config/api';
import jsPDF from 'jspdf';
import logoImage from '../assets/logo.png';

const DonationSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [donationRecorded, setDonationRecorded] = useState(false);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (!sessionId) {
      navigate('/');
      return;
    }

    const run = async () => {
      try {
        setDownloading(true);
        const resp = await fetch(`${API_BASE_URL}/donations/session/${sessionId}`);
        if (!resp.ok) {
          const err = await resp.json().catch(() => ({}));
          throw new Error(err?.message || 'Failed to verify payment');
        }
        const data = await resp.json();
        const session = data?.data?.session || data?.session;
        // Generate PDF receipt with proper invoice format
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
          doc.text(`Receipt #: ${session?.id || 'N/A'}`, pageWidth - margin, 100, { align: 'right' });
          
          // Line separator - positioned below all content with more space
          doc.setDrawColor(200, 200, 200);
          doc.setLineWidth(0.5);
          doc.line(margin, 115, pageWidth - margin, 115);
          
          return 125; // Return Y position for content with proper spacing
        };
        
        let yPosition = createFormalHeader(doc, 'Donation Receipt');
        
        // Donor Information Section
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 64, 175);
        doc.text('Donor Information', margin, yPosition);
        yPosition += 20;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(55, 65, 81);
        
        const donorInfo = [
          ['Name:', session?.customer_details?.name || session?.metadata?.donorName || 'N/A'],
          ['Email:', session?.customer_details?.email || session?.customer_email || 'N/A'],
          ['Receipt Email:', session?.metadata?.donorEmail || 'N/A']
        ];
        
        donorInfo.forEach(([label, value]) => {
          doc.setFont('helvetica', 'bold');
          doc.text(label, margin, yPosition);
          doc.setFont('helvetica', 'normal');
          doc.text(value, margin + 30, yPosition);
          yPosition += 8;
        });
        
        yPosition += 15;
        
        // Payment Details Section
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 64, 175);
        doc.text('Payment Details', margin, yPosition);
        yPosition += 20;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(55, 65, 81);
        
        const paymentInfo = [
          ['Amount:', `${amountTotal} ${String(session?.currency || '').toUpperCase()}`],
          ['Status:', session?.payment_status || 'paid'],
          ['Type:', session?.metadata?.isMonthly === 'true' ? 'Monthly Donation' : 'One-time Donation'],
          ['Payment Method:', 'Stripe'],
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
        const thankYouText = 'Thank you for your generous support towards wildlife conservation in Sri Lanka. Your contribution helps us protect and preserve our precious wildlife for future generations.';
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
        
        // Add footer
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(100);
        doc.text('Wild Lanka Go - Wildlife Conservation Portal', margin, pageHeight - 15);
        doc.text(`Page 1`, pageWidth - margin, pageHeight - 15, { align: 'right' });

        const fileName = `Donation_Receipt_${session?.id || 'receipt'}.pdf`;
        doc.save(fileName);

        // Attempt to record the donation to DB (requires auth) - only once
        if (!donationRecorded) {
          try {
            const recordResp = await fetch(`${API_BASE_URL}/donations/record-from-session`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ sessionId }),
            });
            
            if (!recordResp.ok) {
              const recordErr = await recordResp.json().catch(() => ({}));
              console.warn('Failed to record donation to database:', recordErr?.message || 'Unknown error');
              // Don't throw - this is non-fatal, receipt was already generated
            } else {
              setDonationRecorded(true);
            }
          } catch (recordError) {
            console.warn('Error recording donation to database:', recordError.message);
            // Ignore non-fatal errors - receipt was already generated
          }
        }

        setTimeout(() => navigate('/'), 800);
      } catch (e) {
        setError(e.message || 'Failed to generate receipt');
      } finally {
        setDownloading(false);
      }
    };

    run();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
      <Navbar />
      <div className="pt-20 pb-16">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <h1 className="text-2xl font-bold text-emerald-700 mb-3">Payment Successful</h1>
            <p className="text-gray-600">{downloading ? 'Preparing your receipt...' : 'Your receipt should download automatically.'}</p>
            {error && (
              <div className="mt-4 text-red-600 text-sm">{error}</div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default DonationSuccess;


