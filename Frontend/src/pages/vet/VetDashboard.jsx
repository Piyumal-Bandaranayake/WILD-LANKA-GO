import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { protectedApi } from '../../services/authService';
import RoleGuard from '../../components/RoleGuard';
import Navbar from '../../components/Navbar';
import Footer from '../../components/footer';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import logoImage from '../../assets/logo.png';
import { validateVetCaseForm, getValidationMessageClasses } from '../../utils/formValidation';

const VetDashboard = () => {
  const { backendUser, user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Dashboard data states
  const [stats, setStats] = useState({
    total_cases: 0,
    pending_cases: 0,
    completed_cases: 0,
    closed_cases: 0,
    available_vets: 0
  });
  const [recentCases, setRecentCases] = useState([]);
  const [myTreatments, setMyTreatments] = useState([]);
  const [myReports, setMyReports] = useState([]);

  // Case creation states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCase, setNewCase] = useState({
    animalType: '',
    description: '',
    location: '',
    priority: 'Medium',
    status: 'Open',
    reportedBy: '',
    contactInfo: '',
    symptoms: '',
    estimatedAge: '',
    weight: '',
    images: []
  });
  const [selectedImages, setSelectedImages] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Validation states
  const [validationErrors, setValidationErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});
  const [isFormValid, setIsFormValid] = useState(false);

  // Case management states
  const [animalCases, setAnimalCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCase, setEditingCase] = useState(null);
  const [deletingCase, setDeletingCase] = useState(null);
  const [downloadingReport, setDownloadingReport] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [markingDone, setMarkingDone] = useState(null);

  // Treatment plan states
  const [showTreatmentModal, setShowTreatmentModal] = useState(false);
  const [selectedCaseForTreatment, setSelectedCaseForTreatment] = useState(null);
  const [caseTreatments, setCaseTreatments] = useState({}); // Track treatments for each case
  const [showTreatmentView, setShowTreatmentView] = useState(false);
  const [selectedTreatment, setSelectedTreatment] = useState(null);
  
  // Validation states for treatment form
  const [treatmentValidation, setTreatmentValidation] = useState({
    treatment: { isValid: true, message: '' },
    diagnosis: { isValid: true, message: '' },
    startDate: { isValid: true, message: '' },
    endDate: { isValid: true, message: '' },
    medications: { isValid: true, message: '' }
  });

  // Validation states for medicine form
  const [medicineValidation, setMedicineValidation] = useState({
    name: { isValid: true, message: '' },
    strength: { isValid: true, message: '' },
    currentStock: { isValid: true, message: '' },
    minimumStock: { isValid: true, message: '' }
  });

  // Medicine search state
  const [medicineSearchTerm, setMedicineSearchTerm] = useState('');
  
  // Animal tracking states
  const [showTrackModal, setShowTrackModal] = useState(false);
  const [selectedCaseForTracking, setSelectedCaseForTracking] = useState(null);
  const [showDeviceModal, setShowDeviceModal] = useState(false);
  const [trackingDevices, setTrackingDevices] = useState({}); // Track devices for each case
  const [newDeviceId, setNewDeviceId] = useState('');
  const [showLiveLocation, setShowLiveLocation] = useState(false);
  const [newTreatment, setNewTreatment] = useState({
    treatment: '',
    diagnosis: '',
    medication: '',
    medicationId: '',
    medicationQuantity: 0,
    dosage: '',
    frequency: '',
    duration: '',
    notes: '',
    startDate: '',
    endDate: '',
    medications: [] // Array for multiple medications
  });

  // Inventory states
  const [inventoryStats, setInventoryStats] = useState(null);
  const [medicines, setMedicines] = useState([]);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState(null);

  // Filter medicines based on search term
  const filteredMedicines = medicines.filter(medicine => 
    medicine.name.toLowerCase().includes(medicineSearchTerm.toLowerCase())
  );
  const [newMedicine, setNewMedicine] = useState({
    name: '',
    category: 'Other',
    form: 'Tablet',
    strength: '',
    unit: 'mg',
    currentStock: 0,
    minimumStock: 10,
    status: 'Active',
    notes: ''
  });
  const [stockUpdate, setStockUpdate] = useState({
    action: 'add',
    quantity: 0
  });

  // Multiple medications state
  const [currentMedication, setCurrentMedication] = useState({
    medicationId: '',
    medicationName: '',
    quantity: 0,
    dosage: '',
    frequency: '',
    duration: '',
    notes: ''
  });

  // Vet Support states
  const [availableVets, setAvailableVets] = useState([]);
  const [loadingVets, setLoadingVets] = useState(false);
  const [showCallModal, setShowCallModal] = useState(false);
  const [callingVet, setCallingVet] = useState(null);

  useEffect(() => {
    // Load data in proper sequence to avoid timing issues
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // First, fetch animal cases
        await fetchAnimalCases();
        // Then fetch dashboard data (which can use the animal cases if API fails)
        await fetchDashboardData();
        // Finally fetch other data
        fetchInventoryStats();
        fetchMedicines();
        fetchAvailableVets();
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [backendUser, user]); // Re-fetch when user changes

  // Update stats whenever animalCases changes (for real-time updates)
  useEffect(() => {
    console.log('📊 Updating stats from animalCases:', animalCases.length, 'cases');
    
    const totalCases = animalCases.length;
    const pendingCases = animalCases.filter(c => ['Open', 'In Progress'].includes(c.status)).length;
    const completedCases = animalCases.filter(c => c.status === 'Resolved').length;
    const closedCases = animalCases.filter(c => c.status === 'Closed').length;
    
    console.log('📊 Calculated stats:', { totalCases, pendingCases, completedCases, closedCases });
    
    setStats(prevStats => ({
      ...prevStats,
      total_cases: totalCases,
      pending_cases: pendingCases,
      completed_cases: completedCases,
      closed_cases: closedCases,
      available_vets: prevStats?.available_vets || 0
    }));

    // Update other data as well
    setRecentCases(animalCases.slice(0, 3));
    setMyTreatments(animalCases.filter(c => ['In Progress', 'Open'].includes(c.status)));
    setMyReports(animalCases.filter(c => c.status === 'Resolved'));
  }, [animalCases]);

  // Auto-refresh dashboard data every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDashboardData();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Populate form when editing a treatment
  useEffect(() => {
    if (selectedTreatment) {
      setNewTreatment({
        treatment: selectedTreatment.treatment || '',
        diagnosis: selectedTreatment.diagnosis || '',
        medication: selectedTreatment.medication || '',
        medicationId: selectedTreatment.medicationId || '',
        medicationQuantity: selectedTreatment.medicationQuantity || 0,
        dosage: selectedTreatment.dosage || '',
        frequency: selectedTreatment.frequency || '',
        duration: selectedTreatment.duration || '',
        notes: selectedTreatment.notes || '',
        startDate: selectedTreatment.startDate ? new Date(selectedTreatment.startDate).toISOString().split('T')[0] : '',
        endDate: selectedTreatment.endDate ? new Date(selectedTreatment.endDate).toISOString().split('T')[0] : '',
        medications: selectedTreatment.medications || []
      });
      // Reset validation state when editing
      setTreatmentValidation({
        treatment: { isValid: true, message: '' },
        diagnosis: { isValid: true, message: '' },
        startDate: { isValid: true, message: '' },
        endDate: { isValid: true, message: '' },
        medications: { isValid: true, message: '' }
      });
    }
  }, [selectedTreatment]);

  // Fetch animal cases when switching to cases or reports tab
  useEffect(() => {
    if (activeTab === 'cases' || activeTab === 'reports') {
      fetchAnimalCases();
    }
  }, [activeTab]);

  // Clear medicine search when switching away from inventory tab
  useEffect(() => {
    if (activeTab !== 'inventory') {
      setMedicineSearchTerm('');
    }
  }, [activeTab]);

  const fetchDashboardData = async () => {
    try {
      setError(null);

      console.log('Fetching vet dashboard data...');
      console.log('User context:', { backendUser, user });
      
      // Check if user is properly authenticated
      if (!backendUser && !user) {
        console.error('No user authentication found');
        setError('Please log in to access your dashboard');
        return;
      }

      // Try to fetch real data from API
      try {
        const response = await protectedApi.getVetDashboardStats();
        console.log('API Response:', response.data);
        
        // The API returns { success: true, data: { ... } }
        const apiData = response.data.data || response.data;
        
        // Update stats with API data, but preserve calculated stats if API data is missing
        setStats(prevStats => ({
          total_cases: apiData.total_cases || prevStats?.total_cases || 0,
          pending_cases: apiData.pending_cases || prevStats?.pending_cases || 0,
          completed_cases: apiData.completed_cases || prevStats?.completed_cases || 0,
          closed_cases: apiData.closed_cases || prevStats?.closed_cases || 0,
          available_vets: apiData.available_vets || prevStats?.available_vets || 0
        }));
        setRecentCases(apiData.recent_cases || []);
        setMyTreatments(apiData.active_treatments || []);
        setMyReports(apiData.completed_treatments || []);
      } catch (apiError) {
        console.log('API not available, stats will be calculated from animal cases data:', apiError);
        // Stats are now calculated automatically from animalCases in the useEffect
        // No need to set them here as they will be updated when animalCases changes
      }

      console.log('Vet dashboard data loaded successfully');
      
    } catch (error) {
      console.error('Dashboard data fetch error:', error);
      setError('Failed to load dashboard data. Please try again.');
    }
  };

  const fetchAnimalCases = async () => {
    try {
      console.log('🔍 Fetching animal cases...');
      // Add cache-busting parameter to avoid 304 responses
      const response = await protectedApi.getAnimalCases({ _t: Date.now() });
      console.log('📊 Animal cases API response:', response);
      console.log('📊 Response data:', response.data);
      console.log('📊 Response success:', response.success);
      console.log('📊 Full response structure:', JSON.stringify(response, null, 2));
      
      // Check if response has the expected structure
      let casesData = [];
      if (response && response.data && response.data.data && Array.isArray(response.data.data)) {
        casesData = response.data.data;
        setAnimalCases(casesData);
        console.log('✅ Animal cases set:', casesData.length, 'cases');
      } else if (response && response.data && Array.isArray(response.data)) {
        casesData = response.data;
        setAnimalCases(casesData);
        console.log('✅ Animal cases set (direct data):', casesData.length, 'cases');
      } else if (response && Array.isArray(response)) {
        // Handle case where response is directly an array
        casesData = response;
        setAnimalCases(casesData);
        console.log('✅ Animal cases set (direct array):', casesData.length, 'cases');
      } else {
        console.log('⚠️ No animal cases data found in response');
        console.log('⚠️ Response type:', typeof response);
        console.log('⚠️ Response keys:', Object.keys(response || {}));
        setAnimalCases([]);
      }

      // Stats will be updated automatically by the useEffect that watches animalCases
      
      // Fetch treatments for all cases
      if (casesData.length > 0) {
        await fetchAllCaseTreatments(casesData);
      }
    } catch (error) {
      console.error('❌ Error fetching animal cases:', error);
      setError('Failed to load animal cases');
    }
  };

  const handleEditCase = (case_) => {
    setEditingCase(case_);
    setShowEditModal(true);
  };

  const handleUpdateCase = async (e) => {
    e.preventDefault();
    try {
      setUploadingImages(true);
      setError(null);

      // Only send priority and status for update
      const updateData = {
        priority: editingCase.priority,
        status: editingCase.status
      };

      // Use direct API call with JSON content type instead of FormData
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api'}/animal-cases/${editingCase._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        throw new Error('Failed to update case');
      }

      const result = await response.json();
      console.log('Update result:', result);
      
      setShowEditModal(false);
      setEditingCase(null);
      setUploadingImages(false);
      
      // Refresh the cases list
      await fetchAnimalCases();
      await fetchDashboardData();
      
      alert('Case priority and status updated successfully!');
    } catch (error) {
      console.error('Error updating animal case:', error);
      setError('Failed to update case. Please try again.');
      setUploadingImages(false);
    }
  };

  const handleDeleteCase = async (caseId) => {
    if (!window.confirm('Are you sure you want to delete this animal case? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingCase(caseId);
      await protectedApi.deleteAnimalCase(caseId);
      
      // Find the case being deleted to determine its status
      const deletedCase = animalCases.find(c => c._id === caseId);
      
      // Remove from local state
      const updatedCases = animalCases.filter(c => c._id !== caseId);
      setAnimalCases(updatedCases);
      
      // Update stats immediately
      setStats(prevStats => ({
        ...prevStats,
        total_cases: Math.max((prevStats?.total_cases || 0) - 1, 0),
        pending_cases: deletedCase && ['Open', 'In Progress'].includes(deletedCase.status) 
          ? Math.max((prevStats?.pending_cases || 0) - 1, 0) 
          : prevStats?.pending_cases || 0,
        completed_cases: deletedCase && deletedCase.status === 'Resolved'
          ? Math.max((prevStats?.completed_cases || 0) - 1, 0)
          : prevStats?.completed_cases || 0
      }));
      
      setDeletingCase(null);
      
      alert('Animal case deleted successfully!');
    } catch (error) {
      console.error('Error deleting animal case:', error);
      setError('Failed to delete animal case. Please try again.');
      setDeletingCase(null);
    }
  };

  const handleMarkCaseDone = async (caseId) => {
    if (!window.confirm('Are you sure you want to mark this case as completed? This will move it from the active cases list.')) {
      return;
    }

    try {
      setMarkingDone(caseId);
      
      // Update case status to Resolved (matching backend logic)
      const response = await protectedApi.updateAnimalCase(caseId, { status: 'Resolved' });
      console.log('Case update response:', response);
      
      // Update local state - remove from animalCases and update stats
      const updatedCases = animalCases.filter(c => c._id !== caseId);
      setAnimalCases(updatedCases);
      
      // Update stats immediately with correct field names
      setStats(prevStats => ({
        ...prevStats,
        completed_cases: (prevStats?.completed_cases || 0) + 1,
        pending_cases: Math.max((prevStats?.pending_cases || 0) - 1, 0),
        total_cases: (prevStats?.total_cases || 0) // Keep total the same, just move from pending to completed
      }));
      
      // Show success message
      setSuccessMessage('Case marked as completed successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error marking case as done:', error);
      setError(`Failed to mark case as completed: ${error.response?.data?.message || error.message}`);
    } finally {
      setMarkingDone(null);
    }
  };

  // PDF Generation Functions
  const createFormalHeader = (doc, title, subtitle = '') => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    
    // Header background with gradient effect
    doc.setFillColor(30, 64, 175); // Blue-800
    doc.rect(0, 0, pageWidth, 50, 'F');
    
    // Add actual logo
    try {
      // Add logo image (resize to fit nicely in header)
      doc.addImage(logoImage, 'PNG', 15, 8, 30, 30);
    } catch (error) {
      console.warn('Could not load logo image, using text fallback:', error);
      // Fallback to text logo if image fails
      doc.setFillColor(255, 255, 255);
      doc.circle(35, 25, 12, 'F');
      doc.setTextColor(30, 64, 175);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('WLG', 30, 30, { align: 'center' });
    }
    
    // Company name
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Wild Lanka Go', 55, 20);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Wildlife Conservation Portal', 55, 28);
    
    // Contact info on the right
    doc.setFontSize(8);
    doc.text('123 Wildlife Sanctuary Road', pageWidth - margin, 15, { align: 'right' });
    doc.text('Colombo, Sri Lanka', pageWidth - margin, 22, { align: 'right' });
    doc.text('info@wildlankago.com', pageWidth - margin, 29, { align: 'right' });
    doc.text('+94 11 234 5678', pageWidth - margin, 36, { align: 'right' });
    
    // Document title
    doc.setTextColor(55, 65, 81); // Gray-700
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(title, margin, 70);
    
    if (subtitle) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(subtitle, margin, 80);
    }
    
    // Generated date
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth - margin, 70, { align: 'right' });
    
    // User info
    doc.setFontSize(10);
    doc.text(`Veterinarian: ${user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.name || 'Anonymous'}`, pageWidth - margin, 80, { align: 'right' });
    
    // Line separator
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(margin, 90, pageWidth - margin, 90);
    
    return 100; // Return Y position for content
  };

  const handleDownloadReport = async (case_) => {
    try {
      setDownloadingReport(case_._id);
      
      // Fetch treatment plans for this case
      let treatments = [];
      try {
        const treatmentResponse = await protectedApi.getTreatmentsByCase(case_._id);
        if (treatmentResponse.data.success) {
          treatments = treatmentResponse.data.data;
        }
      } catch (error) {
        console.log('No treatments found for this case:', error);
      }

      // Generate PDF with formal header
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      
      let yPosition = createFormalHeader(doc, 'Animal Case Report', 'Detailed veterinary case information and treatment plans');
      
      // Case Information Table
      const caseColumns = ['Field', 'Value'];
      const caseRows = [
        ['Case ID', case_.caseId || 'N/A'],
        ['Animal Type', case_.animalType || 'N/A'],
        ['Location', case_.location || 'N/A'],
        ['Status', case_.status || 'N/A'],
        ['Priority', case_.priority || 'N/A'],
        ['Created Date', new Date(case_.createdAt).toLocaleDateString()],
        ['Reported By', case_.reportedBy || 'N/A'],
        ['Contact Info', case_.contactInfo || 'N/A']
      ];

      // Add additional details if available
      if (case_.estimatedAge) {
        caseRows.push(['Estimated Age', case_.estimatedAge]);
      }
      if (case_.weight) {
        caseRows.push(['Weight', case_.weight]);
      }

      // Generate case information table
      autoTable(doc, {
        head: [caseColumns],
        body: caseRows,
        startY: yPosition,
        theme: 'grid',
        headStyles: {
          fillColor: [30, 64, 175], // Blue-800
          textColor: 255,
          fontStyle: 'bold',
          halign: 'center',
          fontSize: 10
        },
        bodyStyles: {
          fontSize: 9,
          textColor: 55,
          halign: 'left'
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252] // Gray-50
        },
        columnStyles: {
          0: { cellWidth: 50, halign: 'left', fontStyle: 'bold' }, // Field
          1: { cellWidth: 120, halign: 'left' } // Value
        },
        margin: { left: margin, right: margin }
      });

      yPosition = doc.lastAutoTable.finalY + 20;

      // Description Section
      if (case_.description) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 64, 175);
        doc.text('Description', margin, yPosition);
        yPosition += 10;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(55, 65, 81);
        const descriptionLines = doc.splitTextToSize(case_.description, pageWidth - (margin * 2));
        doc.text(descriptionLines, margin, yPosition);
        yPosition += (descriptionLines.length * 5) + 15;
      }
      
      // Symptoms Section
      if (case_.symptoms) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 64, 175);
        doc.text('Symptoms', margin, yPosition);
        yPosition += 10;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(55, 65, 81);
        const symptomsLines = doc.splitTextToSize(case_.symptoms, pageWidth - (margin * 2));
        doc.text(symptomsLines, margin, yPosition);
        yPosition += (symptomsLines.length * 5) + 15;
      }
      
      // Treatment Plans Section
      if (treatments && treatments.length > 0) {
        // Check if we need a new page
        if (yPosition > 200) {
          doc.addPage();
          yPosition = 20;
        }
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 64, 175);
        doc.text('Treatment Plans', margin, yPosition);
        yPosition += 15;
        
        treatments.forEach((treatment, index) => {
          // Check if we need a new page
          if (yPosition > 180) {
            doc.addPage();
            yPosition = 20;
          }
          
          // Treatment plan header
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(30, 64, 175);
          doc.text(`Treatment Plan #${index + 1}`, margin, yPosition);
          yPosition += 10;
          
          // Treatment details table
          const treatmentColumns = ['Field', 'Value'];
          const treatmentRows = [
            ['Treatment Type', treatment.treatment || 'N/A'],
            ['Diagnosis', treatment.diagnosis || 'N/A'],
            ['Medication', treatment.medication || 'N/A'],
            ['Dosage', treatment.dosage || 'N/A'],
            ['Frequency', treatment.frequency || 'N/A'],
            ['Duration', treatment.duration || 'N/A'],
            ['Start Date', treatment.startDate ? new Date(treatment.startDate).toLocaleDateString() : 'N/A'],
            ['End Date', treatment.endDate ? new Date(treatment.endDate).toLocaleDateString() : 'Ongoing'],
            ['Status', treatment.status || 'N/A']
          ];

          autoTable(doc, {
            head: [treatmentColumns],
            body: treatmentRows,
            startY: yPosition,
            theme: 'grid',
            headStyles: {
              fillColor: [30, 64, 175], // Blue-800
              textColor: 255,
              fontStyle: 'bold',
              halign: 'center',
              fontSize: 9
            },
            bodyStyles: {
              fontSize: 8,
              textColor: 55,
              halign: 'left'
            },
            alternateRowStyles: {
              fillColor: [248, 250, 252] // Gray-50
            },
            columnStyles: {
              0: { cellWidth: 50, halign: 'left', fontStyle: 'bold' }, // Field
              1: { cellWidth: 120, halign: 'left' } // Value
            },
            margin: { left: margin, right: margin }
          });

          yPosition = doc.lastAutoTable.finalY + 10;
          
          // Treatment notes
          if (treatment.notes) {
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(30, 64, 175);
            doc.text('Notes:', margin, yPosition);
            yPosition += 8;
            
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(55, 65, 81);
            const notesLines = doc.splitTextToSize(treatment.notes, pageWidth - (margin * 2) - 20);
            doc.text(notesLines, margin + 10, yPosition);
            yPosition += (notesLines.length * 4) + 15;
          }
        });
      } else {
        // Check if we need a new page
        if (yPosition > 200) {
          doc.addPage();
          yPosition = 20;
        }
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 64, 175);
        doc.text('Treatment Plans', margin, yPosition);
        yPosition += 10;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(156, 163, 175);
        doc.text('No treatment plans available for this case.', margin, yPosition);
      }
      
      // Add footer to all pages
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(100);
        doc.text('Wild Lanka Go - Veterinary Portal', margin, pageHeight - 15);
        doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin, pageHeight - 15, { align: 'right' });
      }
      
      // Download the PDF
      const fileName = `Animal_Case_Report_${case_.caseId}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      
      setDownloadingReport(null);
      
    } catch (error) {
      console.error('Error generating PDF report:', error);
      setError('Failed to generate PDF report. Please try again.');
      setDownloadingReport(null);
    }
  };

  // Fetch treatments for a specific case
  const fetchCaseTreatments = async (caseId) => {
    try {
      const response = await protectedApi.getTreatmentsByCase(caseId);
      if (response.data.success) {
        setCaseTreatments(prev => ({
          ...prev,
          [caseId]: response.data.data
        }));
      }
    } catch (error) {
      console.error('Error fetching case treatments:', error);
    }
  };

  // Fetch treatments for all cases
  const fetchAllCaseTreatments = async (cases) => {
    try {
      const promises = cases.map(case_ => 
        protectedApi.getTreatmentsByCase(case_._id)
          .then(response => ({
            caseId: case_._id,
            treatments: response.data.success ? response.data.data : []
          }))
          .catch(error => {
            console.error(`Error fetching treatments for case ${case_._id}:`, error);
            return { caseId: case_._id, treatments: [] };
          })
      );
      
      const results = await Promise.all(promises);
      const treatmentsMap = {};
      results.forEach(result => {
        treatmentsMap[result.caseId] = result.treatments;
      });
      
      setCaseTreatments(treatmentsMap);
    } catch (error) {
      console.error('Error fetching all case treatments:', error);
    }
  };

  const handleAddTreatment = (case_) => {
    console.log('🔍 Opening treatment modal for case:', case_);
    setSelectedCaseForTreatment(case_);
    setSelectedTreatment(null);
    const todayDate = new Date().toISOString().split('T')[0];
    console.log('🔍 Setting startDate to:', todayDate);
    setNewTreatment({
      treatment: '',
      diagnosis: '',
      medication: '',
      dosage: '',
      frequency: '',
      duration: '',
      notes: '',
      startDate: todayDate, // Today's date
      endDate: '',
      medications: []
    });
    // Reset validation state
    setTreatmentValidation({
      treatment: { isValid: true, message: '' },
      diagnosis: { isValid: true, message: '' },
      startDate: { isValid: true, message: '' },
      endDate: { isValid: true, message: '' },
      medications: { isValid: true, message: '' }
    });
    setShowTreatmentModal(true);
  };

  const handleViewTreatment = (case_) => {
    setSelectedCaseForTreatment(case_);
    fetchCaseTreatments(case_._id);
    setShowTreatmentView(true);
  };

  const handleTrackAnimal = (case_) => {
    setSelectedCaseForTracking(case_);
    setShowDeviceModal(true);
  };

  const handleLiveLocation = (case_) => {
    setSelectedCaseForTracking(case_);
    setShowLiveLocation(true);
  };

  const handleSaveDeviceId = async (e) => {
    e.preventDefault();
    if (!newDeviceId.trim()) {
      alert('Please enter a device ID');
      return;
    }

    try {
      // Save device ID to the case (you can implement API call here)
      setTrackingDevices(prev => ({
        ...prev,
        [selectedCaseForTracking._id]: {
          deviceId: newDeviceId,
          savedAt: new Date().toISOString()
        }
      }));
      
      setNewDeviceId('');
      setShowDeviceModal(false);
      alert('Tracking device ID saved successfully!');
    } catch (error) {
      console.error('Error saving device ID:', error);
      alert('Failed to save device ID. Please try again.');
    }
  };

  const handleMarkTreatmentDone = async (treatmentId) => {
    try {
      // Update treatment status to 'Completed' (Done)
      await protectedApi.updateTreatment(treatmentId, { status: 'Completed' });
      
      // Refresh treatments for the current case
      if (selectedCaseForTreatment) {
        await fetchCaseTreatments(selectedCaseForTreatment._id);
      }
      
      // Refresh all case treatments
      if (animalCases.length > 0) {
        await fetchAllCaseTreatments(animalCases);
      }
      
      alert('Treatment marked as completed successfully!');
    } catch (error) {
      console.error('Error marking treatment as done:', error);
      alert('Failed to mark treatment as done. Please try again.');
    }
  };

  // Validation functions
  const validateTreatmentType = (value) => {
    if (!value || value.trim().length === 0) {
      return { isValid: false, message: 'Treatment type is required' };
    }
    if (value.trim().length < 3) {
      return { isValid: false, message: 'Treatment type must be at least 3 characters' };
    }
    return { isValid: true, message: '' };
  };

  const validateDiagnosis = (value) => {
    if (!value || value.trim().length === 0) {
      return { isValid: false, message: 'Diagnosis is required' };
    }
    if (value.trim().length < 3) {
      return { isValid: false, message: 'Diagnosis must be at least 3 characters' };
    }
    return { isValid: true, message: '' };
  };

  const validateStartDate = (value) => {
    if (!value) {
      return { isValid: false, message: 'Start date is required' };
    }
    const selectedDate = new Date(value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      return { isValid: false, message: 'Start date cannot be in the past' };
    }
    return { isValid: true, message: '' };
  };

  const validateEndDate = (startDate, endDate) => {
    if (!endDate) {
      return { isValid: true, message: '' }; // End date is optional
    }
    
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (end <= start) {
        return { isValid: false, message: 'End date must be after start date' };
      }
    }
    return { isValid: true, message: '' };
  };

  const validateMedications = (medications) => {
    if (medications.length === 0) {
      return { isValid: true, message: '' }; // Medications are optional
    }
    
    for (let med of medications) {
      if (!med.medicationId || med.quantity <= 0) {
        return { isValid: false, message: 'All medications must have valid selection and quantity' };
      }
      
      const selectedMed = medicines.find(m => m._id === med.medicationId);
      if (selectedMed && med.quantity > selectedMed.currentStock) {
        return { isValid: false, message: `Insufficient stock for ${med.medicationName}. Available: ${selectedMed.currentStock}` };
      }
    }
    return { isValid: true, message: '' };
  };

  // Medicine validation functions
  const validateMedicineName = (value, currentMedicineId = null) => {
    if (!value || value.trim().length === 0) {
      return { isValid: false, message: 'Medicine name is required' };
    }
    if (value.trim().length < 2) {
      return { isValid: false, message: 'Medicine name must be at least 2 characters' };
    }
    if (value.trim().length > 100) {
      return { isValid: false, message: 'Medicine name must be less than 100 characters' };
    }
    
    // Check for duplicate names (excluding current medicine if editing)
    const duplicateMedicine = medicines.find(med => 
      med.name.toLowerCase() === value.trim().toLowerCase() && 
      med._id !== currentMedicineId
    );
    if (duplicateMedicine) {
      return { isValid: false, message: 'A medicine with this name already exists' };
    }
    
    return { isValid: true, message: '' };
  };

  const validateMedicineStrength = (value) => {
    if (!value || value.trim().length === 0) {
      return { isValid: false, message: 'Medicine strength is required' };
    }
    if (value.trim().length < 1) {
      return { isValid: false, message: 'Strength must be at least 1 character' };
    }
    if (value.trim().length > 50) {
      return { isValid: false, message: 'Strength must be less than 50 characters' };
    }
    
    // Check if strength contains valid characters (numbers, letters, common units)
    const strengthPattern = /^[0-9]+(\.[0-9]+)?[a-zA-Z]*$/;
    if (!strengthPattern.test(value.trim())) {
      return { isValid: false, message: 'Please enter a valid strength (e.g., 500, 10.5, 250mg)' };
    }
    
    return { isValid: true, message: '' };
  };

  const validateStockValue = (value, fieldName) => {
    if (value === '' || value === null || value === undefined) {
      return { isValid: false, message: `${fieldName} is required` };
    }
    
    const numValue = parseInt(value);
    if (isNaN(numValue)) {
      return { isValid: false, message: `${fieldName} must be a valid number` };
    }
    
    if (numValue < 0) {
      return { isValid: false, message: `${fieldName} cannot be negative` };
    }
    
    if (numValue > 999999) {
      return { isValid: false, message: `${fieldName} cannot exceed 999,999` };
    }
    
    return { isValid: true, message: '' };
  };

  const validateStockRelationship = (currentStock, minimumStock) => {
    const currentNum = parseInt(currentStock);
    const minimumNum = parseInt(minimumStock);
    
    if (!isNaN(currentNum) && !isNaN(minimumNum) && currentNum < minimumNum) {
      return { isValid: false, message: 'Current stock should not be less than minimum stock' };
    }
    
    return { isValid: true, message: '' };
  };

  // Multiple medications functions
  const handleAddMedication = () => {
    if (!currentMedication.medicationId || currentMedication.quantity <= 0) {
      alert('Please select a medication and enter a valid quantity');
      return;
    }

    const selectedMed = medicines.find(m => m._id === currentMedication.medicationId);
    if (selectedMed && currentMedication.quantity > selectedMed.currentStock) {
      alert(`Insufficient stock. Available: ${selectedMed.currentStock}, Required: ${currentMedication.quantity}`);
      return;
    }

    const newMedication = {
      ...currentMedication,
      medicationName: selectedMed.name
    };

    const updatedMedications = [...newTreatment.medications, newMedication];
    setNewTreatment({
      ...newTreatment,
      medications: updatedMedications
    });

    // Validate medications after adding
    const medValidation = validateMedications(updatedMedications);
    setTreatmentValidation(prev => ({
      ...prev,
      medications: medValidation
    }));

    // Reset current medication form
    setCurrentMedication({
      medicationId: '',
      medicationName: '',
      quantity: 0,
      dosage: '',
      frequency: '',
      duration: '',
      notes: ''
    });
  };

  const handleRemoveMedication = (index) => {
    const updatedMedications = newTreatment.medications.filter((_, i) => i !== index);
    setNewTreatment({
      ...newTreatment,
      medications: updatedMedications
    });

    // Validate medications after removing
    const medValidation = validateMedications(updatedMedications);
    setTreatmentValidation(prev => ({
      ...prev,
      medications: medValidation
    }));
  };

  const handleCreateTreatment = async (e) => {
    e.preventDefault();
    try {
      setUploadingImages(true);
      setError(null);

      // Validate all fields using validation functions
      const treatmentValidation = validateTreatmentType(newTreatment.treatment);
      const diagnosisValidation = validateDiagnosis(newTreatment.diagnosis);
      const startDateValidation = validateStartDate(newTreatment.startDate);
      const endDateValidation = validateEndDate(newTreatment.startDate, newTreatment.endDate);
      const medicationsValidation = validateMedications(newTreatment.medications);

      // Update validation state
      setTreatmentValidation({
        treatment: treatmentValidation,
        diagnosis: diagnosisValidation,
        startDate: startDateValidation,
        endDate: endDateValidation,
        medications: medicationsValidation
      });

      // Check if any validation failed
      if (!treatmentValidation.isValid || !diagnosisValidation.isValid || 
          !startDateValidation.isValid || !endDateValidation.isValid || 
          !medicationsValidation.isValid) {
        setError('Please fix the validation errors before submitting');
        setUploadingImages(false);
        return;
      }

      const treatmentData = {
        ...newTreatment,
        caseId: selectedCaseForTreatment._id,
        animalType: selectedCaseForTreatment.animalType,
        status: 'Active'
      };

      console.log('🔍 Treatment data being sent:', treatmentData);
      console.log('🔍 newTreatment state:', newTreatment);

      if (selectedTreatment) {
        // Update existing treatment
        await protectedApi.updateTreatment(selectedTreatment._id, treatmentData);
        alert('Treatment plan updated successfully!');
      } else {
        // Create new treatment
      await protectedApi.createTreatment(selectedCaseForTreatment._id, treatmentData);
        alert('Treatment plan created successfully!');
      }
      
      // Refresh treatments for this case
      await fetchCaseTreatments(selectedCaseForTreatment._id);
      
      setShowTreatmentModal(false);
      setSelectedCaseForTreatment(null);
      setSelectedTreatment(null);
      setNewTreatment({
        treatment: '',
        diagnosis: '',
        medication: '',
        medicationId: '',
        medicationQuantity: 0,
        dosage: '',
        frequency: '',
        duration: '',
        notes: '',
        startDate: '',
        endDate: '',
        medications: []
      });
      setUploadingImages(false);
      
      // Navigate to treatment section and show treatment plans for this case
      setActiveTab('treatments');
      setSelectedCaseForTreatment(selectedCaseForTreatment);
      fetchCaseTreatments(selectedCaseForTreatment._id);
      setShowTreatmentView(true);
      
      // Refresh the cases list and inventory
      await fetchAnimalCases();
      await fetchDashboardData();
      await fetchMedicines(); // Refresh medicines to show updated stock
    } catch (error) {
      console.error('Error creating treatment plan:', error);
      setError('Failed to create treatment plan. Please try again.');
      setUploadingImages(false);
    }
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    
    // Validate file types (same as activities/events)
    const validFiles = files.filter(file => {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      return validTypes.includes(file.type);
    });
    
    // Validate file sizes (5MB limit per file)
    const sizeValidFiles = validFiles.filter(file => file.size <= 5 * 1024 * 1024);
    
    // Check total image count (max 10 for animal cases)
    const currentCount = selectedImages.length;
    const newCount = sizeValidFiles.length;
    
    if (currentCount + newCount > 10) {
      setError(`Maximum 10 images allowed. You currently have ${currentCount} images and are trying to add ${newCount} more.`);
      return;
    }
    
    // Show warnings for invalid files
    if (validFiles.length !== files.length) {
      setError('Some files were skipped because they are not valid image formats (JPG, PNG, GIF only).');
    }
    
    if (sizeValidFiles.length !== validFiles.length) {
      setError('Some files were skipped because they exceed the 5MB size limit.');
    }
    
    setSelectedImages([...selectedImages, ...sizeValidFiles]);
    setError(null); // Clear any previous errors

    // Preview images
    const imageUrls = sizeValidFiles.map(file => URL.createObjectURL(file));
    setNewCase({...newCase, previewImages: [...(newCase.previewImages || []), ...imageUrls]});
  };

  const removeImage = (index) => {
    const newImages = selectedImages.filter((_, i) => i !== index);
    const newPreviewImages = newCase.previewImages.filter((_, i) => i !== index);
    setSelectedImages(newImages);
    setNewCase({...newCase, previewImages: newPreviewImages});
  };

  // Validation functions
  const validateField = (fieldName, value) => {
    const validation = validateVetCaseForm({ [fieldName]: value });
    return validation.validations[fieldName];
  };

  const handleFieldChange = (fieldName, value) => {
    // Update the field value
    setNewCase(prev => ({ ...prev, [fieldName]: value }));
    
    // Mark field as touched
    setTouchedFields(prev => ({ ...prev, [fieldName]: true }));
    
    // Validate the field
    const validation = validateField(fieldName, value);
    setValidationErrors(prev => ({ ...prev, [fieldName]: validation }));
    
    // Update overall form validity
    const fullValidation = validateVetCaseForm({ ...newCase, [fieldName]: value });
    setIsFormValid(fullValidation.isValid);
  };

  const handleFieldBlur = (fieldName) => {
    setTouchedFields(prev => ({ ...prev, [fieldName]: true }));
  };

  const resetForm = () => {
    setNewCase({
      animalType: '',
      description: '',
      location: '',
      priority: 'Medium',
      status: 'Open',
      reportedBy: '',
      contactInfo: '',
      symptoms: '',
      estimatedAge: '',
      weight: '',
      images: []
    });
    setSelectedImages([]);
    setValidationErrors({});
    setTouchedFields({});
    setIsFormValid(false);
  };

  const handleCreateCase = async (e) => {
    e.preventDefault();
    
    // Validate form before submission
    const validation = validateVetCaseForm(newCase);
    if (!validation.isValid) {
      setError('Please fix the validation errors before submitting the form.');
      // Mark all fields as touched to show validation errors
      const allFields = ['animalType', 'location', 'description', 'symptoms', 'reportedBy', 'contactInfo', 'estimatedAge', 'weight'];
      const touchedAll = allFields.reduce((acc, field) => ({ ...acc, [field]: true }), {});
      setTouchedFields(touchedAll);
      setValidationErrors(validation.validations);
      return;
    }
    
    try {
      setUploadingImages(true);
      setUploadProgress(0);
      setError(null); // Clear any previous errors

      console.log('Creating animal case with data:', {
        animalType: newCase.animalType,
        location: newCase.location,
        imageCount: selectedImages.length
      });

      // Create FormData for file upload
      const formData = new FormData();

      // Add all case data
      Object.keys(newCase).forEach(key => {
        if (key !== 'images' && key !== 'previewImages') {
          formData.append(key, newCase[key]);
        }
      });

      // Add images
      selectedImages.forEach((image, index) => {
        formData.append('images', image);
      });

      console.log('Submitting form data to backend...');
      console.log('Form data contents:', {
        animalType: newCase.animalType,
        location: newCase.location,
        description: newCase.description,
        filesCount: selectedImages.length
      });
      
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 1000);
      
      const response = await protectedApi.createAnimalCaseWithImages(formData);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      console.log('Animal case created successfully:', response.data);
      
      // Show success message
      setError(null);
      alert('Animal case created successfully!');
      
      setShowCreateModal(false);
      resetForm();
      
      // Update recent cases in real-time by adding the new case to the top
      const newCaseData = response.data.data;
      setRecentCases(prevCases => {
        const updatedCases = [newCaseData, ...prevCases];
        // Keep only the 3 most recent cases
        return updatedCases.slice(0, 3);
      });

      // Update stats immediately
      setStats(prevStats => ({
        ...prevStats,
        total_cases: (prevStats?.total_cases || 0) + 1,
        pending_cases: (prevStats?.pending_cases || 0) + 1
      }));

      // Add to animal cases list
      setAnimalCases(prevCases => [newCaseData, ...prevCases]);
      
      // Also refresh the full dashboard data for other stats
      fetchDashboardData();
    } catch (error) {
      console.error('Failed to create animal case:', error);
      
      // Provide more specific error messages
      if (error.code === 'ECONNABORTED') {
        setError('Request timed out. This may be due to large image files or slow network. Please try with smaller images or check your internet connection.');
      } else if (error.response?.status === 500) {
        setError('Server error. Please try again later.');
      } else if (error.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
      } else if (error.message?.includes('timeout')) {
        setError('Request timed out. Please try again with smaller images (under 2MB each).');
      } else if (error.response?.status === 413) {
        setError('Image files are too large. Please use images smaller than 5MB each.');
      } else {
        setError(`Failed to create animal case: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setUploadingImages(false);
      setUploadProgress(0);
    }
  };

  // Inventory functions
  const fetchInventoryStats = async () => {
    try {
      const response = await protectedApi.getInventoryStats();
      if (response.data.success) {
        setInventoryStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching inventory stats:', error);
    }
  };

  const fetchMedicines = async () => {
    try {
      const response = await protectedApi.getMedicines();
      if (response.data.success) {
        setMedicines(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching medicines:', error);
    }
  };

  const fetchAvailableVets = async () => {
    try {
      setLoadingVets(true);
      const response = await protectedApi.getAvailableVets();
      if (response.data.success) {
        setAvailableVets(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching available vets:', error);
      // Fallback to mock data if API fails
      setAvailableVets([
        {
          _id: 1,
          firstName: "Sarah",
          lastName: "Johnson",
          specialization: "Wildlife Medicine",
          isOnline: true,
          lastActive: new Date(Date.now() - 2 * 60 * 1000),
          experience: "8 years",
          casesHandled: 156
        },
        {
          _id: 2,
          firstName: "Michael",
          lastName: "Chen",
          specialization: "Emergency Care",
          isOnline: true,
          lastActive: new Date(Date.now() - 5 * 60 * 1000),
          experience: "12 years",
          casesHandled: 203
        },
        {
          _id: 3,
          firstName: "Emily",
          lastName: "Rodriguez",
          specialization: "Surgery",
          isOnline: false,
          lastActive: new Date(Date.now() - 60 * 60 * 1000),
          experience: "6 years",
          casesHandled: 89
        },
        {
          _id: 4,
          firstName: "James",
          lastName: "Wilson",
          specialization: "Exotic Animals",
          isOnline: true,
          lastActive: new Date(),
          experience: "15 years",
          casesHandled: 312
        }
      ]);
    } finally {
      setLoadingVets(false);
    }
  };


  const handleAddMedicine = () => {
    setSelectedMedicine(null);
    setNewMedicine({
      name: '',
      category: 'Other',
      form: 'Tablet',
      strength: '',
      unit: 'mg',
      currentStock: 0,
      minimumStock: 10,
      status: 'Active',
      notes: ''
    });
    // Reset validation state
    setMedicineValidation({
      name: { isValid: true, message: '' },
      strength: { isValid: true, message: '' },
      currentStock: { isValid: true, message: '' },
      minimumStock: { isValid: true, message: '' }
    });
    setShowInventoryModal(true);
  };

  const handleEditMedicine = (medicine) => {
    setSelectedMedicine(medicine);
    setNewMedicine({
      name: medicine.name || '',
      category: medicine.category || 'Other',
      form: medicine.form || 'Tablet',
      strength: medicine.strength || '',
      unit: medicine.unit || 'mg',
      currentStock: medicine.currentStock || 0,
      minimumStock: medicine.minimumStock || 10,
      status: medicine.status || 'Active',
      notes: medicine.notes || ''
    });
    // Reset validation state when editing
    setMedicineValidation({
      name: { isValid: true, message: '' },
      strength: { isValid: true, message: '' },
      currentStock: { isValid: true, message: '' },
      minimumStock: { isValid: true, message: '' }
    });
    setShowInventoryModal(true);
  };

  const handleCreateMedicine = async (e) => {
    e.preventDefault();
    try {
      setUploadingImages(true);
      setError(null);

      // Validate all fields using validation functions
      const nameValidation = validateMedicineName(newMedicine.name, selectedMedicine?._id);
      const strengthValidation = validateMedicineStrength(newMedicine.strength);
      const currentStockValidation = validateStockValue(newMedicine.currentStock, 'Current Stock');
      const minimumStockValidation = validateStockValue(newMedicine.minimumStock, 'Minimum Stock');
      const stockRelationshipValidation = validateStockRelationship(newMedicine.currentStock, newMedicine.minimumStock);

      // Update validation state
      setMedicineValidation({
        name: nameValidation,
        strength: strengthValidation,
        currentStock: currentStockValidation,
        minimumStock: minimumStockValidation
      });

      // Check if any validation failed
      if (!nameValidation.isValid || !strengthValidation.isValid || 
          !currentStockValidation.isValid || !minimumStockValidation.isValid) {
        setError('Please fix the validation errors before submitting');
        setUploadingImages(false);
        return;
      }

      // Check stock relationship validation
      if (!stockRelationshipValidation.isValid) {
        setError(stockRelationshipValidation.message);
        setUploadingImages(false);
        return;
      }

      const medicineData = {
        ...newMedicine,
        currentStock: parseInt(newMedicine.currentStock),
        minimumStock: parseInt(newMedicine.minimumStock)
      };

      if (selectedMedicine) {
        // Update existing medicine
        await protectedApi.updateMedicine(selectedMedicine._id, medicineData);
        alert('Medicine updated successfully!');
      } else {
        // Create new medicine
        await protectedApi.createMedicine(medicineData);
        alert('Medicine added successfully!');
      }
      
      setShowInventoryModal(false);
      setSelectedMedicine(null);
      setNewMedicine({
        name: '',
        category: 'Other',
        form: 'Tablet',
        strength: '',
        unit: 'mg',
        currentStock: 0,
        minimumStock: 10,
        status: 'Active',
        notes: ''
      });
      // Reset validation state
      setMedicineValidation({
        name: { isValid: true, message: '' },
        strength: { isValid: true, message: '' },
        currentStock: { isValid: true, message: '' },
        minimumStock: { isValid: true, message: '' }
      });
      setUploadingImages(false);
      
      // Refresh inventory data
      await fetchMedicines();
      await fetchInventoryStats();
    } catch (error) {
      console.error('Error creating/updating medicine:', error);
      setError('Failed to save medicine. Please try again.');
      setUploadingImages(false);
    }
  };

  const handleDeleteMedicine = async (medicineId) => {
    if (!window.confirm('Are you sure you want to delete this medicine?')) {
      return;
    }

    try {
      await protectedApi.deleteMedicine(medicineId);
      alert('Medicine deleted successfully!');
      await fetchMedicines();
      await fetchInventoryStats();
    } catch (error) {
      console.error('Error deleting medicine:', error);
      alert('Failed to delete medicine. Please try again.');
    }
  };

  const handleUpdateStock = (medicine) => {
    setSelectedMedicine(medicine);
    setStockUpdate({
      action: 'add',
      quantity: 0
    });
    setShowStockModal(true);
  };

  const handleStockUpdate = async (e) => {
    e.preventDefault();
    try {
      setUploadingImages(true);
      setError(null);

      if (stockUpdate.quantity <= 0) {
        setError('Quantity must be greater than 0');
        setUploadingImages(false);
        return;
      }

      await protectedApi.updateStock(selectedMedicine._id, stockUpdate);
      alert('Stock updated successfully!');
      
      setShowStockModal(false);
      setSelectedMedicine(null);
      setStockUpdate({
        action: 'add',
        quantity: 0
      });
      setUploadingImages(false);
      
      // Refresh inventory data
      await fetchMedicines();
      await fetchInventoryStats();
    } catch (error) {
      console.error('Error updating stock:', error);
      setError('Failed to update stock. Please try again.');
      setUploadingImages(false);
    }
  };

  const handleRequestHelp = (vetId) => {
    const vet = availableVets.find(v => v._id === vetId);
    if (!vet) {
      alert('Veterinarian not found');
      return;
    }

    // Show call simulation modal
    setCallingVet(vet);
    setShowCallModal(true);
  };


  const getStatusColor = (status) => {
    const colors = {
      'Unassigned': 'bg-gray-100 text-gray-800',
      'Assigned': 'bg-blue-100 text-blue-800',
      'In Progress': 'bg-yellow-100 text-yellow-800',
      'Completed': 'bg-green-100 text-green-800',
      'Ongoing': 'bg-yellow-100 text-yellow-800',
      'Open': 'bg-red-100 text-red-800',
      'Resolved': 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'Low': 'bg-green-100 text-green-800',
      'Medium': 'bg-yellow-100 text-yellow-800',
      'High': 'bg-red-100 text-red-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <RoleGuard requiredRole="vet">
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <div className="flex-1 flex items-center justify-center pt-32">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading your portal...</p>
            </div>
          </div>
          <Footer />
        </div>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard requiredRole="vet">
      <div className="flex flex-col min-h-screen bg-[#F4F6FF]">
        <Navbar />
        
        {/* Shell */}
        <div className="flex-1 pt-28 pb-10">
          <div className="mx-auto max-w-7xl px-4">
            
            {/* Success Message */}
            {successMessage && (
              <div className="fixed top-20 right-4 z-50 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg shadow-lg">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  {successMessage}
                </div>
              </div>
            )}
            {/* Grid: Sidebar | Main */}
            <div className="grid grid-cols-12 gap-4 items-start">
              {/* LEFT SIDEBAR */}
              <aside className="col-span-12 lg:col-span-3">
                <div className="group relative overflow-hidden rounded-2xl lg:rounded-3xl bg-white/80 backdrop-blur-xl border border-white/20 shadow-xl lg:shadow-2xl p-4 lg:p-6 sticky top-20 lg:top-24 transition-all duration-500 hover:shadow-2xl lg:hover:shadow-3xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 to-indigo-50/30"></div>
                  <div className="relative z-10">
                    {/* Mobile Header - Horizontal Layout */}
                    <div className="flex items-center justify-between lg:justify-start gap-3 mb-4 lg:mb-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 lg:p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl lg:rounded-2xl shadow-lg">
                          <svg className="w-5 h-5 lg:w-6 lg:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                        </div>
                        <div className="hidden sm:block">
                          <div className="text-lg lg:text-xl font-bold text-gray-800">Vet Portal</div>
                          <div className="text-xs lg:text-sm text-gray-500">Wild Lanka Go</div>
                        </div>
                        <div className="block sm:hidden">
                          <div className="text-sm font-bold text-gray-800">Vet Portal</div>
                        </div>
                      </div>
                      {/* Mobile Menu Toggle - Hidden on desktop */}
                      <button className="lg:hidden p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                      </button>
                  </div>

                  {[
                    { key: 'overview', label: 'Overview', icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
                        </svg>
                      )},
                    { key: 'cases', label: 'All Cases', icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      )},
                    { key: 'treatments', label: 'Treatments', icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                      )},
                    { key: 'inventory', label: 'Inventory', icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M9 5l7-3m0 0l7 3m-7-3v18" />
                        </svg>
                      )},
                    { key: 'reports', label: 'Reports', icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      )},
                    { key: 'emergency', label: 'Emergency', icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                      )},
                    { key: 'support', label: 'Support', icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
                        </svg>
                      )}
                  ].map(({ key, label, icon }) => (
                    <button
                      key={key}
                      onClick={() => {
                        setActiveTab(key);
                        // Fetch treatments when treatments tab is clicked
                        if (key === 'treatments' && animalCases.length > 0) {
                          fetchAllCaseTreatments(animalCases);
                        }
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-300 mb-2 ${
                        activeTab === key
                          ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg transform scale-105'
                          : 'text-gray-600 hover:bg-white/60 hover:text-gray-800 hover:shadow-md'
                      }`}
                    >
                      {icon}
                      <span className="text-sm font-medium">{label}</span>
                    </button>
                  ))}
                  
                  <div className="mt-6 pt-4 border-t border-gray-200/50">
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl px-4 py-3 text-sm font-medium shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105"
                    >
                      New Case
                    </button>
                  </div>
                  </div>
                </div>
              </aside>

              {/* MAIN CONTENT */}
              <main className="col-span-12 lg:col-span-9">
                <div className="space-y-6">
                  {/* Top greeting banner */}
                  <div className="mb-6">
                    <div className="bg-blue-600 text-white rounded-2xl p-4 lg:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                      <div className="flex-1">
                        <h2 className="text-base sm:text-lg lg:text-xl font-semibold">
                          {`Good ${new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}, Dr. ${backendUser?.firstName || backendUser?.name || user?.firstName || user?.name || 'Veterinarian'}`}
                        </h2>
                        <p className="text-xs sm:text-sm opacity-90 mt-1">
                          You have {stats?.pending_cases || 0} pending cases. Stay focused and provide excellent care!
                        </p>
                        <button
                          onClick={() => setShowCreateModal(true)}
                          className="mt-3 bg-white/20 hover:bg-white/30 text-white rounded-lg px-3 py-1.5 text-sm transition-colors"
                        >
                          New Case
                        </button>
                      </div>
                      <div className="hidden md:block">
                        {/* simple illustration block */}
                        <div className="w-28 h-20 rounded-xl bg-white/10 backdrop-blur-sm" />
                        </div>
                      </div>
                    </div>

                  {/* Tab buttons (for center area) */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {[
                      { k: 'overview', t: 'Overview' },
                      { k: 'cases', t: 'All Cases' },
                      { k: 'treatments', t: 'Treatments' },
                      { k: 'inventory', t: 'Inventory' },
                      { k: 'reports', t: 'Reports' },
                      { k: 'emergency', t: 'Emergency' },
                      { k: 'support', t: 'Support' }
                    ].map(({ k, t }) => (
                      <button
                        key={k}
                        onClick={() => {
                          setActiveTab(k);
                          // Fetch treatments when treatments tab is clicked
                          if (k === 'treatments' && animalCases.length > 0) {
                            fetchAllCaseTreatments(animalCases);
                          }
                        }}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition
                        ${activeTab === k ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-red-800">Error</h3>
                          <div className="mt-2 text-sm text-red-700">
                            <p>{error}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tab Content */}
                  {activeTab === 'overview' && (
                    <div className="space-y-6">
                      {/* Stat Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                        <div className="group relative overflow-hidden rounded-2xl lg:rounded-3xl bg-gradient-to-br from-blue-500 via-indigo-500 to-blue-600 p-4 lg:p-6 text-white shadow-xl lg:shadow-2xl transition-all duration-500 hover:scale-105 hover:shadow-2xl lg:hover:shadow-3xl">
                          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                          <div className="relative z-10">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-blue-100 text-xs lg:text-sm font-medium">Total Cases</p>
                                <p className="text-2xl lg:text-4xl font-bold mt-1 lg:mt-2">{stats?.total_cases || 0}</p>
                                <p className="text-blue-200 text-xs mt-1">All animal cases</p>
                              </div>
                              <div className="p-3 lg:p-4 bg-white/20 rounded-xl lg:rounded-2xl backdrop-blur-sm">
                                <svg className="w-6 h-6 lg:w-8 lg:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600 p-6 text-white shadow-2xl transition-all duration-500 hover:scale-105 hover:shadow-3xl">
                          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                          <div className="relative z-10">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-green-100 text-xs lg:text-sm font-medium">Completed Cases</p>
                                <p className="text-2xl lg:text-4xl font-bold mt-1 lg:mt-2">{stats?.completed_cases || 0}</p>
                                <p className="text-green-200 text-xs mt-1">Successfully treated</p>
                              </div>
                              <div className="p-3 lg:p-4 bg-white/20 rounded-xl lg:rounded-2xl backdrop-blur-sm">
                                <svg className="w-6 h-6 lg:w-8 lg:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 p-6 text-white shadow-2xl transition-all duration-500 hover:scale-105 hover:shadow-3xl">
                          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                          <div className="relative z-10">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-orange-100 text-xs lg:text-sm font-medium">Pending Cases</p>
                                <p className="text-2xl lg:text-4xl font-bold mt-1 lg:mt-2">{stats?.pending_cases || 0}</p>
                                <p className="text-orange-200 text-xs mt-1">Requires attention</p>
                              </div>
                              <div className="p-3 lg:p-4 bg-white/20 rounded-xl lg:rounded-2xl backdrop-blur-sm">
                                <svg className="w-6 h-6 lg:w-8 lg:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-500 via-indigo-500 to-blue-600 p-6 text-white shadow-2xl transition-all duration-500 hover:scale-105 hover:shadow-3xl">
                          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                          <div className="relative z-10">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-purple-100 text-xs lg:text-sm font-medium">Available Vets</p>
                                <p className="text-2xl lg:text-4xl font-bold mt-1 lg:mt-2">{stats?.available_vets || 0}</p>
                                <p className="text-purple-200 text-xs mt-1">Ready to help</p>
                              </div>
                              <div className="p-3 lg:p-4 bg-white/20 rounded-xl lg:rounded-2xl backdrop-blur-sm">
                                <svg className="w-6 h-6 lg:w-8 lg:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Recent Cases */}
                      <div className="group relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl transition-all duration-500 hover:shadow-3xl">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50"></div>
                        <div className="relative z-10">
                          <div className="px-8 py-6 border-b border-gray-100/50">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-100 rounded-2xl">
                                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                  </svg>
                                </div>
                                <h2 className="text-2xl font-bold text-gray-800">Recent Cases</h2>
                              </div>
                          <button
                            onClick={fetchDashboardData}
                            disabled={loading}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white/60 rounded-lg hover:bg-white/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            {loading ? 'Refreshing...' : 'Refresh'}
                          </button>
                        </div>
                        </div>
                          <div className="p-8">
                        {recentCases.length > 0 ? (
                              <div className="space-y-4">
                                {recentCases.slice(0, 3).map((case_) => (
                                  <div key={case_._id} className="flex items-center justify-between p-4 bg-white/60 rounded-2xl border border-white/50 backdrop-blur-sm hover:bg-white/80 transition-all duration-300">
                                  <div className="flex-1">
                                      <h3 className="font-semibold text-gray-900 text-lg">{case_.caseId} - {case_.animalType}</h3>
                                      <p className="text-sm text-gray-600 mt-1">Location: {case_.location}</p>
                                      <p className="text-sm text-gray-500 mt-1">Description: {case_.description}</p>
                                      {case_.symptoms && <p className="text-sm text-gray-500 mt-1">Symptoms: {case_.symptoms}</p>}
                                    </div>
                                    <div className="text-right">
                                      <div className="flex flex-col gap-2">
                                        <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(case_.status)}`}>
                                        {case_.status}
                                      </span>
                                        <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getPriorityColor(case_.priority)}`}>
                                        {case_.priority}
                                      </span>
                                    </div>
                                </div>
                              </div>
                            ))}
                            
                            {/* View All Cases Link */}
                                <div className="pt-4 border-t border-gray-200/50">
                              <button
                                onClick={() => setActiveTab('cases')}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                              >
                                View All Cases
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        ) : (
                              <div className="text-center py-12">
                                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                <h3 className="mt-2 text-sm font-medium text-gray-900">No recent cases</h3>
                                <p className="mt-1 text-sm text-gray-500">All clear! No recent animal cases.</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'cases' && (
                    <div className="space-y-6">
                      <div className="group relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl transition-all duration-500 hover:shadow-3xl">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50"></div>
                        <div className="relative z-10">
                          <div className="px-8 py-6 border-b border-gray-100/50">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-100 rounded-2xl">
                                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                  </svg>
                                </div>
                                <h2 className="text-2xl font-bold text-gray-800">All Animal Cases</h2>
                              </div>
                          <button
                            onClick={() => setShowCreateModal(true)}
                                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105"
                          >
                            Create New Case
                          </button>
                        </div>
                          </div>
                          <div className="p-8">
                        {console.log('🎯 Rendering All Cases tab. Animal cases:', animalCases, 'Length:', animalCases.length)}
                        {(() => {
                          // Filter out completed cases for the "All Cases" view
                          const activeCases = animalCases.filter(case_ => case_.status !== 'Completed');
                          return activeCases.length > 0 ? (
                                <div className="space-y-4">
                              {activeCases.map((case_) => (
                                  <div key={case_._id} className="bg-white/60 rounded-2xl border border-white/50 backdrop-blur-sm p-6 hover:bg-white/80 transition-all duration-300">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                      <h3 className="font-semibold text-gray-900">{case_.caseId} - {case_.animalType}</h3>
                                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(case_.status)}`}>
                                        {case_.status}
                                      </span>
                                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(case_.priority)}`}>
                                        {case_.priority}
                                      </span>
                                    </div>
                                    <p className="text-sm text-gray-600 mb-1">Location: {case_.location}</p>
                                    <p className="text-sm text-gray-500 mb-1">Description: {case_.description}</p>
                                    {case_.symptoms && <p className="text-sm text-gray-500 mb-1">Symptoms: {case_.symptoms}</p>}
                                    <p className="text-sm text-gray-500">Created: {new Date(case_.createdAt).toLocaleDateString()}</p>
                                  </div>
                                  <div className="flex gap-2 ml-4">
                                    <div className="flex items-center gap-2">
                                      {caseTreatments[case_._id] && caseTreatments[case_._id].length > 0 && (
                                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                          {caseTreatments[case_._id].length} Treatment{caseTreatments[case_._id].length > 1 ? 's' : ''}
                                        </span>
                                      )}
                                      <button
                                        onClick={() => handleAddTreatment(case_)}
                                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                                      >
                                        Add Treatment Plan
                                      </button>
                                    </div>
                                    <button
                                      onClick={() => handleEditCase(case_)}
                                      className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => handleMarkCaseDone(case_._id)}
                                      disabled={markingDone === case_._id}
                                      className={`px-3 py-1 rounded text-sm transition-colors ${
                                        markingDone === case_._id 
                                          ? 'bg-gray-400 cursor-not-allowed' 
                                          : 'bg-green-600 hover:bg-green-700'
                                      } text-white`}
                                    >
                                      {markingDone === case_._id ? 'Completing...' : 'Done'}
                                    </button>
                                    <button
                                      onClick={() => handleDeleteCase(case_._id)}
                                      disabled={deletingCase === case_._id}
                                      className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors disabled:opacity-50"
                                    >
                                      {deletingCase === case_._id ? 'Deleting...' : 'Delete'}
                                    </button>
                                  </div>
                                </div>
                                
                                {/* Animal Images Display */}
                                {case_.images && case_.images.length > 0 && (
                                  <div className="mt-4 pt-4 border-t border-gray-200">
                                    <h4 className="text-sm font-medium text-gray-700 mb-3">Animal Images ({case_.images.length})</h4>
                                    
                                    
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                      {case_.images.map((image, index) => {
                                        // Function to resolve image URL using the backend API
                                        const resolveImageUrl = async (originalUrl) => {
                                          if (!originalUrl || !originalUrl.startsWith('/uploads/')) {
                                            return originalUrl;
                                          }
                                          
                                          try {
                                            const filename = originalUrl.split('/').pop();
                                            const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';
                                            const response = await fetch(`${baseUrl}/animal-cases/resolve-image/${filename}`, {
                                              headers: {
                                                'Authorization': `Bearer ${localStorage.getItem('token')}`
                                              }
                                            });
                                            
                                            if (response.ok) {
                                              const data = await response.json();
                                              if (data.success && data.data.imageUrl) {
                                                const backendUrl = baseUrl.replace('/api', '');
                                                return `${backendUrl}${data.data.imageUrl}`;
                                              }
                                            }
                                          } catch (error) {
                                            console.error('Error resolving image URL:', error);
                                          }
                                          
                                          // Fallback to original URL
                                          const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';
                                          const backendUrl = baseUrl.replace('/api', '');
                                          return `${backendUrl}${originalUrl}`;
                                        };
                                        
                                        // Handle different URL formats
                                        let imageUrl = image.url || image.secure_url;
                                        
                                        // If it's a local upload path, prepend the backend URL
                                        if (imageUrl && imageUrl.startsWith('/uploads/')) {
                                          // Use the same base URL as the API calls
                                          const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';
                                          const backendUrl = baseUrl.replace('/api', ''); // Remove /api to get backend base URL
                                          imageUrl = `${backendUrl}${imageUrl}`;
                                        }
                                        
                                        // Debug logging
                                        console.log(`Image ${index + 1} URL:`, imageUrl);
                                        console.log(`Image ${index + 1} object:`, image);
                                        console.log(`Environment API URL:`, import.meta.env.VITE_API_BASE_URL);
                                        
                                        return (
                                          <div key={index} className="relative group">
                                            <img
                                              src={imageUrl}
                                              alt={`Animal case ${case_.caseId} - Image ${index + 1}`}
                                              className="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity border-2 border-blue-500"
                                              onClick={() => window.open(imageUrl, '_blank')}
                                              onLoad={(e) => {
                                                e.target.style.border = '2px solid green';
                                                console.log(`✅ Image ${index + 1} loaded successfully:`, imageUrl);
                                              }}
                                              onError={async (e) => {
                                                console.error(`❌ Image ${index + 1} failed to load:`, imageUrl);
                                                console.error('Image object:', image);
                                                e.target.style.border = '2px solid red';
                                                e.target.alt = `Failed to load image ${index + 1}`;
                                                
                                                // Try to resolve the image URL using the backend API
                                                const originalUrl = image.url || image.secure_url;
                                                if (originalUrl && originalUrl.startsWith('/uploads/')) {
                                                  try {
                                                    const resolvedUrl = await resolveImageUrl(originalUrl);
                                                    console.log(`🔄 Trying resolved URL:`, resolvedUrl);
                                                    e.target.src = resolvedUrl;
                                                  } catch (error) {
                                                    console.error('Error resolving image URL:', error);
                                                    // Show error state
                                                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk0YTNiOCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIEVycm9yPC90ZXh0Pjwvc3ZnPg==';
                                                  }
                                                } else {
                                                  // Show error state for non-local images
                                                  e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk0YTNiOCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIEVycm9yPC90ZXh0Pjwvc3ZnPg==';
                                                }
                                              }}
                                            />
                                            {image.description && (
                                              <p className="text-xs text-gray-500 mt-1 truncate" title={image.description}>
                                                {image.description}
                                              </p>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                            </div>
                          ) : (
                                <div className="text-center py-12">
                                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                  </svg>
                                  <h3 className="mt-2 text-sm font-medium text-gray-900">No active animal cases</h3>
                                  <p className="mt-1 text-sm text-gray-500">All clear! No active animal cases found.</p>
                                </div>
                          );
                        })()}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}


                  {activeTab === 'treatments' && (
                    <div className="space-y-6">
                      <div className="group relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl transition-all duration-500 hover:shadow-3xl">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50"></div>
                        <div className="relative z-10">
                          <div className="px-8 py-6 border-b border-gray-100/50">
                            <div className="flex items-center gap-4">
                              <div className="p-3 bg-blue-100 rounded-2xl">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                              </div>
                              <h2 className="text-2xl font-bold text-gray-800">Treatment Plans by Case</h2>
                            </div>
                          </div>
                          <div className="p-8">
                        {animalCases.length > 0 ? (
                          <div className="space-y-4">
                            {animalCases.map((case_) => (
                                  <div key={case_._id} className="bg-white/60 rounded-2xl border border-white/50 backdrop-blur-sm p-6 hover:bg-white/80 transition-all duration-300">
                                <div className="flex justify-between items-center">
                                  <div className="flex-1">
                                    <h3 className="font-semibold text-gray-900">{case_.caseId} - {case_.animalType}</h3>
                                    <p className="text-sm text-gray-600">{case_.description}</p>
                                    <p className="text-sm text-gray-500">
                                      Status: <span className={`font-medium ${getStatusColor(case_.status)}`}>{case_.status}</span>
                                    </p>
                                    {caseTreatments[case_._id] && caseTreatments[case_._id].length > 0 && (
                                      <p className="text-sm text-green-600 font-medium mt-1">
                                        {caseTreatments[case_._id].length} Treatment Plan{caseTreatments[case_._id].length > 1 ? 's' : ''}
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3">
                                    {caseTreatments[case_._id] && caseTreatments[case_._id].length > 0 ? (
                                      <button
                                        onClick={() => handleViewTreatment(case_)}
                                        className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition-colors"
                                      >
                                        View Treatment Plans
                                      </button>
                                    ) : (
                                      <span className="text-sm text-gray-500">No treatment plans</span>
                                    )}
                                    <button
                                      onClick={() => handleAddTreatment(case_)}
                                      className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 transition-colors"
                                    >
                                      Add Treatment Plan
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                              <div className="text-center py-12">
                                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                                <h3 className="mt-2 text-sm font-medium text-gray-900">No animal cases found</h3>
                                <p className="mt-1 text-sm text-gray-500">No animal cases available for treatment plans.</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'reports' && (
                    <div className="space-y-6">
                      <div className="group relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl transition-all duration-500 hover:shadow-3xl">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50"></div>
                        <div className="relative z-10">
                          <div className="px-8 py-6 border-b border-gray-100/50">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-100 rounded-2xl">
                                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                  </svg>
                                </div>
                                <h2 className="text-2xl font-bold text-gray-800">Animal Case Reports</h2>
                              </div>
                          <div className="text-sm text-gray-600">
                            {animalCases.length} total cases
                          </div>
                        </div>
                          </div>
                          <div className="p-8">
                        {animalCases.length > 0 ? (
                              <div className="space-y-4">
                            {animalCases.map((case_) => (
                                  <div key={case_._id} className="bg-white/60 rounded-2xl border border-white/50 backdrop-blur-sm p-6 hover:bg-white/80 transition-all duration-300">
                                <div className="flex justify-between items-center">
                                  <div className="flex-1">
                                    <h3 className="font-medium text-gray-900">{case_.caseId}</h3>
                                    <p className="text-sm text-gray-600">{case_.animalType}</p>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(case_.status)}`}>
                                      {case_.status}
                                    </span>
                                    <button
                                      onClick={() => handleDownloadReport(case_)}
                                      disabled={downloadingReport === case_._id}
                                      className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                                        downloadingReport === case_._id 
                                          ? 'bg-gray-400 cursor-not-allowed' 
                                          : 'bg-blue-600 hover:bg-blue-700'
                                      } text-white`}
                                    >
                                      {downloadingReport === case_._id ? (
                                        <>
                                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                          Generating...
                                        </>
                                      ) : (
                                        <>
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                          </svg>
                                          Download
                                        </>
                                      )}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                              <div className="text-center py-12">
                                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                <h3 className="mt-2 text-sm font-medium text-gray-900">No animal cases found</h3>
                                <p className="mt-1 text-sm text-gray-500">No animal cases available for reports.</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'inventory' && (
                    <div className="space-y-6">
                      {/* Inventory Stats */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
                        <div className="group relative overflow-hidden rounded-2xl lg:rounded-3xl bg-gradient-to-br from-blue-500 via-indigo-500 to-blue-600 p-4 lg:p-6 text-white shadow-xl lg:shadow-2xl transition-all duration-500 hover:scale-105 hover:shadow-2xl lg:hover:shadow-3xl">
                          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                          <div className="relative z-10">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-blue-100 text-xs lg:text-sm font-medium">Total Medicines</p>
                                <p className="text-2xl lg:text-4xl font-bold mt-1 lg:mt-2">{inventoryStats?.totalMedicines || 0}</p>
                                <p className="text-blue-200 text-xs mt-1">In inventory</p>
                              </div>
                              <div className="p-3 lg:p-4 bg-white/20 rounded-xl lg:rounded-2xl backdrop-blur-sm">
                                <svg className="w-6 h-6 lg:w-8 lg:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M9 5l7-3m0 0l7 3m-7-3v18" />
                              </svg>
                            </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-red-500 via-pink-500 to-red-600 p-6 text-white shadow-2xl transition-all duration-500 hover:scale-105 hover:shadow-3xl">
                          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                          <div className="relative z-10">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-red-100 text-xs lg:text-sm font-medium">Out of Stock</p>
                                <p className="text-2xl lg:text-4xl font-bold mt-1 lg:mt-2">{inventoryStats?.outOfStock || 0}</p>
                                <p className="text-red-200 text-xs mt-1">Needs restocking</p>
                              </div>
                              <div className="p-3 lg:p-4 bg-white/20 rounded-xl lg:rounded-2xl backdrop-blur-sm">
                                <svg className="w-6 h-6 lg:w-8 lg:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                              </svg>
                            </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500 via-yellow-500 to-orange-600 p-6 text-white shadow-2xl transition-all duration-500 hover:scale-105 hover:shadow-3xl">
                          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                          <div className="relative z-10">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-orange-100 text-xs lg:text-sm font-medium">Low Stock</p>
                                <p className="text-2xl lg:text-4xl font-bold mt-1 lg:mt-2">{inventoryStats?.lowStock || 0}</p>
                                <p className="text-orange-200 text-xs mt-1">Monitor closely</p>
                              </div>
                              <div className="p-3 lg:p-4 bg-white/20 rounded-xl lg:rounded-2xl backdrop-blur-sm">
                                <svg className="w-6 h-6 lg:w-8 lg:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600 p-6 text-white shadow-2xl transition-all duration-500 hover:scale-105 hover:shadow-3xl">
                          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                          <div className="relative z-10">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-green-100 text-xs lg:text-sm font-medium">Active Medicines</p>
                                <p className="text-2xl lg:text-4xl font-bold mt-1 lg:mt-2">{inventoryStats?.activeMedicines || 0}</p>
                                <p className="text-green-200 text-xs mt-1">Ready to use</p>
                              </div>
                              <div className="p-3 lg:p-4 bg-white/20 rounded-xl lg:rounded-2xl backdrop-blur-sm">
                                <svg className="w-6 h-6 lg:w-8 lg:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Medicine List */}
                      <div className="bg-white rounded-2xl shadow-sm p-6">
                        <div className="flex justify-between items-center mb-4">
                          <h2 className="text-lg font-semibold text-gray-900">Medicine Inventory</h2>
                          <button
                            onClick={handleAddMedicine}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                          >
                            Add Medicine
                          </button>
                        </div>

                        {/* Search Bar */}
                        <div className="mb-6">
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                              </svg>
                            </div>
                            <input
                              type="text"
                              placeholder="Search medicines by name..."
                              value={medicineSearchTerm}
                              onChange={(e) => setMedicineSearchTerm(e.target.value)}
                              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                            {medicineSearchTerm && (
                              <button
                                onClick={() => setMedicineSearchTerm('')}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                              >
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            )}
                          </div>
                          {medicineSearchTerm && (
                            <p className="text-sm text-gray-600 mt-2">
                              Showing {filteredMedicines.length} of {medicines.length} medicines
                            </p>
                          )}
                        </div>
                        
                        {medicines.length > 0 ? (
                          filteredMedicines.length > 0 ? (
                            <div className="overflow-x-auto">
                              <table className="w-full">
                                <thead>
                                  <tr className="border-b border-gray-200">
                                    <th className="text-left py-3 px-4 font-medium text-gray-700">Medicine</th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-700">Category</th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-700">Form</th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-700">Strength</th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-700">Stock</th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                                    <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {filteredMedicines.map((medicine) => (
                                  <tr key={medicine._id} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="py-3 px-4">
                                      <div>
                                        <div className="font-medium text-gray-900">{medicine.name}</div>
                                        <div className="text-sm text-gray-500">ID: {medicine.medicineId}</div>
                                      </div>
                                    </td>
                                    <td className="py-3 px-4">
                                      <span className="text-sm text-gray-700">{medicine.category}</span>
                                    </td>
                                    <td className="py-3 px-4">
                                      <span className="text-sm text-gray-700">{medicine.form}</span>
                                    </td>
                                    <td className="py-3 px-4">
                                      <span className="text-sm text-gray-700">{medicine.strength} {medicine.unit}</span>
                                    </td>
                                    <td className="py-3 px-4">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-gray-900">{medicine.currentStock}</span>
                                        <span className="text-xs text-gray-500">/ {medicine.minimumStock} min</span>
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                          medicine.stockStatus === 'Out of Stock' ? 'bg-red-100 text-red-800' :
                                          medicine.stockStatus === 'Low Stock' ? 'bg-yellow-100 text-yellow-800' :
                                          'bg-green-100 text-green-800'
                                        }`}>
                                          {medicine.stockStatus}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="py-3 px-4">
                                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                        medicine.status === 'Active' ? 'bg-green-100 text-green-800' :
                                        medicine.status === 'Inactive' ? 'bg-gray-100 text-gray-800' :
                                        'bg-red-100 text-red-800'
                                      }`}>
                                        {medicine.status}
                                      </span>
                                    </td>
                                    <td className="py-3 px-4">
                                      <div className="flex gap-2">
                                        <button
                                          onClick={() => handleUpdateStock(medicine)}
                                          className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700 transition-colors"
                                          title="Update Stock"
                                        >
                                          Stock
                                        </button>
                                        <button
                                          onClick={() => handleEditMedicine(medicine)}
                                          className="bg-yellow-600 text-white px-2 py-1 rounded text-xs hover:bg-yellow-700 transition-colors"
                                          title="Edit Medicine"
                                        >
                                          Edit
                                        </button>
                                        <button
                                          onClick={() => handleDeleteMedicine(medicine._id)}
                                          className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700 transition-colors"
                                          title="Delete Medicine"
                                        >
                                          Delete
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <div className="text-center py-8">
                              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                              </svg>
                              <p className="text-gray-500 mt-2">No medicines found matching "{medicineSearchTerm}"</p>
                              <button
                                onClick={() => setMedicineSearchTerm('')}
                                className="mt-4 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                              >
                                Clear Search
                              </button>
                            </div>
                          )
                        ) : (
                          <div className="text-center py-8">
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M9 5l7-3m0 0l7 3m-7-3v18" />
                            </svg>
                            <p className="text-gray-500 mt-2">No medicines in inventory yet.</p>
                            <button
                              onClick={handleAddMedicine}
                              className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                            >
                              Add First Medicine
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === 'emergency' && (
                    <div className="space-y-6">
                      <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
                        <h2 className="text-lg font-semibold text-red-900 mb-4">Emergency Response</h2>
                        <div className="space-y-4">
                          <div className="bg-white rounded-lg p-4">
                            <h3 className="font-medium text-gray-900 mb-2">Emergency Protocol</h3>
                            <p className="text-sm text-gray-600 mb-3">
                              In case of wildlife emergency, follow these steps:
                            </p>
                            <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                              <li>Assess the situation and ensure your safety</li>
                              <li>Contact emergency services immediately</li>
                              <li>Provide first aid if safe to do so</li>
                              <li>Document the incident with photos/video</li>
                              <li>Report to wildlife authorities</li>
                            </ol>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button className="bg-red-600 text-white py-3 px-4 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">
                              Call Emergency: 1990
                            </button>
                            <button className="bg-orange-600 text-white py-3 px-4 rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors">
                              Wildlife Hotline: 011-288-8585
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'support' && (
                    <div className="space-y-6">
                      <div className="bg-white rounded-2xl shadow-sm p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Vet Support Network</h2>
                        <p className="text-gray-600 mb-6">
                          Connect with other veterinarians for consultation, collaboration, and support on complex cases.
                        </p>
                        
                        {/* Available Vets List */}
                        <div className="space-y-4">
                          <h3 className="text-md font-medium text-gray-900 mb-3">Available Veterinarians</h3>
                          
                          {loadingVets ? (
                            <div className="text-center py-4">
                              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
                              <p className="text-sm text-gray-500 mt-2">Loading veterinarians...</p>
                            </div>
                          ) : availableVets.filter(vet => vet.isOnline).length > 0 ? (
                            availableVets
                              .filter(vet => vet.isOnline)
                              .map((vet) => (
                                <div key={vet._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                        <span className="text-green-600 font-semibold text-lg">
                                          {vet.firstName?.[0]}{vet.lastName?.[0]}
                                        </span>
                                      </div>
                                      <div>
                                        <h4 className="font-semibold text-gray-900">Dr. {vet.firstName} {vet.lastName}</h4>
                                        <p className="text-sm text-gray-600">{vet.specialization}</p>
                                        <div className="flex items-center space-x-4 mt-1">
                                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            <span className="w-2 h-2 rounded-full mr-1 bg-green-400"></span>
                                            Online
                                          </span>
                                          <span className="text-xs text-gray-500">
                                            {vet.experience} experience • {vet.casesHandled} cases
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <button 
                                        onClick={() => handleRequestHelp(vet._id)}
                                        className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-2"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                        </svg>
                                        Request Help
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))
                          ) : (
                            <div className="text-center py-8">
                              <p className="text-gray-500">No veterinarians available at the moment.</p>
                            </div>
                          )}
                        </div>

                      </div>
                    </div>
                  )}
                </div>
              </main>

            </div>
          </div>
        </div>

        {/* Create Case Modal */}
        {showCreateModal && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" 
            style={{zIndex: 9999, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0}}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowCreateModal(false);
              }
            }}
          >
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto mx-4">
              <h2 className="text-2xl font-bold mb-4">Report Animal Case</h2>
              <form onSubmit={handleCreateCase}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Animal Type</label>
                    <input
                      type="text"
                      value={newCase.animalType}
                      onChange={(e) => handleFieldChange('animalType', e.target.value)}
                      onBlur={() => handleFieldBlur('animalType')}
                      className={`w-full border rounded-lg px-3 py-2 ${
                        touchedFields.animalType && validationErrors.animalType && !validationErrors.animalType.isValid
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                          : touchedFields.animalType && validationErrors.animalType && validationErrors.animalType.isValid
                          ? 'border-green-500 focus:border-green-500 focus:ring-green-500'
                          : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                      } focus:outline-none focus:ring-2`}
                      placeholder="e.g., Elephant, Leopard, etc."
                      required
                    />
                    {touchedFields.animalType && validationErrors.animalType && (
                      <p className={`text-sm mt-1 ${getValidationMessageClasses(validationErrors.animalType.severity)}`}>
                        {validationErrors.animalType.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Location</label>
                    <input
                      type="text"
                      value={newCase.location}
                      onChange={(e) => handleFieldChange('location', e.target.value)}
                      onBlur={() => handleFieldBlur('location')}
                      className={`w-full border rounded-lg px-3 py-2 ${
                        touchedFields.location && validationErrors.location && !validationErrors.location.isValid
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                          : touchedFields.location && validationErrors.location && validationErrors.location.isValid
                          ? 'border-green-500 focus:border-green-500 focus:ring-green-500'
                          : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                      } focus:outline-none focus:ring-2`}
                      required
                    />
                    {touchedFields.location && validationErrors.location && (
                      <p className={`text-sm mt-1 ${getValidationMessageClasses(validationErrors.location.severity)}`}>
                        {validationErrors.location.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea
                      value={newCase.description}
                      onChange={(e) => handleFieldChange('description', e.target.value)}
                      onBlur={() => handleFieldBlur('description')}
                      className={`w-full border rounded-lg px-3 py-2 ${
                        touchedFields.description && validationErrors.description && !validationErrors.description.isValid
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                          : touchedFields.description && validationErrors.description && validationErrors.description.isValid
                          ? 'border-green-500 focus:border-green-500 focus:ring-green-500'
                          : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                      } focus:outline-none focus:ring-2`}
                      rows="3"
                      required
                    />
                    {touchedFields.description && validationErrors.description && (
                      <p className={`text-sm mt-1 ${getValidationMessageClasses(validationErrors.description.severity)}`}>
                        {validationErrors.description.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Symptoms</label>
                    <textarea
                      value={newCase.symptoms}
                      onChange={(e) => handleFieldChange('symptoms', e.target.value)}
                      onBlur={() => handleFieldBlur('symptoms')}
                      className={`w-full border rounded-lg px-3 py-2 ${
                        touchedFields.symptoms && validationErrors.symptoms && !validationErrors.symptoms.isValid
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                          : touchedFields.symptoms && validationErrors.symptoms && validationErrors.symptoms.isValid
                          ? 'border-green-500 focus:border-green-500 focus:ring-green-500'
                          : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                      } focus:outline-none focus:ring-2`}
                      rows="2"
                    />
                    {touchedFields.symptoms && validationErrors.symptoms && (
                      <p className={`text-sm mt-1 ${getValidationMessageClasses(validationErrors.symptoms.severity)}`}>
                        {validationErrors.symptoms.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Priority</label>
                    <select
                      value={newCase.priority}
                      onChange={(e) => setNewCase({...newCase, priority: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Reported By</label>
                    <input
                      type="text"
                      value={newCase.reportedBy}
                      onChange={(e) => handleFieldChange('reportedBy', e.target.value)}
                      onBlur={() => handleFieldBlur('reportedBy')}
                      className={`w-full border rounded-lg px-3 py-2 ${
                        touchedFields.reportedBy && validationErrors.reportedBy && !validationErrors.reportedBy.isValid
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                          : touchedFields.reportedBy && validationErrors.reportedBy && validationErrors.reportedBy.isValid
                          ? 'border-green-500 focus:border-green-500 focus:ring-green-500'
                          : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                      } focus:outline-none focus:ring-2`}
                      required
                    />
                    {touchedFields.reportedBy && validationErrors.reportedBy && (
                      <p className={`text-sm mt-1 ${getValidationMessageClasses(validationErrors.reportedBy.severity)}`}>
                        {validationErrors.reportedBy.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Contact Information</label>
                    <input
                      type="text"
                      value={newCase.contactInfo}
                      onChange={(e) => handleFieldChange('contactInfo', e.target.value)}
                      onBlur={() => handleFieldBlur('contactInfo')}
                      className={`w-full border rounded-lg px-3 py-2 ${
                        touchedFields.contactInfo && validationErrors.contactInfo && !validationErrors.contactInfo.isValid
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                          : touchedFields.contactInfo && validationErrors.contactInfo && validationErrors.contactInfo.isValid
                          ? 'border-green-500 focus:border-green-500 focus:ring-green-500'
                          : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                      } focus:outline-none focus:ring-2`}
                      placeholder="Phone number or email"
                      required
                    />
                    {touchedFields.contactInfo && validationErrors.contactInfo && (
                      <p className={`text-sm mt-1 ${getValidationMessageClasses(validationErrors.contactInfo.severity)}`}>
                        {validationErrors.contactInfo.message}
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Estimated Age</label>
                      <input
                        type="text"
                        value={newCase.estimatedAge}
                        onChange={(e) => handleFieldChange('estimatedAge', e.target.value)}
                        onBlur={() => handleFieldBlur('estimatedAge')}
                        className={`w-full border rounded-lg px-3 py-2 ${
                          touchedFields.estimatedAge && validationErrors.estimatedAge && !validationErrors.estimatedAge.isValid
                            ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                            : touchedFields.estimatedAge && validationErrors.estimatedAge && validationErrors.estimatedAge.isValid
                            ? 'border-green-500 focus:border-green-500 focus:ring-green-500'
                            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                        } focus:outline-none focus:ring-2`}
                        placeholder="e.g., Adult, Juvenile"
                      />
                      {touchedFields.estimatedAge && validationErrors.estimatedAge && (
                        <p className={`text-sm mt-1 ${getValidationMessageClasses(validationErrors.estimatedAge.severity)}`}>
                          {validationErrors.estimatedAge.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Weight (kg)</label>
                      <input
                        type="text"
                        value={newCase.weight}
                        onChange={(e) => handleFieldChange('weight', e.target.value)}
                        onBlur={() => handleFieldBlur('weight')}
                        className={`w-full border rounded-lg px-3 py-2 ${
                          touchedFields.weight && validationErrors.weight && !validationErrors.weight.isValid
                            ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                            : touchedFields.weight && validationErrors.weight && validationErrors.weight.isValid
                            ? 'border-green-500 focus:border-green-500 focus:ring-green-500'
                            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                        } focus:outline-none focus:ring-2`}
                        placeholder="Estimated weight"
                      />
                      {touchedFields.weight && validationErrors.weight && (
                        <p className={`text-sm mt-1 ${getValidationMessageClasses(validationErrors.weight.severity)}`}>
                          {validationErrors.weight.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Image Upload Section */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Animal Images (Max 10 images, 5MB each)</label>
                    
                    {/* Drag & Drop Area */}
                    <div 
                      className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-green-400 transition-colors cursor-pointer"
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.add('border-green-400', 'bg-green-50');
                      }}
                      onDragLeave={(e) => {
                        e.currentTarget.classList.remove('border-green-400', 'bg-green-50');
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.remove('border-green-400', 'bg-green-50');
                        const files = Array.from(e.dataTransfer.files);
                        handleImageSelect({ target: { files } });
                      }}
                      onClick={() => document.getElementById('animal-image-upload').click()}
                    >
                      <div className="space-y-2">
                        <svg className="mx-auto h-8 w-8 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <div className="text-sm text-gray-600">
                          <span className="font-medium text-green-600 hover:text-green-500">Click to upload</span> or drag and drop
                        </div>
                        <p className="text-xs text-gray-500">
                          PNG, JPG, GIF up to 5MB each (max 10 images)
                        </p>
                      </div>
                    </div>
                    
                    {/* Hidden File Input */}
                    <input
                      id="animal-image-upload"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                  </div>

                  {/* Image Preview */}
                  {newCase.previewImages && newCase.previewImages.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium mb-2">Image Preview</label>
                      <div className="grid grid-cols-3 gap-2">
                        {newCase.previewImages.map((imageUrl, index) => (
                          <div key={index} className="relative">
                            <img
                              src={imageUrl}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-20 object-cover rounded border"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex gap-4 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploadingImages || !isFormValid}
                    className={`flex-1 ${
                      uploadingImages 
                        ? 'bg-gray-400' 
                        : !isFormValid 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-green-600 hover:bg-green-700'
                    } text-white py-2 rounded-lg transition-colors flex items-center justify-center`}
                  >
                    {uploadingImages ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Uploading Images... {uploadProgress}%
                      </>
                    ) : !isFormValid ? (
                      'Please fill required fields'
                    ) : (
                      'Report Case'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Case Modal */}
        {showEditModal && editingCase && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" 
            style={{zIndex: 9999, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0}}
          >
            <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Edit Animal Case - {editingCase.caseId}</h2>
              
              {/* Case Details (Read-only) */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Case Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Animal Type:</span>
                    <p className="text-gray-900">{editingCase.animalType}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Location:</span>
                    <p className="text-gray-900">{editingCase.location}</p>
                  </div>
                  <div className="md:col-span-2">
                    <span className="font-medium text-gray-700">Description:</span>
                    <p className="text-gray-900">{editingCase.description}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Reported By:</span>
                    <p className="text-gray-900">{editingCase.reportedBy || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Contact Info:</span>
                    <p className="text-gray-900">{editingCase.contactInfo || 'N/A'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <span className="font-medium text-gray-700">Symptoms:</span>
                    <p className="text-gray-900">{editingCase.symptoms || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Estimated Age:</span>
                    <p className="text-gray-900">{editingCase.estimatedAge || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Weight:</span>
                    <p className="text-gray-900">{editingCase.weight || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Created:</span>
                    <p className="text-gray-900">{new Date(editingCase.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
              
              {/* Editable Fields */}
              <form onSubmit={handleUpdateCase} className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Update Case Status</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Priority</label>
                    <select
                      value={editingCase.priority}
                      onChange={(e) => setEditingCase({...editingCase, priority: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Status</label>
                    <select
                      value={editingCase.status}
                      onChange={(e) => setEditingCase({...editingCase, status: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="Open">Open</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Resolved">Resolved</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-4 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploadingImages}
                    className={`flex-1 ${uploadingImages ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'} text-white py-2 rounded-lg transition-colors flex items-center justify-center`}
                  >
                    {uploadingImages ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Updating Case... {uploadProgress}%
                      </>
                    ) : (
                      'Update Priority & Status'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Treatment Plan Modal */}
        {showTreatmentModal && selectedCaseForTreatment && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" 
            style={{zIndex: 9999, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0}}
          >
            <div className="bg-white rounded-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {selectedTreatment ? 'Update Treatment Plan' : 'Add Treatment Plan'} - {selectedCaseForTreatment.caseId}
              </h2>
              
              <form onSubmit={handleCreateTreatment} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Treatment Type</label>
                    <input
                      type="text"
                      value={newTreatment.treatment}
                      onChange={(e) => {
                        const value = e.target.value;
                        setNewTreatment({...newTreatment, treatment: value});
                        const validation = validateTreatmentType(value);
                        setTreatmentValidation(prev => ({
                          ...prev,
                          treatment: validation
                        }));
                      }}
                      className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${
                        treatmentValidation.treatment.isValid 
                          ? 'border-gray-300 focus:ring-green-500' 
                          : 'border-red-500 focus:ring-red-500'
                      }`}
                      placeholder="e.g., Surgery, Medication, Physical Therapy"
                    />
                    {!treatmentValidation.treatment.isValid && (
                      <p className="text-red-500 text-sm mt-1">{treatmentValidation.treatment.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Diagnosis</label>
                    <input
                      type="text"
                      value={newTreatment.diagnosis}
                      onChange={(e) => {
                        const value = e.target.value;
                        setNewTreatment({...newTreatment, diagnosis: value});
                        const validation = validateDiagnosis(value);
                        setTreatmentValidation(prev => ({
                          ...prev,
                          diagnosis: validation
                        }));
                      }}
                      className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${
                        treatmentValidation.diagnosis.isValid 
                          ? 'border-gray-300 focus:ring-green-500' 
                          : 'border-red-500 focus:ring-red-500'
                      }`}
                      placeholder="Medical diagnosis"
                    />
                    {!treatmentValidation.diagnosis.isValid && (
                      <p className="text-red-500 text-sm mt-1">{treatmentValidation.diagnosis.message}</p>
                    )}
                  </div>
                </div>

                {/* Multiple Medications Section */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Medications</h3>
                  {!treatmentValidation.medications.isValid && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-600 text-sm">{treatmentValidation.medications.message}</p>
                    </div>
                  )}
                  
                  {/* Add New Medication Form */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Add New Medication</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Select Medication</label>
                        <select
                          value={currentMedication.medicationId}
                          onChange={(e) => {
                            const selectedMed = medicines.find(m => m._id === e.target.value);
                            setCurrentMedication({
                              ...currentMedication,
                              medicationId: e.target.value,
                              medicationName: selectedMed ? selectedMed.name : ''
                            });
                          }}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          <option value="">Select a medication...</option>
                          {medicines.filter(med => med.status === 'Active' && med.currentStock > 0).map(medicine => (
                            <option key={medicine._id} value={medicine._id}>
                              {medicine.name} ({medicine.strength} {medicine.unit}) - Stock: {medicine.currentStock}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Quantity</label>
                        <input
                          type="number"
                          min="0"
                          max={medicines.find(m => m._id === currentMedication.medicationId)?.currentStock || 0}
                          value={currentMedication.quantity}
                          onChange={(e) => setCurrentMedication({...currentMedication, quantity: parseInt(e.target.value) || 0})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="Enter quantity"
                          disabled={!currentMedication.medicationId}
                        />
                        {currentMedication.medicationId && (
                          <p className="text-xs text-gray-500 mt-1">
                            Available: {medicines.find(m => m._id === currentMedication.medicationId)?.currentStock || 0}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Dosage</label>
                        <input
                          type="text"
                          value={currentMedication.dosage}
                          onChange={(e) => setCurrentMedication({...currentMedication, dosage: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="e.g., 2 tablets"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Frequency</label>
                        <input
                          type="text"
                          value={currentMedication.frequency}
                          onChange={(e) => setCurrentMedication({...currentMedication, frequency: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="e.g., Twice daily"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Duration</label>
                        <input
                          type="text"
                          value={currentMedication.duration}
                          onChange={(e) => setCurrentMedication({...currentMedication, duration: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="e.g., 7 days"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Notes</label>
                        <input
                          type="text"
                          value={currentMedication.notes}
                          onChange={(e) => setCurrentMedication({...currentMedication, notes: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                          placeholder="Additional notes"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddMedication}
                      className="mt-3 bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 transition-colors"
                    >
                      Add Medication
                    </button>
                  </div>

                  {/* List of Added Medications */}
                  {newTreatment.medications.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Added Medications ({newTreatment.medications.length})</h4>
                      <div className="space-y-2">
                        {newTreatment.medications.map((med, index) => (
                          <div key={index} className="bg-white border border-gray-200 rounded-lg p-3 flex justify-between items-center">
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{med.medicationName}</div>
                              <div className="text-sm text-gray-600">
                                Quantity: {med.quantity} | 
                                {med.dosage && ` Dosage: ${med.dosage} |`}
                                {med.frequency && ` Frequency: ${med.frequency} |`}
                                {med.duration && ` Duration: ${med.duration}`}
                              </div>
                              {med.notes && (
                                <div className="text-xs text-gray-500 mt-1">Notes: {med.notes}</div>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveMedication(index)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>


                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Start Date</label>
                    <input
                      type="date"
                      value={newTreatment.startDate}
                      onChange={(e) => {
                        const value = e.target.value;
                        setNewTreatment({...newTreatment, startDate: value});
                        const startDateValidation = validateStartDate(value);
                        const endDateValidation = validateEndDate(value, newTreatment.endDate);
                        setTreatmentValidation(prev => ({
                          ...prev,
                          startDate: startDateValidation,
                          endDate: endDateValidation
                        }));
                      }}
                      className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${
                        treatmentValidation.startDate.isValid 
                          ? 'border-gray-300 focus:ring-green-500' 
                          : 'border-red-500 focus:ring-red-500'
                      }`}
                    />
                    {!treatmentValidation.startDate.isValid && (
                      <p className="text-red-500 text-sm mt-1">{treatmentValidation.startDate.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">End Date (Optional)</label>
                    <input
                      type="date"
                      value={newTreatment.endDate}
                      onChange={(e) => {
                        const value = e.target.value;
                        setNewTreatment({...newTreatment, endDate: value});
                        const endDateValidation = validateEndDate(newTreatment.startDate, value);
                        setTreatmentValidation(prev => ({
                          ...prev,
                          endDate: endDateValidation
                        }));
                      }}
                      className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${
                        treatmentValidation.endDate.isValid 
                          ? 'border-gray-300 focus:ring-green-500' 
                          : 'border-red-500 focus:ring-red-500'
                      }`}
                    />
                    {!treatmentValidation.endDate.isValid && (
                      <p className="text-red-500 text-sm mt-1">{treatmentValidation.endDate.message}</p>
                    )}
                  </div>
                </div>


                <div>
                  <label className="block text-sm font-medium mb-2">Treatment Notes</label>
                  <textarea
                    value={newTreatment.notes}
                    onChange={(e) => setNewTreatment({...newTreatment, notes: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    rows="4"
                    placeholder="Additional notes about the treatment plan..."
                  />
                </div>

                <div className="flex gap-4 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowTreatmentModal(false)}
                    className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploadingImages}
                    className={`flex-1 ${uploadingImages ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'} text-white py-2 rounded-lg transition-colors flex items-center justify-center`}
                  >
                    {uploadingImages ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {selectedTreatment ? 'Updating Treatment Plan...' : 'Creating Treatment Plan...'}
                      </>
                    ) : (
                      selectedTreatment ? 'Update Treatment Plan' : 'Create Treatment Plan'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Treatment View Modal */}
        {showTreatmentView && selectedCaseForTreatment && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" 
            style={{zIndex: 9999, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0}}
          >
            <div className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Treatment Plans - {selectedCaseForTreatment.caseId}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Animal Type: {selectedCaseForTreatment.animalType} | 
                    Status: {selectedCaseForTreatment.status} | 
                    Priority: {selectedCaseForTreatment.priority}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {trackingDevices[selectedCaseForTreatment._id] ? (
                    <button
                      onClick={() => {
                        setShowTreatmentView(false);
                        handleLiveLocation(selectedCaseForTreatment);
                      }}
                      className="bg-purple-600 text-white px-4 py-2 rounded text-sm hover:bg-purple-700 transition-colors"
                    >
                      Live Location
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setShowTreatmentView(false);
                        handleTrackAnimal(selectedCaseForTreatment);
                      }}
                      className="bg-purple-600 text-white px-4 py-2 rounded text-sm hover:bg-purple-700 transition-colors"
                    >
                      Track the Animal
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setShowTreatmentView(false);
                      handleAddTreatment(selectedCaseForTreatment);
                    }}
                    className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 transition-colors"
                  >
                    Add Treatment Plan
                  </button>
                  <button
                    onClick={() => {
                      setShowTreatmentView(false);
                      setSelectedCaseForTreatment(null);
                      setSelectedTreatment(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {caseTreatments[selectedCaseForTreatment._id] && caseTreatments[selectedCaseForTreatment._id].length > 0 ? (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <h3 className="font-medium text-blue-900">Treatment Summary</h3>
                        <p className="text-sm text-blue-700">
                          This case has {caseTreatments[selectedCaseForTreatment._id].length} treatment plan{caseTreatments[selectedCaseForTreatment._id].length > 1 ? 's' : ''} 
                          specifically created for {selectedCaseForTreatment.caseId}. Each treatment is unique to this animal case.
                        </p>
                      </div>
                    </div>
                  </div>
                  {caseTreatments[selectedCaseForTreatment._id].map((treatment, index) => (
                    <div key={treatment._id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            Treatment #{index + 1} - {treatment.treatmentId || 'N/A'}
                          </h3>
                          <p className="text-sm text-gray-500">
                            Created: {new Date(treatment.createdAt).toLocaleDateString()} | 
                            Case: {selectedCaseForTreatment.caseId}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedTreatment(treatment);
                              setShowTreatmentView(false);
                              setShowTreatmentModal(true);
                            }}
                            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                          >
                            Update
                          </button>
                          {treatment.status === 'Active' && (
                            <button
                              onClick={() => handleMarkTreatmentDone(treatment._id)}
                              className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                            >
                              Done
                            </button>
                          )}
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            treatment.status === 'Active' ? 'bg-green-100 text-green-800' : 
                            treatment.status === 'Completed' ? 'bg-blue-100 text-blue-800' : 
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {treatment.status}
                          </span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Treatment Type</label>
                          <p className="text-sm text-gray-900">{treatment.treatment}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis</label>
                          <p className="text-sm text-gray-900">{treatment.diagnosis}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                          <p className="text-sm text-gray-900">{new Date(treatment.startDate).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                          <p className="text-sm text-gray-900">{treatment.endDate ? new Date(treatment.endDate).toLocaleDateString() : 'Ongoing'}</p>
                        </div>
                      </div>
                      
                      {/* Medications Section */}
                      {(treatment.medications && treatment.medications.length > 0) || treatment.medication ? (
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">Medications</label>
                          <div className="space-y-2">
                            {/* Display multiple medications if available */}
                            {treatment.medications && treatment.medications.length > 0 ? (
                              treatment.medications.map((med, index) => (
                                <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                  <div className="font-medium text-gray-900">{med.medicationName}</div>
                                  <div className="text-sm text-gray-600 mt-1">
                                    <div>Quantity: {med.quantity}</div>
                                    {med.dosage && <div>Dosage: {med.dosage}</div>}
                                    {med.frequency && <div>Frequency: {med.frequency}</div>}
                                    {med.duration && <div>Duration: {med.duration}</div>}
                                    {med.notes && <div>Notes: {med.notes}</div>}
                                  </div>
                                </div>
                              ))
                            ) : (
                              /* Fallback to legacy single medication */
                              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                <div className="font-medium text-gray-900">{treatment.medication || 'N/A'}</div>
                                <div className="text-sm text-gray-600 mt-1">
                                  {treatment.dosage && <div>Dosage: {treatment.dosage}</div>}
                                  {treatment.frequency && <div>Frequency: {treatment.frequency}</div>}
                                  {treatment.duration && <div>Duration: {treatment.duration}</div>}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : null}
                      
                      {treatment.notes && (
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                          <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded">{treatment.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No treatment plans found for this case.</p>
                  <div className="flex justify-center gap-3">
                    {trackingDevices[selectedCaseForTreatment._id] ? (
                      <button
                        onClick={() => {
                          setShowTreatmentView(false);
                          handleLiveLocation(selectedCaseForTreatment);
                        }}
                        className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition-colors"
                      >
                        Live Location
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setShowTreatmentView(false);
                          handleTrackAnimal(selectedCaseForTreatment);
                        }}
                        className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition-colors"
                      >
                        Track the Animal
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setShowTreatmentView(false);
                        handleAddTreatment(selectedCaseForTreatment);
                      }}
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
                    >
                      Add Treatment Plan
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Animal Tracking Modal */}
        {showTrackModal && selectedCaseForTracking && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" 
            style={{zIndex: 9999, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0}}
          >
            <div className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Animal Tracking - {selectedCaseForTracking.caseId}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Animal Type: {selectedCaseForTracking.animalType} | 
                    Status: {selectedCaseForTracking.status} | 
                    Priority: {selectedCaseForTracking.priority}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowTrackModal(false);
                    setSelectedCaseForTracking(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* Case Information */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Case Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Case ID</label>
                      <p className="text-sm text-gray-900">{selectedCaseForTracking.caseId}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Animal Type</label>
                      <p className="text-sm text-gray-900">{selectedCaseForTracking.animalType}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Location</label>
                      <p className="text-sm text-gray-900">{selectedCaseForTracking.location}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedCaseForTracking.status)}`}>
                        {selectedCaseForTracking.status}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Priority</label>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(selectedCaseForTracking.priority)}`}>
                        {selectedCaseForTracking.priority}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Reported By</label>
                      <p className="text-sm text-gray-900">{selectedCaseForTracking.reportedBy}</p>
                    </div>
                  </div>
                </div>

                {/* Medical Information */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Medical Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Symptoms</label>
                      <p className="text-sm text-gray-900">{selectedCaseForTracking.symptoms || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Estimated Age</label>
                      <p className="text-sm text-gray-900">{selectedCaseForTracking.estimatedAge || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Weight</label>
                      <p className="text-sm text-gray-900">{selectedCaseForTracking.weight || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Contact Info</label>
                      <p className="text-sm text-gray-900">{selectedCaseForTracking.contactInfo || 'Not provided'}</p>
                    </div>
                  </div>
                </div>

                {/* Treatment History */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Treatment History</h3>
                  {caseTreatments[selectedCaseForTracking._id] && caseTreatments[selectedCaseForTracking._id].length > 0 ? (
                    <div className="space-y-3">
                      {caseTreatments[selectedCaseForTracking._id].map((treatment, index) => (
                        <div key={treatment._id || index} className="bg-white border border-gray-200 rounded-lg p-3">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-gray-900">{treatment.treatment}</h4>
                            <span className="text-xs text-gray-500">
                              {new Date(treatment.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{treatment.diagnosis}</p>
                          {treatment.medications && treatment.medications.length > 0 && (
                            <div className="text-sm text-gray-600">
                              <strong>Medications:</strong> {treatment.medications.map(med => med.medication).join(', ')}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No treatment plans found for this case.</p>
                  )}
                </div>

                {/* Case Timeline */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Case Timeline</h3>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                      <span className="text-gray-600">Case created on {new Date(selectedCaseForTracking.createdAt).toLocaleDateString()}</span>
                    </div>
                    {selectedCaseForTracking.updatedAt && selectedCaseForTracking.updatedAt !== selectedCaseForTracking.createdAt && (
                      <div className="flex items-center text-sm">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                        <span className="text-gray-600">Last updated on {new Date(selectedCaseForTracking.updatedAt).toLocaleDateString()}</span>
                      </div>
                    )}
                    {caseTreatments[selectedCaseForTracking._id] && caseTreatments[selectedCaseForTracking._id].length > 0 && (
                      <div className="flex items-center text-sm">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                        <span className="text-gray-600">{caseTreatments[selectedCaseForTracking._id].length} treatment plan(s) created</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notes */}
                {selectedCaseForTracking.notes && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Additional Notes</h3>
                    <p className="text-sm text-gray-900">{selectedCaseForTracking.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Device ID Input Modal */}
        {showDeviceModal && selectedCaseForTracking && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" 
            style={{zIndex: 9999, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0}}
          >
            <div className="bg-white rounded-2xl p-6 w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Add Tracking Device
                </h2>
                <button
                  onClick={() => {
                    setShowDeviceModal(false);
                    setSelectedCaseForTracking(null);
                    setNewDeviceId('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Case: <span className="font-medium">{selectedCaseForTracking.caseId}</span>
                </p>
                <p className="text-sm text-gray-600">
                  Animal: <span className="font-medium">{selectedCaseForTracking.animalType}</span>
                </p>
              </div>

              <form onSubmit={handleSaveDeviceId} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tracking Device ID
                  </label>
                  <input
                    type="text"
                    value={newDeviceId}
                    onChange={(e) => setNewDeviceId(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter device ID (e.g., GPS-001, TRK-123)"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter the unique identifier for the tracking device attached to this animal.
                  </p>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeviceModal(false);
                      setSelectedCaseForTracking(null);
                      setNewDeviceId('');
                    }}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Save Device ID
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Live Location Modal */}
        {showLiveLocation && selectedCaseForTracking && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" 
            style={{zIndex: 9999, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0}}
          >
            <div className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Live Location - {selectedCaseForTracking.caseId}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Animal Type: {selectedCaseForTracking.animalType} | 
                    Device ID: {trackingDevices[selectedCaseForTracking._id]?.deviceId}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowLiveLocation(false);
                    setSelectedCaseForTracking(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* Device Information */}
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Device Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Device ID</label>
                      <p className="text-sm text-gray-900">{trackingDevices[selectedCaseForTracking._id]?.deviceId}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Device Added</label>
                      <p className="text-sm text-gray-900">
                        {new Date(trackingDevices[selectedCaseForTracking._id]?.savedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Live Location Display */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Current Location</h3>
                  
                  {/* Demo Map */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
                    <div className="relative bg-gray-100 rounded-lg overflow-hidden" style={{height: '300px'}}>
                      {/* Map Background */}
                      <div className="absolute inset-0 bg-gradient-to-br from-green-100 to-blue-100">
                        {/* Grid Pattern */}
                        <div className="absolute inset-0 opacity-20">
                          <svg width="100%" height="100%" className="text-gray-400">
                            <defs>
                              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="1"/>
                              </pattern>
                            </defs>
                            <rect width="100%" height="100%" fill="url(#grid)" />
                          </svg>
                        </div>
                        
                        {/* Map Features */}
                        <div className="absolute top-4 left-4 text-xs text-gray-600 bg-white bg-opacity-80 px-2 py-1 rounded">
                          Sri Lanka Wildlife Reserve
                        </div>
                        
                        {/* Animal Location Marker */}
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                          <div className="relative">
                            {/* Pulse Animation */}
                            <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75"></div>
                            <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-50" style={{animationDelay: '0.5s'}}></div>
                            
                            {/* Main Marker */}
                            <div className="relative w-8 h-8 bg-red-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                              </svg>
                            </div>
                            
                            {/* Animal Icon */}
                            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
                              <div className="bg-white border border-gray-300 rounded-full p-1 shadow-md">
                                <svg className="w-4 h-4 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M10 2L3 7v11h4v-6h6v6h4V7l-7-5z"/>
                                </svg>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Location Info Box */}
                        <div className="absolute bottom-4 right-4 bg-white bg-opacity-90 rounded-lg p-3 shadow-lg max-w-xs">
                          <div className="text-xs font-medium text-gray-900 mb-1">Animal Location</div>
                          <div className="text-xs text-gray-600">7.8731° N, 80.7718° E</div>
                          <div className="text-xs text-green-600 font-medium mt-1">● Live Tracking</div>
                        </div>
                        
                        {/* Compass */}
                        <div className="absolute top-4 right-4 bg-white bg-opacity-90 rounded-full p-2 shadow-lg">
                          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    
                    {/* Map Controls */}
                    <div className="flex justify-between items-center mt-3">
                      <div className="flex gap-2">
                        <button className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors">
                          Satellite
                        </button>
                        <button className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors">
                          Terrain
                        </button>
                      </div>
                      <div className="text-xs text-gray-500">
                        Last updated: {new Date().toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                  
                  {/* Location Details */}
                  <div className="text-center">
                    <div className="bg-white border border-gray-200 rounded-lg p-4 max-w-md mx-auto">
                      <div className="text-sm text-gray-600 mb-2">Last Updated:</div>
                      <div className="text-lg font-mono text-gray-900">
                        {new Date().toLocaleTimeString()}
                      </div>
                      <div className="text-sm text-gray-600 mt-2">Coordinates:</div>
                      <div className="text-sm font-mono text-gray-900">
                        7.8731° N, 80.7718° E
                      </div>
                      <div className="text-sm text-gray-600 mt-2">Status:</div>
                      <div className="text-sm text-green-600 font-medium">
                        ● Online
                      </div>
                    </div>
                  </div>
                </div>

                {/* Location History */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Recent Location History</h3>
                  
                  {/* Movement Path Map */}
                  <div className="bg-white border border-gray-200 rounded-lg p-3 mb-4">
                    <div className="relative bg-gray-50 rounded overflow-hidden" style={{height: '150px'}}>
                      <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-blue-50">
                        {/* Movement Path */}
                        <svg className="absolute inset-0 w-full h-full">
                          <path
                            d="M 50 100 Q 100 50 150 80 Q 200 110 250 90"
                            stroke="#3B82F6"
                            strokeWidth="3"
                            fill="none"
                            strokeDasharray="5,5"
                            className="animate-pulse"
                          />
                          
                          {/* Previous Location */}
                          <circle cx="50" cy="100" r="4" fill="#3B82F6" />
                          <circle cx="50" cy="100" r="8" fill="#3B82F6" fillOpacity="0.3" className="animate-ping" />
                          
                          {/* Current Location */}
                          <circle cx="250" cy="90" r="4" fill="#EF4444" />
                          <circle cx="250" cy="90" r="8" fill="#EF4444" fillOpacity="0.3" className="animate-ping" />
                          
                          {/* Waypoint */}
                          <circle cx="150" cy="80" r="3" fill="#10B981" />
                        </svg>
                        
                        {/* Labels */}
                        <div className="absolute bottom-2 left-2 text-xs text-gray-600 bg-white bg-opacity-80 px-2 py-1 rounded">
                          Movement Path
                        </div>
                        <div className="absolute top-2 right-2 text-xs text-gray-600 bg-white bg-opacity-80 px-2 py-1 rounded">
                          Last 2 hours
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between bg-white border border-gray-200 rounded p-3">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                        <div>
                          <div className="text-sm font-medium">Current Location</div>
                          <div className="text-xs text-gray-500">7.8731° N, 80.7718° E</div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">{new Date().toLocaleTimeString()}</div>
                    </div>
                    <div className="flex items-center justify-between bg-white border border-gray-200 rounded p-3">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                        <div>
                          <div className="text-sm font-medium">Waypoint</div>
                          <div className="text-xs text-gray-500">7.8728° N, 80.7719° E</div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(Date.now() - 120000).toLocaleTimeString()}
                      </div>
                    </div>
                    <div className="flex items-center justify-between bg-white border border-gray-200 rounded p-3">
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                        <div>
                          <div className="text-sm font-medium">Previous Location</div>
                          <div className="text-xs text-gray-500">7.8725° N, 80.7720° E</div>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(Date.now() - 300000).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Inventory Modal */}
        {showInventoryModal && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" 
            style={{zIndex: 9999, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0}}
          >
            <div className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {selectedMedicine ? 'Edit Medicine' : 'Add New Medicine'}
              </h2>
              
              <form onSubmit={handleCreateMedicine} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Medicine Name *</label>
                    <input
                      type="text"
                      value={newMedicine.name}
                      onChange={(e) => {
                        const value = e.target.value;
                        setNewMedicine({...newMedicine, name: value});
                        const validation = validateMedicineName(value, selectedMedicine?._id);
                        setMedicineValidation(prev => ({
                          ...prev,
                          name: validation
                        }));
                      }}
                      className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${
                        medicineValidation.name.isValid 
                          ? 'border-gray-300 focus:ring-green-500' 
                          : 'border-red-500 focus:ring-red-500'
                      }`}
                      placeholder="e.g., Amoxicillin"
                      required
                    />
                    {!medicineValidation.name.isValid && (
                      <p className="text-red-500 text-sm mt-1">{medicineValidation.name.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Category *</label>
                    <select
                      value={newMedicine.category}
                      onChange={(e) => setNewMedicine({...newMedicine, category: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    >
                      <option value="Antibiotic">Antibiotic</option>
                      <option value="Pain Relief">Pain Relief</option>
                      <option value="Anti-inflammatory">Anti-inflammatory</option>
                      <option value="Vaccine">Vaccine</option>
                      <option value="Supplements">Supplements</option>
                      <option value="Emergency">Emergency</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Form *</label>
                    <select
                      value={newMedicine.form}
                      onChange={(e) => setNewMedicine({...newMedicine, form: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    >
                      <option value="Tablet">Tablet</option>
                      <option value="Capsule">Capsule</option>
                      <option value="Liquid">Liquid</option>
                      <option value="Injection">Injection</option>
                      <option value="Cream">Cream</option>
                      <option value="Ointment">Ointment</option>
                      <option value="Spray">Spray</option>
                      <option value="Drops">Drops</option>
                      <option value="Powder">Powder</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Strength *</label>
                    <input
                      type="text"
                      value={newMedicine.strength}
                      onChange={(e) => {
                        const value = e.target.value;
                        setNewMedicine({...newMedicine, strength: value});
                        const validation = validateMedicineStrength(value);
                        setMedicineValidation(prev => ({
                          ...prev,
                          strength: validation
                        }));
                      }}
                      className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${
                        medicineValidation.strength.isValid 
                          ? 'border-gray-300 focus:ring-green-500' 
                          : 'border-red-500 focus:ring-red-500'
                      }`}
                      placeholder="e.g., 500mg"
                      required
                    />
                    {!medicineValidation.strength.isValid && (
                      <p className="text-red-500 text-sm mt-1">{medicineValidation.strength.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Unit *</label>
                    <select
                      value={newMedicine.unit}
                      onChange={(e) => setNewMedicine({...newMedicine, unit: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                      required
                    >
                      <option value="mg">mg</option>
                      <option value="g">g</option>
                      <option value="ml">ml</option>
                      <option value="cc">cc</option>
                      <option value="units">units</option>
                      <option value="tablets">tablets</option>
                      <option value="capsules">capsules</option>
                      <option value="tubes">tubes</option>
                      <option value="bottles">bottles</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Current Stock *</label>
                    <input
                      type="number"
                      min="0"
                      value={newMedicine.currentStock}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0;
                        setNewMedicine({...newMedicine, currentStock: value});
                        const currentStockValidation = validateStockValue(value, 'Current Stock');
                        const stockRelationshipValidation = validateStockRelationship(value, newMedicine.minimumStock);
                        setMedicineValidation(prev => ({
                          ...prev,
                          currentStock: currentStockValidation
                        }));
                        // Also validate minimum stock relationship
                        if (!stockRelationshipValidation.isValid) {
                          setMedicineValidation(prev => ({
                            ...prev,
                            minimumStock: stockRelationshipValidation
                          }));
                        }
                      }}
                      className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${
                        medicineValidation.currentStock.isValid 
                          ? 'border-gray-300 focus:ring-green-500' 
                          : 'border-red-500 focus:ring-red-500'
                      }`}
                      required
                    />
                    {!medicineValidation.currentStock.isValid && (
                      <p className="text-red-500 text-sm mt-1">{medicineValidation.currentStock.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Minimum Stock *</label>
                    <input
                      type="number"
                      min="0"
                      value={newMedicine.minimumStock}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0;
                        setNewMedicine({...newMedicine, minimumStock: value});
                        const minimumStockValidation = validateStockValue(value, 'Minimum Stock');
                        const stockRelationshipValidation = validateStockRelationship(newMedicine.currentStock, value);
                        setMedicineValidation(prev => ({
                          ...prev,
                          minimumStock: minimumStockValidation
                        }));
                        // Also validate current stock relationship
                        if (!stockRelationshipValidation.isValid) {
                          setMedicineValidation(prev => ({
                            ...prev,
                            currentStock: stockRelationshipValidation
                          }));
                        }
                      }}
                      className={`w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${
                        medicineValidation.minimumStock.isValid 
                          ? 'border-gray-300 focus:ring-green-500' 
                          : 'border-red-500 focus:ring-red-500'
                      }`}
                      required
                    />
                    {!medicineValidation.minimumStock.isValid && (
                      <p className="text-red-500 text-sm mt-1">{medicineValidation.minimumStock.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Status</label>
                    <select
                      value={newMedicine.status}
                      onChange={(e) => setNewMedicine({...newMedicine, status: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Out of Stock">Out of Stock</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Notes</label>
                  <textarea
                    value={newMedicine.notes}
                    onChange={(e) => setNewMedicine({...newMedicine, notes: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    rows="3"
                    placeholder="Additional notes about this medicine"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowInventoryModal(false);
                      setSelectedMedicine(null);
                      setError(null);
                      // Reset validation state
                      setMedicineValidation({
                        name: { isValid: true, message: '' },
                        strength: { isValid: true, message: '' },
                        currentStock: { isValid: true, message: '' },
                        minimumStock: { isValid: true, message: '' }
                      });
                    }}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploadingImages}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {uploadingImages ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {selectedMedicine ? 'Updating Medicine...' : 'Adding Medicine...'}
                      </>
                    ) : (
                      selectedMedicine ? 'Update Medicine' : 'Add Medicine'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Stock Update Modal */}
        {showStockModal && selectedMedicine && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" 
            style={{zIndex: 9999, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0}}
          >
            <div className="bg-white rounded-2xl p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Update Stock - {selectedMedicine.name}
              </h2>
              
              <form onSubmit={handleStockUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Action</label>
                  <select
                    value={stockUpdate.action}
                    onChange={(e) => setStockUpdate({...stockUpdate, action: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  >
                    <option value="add">Add Stock</option>
                    <option value="remove">Remove Stock</option>
                    <option value="set">Set Stock</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Quantity</label>
                  <input
                    type="number"
                    min="0"
                    value={stockUpdate.quantity}
                    onChange={(e) => setStockUpdate({...stockUpdate, quantity: parseInt(e.target.value) || 0})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowStockModal(false);
                      setSelectedMedicine(null);
                      setError(null);
                    }}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploadingImages}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {uploadingImages ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Updating Stock...
                      </>
                    ) : (
                      'Update Stock'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Call Simulation Modal */}
        {showCallModal && callingVet && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" 
            style={{zIndex: 9999, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0}}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowCallModal(false);
                setCallingVet(null);
              }
            }}
          >
            <div className="bg-white rounded-2xl p-8 w-full max-w-md mx-4">
              <div className="text-center">
                {/* Phone Icon Animation */}
                <div className="mb-6">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                    <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  
                  {/* Calling Animation */}
                  <div className="flex justify-center space-x-1 mb-4">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>

                {/* Calling Message */}
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Calling Dr. {callingVet.firstName} {callingVet.lastName}...
                </h2>
                <p className="text-gray-600 mb-6">
                  {callingVet.specialization} • {callingVet.experience} experience
                </p>

                {/* End Call Button */}
                <button
                  onClick={() => {
                    setShowCallModal(false);
                    setCallingVet(null);
                  }}
                  className="bg-red-600 text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors flex items-center gap-2 mx-auto"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  End Call
                </button>
              </div>
            </div>
          </div>
        )}


        <Footer />
      </div>
    </RoleGuard>
  );
};

// StatCard component
const StatCard = ({ title, value, color, icon, loading = false, error = false }) => {
  const colorMap = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    red: 'bg-red-100 text-red-600',
    orange: 'bg-orange-100 text-orange-600',
    purple: 'bg-purple-100 text-purple-600',
  };

  const displayValue = () => {
    if (loading) {
      return (
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400 mr-2"></div>
          <span className="text-sm text-gray-500">Loading...</span>
        </div>
      );
    }
    if (error) {
      return <span className="text-red-500">N/A</span>;
    }
    return value;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center">
        <span className={`p-3 rounded-xl ${colorMap[color]} shadow-sm`}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={icon} /></svg>
        </span>
        <div className="ml-4">
          <div className="text-sm font-medium text-gray-600 mb-1">{title}</div>
          <div className="text-2xl font-bold text-gray-900">{displayValue()}</div>
        </div>
      </div>
    </div>
  );
};

export default VetDashboard;