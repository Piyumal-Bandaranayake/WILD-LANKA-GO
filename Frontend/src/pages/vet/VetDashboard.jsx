import React, { useState, useEffect } from 'react';
import { useAuthContext } from '../../contexts/AuthContext';
import { protectedApi } from '../../services/authService';
import ProtectedRoute from '../../components/ProtectedRoute';
import Navbar from '../../components/Navbar';
import Footer from '../../components/footer';
// Icons for GPS tracking
import { 
  FaMapMarkerAlt as MapPin, 
  FaSync as RefreshCw, 
  FaShieldAlt as Shield, 
  FaCrosshairs as Target, 
  FaChartLine as Activity, 
  FaExclamationTriangle as AlertTriangle, 
  FaClock as Clock, 
  FaTimes as X 
} from 'react-icons/fa';

const VetDashboard = () => {
  const { backendUser, user } = useAuthContext();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Dashboard data states
  const [animalCases, setAnimalCases] = useState([]);
  const [medications, setMedications] = useState([]);
  const [treatments, setTreatments] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [collaborations, setCollaborations] = useState([]);
  const [gpsTracking, setGpsTracking] = useState([]);
  const [vetProfiles, setVetProfiles] = useState([]);
  const [stats, setStats] = useState({
    totalCases: 0,
    activeCases: 0,
    newCases: 0,
    inTreatment: 0,
    recoveredAnimals: 0,
    deceased: 0,
    transferred: 0,
    criticalCases: 0,
    medicationItems: 0,
    lowStockItems: 0,
    expiringSoon: 0,
    collaboratingCases: 0,
    trackedAnimals: 0,
    reportsGenerated: 0
  });

  // View mode states
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'gallery'
  const [selectedCaseForEdit, setSelectedCaseForEdit] = useState(null);

  // Modal states
  const [showCaseModal, setShowCaseModal] = useState(false);
  const [showTreatmentModal, setShowTreatmentModal] = useState(false);
  const [showMedicationModal, setShowMedicationModal] = useState(false);
  const [showCollaborationModal, setShowCollaborationModal] = useState(false);
  const [showGPSModal, setShowGPSModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  // GPS Modal state
  const [showGPSTracking, setShowGPSTracking] = useState(false);
  const [showGeofenceModal, setShowGeofenceModal] = useState(false);
  const [geofenceForm, setGeofenceForm] = useState({
    centerLat: '',
    centerLng: '',
    radius: 1, // km
    alertType: 'both', // exit, enter, both
    description: ''
  });

  // Comprehensive modal state object
  const [modals, setModals] = useState({
    showCaseModal: false,
    showTreatmentModal: false,
    showMedicationModal: false,
    showCollaborationModal: false,
    showGpsModal: false,
    showReportModal: false
  });

  // Enhanced form states
  const [caseForm, setCaseForm] = useState({
    animalId: '',
    species: '',
    sex: '',
    age: '',
    condition: '',
    foundLocation: '',
    urgencyLevel: 'medium',
    images: [],
    description: '',
    weight: '',
    temperature: '',
    heartRate: '',
    respiratoryRate: '',
    gpsCollarId: '',
    assignedVet: backendUser?._id || ''
  });

  const [treatmentForm, setTreatmentForm] = useState({
    caseId: '',
    diagnosis: '',
    medicationPlan: '',
    dosage: '',
    treatmentSteps: '',
    notes: '',
    surgeryRequired: false,
    surgeryDetails: '',
    status: 'ongoing',
    dailyTreatment: '',
    progressImages: [],
    labReports: [],
    xrayImages: [],
    estimatedRecoveryTime: '',
    followUpDate: ''
  });

  const [medicationForm, setMedicationForm] = useState({
    name: '',
    batchNumber: '',
    quantity: '',
    expiryDate: '',
    supplier: '',
    type: '',
    unitPrice: '',
    storageConditions: '',
    prescriptionRequired: false,
    sideEffects: '',
    dosageInstructions: ''
  });

  // Search and filter states
  const [searchFilters, setSearchFilters] = useState({
    caseSearch: '',
    treatmentSearch: '',
    medicationSearch: '',
    statusFilter: '',
    urgencyFilter: '',
    speciesFilter: '',
    dateFrom: '',
    dateTo: '',
    assignedVet: '',
    location: ''
  });

  // Sorting state
  const [sortConfig, setSortConfig] = useState({
    field: 'createdAt',
    direction: 'desc'
  });

  // Profile management
  const [vetProfile, setVetProfile] = useState({
    name: '',
    email: '',
    specialization: '',
    license: '',
    experience: '',
    qualifications: [],
    contactNumber: '',
    emergencyContact: ''
  });

  // Form validation state
  const [formErrors, setFormErrors] = useState({});
  const [formTouched, setFormTouched] = useState({});

  // Bulk operations state
  const [selectedCases, setSelectedCases] = useState([]);
  const [bulkAction, setBulkAction] = useState('');

  useEffect(() => {
    fetchDashboardData();
    initializeProfile();
  }, [backendUser]);

  const initializeProfile = () => {
    if (backendUser) {
      // Initialize any profile-specific data or settings
      console.log('Veterinary profile initialized for:', backendUser.name);
    }
  };

  // === FORM VALIDATION FUNCTIONS ===
  const validateField = (fieldName, value, formType = 'case') => {
    let error = '';

    switch (fieldName) {
      case 'species':
        if (!value.trim()) error = 'Species is required';
        else if (value.trim().length < 2) error = 'Species must be at least 2 characters';
        break;
      
      case 'condition':
        if (!value.trim()) error = 'Condition description is required';
        else if (value.trim().length < 5) error = 'Condition must be at least 5 characters';
        break;
      
      case 'foundLocation':
        if (!value.trim()) error = 'Found location is required';
        break;
      
      case 'weight':
        if (value && isNaN(parseFloat(value))) error = 'Weight must be a valid number';
        else if (value && parseFloat(value) <= 0) error = 'Weight must be positive';
        break;
      
      case 'temperature':
        if (value && isNaN(parseFloat(value))) error = 'Temperature must be a valid number';
        else if (value && (parseFloat(value) < 30 || parseFloat(value) > 45)) error = 'Temperature should be between 30-45°C';
        break;
      
      case 'heartRate':
        if (value && isNaN(parseInt(value))) error = 'Heart rate must be a valid number';
        else if (value && (parseInt(value) < 10 || parseInt(value) > 300)) error = 'Heart rate should be between 10-300 BPM';
        break;
      
      case 'diagnosis':
        if (formType === 'treatment' && !value.trim()) error = 'Diagnosis is required';
        else if (formType === 'treatment' && value.trim().length < 3) error = 'Diagnosis must be at least 3 characters';
        break;
      
      case 'medication':
        if (formType === 'treatment' && !value.trim()) error = 'Medication is required';
        break;
      
      case 'dosage':
        if (formType === 'medication' && !value.trim()) error = 'Dosage is required';
        break;
      
      case 'frequency':
        if (formType === 'medication' && !value.trim()) error = 'Frequency is required';
        break;
      
      default:
        break;
    }

    return error;
  };

  const validateForm = (formData, formType) => {
    const errors = {};
    
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key], formType);
      if (error) errors[key] = error;
    });

    return errors;
  };

  const handleFieldChange = (formType, field, value) => {
    // Update form data
    if (formType === 'case') {
      setCaseForm(prev => ({ ...prev, [field]: value }));
    } else if (formType === 'treatment') {
      setTreatmentForm(prev => ({ ...prev, [field]: value }));
    } else if (formType === 'medication') {
      setMedicationForm(prev => ({ ...prev, [field]: value }));
    }

    // Mark field as touched
    setFormTouched(prev => ({ ...prev, [`${formType}_${field}`]: true }));

    // Validate field in real-time
    const error = validateField(field, value, formType);
    setFormErrors(prev => ({
      ...prev,
      [`${formType}_${field}`]: error
    }));
  };

  // === BULK OPERATIONS ===
  const handleSelectCase = (caseId) => {
    setSelectedCases(prev => 
      prev.includes(caseId) 
        ? prev.filter(id => id !== caseId)
        : [...prev, caseId]
    );
  };

  const handleSelectAll = () => {
    const filteredCases = getSortedAndFilteredCases();
    if (selectedCases.length === filteredCases.length) {
      setSelectedCases([]);
    } else {
      setSelectedCases(filteredCases.map(case_ => case_._id));
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedCases.length === 0) return;

    try {
      switch (bulkAction) {
        case 'updateStatus':
          await bulkUpdateStatus(selectedCases, 'in-treatment');
          break;
        case 'assignVet':
          await bulkAssignVet(selectedCases, backendUser?._id || user?.sub);
          break;
        case 'markCritical':
          await bulkUpdateUrgency(selectedCases, 'critical');
          break;
        case 'delete':
          if (window.confirm(`Are you sure you want to delete ${selectedCases.length} cases?`)) {
            await bulkDeleteCases(selectedCases);
          }
          break;
        default:
          break;
      }
      
      // Clear selection after action
      setSelectedCases([]);
      setBulkAction('');
      
      // Refresh data
      fetchDashboardData();
    } catch (error) {
      console.error('Bulk action failed:', error);
      setError('Failed to perform bulk action');
    }
  };

  const bulkUpdateStatus = async (caseIds, status) => {
    // Update local state for demo
    setAnimalCases(prev => 
      prev.map(case_ => 
        caseIds.includes(case_._id) 
          ? { ...case_, status }
          : case_
      )
    );
  };

  const bulkAssignVet = async (caseIds, vetId) => {
    // Update local state for demo
    setAnimalCases(prev => 
      prev.map(case_ => 
        caseIds.includes(case_._id) 
          ? { ...case_, assignedVet: vetId }
          : case_
      )
    );
  };

  const bulkUpdateUrgency = async (caseIds, urgencyLevel) => {
    // Update local state for demo
    setAnimalCases(prev => 
      prev.map(case_ => 
        caseIds.includes(case_._id) 
          ? { ...case_, urgencyLevel }
          : case_
      )
    );
  };

  const bulkDeleteCases = async (caseIds) => {
    // Update local state for demo
    setAnimalCases(prev => prev.filter(case_ => !caseIds.includes(case_._id)));
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch data from all endpoints in parallel
      const [
        animalCasesResult,
        treatmentsResult,
        medicationsResult,
        inventoryResult,
        collaborationsResult,
        statsResult
      ] = await Promise.allSettled([
        protectedApi.getAnimalCases(),
        protectedApi.getTreatments(),
        protectedApi.getMedicationInventory(),
        protectedApi.getMedicationInventory(), // Using same endpoint for now
        protectedApi.getVetCollaborations(),
        protectedApi.getVetDashboardStats()
      ]);

      // Handle animal cases
      if (animalCasesResult.status === 'fulfilled') {
        const cases = animalCasesResult.value.data?.cases || animalCasesResult.value.data || [];
        setAnimalCases(cases);
      } else {
        console.error('Failed to fetch animal cases:', animalCasesResult.reason);
        setAnimalCases([]);
      }

      // Handle treatments
      if (treatmentsResult.status === 'fulfilled') {
        const treatments = treatmentsResult.value.data || [];
        setTreatments(treatments);
      } else {
        console.error('Failed to fetch treatments:', treatmentsResult.reason);
        setTreatments([]);
      }

      // Handle medications
      if (medicationsResult.status === 'fulfilled') {
        const medications = medicationsResult.value.data || [];
        setMedications(medications);
      } else {
        console.error('Failed to fetch medications:', medicationsResult.reason);
        setMedications([]);
      }

      // Handle inventory (transform medications for inventory view)
      if (inventoryResult.status === 'fulfilled') {
        const inventory = inventoryResult.value.data || [];
        // Transform medications into inventory format
        const inventoryItems = inventory.map(med => ({
          ...med,
          minimumStock: med.minimumStock || 10, // Default minimum stock
          lowStock: med.quantity < (med.minimumStock || 10)
        }));
        setInventory(inventoryItems);
      } else {
        console.error('Failed to fetch inventory:', inventoryResult.reason);
        setInventory([]);
      }

      // Handle collaborations
      if (collaborationsResult.status === 'fulfilled') {
        const collaborations = collaborationsResult.value.data || [];
        setCollaborations(collaborations);
      } else {
        console.error('Failed to fetch collaborations:', collaborationsResult.reason);
        setCollaborations([]);
      }

      // Handle dashboard stats
      if (statsResult.status === 'fulfilled') {
        const dashboardStats = statsResult.value.data || {};
        setStats({
          totalCases: dashboardStats.totalCases || 0,
          activeCases: dashboardStats.activeCases || 0,
          criticalCases: dashboardStats.criticalCases || 0,
          recoveredAnimals: dashboardStats.recoveredAnimals || 0
        });
      } else {
        console.error('Failed to fetch dashboard stats:', statsResult.reason);
        // Calculate stats from animal cases if stats endpoint fails
        const cases = animalCases;
        setStats({
          totalCases: cases.length,
          activeCases: cases.filter(c => c.status === 'in-treatment' || c.status === 'rescued').length,
          criticalCases: cases.filter(c => c.urgencyLevel === 'critical').length,
          recoveredAnimals: cases.filter(c => c.status === 'released' || c.status === 'ready-for-release').length
        });
      }

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setError('Failed to load dashboard data. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const createAnimalCase = async (e) => {
    e.preventDefault();
    
    // Validate form before submission
    const errors = validateForm(caseForm, 'case');
    setFormErrors(prev => ({ ...prev, ...Object.keys(errors).reduce((acc, key) => {
      acc[`case_${key}`] = errors[key];
      return acc;
    }, {}) }));

    if (Object.keys(errors).length > 0) {
      setError('Please fix the form errors before submitting');
      return;
    }

    try {
      // For demo purposes, add to local state if API isn't available
      const newCase = {
        _id: `case_${Date.now()}`,
        animalId: caseForm.animalId || generateAnimalId(),
        species: caseForm.species,
        sex: caseForm.sex,
        age: caseForm.age,
        condition: caseForm.condition,
        foundLocation: caseForm.foundLocation,
        urgencyLevel: caseForm.urgencyLevel,
        status: 'rescued',
        images: caseForm.images,
        createdAt: new Date().toISOString()
      };
      
      try {
        const formData = new FormData();
        Object.keys(caseForm).forEach(key => {
          if (key === 'images') {
            caseForm.images.forEach(image => formData.append('images', image));
          } else {
            formData.append(key, caseForm[key]);
          }
        });
        await protectedApi.createAnimalCase(formData);
        await fetchDashboardData();
      } catch (apiError) {
        console.log('API not available, adding to local state');
        setAnimalCases(prev => [...prev, newCase]);
      }
      
      setCaseForm({ animalId: '', species: '', sex: '', age: '', condition: '', foundLocation: '', urgencyLevel: 'medium', images: [] });
      closeAllModals();
      setError(null);
    } catch (error) {
      setError('Failed to create animal case.');
    }
  };

  const updateCaseStatus = async (caseId, status) => {
    try {
      await protectedApi.updateAnimalCaseStatus(caseId, status);
      await fetchDashboardData();
      setError(null);
    } catch (error) {
      setError('Failed to update case status.');
    }
  };

  const addTreatment = async (e) => {
    e.preventDefault();
    try {
      // Auto-deduct medication from inventory when used
      if (treatmentForm.medication) {
        const medication = inventory.find(med => 
          med.name.toLowerCase() === treatmentForm.medication.toLowerCase()
        );
        
        if (medication) {
          const dosageAmount = parseInt(treatmentForm.dosage) || 1;
          await updateMedicationStock(medication._id, medication.quantity - dosageAmount);
        }
      }
      
      await protectedApi.addTreatment(treatmentForm);
      setTreatmentForm({ 
        caseId: '', 
        diagnosis: '', 
        medication: '', 
        dosage: '', 
        treatmentPlan: '', 
        notes: '',
        dailyTreatment: '',
        progressImages: [],
        status: 'ongoing'
      });
      await fetchDashboardData();
      setError(null);
    } catch (error) {
      setError('Failed to add treatment.');
    }
  };

  const addMedication = async (e) => {
    e.preventDefault();
    try {
      await protectedApi.addMedication(medicationForm);
      setMedicationForm({ name: '', batchNumber: '', quantity: '', expiryDate: '', supplier: '' });
      await fetchDashboardData();
      setError(null);
    } catch (error) {
      setError('Failed to add medication to inventory.');
    }
  };

  // === COMPREHENSIVE REPORTS & EXPORTS ===
  const generateReport = async (type, options = {}) => {
    try {
      setLoading(true);
      
      let reportData;
      let fileName;
      let reportContent;
      
      switch (type) {
        case 'case-summary':
          reportData = generateCaseSummaryReport(options.caseId);
          fileName = `individual-case-report-${options.caseId || 'all'}.pdf`;
          break;
          
        case 'monthly':
          reportData = generateMonthlyTreatmentReport(options.month, options.year);
          fileName = `monthly-treatment-log-${options.month || new Date().getMonth() + 1}-${options.year || new Date().getFullYear()}.pdf`;
          break;
          
        case 'medication-usage':
          reportData = generateMedicationUsageReport(options.startDate, options.endDate);
          fileName = `medication-usage-report-${new Date().toISOString().split('T')[0]}.pdf`;
          break;
          
        case 'activity-summary':
          reportData = generateVetActivityReport(options.startDate, options.endDate);
          fileName = `vet-activity-summary-${new Date().toISOString().split('T')[0]}.pdf`;
          break;
          
        default:
          throw new Error('Unknown report type');
      }
      
      // Create downloadable report
      if (options.format === 'json') {
        downloadAsJSON(reportData, fileName.replace('.pdf', '.json'));
      } else if (options.format === 'csv') {
        downloadAsCSV(reportData, fileName.replace('.pdf', '.csv'));
      } else {
        downloadAsPDF(reportData, fileName);
      }
      
      setError(null);
      
    } catch (error) {
      setError(`Failed to generate ${type} report: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const generateCaseSummaryReport = (caseId) => {
    const selectedCases = caseId ? animalCases.filter(c => c._id === caseId) : animalCases;
    
    return {
      title: 'Individual Animal Case Report',
      generatedDate: new Date().toISOString(),
      generatedBy: backendUser?.name || 'Veterinarian',
      totalCases: selectedCases.length,
      cases: selectedCases.map(case_ => ({
        animalId: case_.animalId,
        species: case_.species,
        sex: case_.sex,
        age: case_.age,
        condition: case_.condition,
        urgencyLevel: case_.urgencyLevel,
        status: case_.status,
        foundLocation: case_.foundLocation,
        rescueDate: case_.createdAt,
        assignedVet: case_.assignedVet,
        treatments: treatments.filter(t => t.caseId === case_._id).map(t => ({
          diagnosis: t.diagnosis,
          treatmentPlan: t.treatmentPlan,
          medication: t.medication,
          dosage: t.dosage,
          status: t.status,
          createdDate: t.createdAt,
          dailyTreatment: t.dailyTreatment,
          surgicalPlan: t.surgicalPlan,
          recoveryPlan: t.recoveryPlan
        })),
        medicationsUsed: treatments
          .filter(t => t.caseId === case_._id && t.medication)
          .map(t => ({
            medication: t.medication,
            dosage: t.dosage,
            dateAdministered: t.createdAt
          })),
        images: case_.images || [],
        gpsData: case_.gpsData || {},
        notes: case_.notes || '',
        outcome: case_.outcome || 'In Progress'
      })),
      summary: {
        byStatus: selectedCases.reduce((acc, case_) => {
          acc[case_.status] = (acc[case_.status] || 0) + 1;
          return acc;
        }, {}),
        byUrgency: selectedCases.reduce((acc, case_) => {
          acc[case_.urgencyLevel] = (acc[case_.urgencyLevel] || 0) + 1;
          return acc;
        }, {}),
        bySpecies: selectedCases.reduce((acc, case_) => {
          acc[case_.species] = (acc[case_.species] || 0) + 1;
          return acc;
        }, {}),
        recoveryRate: selectedCases.length > 0 ? 
          (selectedCases.filter(c => c.status === 'recovered').length / selectedCases.length * 100).toFixed(2) : 0
      }
    };
  };

  const generateMonthlyTreatmentReport = (month, year) => {
    const targetMonth = month || new Date().getMonth() + 1;
    const targetYear = year || new Date().getFullYear();
    
    const monthlyTreatments = treatments.filter(t => {
      const treatmentDate = new Date(t.createdAt);
      return treatmentDate.getMonth() + 1 === targetMonth && treatmentDate.getFullYear() === targetYear;
    });
    
    return {
      title: 'Monthly Treatment Log Report',
      period: `${targetMonth}/${targetYear}`,
      generatedDate: new Date().toISOString(),
      generatedBy: backendUser?.name || 'Veterinarian',
      totalTreatments: monthlyTreatments.length,
      treatments: monthlyTreatments.map(treatment => {
        const caseDetails = animalCases.find(c => c._id === treatment.caseId);
        return {
          treatmentId: treatment._id,
          animalId: caseDetails?.animalId,
          species: caseDetails?.species,
          diagnosis: treatment.diagnosis,
          treatmentPlan: treatment.treatmentPlan,
          medication: treatment.medication,
          dosage: treatment.dosage,
          status: treatment.status,
          surgeryRequired: treatment.surgeryRequired,
          dailyTreatment: treatment.dailyTreatment,
          treatmentDate: treatment.createdAt,
          vetInCharge: treatment.vetId || backendUser?.name,
          outcome: treatment.outcome || 'Ongoing',
          progressNotes: treatment.progressNotes || '',
          complications: treatment.complications || 'None'
        };
      }),
      statistics: {
        completedTreatments: monthlyTreatments.filter(t => t.status === 'completed').length,
        ongoingTreatments: monthlyTreatments.filter(t => t.status === 'ongoing').length,
        pausedTreatments: monthlyTreatments.filter(t => t.status === 'paused').length,
        surgicalCases: monthlyTreatments.filter(t => t.surgeryRequired).length,
        medicationsUsed: [...new Set(monthlyTreatments.map(t => t.medication).filter(Boolean))],
        averageTreatmentDuration: calculateAverageTreatmentDuration(monthlyTreatments),
        successRate: monthlyTreatments.length > 0 ? 
          (monthlyTreatments.filter(t => t.status === 'completed').length / monthlyTreatments.length * 100).toFixed(2) : 0
      }
    };
  };

  const generateMedicationUsageReport = (startDate, endDate) => {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    
    const relevantTreatments = treatments.filter(t => {
      const treatmentDate = new Date(t.createdAt);
      return treatmentDate >= start && treatmentDate <= end && t.medication;
    });
    
    const medicationUsage = relevantTreatments.reduce((acc, treatment) => {
      const med = treatment.medication;
      if (!acc[med]) {
        acc[med] = {
          name: med,
          totalUsed: 0,
          casesUsed: [],
          dosages: [],
          treatments: []
        };
      }
      acc[med].totalUsed += 1;
      acc[med].casesUsed.push(treatment.caseId);
      acc[med].dosages.push(treatment.dosage);
      acc[med].treatments.push({
        caseId: treatment.caseId,
        dosage: treatment.dosage,
        date: treatment.createdAt,
        diagnosis: treatment.diagnosis
      });
      return acc;
    }, {});
    
    return {
      title: 'Medication Usage Report',
      period: `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`,
      generatedDate: new Date().toISOString(),
      generatedBy: backendUser?.name || 'Veterinarian',
      totalMedicationsUsed: Object.keys(medicationUsage).length,
      totalUsageInstances: relevantTreatments.length,
      medicationBreakdown: Object.values(medicationUsage).map(med => ({
        medication: med.name,
        timesUsed: med.totalUsed,
        uniqueCases: [...new Set(med.casesUsed)].length,
        commonDosages: [...new Set(med.dosages)],
        recentUsage: med.treatments.slice(-5)
      })),
      inventoryComparison: inventory.map(item => {
        const usage = medicationUsage[item.name];
        return {
          medication: item.name,
          currentStock: item.quantity,
          usageCount: usage ? usage.totalUsed : 0,
          stockStatus: item.quantity < 10 ? 'Low' : item.quantity < 50 ? 'Medium' : 'Good',
          expiryDate: item.expiryDate,
          recommendedRestock: (usage?.totalUsed || 0) > (item.quantity / 2)
        };
      }),
      recommendations: generateMedicationRecommendations(medicationUsage, inventory)
    };
  };

  const generateVetActivityReport = (startDate, endDate) => {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    
    const periodCases = animalCases.filter(c => {
      const caseDate = new Date(c.createdAt);
      return caseDate >= start && caseDate <= end;
    });
    
    const periodTreatments = treatments.filter(t => {
      const treatmentDate = new Date(t.createdAt);
      return treatmentDate >= start && treatmentDate <= end;
    });
    
    return {
      title: 'Veterinarian Activity Summary',
      period: `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`,
      generatedDate: new Date().toISOString(),
      veterinarian: backendUser?.name || 'Veterinarian',
      summary: {
        totalCasesHandled: periodCases.length,
        totalTreatmentsAdministered: periodTreatments.length,
        casesByUrgency: periodCases.reduce((acc, case_) => {
          acc[case_.urgencyLevel] = (acc[case_.urgencyLevel] || 0) + 1;
          return acc;
        }, {}),
        treatmentsByType: periodTreatments.reduce((acc, treatment) => {
          const type = treatment.surgeryRequired ? 'Surgical' : 'Medical';
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {}),
        successfulOutcomes: periodCases.filter(c => c.status === 'recovered').length,
        activeCollaborations: collaborations?.length || 0,
        averageCaseResolutionTime: calculateAverageResolutionTime(periodCases)
      },
      dailyActivity: generateDailyActivityBreakdown(periodCases, periodTreatments, start, end),
      performanceMetrics: {
        caseSuccessRate: periodCases.length > 0 ? 
          (periodCases.filter(c => c.status === 'recovered').length / periodCases.length * 100).toFixed(2) : 0,
        treatmentCompletionRate: periodTreatments.length > 0 ? 
          (periodTreatments.filter(t => t.status === 'completed').length / periodTreatments.length * 100).toFixed(2) : 0,
        averageCasesPerDay: periodCases.length / Math.ceil((end - start) / (1000 * 60 * 60 * 24)),
        criticalCasesHandled: periodCases.filter(c => c.urgencyLevel === 'critical').length,
        emergencyResponseTime: 'Under 2 hours', // This would be calculated from actual data
        collaborationEffectiveness: '95%' // This would be calculated from actual collaboration data
      },
      recommendations: generateVetPerformanceRecommendations(periodCases, periodTreatments)
    };
  };

  // Helper functions for report generation
  const calculateAverageTreatmentDuration = (treatments) => {
    const completedTreatments = treatments.filter(t => t.status === 'completed' && t.completedAt);
    if (completedTreatments.length === 0) return 'N/A';
    
    const totalDuration = completedTreatments.reduce((acc, t) => {
      const start = new Date(t.createdAt);
      const end = new Date(t.completedAt);
      return acc + (end - start);
    }, 0);
    
    const avgMs = totalDuration / completedTreatments.length;
    const avgDays = Math.round(avgMs / (1000 * 60 * 60 * 24));
    return `${avgDays} days`;
  };

  const calculateAverageResolutionTime = (cases) => {
    const resolvedCases = cases.filter(c => c.status === 'recovered' && c.resolvedAt);
    if (resolvedCases.length === 0) return 'N/A';
    
    const totalTime = resolvedCases.reduce((acc, c) => {
      const start = new Date(c.createdAt);
      const end = new Date(c.resolvedAt);
      return acc + (end - start);
    }, 0);
    
    const avgMs = totalTime / resolvedCases.length;
    const avgDays = Math.round(avgMs / (1000 * 60 * 60 * 24));
    return `${avgDays} days`;
  };

  const generateDailyActivityBreakdown = (cases, treatments, start, end) => {
    const days = [];
    const current = new Date(start);
    
    while (current <= end) {
      const dayStr = current.toISOString().split('T')[0];
      const dayCases = cases.filter(c => c.createdAt.startsWith(dayStr));
      const dayTreatments = treatments.filter(t => t.createdAt.startsWith(dayStr));
      
      days.push({
        date: dayStr,
        casesRegistered: dayCases.length,
        treatmentsAdministered: dayTreatments.length,
        criticalCases: dayCases.filter(c => c.urgencyLevel === 'critical').length,
        completedTreatments: dayTreatments.filter(t => t.status === 'completed').length
      });
      
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  const generateMedicationRecommendations = (usage, inventory) => {
    const recommendations = [];
    
    // Check for frequently used medications with low stock
    Object.values(usage).forEach(med => {
      const inventoryItem = inventory.find(i => i.name === med.name);
      if (inventoryItem && inventoryItem.quantity < med.totalUsed * 2) {
        recommendations.push(`Consider restocking ${med.name} - high usage (${med.totalUsed} times) but low stock (${inventoryItem.quantity})`);
      }
    });
    
    // Check for expired or expiring medications
    inventory.forEach(item => {
      const daysUntilExpiry = Math.floor((new Date(item.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
      if (daysUntilExpiry < 30 && daysUntilExpiry > 0) {
        recommendations.push(`${item.name} expires in ${daysUntilExpiry} days - consider using or replacing`);
      } else if (daysUntilExpiry <= 0) {
        recommendations.push(`${item.name} has expired - remove from inventory immediately`);
      }
    });
    
    return recommendations;
  };

  const generateVetPerformanceRecommendations = (cases, treatments) => {
    const recommendations = [];
    
    // Success rate analysis
    const successRate = cases.length > 0 ? (cases.filter(c => c.status === 'recovered').length / cases.length * 100) : 0;
    if (successRate < 70) {
      recommendations.push('Consider reviewing treatment protocols - success rate below optimal threshold');
    } else if (successRate > 90) {
      recommendations.push('Excellent performance - consider mentoring junior veterinarians');
    }
    
    // Critical case handling
    const criticalCases = cases.filter(c => c.urgencyLevel === 'critical');
    if (criticalCases.length > cases.length * 0.3) {
      recommendations.push('High volume of critical cases - ensure adequate rest and consider additional support');
    }
    
    // Treatment completion rate
    const completionRate = treatments.length > 0 ? (treatments.filter(t => t.status === 'completed').length / treatments.length * 100) : 0;
    if (completionRate < 80) {
      recommendations.push('Monitor treatment completion rates - consider follow-up protocols');
    }
    
    return recommendations;
  };

  // Export functions
  const downloadAsJSON = (data, fileName) => {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const downloadAsCSV = (data, fileName) => {
    let csvContent = '';
    
    if (data.cases) {
      // For case reports
      csvContent = 'Animal ID,Species,Sex,Age,Condition,Urgency,Status,Location,Rescue Date\n';
      data.cases.forEach(case_ => {
        csvContent += `${case_.animalId},${case_.species},${case_.sex},${case_.age},"${case_.condition}",${case_.urgencyLevel},${case_.status},"${case_.foundLocation}",${case_.rescueDate}\n`;
      });
    } else if (data.treatments) {
      // For treatment reports
      csvContent = 'Treatment ID,Animal ID,Species,Diagnosis,Medication,Status,Date\n';
      data.treatments.forEach(treatment => {
        csvContent += `${treatment.treatmentId},${treatment.animalId},${treatment.species},"${treatment.diagnosis}",${treatment.medication},${treatment.status},${treatment.treatmentDate}\n`;
      });
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const downloadAsPDF = (data, fileName) => {
    // Create a simple HTML report that can be printed as PDF
    const htmlContent = generateHTMLReport(data);
    const printWindow = window.open('', '_blank');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
  };

  const generateHTMLReport = (data) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${data.title}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { border-bottom: 2px solid #ccc; margin-bottom: 20px; padding-bottom: 10px; }
        .section { margin: 20px 0; }
        .stats { display: flex; gap: 20px; margin: 10px 0; }
        .stat-box { border: 1px solid #ddd; padding: 10px; border-radius: 5px; }
        table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .recommendation { background-color: #f9f9f9; padding: 10px; margin: 5px 0; border-radius: 5px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${data.title}</h1>
        <p>Generated on: ${new Date(data.generatedDate).toLocaleString()}</p>
        <p>Generated by: ${data.generatedBy}</p>
        ${data.period ? `<p>Period: ${data.period}</p>` : ''}
      </div>
      
      <div class="section">
        <h2>Summary</h2>
        ${JSON.stringify(data.summary || {}, null, 2)}
      </div>
      
      ${data.recommendations ? `
      <div class="section">
        <h2>Recommendations</h2>
        ${data.recommendations.map(rec => `<div class="recommendation">${rec}</div>`).join('')}
      </div>
      ` : ''}
      
      <div class="section">
        <h2>Detailed Data</h2>
        <pre>${JSON.stringify(data, null, 2)}</pre>
      </div>
    </body>
    </html>
    `;
  };

  // === COMPREHENSIVE ANIMAL CASE MANAGEMENT ===
  const generateAnimalId = () => {
    const prefix = 'ANIMAL';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  };

  const handleCaseImageUpload = (e) => {
    const files = Array.from(e.target.files);
    setCaseForm(prev => ({ ...prev, images: [...prev.images, ...files] }));
  };

  const removeCaseImage = (index) => {
    setCaseForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const deleteAnimalCase = async (caseId) => {
    if (!window.confirm('Are you sure you want to delete this case?')) return;
    try {
      await protectedApi.deleteAnimalCase(caseId);
      await fetchDashboardData();
      setError(null);
    } catch (error) {
      setError('Failed to delete animal case.');
    }
  };

  const assignVetToCase = async (caseId, vetId) => {
    try {
      await protectedApi.assignVetToCase(caseId, vetId);
      await fetchDashboardData();
      setError(null);
    } catch (error) {
      setError('Failed to assign veterinarian to case.');
    }
  };

  const addCaseNote = async (caseId, note) => {
    try {
      await protectedApi.addCaseNote(caseId, { note, timestamp: new Date() });
      await fetchDashboardData();
      setError(null);
    } catch (error) {
      setError('Failed to add case note.');
    }
  };

  // === TREATMENT PLAN MANAGEMENT ===
  const createTreatmentPlan = async (e) => {
    e.preventDefault();
    try {
      const planData = {
        ...treatmentPlanForm,
        id: `PLAN-${Date.now()}`,
        createdBy: backendUser?.id,
        createdAt: new Date()
      };
      await protectedApi.createTreatmentPlan(planData);
      setTreatmentPlanForm({
        caseId: '',
        diagnosis: '',
        condition: '',
        treatmentType: '',
        medications: [],
        surgicalPlan: '',
        recoveryPlan: '',
        followUpSchedule: '',
        specialInstructions: '',
        estimatedDuration: '',
        progressImages: []
      });
      await fetchDashboardData();
      setError(null);
    } catch (error) {
      setError('Failed to create treatment plan.');
    }
  };

  const updateTreatmentPlan = async (planId, updates) => {
    try {
      await protectedApi.updateTreatmentPlan(planId, updates);
      await fetchDashboardData();
      setError(null);
    } catch (error) {
      setError('Failed to update treatment plan.');
    }
  };

  const addProgressImage = (e) => {
    const files = Array.from(e.target.files);
    setTreatmentPlanForm(prev => ({
      ...prev,
      progressImages: [...prev.progressImages, ...files]
    }));
  };

  const addMedicationToPlan = () => {
    const newMed = {
      id: Date.now(),
      name: '',
      dosage: '',
      frequency: '',
      duration: '',
      instructions: ''
    };
    setTreatmentPlanForm(prev => ({
      ...prev,
      medications: [...prev.medications, newMed]
    }));
  };

  const removeMedicationFromPlan = (medId) => {
    setTreatmentPlanForm(prev => ({
      ...prev,
      medications: prev.medications.filter(med => med.id !== medId)
    }));
  };

  const logDailyTreatment = async (planId, logData) => {
    try {
      await protectedApi.logDailyTreatment(planId, {
        ...logData,
        timestamp: new Date(),
        veterinarian: backendUser?.name
      });
      await fetchDashboardData();
      setError(null);
    } catch (error) {
      setError('Failed to log daily treatment.');
    }
  };

  // === MEDICATION INVENTORY MANAGEMENT ===
  const updateMedicationStock = async (medId, newQuantity) => {
    try {
      await protectedApi.updateMedicationStock(medId, newQuantity);
      await fetchDashboardData();
      setError(null);
    } catch (error) {
      setError('Failed to update medication stock.');
    }
  };

  const deleteMedication = async (medId) => {
    if (!window.confirm('Are you sure you want to remove this medication?')) return;
    try {
      await protectedApi.deleteMedication(medId);
      await fetchDashboardData();
      setError(null);
    } catch (error) {
      setError('Failed to delete medication.');
    }
  };

  const checkExpiryAlerts = () => {
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));
    
    return inventory.filter(med => {
      const expiryDate = new Date(med.expiryDate);
      return expiryDate <= thirtyDaysFromNow;
    });
  };

  const checkLowStockAlerts = () => {
    return inventory.filter(med => med.quantity <= (med.minimumStock || 10));
  };

  const requestRestock = async (medication) => {
    try {
      const requestedQuantity = (medication.minimumStock || 50) * 2;
      const urgency = medication.quantity === 0 ? 'critical' : medication.quantity <= 5 ? 'high' : 'medium';
      
      await protectedApi.requestMedicationRestock(medication._id, {
        medicationName: medication.name,
        currentQuantity: medication.quantity,
        requestedQuantity,
        requestedBy: backendUser?.id || user?.sub,
        requestDate: new Date(),
        urgency,
        reason: medication.quantity === 0 ? 'Out of stock' : 'Low stock'
      });
      
      // Show success notification
      alert(`Restock request submitted for ${medication.name}\nRequested Quantity: ${requestedQuantity}\nUrgency: ${urgency}`);
      
      setError(null);
    } catch (error) {
      setError('Failed to request medication restock.');
    }
  };

  const deductMedicationStock = async (medId, quantity, reason) => {
    try {
      await protectedApi.deductMedicationStock(medId, {
        quantity,
        reason,
        deductedBy: backendUser?.id,
        timestamp: new Date()
      });
      await fetchDashboardData();
      setError(null);
    } catch (error) {
      setError('Failed to deduct medication stock.');
    }
  };

  // === VET COLLABORATION TOOLS ===
  const shareCase = async (caseId, targetVetId, message) => {
    try {
      await protectedApi.shareCase(caseId, {
        targetVetId,
        message,
        sharedBy: backendUser?.id,
        sharedAt: new Date(),
        permissions: ['view', 'comment']
      });
      await fetchDashboardData();
      setError(null);
    } catch (error) {
      setError('Failed to share case.');
    }
  };

  const sendVetMessage = async (targetVetId, message, caseId = null) => {
    try {
      await protectedApi.sendVetMessage({
        targetVetId,
        message,
        senderId: backendUser?.id,
        caseId,
        timestamp: new Date()
      });
      setCollaborationForm({ targetVet: '', message: '', caseId: '' });
      setError(null);
    } catch (error) {
      setError('Failed to send message.');
    }
  };

  const transferCase = async (caseId, targetVetId, transferReason) => {
    try {
      await protectedApi.transferCase(caseId, {
        targetVetId,
        transferReason,
        transferredBy: backendUser?.id,
        transferDate: new Date()
      });
      await fetchDashboardData();
      setError(null);
    } catch (error) {
      setError('Failed to transfer case.');
    }
  };

  const acceptCaseTransfer = async (transferId) => {
    try {
      await protectedApi.acceptCaseTransfer(transferId);
      await fetchDashboardData();
      setError(null);
    } catch (error) {
      setError('Failed to accept case transfer.');
    }
  };

  const addCollaborationNote = async (caseId, note) => {
    try {
      await protectedApi.addCollaborationNote(caseId, {
        note,
        addedBy: backendUser?.id,
        timestamp: new Date()
      });
      await fetchDashboardData();
      setError(null);
    } catch (error) {
      setError('Failed to add collaboration note.');
    }
  };

  // === GPS TRACKING FUNCTIONS ===
  const trackAnimal = async (animalId, gpsData) => {
    try {
      await protectedApi.updateAnimalLocation(animalId, {
        ...gpsData,
        timestamp: new Date(),
        recordedBy: backendUser?.id
      });
      await fetchDashboardData();
      setError(null);
    } catch (error) {
      setError('Failed to update animal location.');
    }
  };

  const checkGeofenceViolations = (animalLocation, geofence) => {
    if (!animalLocation || !geofence) return false;
    
    const distance = calculateDistance(
      animalLocation.latitude, 
      animalLocation.longitude,
      geofence.centerLat,
      geofence.centerLng
    );
    
    return distance > geofence.radius;
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const checkMovementAlerts = (animalHistory) => {
    if (!animalHistory || animalHistory.length < 2) return null;
    
    const lastUpdate = new Date(animalHistory[animalHistory.length - 1].timestamp);
    const timeSinceLastUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60); // hours
    
    if (timeSinceLastUpdate > 24) {
      return { type: 'no_movement', message: 'No movement detected for 24+ hours' };
    }
    
    // Check if animal has moved too far too fast (potential poaching/transport)
    const recent = animalHistory.slice(-2);
    if (recent.length === 2) {
      const distance = calculateDistance(
        recent[0].latitude, recent[0].longitude,
        recent[1].latitude, recent[1].longitude
      );
      const timeSpan = (new Date(recent[1].timestamp) - new Date(recent[0].timestamp)) / (1000 * 60 * 60);
      const speed = distance / timeSpan; // km/h
      
      if (speed > 50) { // Unrealistic speed for most wildlife
        return { type: 'rapid_movement', message: `Rapid movement detected: ${speed.toFixed(2)} km/h` };
      }
    }
    
    return null;
  };

  const setGeofence = async (animalId, geofenceData) => {
    try {
      await protectedApi.setAnimalGeofence(animalId, {
        ...geofenceData,
        createdBy: backendUser?.id,
        createdAt: new Date()
      });
      await fetchDashboardData();
      setError(null);
    } catch (error) {
      setError('Failed to set geofence.');
    }
  };

  const getLocationHistory = async (animalId, timeRange) => {
    try {
      const response = await protectedApi.getAnimalLocationHistory(animalId, timeRange);
      setGpsTracking(prev => ({
        ...prev,
        locationHistory: response.data
      }));
    } catch (error) {
      setError('Failed to fetch location history.');
    }
  };

  const setupMovementAlert = async (animalId, alertConfig) => {
    try {
      await protectedApi.setupMovementAlert(animalId, {
        ...alertConfig,
        createdBy: backendUser?.id,
        active: true
      });
      await fetchDashboardData();
      setError(null);
    } catch (error) {
      setError('Failed to setup movement alert.');
    }
  };

  // === MODAL CONTROL FUNCTIONS ===
  const openCaseModal = (caseData = null) => {
    if (caseData) {
      setCaseForm(caseData);
    } else {
      setCaseForm(prev => ({ ...prev, animalId: generateAnimalId() }));
    }
    setModals(prev => ({ ...prev, showCaseModal: true }));
  };

  const openTreatmentModal = (treatmentData = null) => {
    if (treatmentData) {
      setTreatmentPlanForm(treatmentData);
    }
    setModals(prev => ({ ...prev, showTreatmentModal: true }));
  };

  const openMedicationModal = (medicationData = null) => {
    if (medicationData) {
      setMedicationForm(medicationData);
    }
    setModals(prev => ({ ...prev, showMedicationModal: true }));
  };

  const openCollaborationModal = (caseId = null) => {
    if (caseId) {
      setCollaborationForm(prev => ({ ...prev, caseId }));
    }
    setModals(prev => ({ ...prev, showCollaborationModal: true }));
  };

  const closeAllModals = () => {
    setModals({
      showCaseModal: false,
      showTreatmentModal: false,
      showMedicationModal: false,
      showCollaborationModal: false,
      showGpsModal: false,
      showReportModal: false
    });
  };

  // === SEARCH AND FILTER FUNCTIONS ===
  const handleSearchChange = (field, value) => {
    setSearchFilters(prev => ({ ...prev, [field]: value }));
  };

  const filterAnimalCases = () => {
    return animalCases.filter(animalCase => {
      const matchesSearch = !searchFilters.caseSearch || 
        animalCase.animalId?.toLowerCase().includes(searchFilters.caseSearch.toLowerCase()) ||
        animalCase.species?.toLowerCase().includes(searchFilters.caseSearch.toLowerCase()) ||
        animalCase.condition?.toLowerCase().includes(searchFilters.caseSearch.toLowerCase());
      
      const matchesStatus = !searchFilters.statusFilter || animalCase.status === searchFilters.statusFilter;
      const matchesUrgency = !searchFilters.urgencyFilter || animalCase.urgencyLevel === searchFilters.urgencyFilter;
      const matchesSpecies = !searchFilters.speciesFilter || animalCase.species === searchFilters.speciesFilter;

      // Date range filtering
      const caseDate = new Date(animalCase.createdAt || animalCase.dateAdded || Date.now());
      const fromDate = searchFilters.dateFrom ? new Date(searchFilters.dateFrom) : null;
      const toDate = searchFilters.dateTo ? new Date(searchFilters.dateTo + 'T23:59:59') : null;
      
      const matchesDateRange = (!fromDate || caseDate >= fromDate) && (!toDate || caseDate <= toDate);

      return matchesSearch && matchesStatus && matchesUrgency && matchesSpecies && matchesDateRange;
    });
  };

  const filterTreatments = () => {
    return treatments.filter(treatment => {
      const matchesSearch = !searchFilters.treatmentSearch || 
        treatment.diagnosis?.toLowerCase().includes(searchFilters.treatmentSearch.toLowerCase()) ||
        treatment.medication?.toLowerCase().includes(searchFilters.treatmentSearch.toLowerCase());
      
      return matchesSearch;
    });
  };

  const filterMedications = () => {
    return inventory.filter(med => {
      const matchesSearch = !searchFilters.medicationSearch || 
        med.name?.toLowerCase().includes(searchFilters.medicationSearch.toLowerCase()) ||
        med.batchNumber?.toLowerCase().includes(searchFilters.medicationSearch.toLowerCase());
      
      return matchesSearch;
    });
  };

  // === SORTING FUNCTIONS ===
  const handleSort = (field) => {
    let direction = 'asc';
    if (sortConfig.field === field && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ field, direction });
  };

  const sortData = (data, field, direction) => {
    return [...data].sort((a, b) => {
      let aValue = a[field];
      let bValue = b[field];

      // Handle different data types
      if (field === 'createdAt' || field === 'updatedAt') {
        aValue = new Date(aValue || Date.now());
        bValue = new Date(bValue || Date.now());
      } else if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      } else if (typeof aValue === 'number') {
        aValue = aValue || 0;
        bValue = bValue || 0;
      }

      if (direction === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });
  };

  const getSortedAndFilteredCases = () => {
    const filtered = filterAnimalCases();
    return sortData(filtered, sortConfig.field, sortConfig.direction);
  };

  const getSortedAndFilteredTreatments = () => {
    const filtered = filterTreatments();
    return sortData(filtered, sortConfig.field, sortConfig.direction);
  };

  const getSortedAndFilteredMedications = () => {
    const filtered = filterMedications();
    return sortData(filtered, sortConfig.field, sortConfig.direction);
  };

  // === COMPREHENSIVE REPORT GENERATION ===
  const generateCaseReport = async (caseId) => {
    try {
      const response = await protectedApi.generateCaseReport(caseId);
      downloadReport(response.data, `case-${caseId}-report.pdf`);
    } catch (error) {
      setError('Failed to generate case report.');
    }
  };

  const generateTreatmentLog = async (planId) => {
    try {
      const response = await protectedApi.generateTreatmentLog(planId);
      downloadReport(response.data, `treatment-log-${planId}.pdf`);
    } catch (error) {
      setError('Failed to generate treatment log.');
    }
  };

  const generateActivitySummary = async (timeRange) => {
    try {
      const response = await protectedApi.generateActivitySummary(timeRange);
      downloadReport(response.data, `activity-summary-${timeRange}.pdf`);
    } catch (error) {
      setError('Failed to generate activity summary.');
    }
  };

  const downloadReport = (data, filename) => {
    const blob = new Blob([data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['vet']}>
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <div className="flex-1 flex items-center justify-center pt-32">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading veterinary dashboard...</p>
            </div>
          </div>
          <Footer />
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['vet']}>
      <div className="flex flex-col min-h-screen bg-[#F4F6FF]">
        <Navbar />
        
        {/* Shell */}
        <div className="flex-1 pt-28 pb-10">
          <div className="mx-auto max-w-7xl px-4">
            {/* Grid: Sidebar | Main | Right */}
            <div className="grid grid-cols-12 gap-6">
              {/* LEFT SIDEBAR */}
              <aside className="col-span-12 md:col-span-2">
                <div className="bg-white rounded-2xl shadow-sm p-4 sticky top-24">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">V</div>
                    <div className="font-semibold">Vet Portal</div>
                  </div>

                  {[
                    { key: 'overview', label: 'Overview', icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0h6" />
                        </svg>
                    )},
                    { key: 'cases', label: 'Animal Cases', icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    )},
                    { key: 'treatments', label: 'Treatments', icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                        </svg>
                    )},
                    { key: 'inventory', label: 'Inventory', icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                    )},
                    { key: 'collaboration', label: 'Collaboration', icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    )},
                    { key: 'reports', label: 'Reports', icon: (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    )}
                  ].map(item => (
                    <button
                      key={item.key}
                      onClick={() => setActiveTab(item.key)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl mb-1 transition
                        ${activeTab === item.key ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                      <span className={`p-2 rounded-lg ${activeTab === item.key ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                        {item.icon}
                      </span>
                      <span className="text-sm font-medium">{item.label}</span>
                    </button>
                  ))}
                </div>
              </aside>

              {/* MAIN CONTENT */}
              <main className="col-span-12 md:col-span-7">
                {/* Top greeting banner */}
                <div className="mb-6">
                  <div className="bg-blue-600 text-white rounded-2xl p-5 flex items-center justify-between shadow-sm">
                    <div>
                      <h2 className="text-lg md:text-xl font-semibold">
                        {`Good ${new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}, Dr. ${backendUser?.name?.split(' ')[0] || user?.name?.split(' ')[0] || 'Veterinarian'}`}
                      </h2>
                      <p className="text-sm opacity-90 mt-1">
                        You have {stats.activeCases} active cases and {stats.criticalCases} critical cases requiring attention.
                      </p>
                      <button
                        onClick={() => setActiveTab('cases')}
                        className="mt-3 bg-white/20 hover:bg-white/30 text-white rounded-lg px-3 py-1.5 text-sm"
                      >
                        Review Cases
                      </button>
                    </div>
                    <div className="hidden md:block">
                      {/* simple illustration block */}
                      <div className="w-28 h-20 rounded-xl bg-white/10 backdrop-blur-sm" />
                    </div>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <StatCard title="Total Cases" value={stats.totalCases} color="blue" iconPath="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  <StatCard title="Active Cases" value={stats.activeCases} color="yellow" iconPath="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  <StatCard title="Recovered" value={stats.recoveredAnimals} color="green" iconPath="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  <StatCard title="Critical" value={stats.criticalCases} color="purple" iconPath="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </div>

                {/* Tab buttons */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {[
                    { k: 'overview', t: 'Overview' },
                    { k: 'cases', t: 'Animal Cases' },
                    { k: 'treatments', t: 'Treatments' },
                    { k: 'inventory', t: 'Inventory' },
                    { k: 'collaboration', t: 'Collaboration' },
                    { k: 'reports', t: 'Reports' }
                  ].map(({ k, t }) => (
                    <button
                      key={k}
                      onClick={() => setActiveTab(k)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition
                      ${activeTab === k ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                {/* CENTER PANELS */}
                <div className="space-y-6">
                  {/* Overview Tab */}
                  {activeTab === 'overview' && (
                    <div className="bg-white rounded-2xl shadow-sm p-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Veterinary Dashboard Overview</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-2">Recent Critical Cases</h4>
                          <div className="space-y-2 text-sm text-gray-600">
                            {animalCases.filter(c => c.urgencyLevel === 'critical').slice(0, 5).map((case_) => (
                              <div key={case_._id} className="flex justify-between">
                                <span className="text-red-600">🚨 {case_.species} - {case_.condition}</span>
                                <span>{case_.animalId}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-2">Quick Actions</h4>
                          <div className="space-y-2">
                            <button
                              onClick={() => openCaseModal()}
                              className="block w-full text-left px-3 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
                            >
                              🐾 Register New Animal Case
                            </button>
                            <button
                              onClick={() => openTreatmentModal()}
                              className="block w-full text-left px-3 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
                            >
                              💊 Create Treatment Plan
                            </button>
                            <button
                              onClick={() => openMedicationModal()}
                              className="block w-full text-left px-3 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
                            >
                              📦 Add to Medication Inventory
                            </button>
                            <button
                              onClick={() => openCollaborationModal()}
                              className="block w-full text-left px-3 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
                            >
                              🤝 Start Vet Collaboration
                            </button>
                            <button
                              onClick={() => generateReport('monthly')}
                              className="block w-full text-left px-3 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
                            >
                              📄 Generate Monthly Report
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Animal Cases Tab */}
                  {activeTab === 'cases' && (
                    <div className="bg-white rounded-2xl shadow-sm p-6">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-semibold text-gray-800">Animal Cases Management</h3>
                        <div className="flex space-x-3">
                          <button
                            onClick={() => openCaseModal()}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-2"
                          >
                            <span>🐾</span>
                            <span>Register New Case</span>
                          </button>
                          <button
                            onClick={() => openTreatmentModal()}
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center space-x-2"
                          >
                            <span>💊</span>
                            <span>Treatment Plan</span>
                          </button>
                        </div>
                      </div>

                      {/* Comprehensive Filter Bar */}
                      <div className="bg-gray-50 rounded-lg p-4 mb-6">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Filter & Search</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Search Cases</label>
                            <input
                              type="text"
                              placeholder="Search by ID, species, condition..."
                              value={searchFilters.caseSearch}
                              onChange={(e) => handleSearchChange('caseSearch', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                            <select
                              value={searchFilters.statusFilter}
                              onChange={(e) => handleSearchChange('statusFilter', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                              <option value="">All Status</option>
                              <option value="rescued">Rescued</option>
                              <option value="in-treatment">In Treatment</option>
                              <option value="recovering">Recovering</option>
                              <option value="ready-for-release">Ready for Release</option>
                              <option value="released">Released</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Urgency Level</label>
                            <select
                              value={searchFilters.urgencyFilter}
                              onChange={(e) => handleSearchChange('urgencyFilter', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                              <option value="">All Urgency</option>
                              <option value="low">Low</option>
                              <option value="medium">Medium</option>
                              <option value="high">High</option>
                              <option value="critical">Critical</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Species</label>
                            <select
                              value={searchFilters.speciesFilter}
                              onChange={(e) => handleSearchChange('speciesFilter', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                              <option value="">All Species</option>
                              <option value="Elephant">Elephant</option>
                              <option value="Leopard">Leopard</option>
                              <option value="Monkey">Monkey</option>
                              <option value="Deer">Deer</option>
                              <option value="Bird">Bird</option>
                              <option value="Bear">Bear</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Date From</label>
                            <input
                              type="date"
                              value={searchFilters.dateFrom}
                              onChange={(e) => handleSearchChange('dateFrom', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Date To</label>
                            <input
                              type="date"
                              value={searchFilters.dateTo}
                              onChange={(e) => handleSearchChange('dateTo', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                          </div>
                          <div className="flex items-end">
                            <button
                              onClick={() => setSearchFilters({
                                caseSearch: '',
                                treatmentSearch: '',
                                medicationSearch: '',
                                statusFilter: '',
                                urgencyFilter: '',
                                speciesFilter: '',
                                dateFrom: '',
                                dateTo: '',
                                assignedVet: '',
                                location: ''
                              })}
                              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 text-sm"
                            >
                              Clear Filters
                            </button>
                          </div>
                          <div className="flex items-end">
                            <div className="text-sm text-gray-600">
                              Showing {getSortedAndFilteredCases().length} of {animalCases.length} cases
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Bulk Actions Bar */}
                      {selectedCases.length > 0 && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-4">
                              <span className="text-sm font-medium text-blue-900">
                                {selectedCases.length} case{selectedCases.length !== 1 ? 's' : ''} selected
                              </span>
                              <select
                                value={bulkAction}
                                onChange={(e) => setBulkAction(e.target.value)}
                                className="px-3 py-1 border border-blue-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="">Choose Action</option>
                                <option value="updateStatus">Mark as In Treatment</option>
                                <option value="assignVet">Assign to Me</option>
                                <option value="markCritical">Mark as Critical</option>
                                <option value="delete">Delete Cases</option>
                              </select>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={handleBulkAction}
                                disabled={!bulkAction}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 text-sm"
                              >
                                Apply Action
                              </button>
                              <button
                                onClick={() => setSelectedCases([])}
                                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 text-sm"
                              >
                                Clear Selection
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Create New Case */}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800 mb-4">Register New Animal Case</h3>
                          <form onSubmit={createAnimalCase} className="bg-gray-50 rounded-lg p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Species</label>
                                <input
                                  type="text"
                                  value={caseForm.species}
                                  onChange={(e) => handleFieldChange('case', 'species', e.target.value)}
                                  required
                                  className={`w-full border rounded-md px-3 py-2 ${
                                    formErrors.case_species ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-emerald-500'
                                  } focus:outline-none focus:ring-2`}
                                  placeholder="e.g., Elephant, Leopard"
                                />
                                {formErrors.case_species && (
                                  <p className="text-red-500 text-sm mt-1">{formErrors.case_species}</p>
                                )}
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Sex</label>
                                <select
                                  value={caseForm.sex}
                                  onChange={(e) => setCaseForm({...caseForm, sex: e.target.value})}
                                  required
                                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                                >
                                  <option value="">Select</option>
                                  <option value="male">Male</option>
                                  <option value="female">Female</option>
                                  <option value="unknown">Unknown</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
                                <input
                                  type="text"
                                  value={caseForm.age}
                                  onChange={(e) => setCaseForm({...caseForm, age: e.target.value})}
                                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                                  placeholder="e.g., Adult, 2 years"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Urgency Level</label>
                                <select
                                  value={caseForm.urgencyLevel}
                                  onChange={(e) => setCaseForm({...caseForm, urgencyLevel: e.target.value})}
                                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                                >
                                  <option value="low">Low</option>
                                  <option value="medium">Medium</option>
                                  <option value="high">High</option>
                                  <option value="critical">Critical</option>
                                </select>
                              </div>
                            </div>
                            <div className="mt-4">
                              <label className="block text-sm font-medium text-gray-700 mb-2">Condition</label>
                              <textarea
                                value={caseForm.condition}
                                onChange={(e) => handleFieldChange('case', 'condition', e.target.value)}
                                rows="3"
                                required
                                className={`w-full border rounded-md px-3 py-2 ${
                                  formErrors.case_condition ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-emerald-500'
                                } focus:outline-none focus:ring-2`}
                                placeholder="Describe the injury or sickness..."
                              />
                              {formErrors.case_condition && (
                                <p className="text-red-500 text-sm mt-1">{formErrors.case_condition}</p>
                              )}
                            </div>
                            <div className="mt-4">
                              <label className="block text-sm font-medium text-gray-700 mb-2">Found Location</label>
                              <input
                                type="text"
                                value={caseForm.foundLocation}
                                onChange={(e) => setCaseForm({...caseForm, foundLocation: e.target.value})}
                                required
                                className="w-full border border-gray-300 rounded-md px-3 py-2"
                                placeholder="Where was the animal found?"
                              />
                            </div>
                            <div className="mt-4">
                              <label className="block text-sm font-medium text-gray-700 mb-2">Upload Images</label>
                              <input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={(e) => setCaseForm({...caseForm, images: Array.from(e.target.files)})}
                                className="w-full border border-gray-300 rounded-md px-3 py-2"
                              />
                            </div>
                            <button
                              type="submit"
                              className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                              🐾 Register Animal Case
                            </button>
                          </form>
                        </div>

                        {/* Animal Cases Grid */}
                        <div>
                          <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center space-x-3">
                              <input
                                type="checkbox"
                                checked={selectedCases.length === getSortedAndFilteredCases().length && getSortedAndFilteredCases().length > 0}
                                onChange={handleSelectAll}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <h3 className="text-lg font-semibold text-gray-800">Animal Cases</h3>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="flex items-center space-x-1 mr-4">
                                <button
                                  onClick={() => setViewMode('list')}
                                  className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-emerald-100 text-emerald-700' : 'text-gray-500 hover:text-gray-700'}`}
                                  title="List View"
                                >
                                  ☰
                                </button>
                                <button
                                  onClick={() => setViewMode('gallery')}
                                  className={`p-2 rounded-md ${viewMode === 'gallery' ? 'bg-emerald-100 text-emerald-700' : 'text-gray-500 hover:text-gray-700'}`}
                                  title="Gallery View"
                                >
                                  ⊞
                                </button>
                              </div>
                              <span className="text-sm text-gray-600">Sort by:</span>
                              <select 
                                value={sortConfig.field}
                                onChange={(e) => handleSort(e.target.value)}
                                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                              >
                                <option value="createdAt">Date Created</option>
                                <option value="urgencyLevel">Urgency</option>
                                <option value="species">Species</option>
                                <option value="status">Status</option>
                                <option value="animalId">Animal ID</option>
                              </select>
                              <button
                                onClick={() => handleSort(sortConfig.field)}
                                className="p-1 text-gray-500 hover:text-gray-700"
                                title={`Sort ${sortConfig.direction === 'asc' ? 'descending' : 'ascending'}`}
                              >
                                {sortConfig.direction === 'asc' ? '↑' : '↓'}
                              </button>
                            </div>
                          </div>
                          
                          {/* Conditional View Rendering */}
                          {viewMode === 'list' ? (
                            /* List View */
                            <div className="space-y-4 max-h-96 overflow-y-auto">
                              {getSortedAndFilteredCases().map((case_) => (
                              <div key={case_._id} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h4 className="font-medium text-gray-900">
                                      {case_.species} - ID: {case_.animalId}
                                    </h4>
                                    <p className="text-sm text-gray-600 mt-1">{case_.condition}</p>
                                    <div className="flex items-center space-x-2 mt-2">
                                      <span className={`px-2 py-1 text-xs rounded-full ${
                                        case_.urgencyLevel === 'critical' ? 'bg-red-100 text-red-800' :
                                        case_.urgencyLevel === 'high' ? 'bg-orange-100 text-orange-800' :
                                        case_.urgencyLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-green-100 text-green-800'
                                      }`}>
                                        {case_.urgencyLevel ? case_.urgencyLevel.toUpperCase() : 'N/A'}
                                      </span>
                                      <span className={`px-2 py-1 text-xs rounded-full ${
                                        case_.status === 'new' ? 'bg-blue-100 text-blue-800' :
                                        case_.status === 'in-treatment' ? 'bg-yellow-100 text-yellow-800' :
                                        case_.status === 'recovered' ? 'bg-green-100 text-green-800' :
                                        'bg-gray-100 text-gray-800'
                                      }`}>
                                        {case_.status ? case_.status.toUpperCase() : 'N/A'}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex flex-col space-y-1">
                                    {case_.status === 'new' && (
                                      <button
                                        onClick={() => updateCaseStatus(case_._id, 'in-treatment')}
                                        className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                                      >
                                        Start Treatment
                                      </button>
                                    )}
                                    {case_.status === 'in-treatment' && (
                                      <>
                                        <button
                                          onClick={() => updateCaseStatus(case_._id, 'recovered')}
                                          className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                                        >
                                          Mark Recovered
                                        </button>
                                        <button
                                          onClick={() => updateCaseStatus(case_._id, 'deceased')}
                                          className="px-2 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-700"
                                        >
                                          Mark Deceased
                                        </button>
                                      </>
                                    )}
                                    <button 
                                      onClick={() => {
                                        setSelectedCaseForEdit(case_);
                                        openCaseModal();
                                      }}
                                      className="px-2 py-1 bg-purple-600 text-white rounded text-xs hover:bg-purple-700"
                                    >
                                      View Details
                                    </button>
                                    <button 
                                      onClick={() => {
                                        setSelectedCase(case_);
                                        setShowGPSTracking(true);
                                      }}
                                      className="px-2 py-1 bg-emerald-600 text-white rounded text-xs hover:bg-emerald-700"
                                      title="GPS Tracking"
                                    >
                                      📍 GPS
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                            </div>
                          ) : (
                            /* Gallery View */
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-h-96 overflow-y-auto">
                              {getSortedAndFilteredCases().map((case_) => (
                                <div key={case_._id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                                  <div className="relative">
                                    <input
                                      type="checkbox"
                                      checked={selectedCases.includes(case_._id)}
                                      onChange={() => handleSelectCase(case_._id)}
                                      className="absolute top-2 left-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded z-10"
                                    />
                                    {/* Animal Image */}
                                    <div className="h-32 bg-gradient-to-br from-emerald-100 to-blue-100 flex items-center justify-center">
                                      {case_.images && case_.images.length > 0 ? (
                                        <img 
                                          src={case_.images[0]} 
                                          alt={`${case_.species} ${case_.animalId}`}
                                          className="h-full w-full object-cover"
                                        />
                                      ) : (
                                        <div className="text-4xl">
                                          {case_.species === 'Elephant' ? '🐘' :
                                           case_.species === 'Leopard' ? '🐆' :
                                           case_.species === 'Monkey' ? '🐒' :
                                           case_.species === 'Deer' ? '🦌' :
                                           case_.species === 'Bird' ? '🦅' :
                                           case_.species === 'Bear' ? '🐻' : '🦁'}
                                        </div>
                                      )}
                                    </div>
                                    {/* Status Badge */}
                                    <div className="absolute top-2 right-2">
                                      <span className={`px-2 py-1 text-xs rounded-full ${
                                        case_.urgencyLevel === 'critical' ? 'bg-red-100 text-red-800' :
                                        case_.urgencyLevel === 'high' ? 'bg-orange-100 text-orange-800' :
                                        case_.urgencyLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-green-100 text-green-800'
                                      }`}>
                                        {case_.urgencyLevel?.toUpperCase() || 'N/A'}
                                      </span>
                                    </div>
                                  </div>
                                  
                                  {/* Card Content */}
                                  <div className="p-4">
                                    <div className="mb-2">
                                      <h4 className="font-medium text-gray-900 text-sm">
                                        {case_.species} - ID: {case_.animalId}
                                      </h4>
                                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">{case_.condition}</p>
                                    </div>
                                    
                                    <div className="flex items-center justify-between mb-3">
                                      <span className={`px-2 py-1 text-xs rounded-full ${
                                        case_.status === 'recovered' ? 'bg-green-100 text-green-800' :
                                        case_.status === 'in-treatment' ? 'bg-blue-100 text-blue-800' :
                                        case_.status === 'new' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-gray-100 text-gray-800'
                                      }`}>
                                        {case_.status ? case_.status.toUpperCase() : 'N/A'}
                                      </span>
                                      {case_.assignedVet && (
                                        <span className="text-xs text-gray-500">
                                          Dr. {case_.assignedVet}
                                        </span>
                                      )}
                                    </div>
                                    
                                    {/* Quick Action Buttons */}
                                    <div className="flex space-x-1">
                                      <button 
                                        onClick={() => {
                                          setSelectedCaseForEdit(case_);
                                          openCaseModal();
                                        }}
                                        className="flex-1 px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                                        title="View Details"
                                      >
                                        👁️
                                      </button>
                                      <button 
                                        onClick={() => {
                                          setSelectedCaseForEdit(case_);
                                          openCaseModal();
                                        }}
                                        className="flex-1 px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                                        title="Edit Case"
                                      >
                                        ✏️
                                      </button>
                                      <button 
                                        onClick={() => {
                                          setSelectedCase(case_);
                                          setShowGPSTracking(true);
                                        }}
                                        className="flex-1 px-2 py-1 bg-emerald-600 text-white rounded text-xs hover:bg-emerald-700"
                                        title="GPS Tracking"
                                      >
                                        📍
                                      </button>
                                      <button 
                                        onClick={() => deleteAnimalCase(case_._id)}
                                        className="flex-1 px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                                        title="Delete Case"
                                      >
                                        🗑️
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Treatments Tab */}
                  {activeTab === 'treatments' && (
                    <div className="bg-white rounded-2xl shadow-sm p-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Treatment Management</h3>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Add Treatment */}
                        <div>
                          <h4 className="font-medium text-gray-900 mb-4">Add Treatment Plan</h4>
                          <form onSubmit={addTreatment} className="bg-gray-50 rounded-lg p-6">
                            <div className="mb-4">
                              <label className="block text-sm font-medium text-gray-700 mb-2">Select Case</label>
                              <select
                                value={treatmentForm.caseId}
                                onChange={(e) => setTreatmentForm({...treatmentForm, caseId: e.target.value})}
                                required
                                className="w-full border border-gray-300 rounded-md px-3 py-2"
                              >
                                <option value="">Select an animal case</option>
                                {animalCases.filter(c => c.status === 'in-treatment').map((case_) => (
                                  <option key={case_._id} value={case_._id}>
                                    {case_.species} - {case_.animalId}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="mb-4">
                              <label className="block text-sm font-medium text-gray-700 mb-2">Diagnosis</label>
                              <textarea
                                value={treatmentForm.diagnosis}
                                onChange={(e) => setTreatmentForm({...treatmentForm, diagnosis: e.target.value})}
                                rows="3"
                                required
                                className="w-full border border-gray-300 rounded-md px-3 py-2"
                                placeholder="Medical diagnosis..."
                              />
                            </div>
                            <div className="mb-4">
                              <label className="block text-sm font-medium text-gray-700 mb-2">Treatment Plan</label>
                              <textarea
                                value={treatmentForm.treatmentPlan}
                                onChange={(e) => setTreatmentForm({...treatmentForm, treatmentPlan: e.target.value})}
                                rows="3"
                                required
                                className="w-full border border-gray-300 rounded-md px-3 py-2"
                                placeholder="Detailed treatment plan..."
                              />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Medication</label>
                                <input
                                  type="text"
                                  value={treatmentForm.medication}
                                  onChange={(e) => setTreatmentForm({...treatmentForm, medication: e.target.value})}
                                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                                  placeholder="Medication name"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Dosage</label>
                                <input
                                  type="text"
                                  value={treatmentForm.dosage}
                                  onChange={(e) => setTreatmentForm({...treatmentForm, dosage: e.target.value})}
                                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                                  placeholder="Dosage instructions"
                                />
                              </div>
                            </div>
                            <button
                              type="submit"
                              className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                              💊 Add Treatment
                            </button>
                          </form>
                        </div>

                        {/* Treatment History */}
                        <div>
                          <div className="flex justify-between items-center mb-4">
                            <h4 className="font-medium text-gray-900">Recent Treatments</h4>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-600">Sort by:</span>
                              <select 
                                value={sortConfig.field}
                                onChange={(e) => handleSort(e.target.value)}
                                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                              >
                                <option value="createdAt">Date</option>
                                <option value="status">Status</option>
                                <option value="diagnosis">Diagnosis</option>
                              </select>
                              <button
                                onClick={() => handleSort(sortConfig.field)}
                                className="p-1 text-gray-500 hover:text-gray-700"
                                title={`Sort ${sortConfig.direction === 'asc' ? 'descending' : 'ascending'}`}
                              >
                                {sortConfig.direction === 'asc' ? '↑' : '↓'}
                              </button>
                            </div>
                          </div>
                          <div className="space-y-4 max-h-96 overflow-y-auto">
                            {getSortedAndFilteredTreatments().map((treatment) => (
                              <div key={treatment._id} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <h5 className="font-medium text-gray-900">{treatment.caseDetails?.species} - {treatment.caseDetails?.animalId}</h5>
                                    <p className="text-sm text-gray-600 mt-1">{treatment.diagnosis}</p>
                                    <p className="text-sm text-gray-700 mt-2">{treatment.treatmentPlan}</p>
                                    
                                    {/* Treatment Status */}
                                    <div className="flex items-center space-x-2 mt-2">
                                      <span className={`px-2 py-1 text-xs rounded-full ${
                                        treatment.status === 'completed' ? 'bg-green-100 text-green-800' :
                                        treatment.status === 'ongoing' ? 'bg-blue-100 text-blue-800' :
                                        treatment.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-gray-100 text-gray-800'
                                      }`}>
                                        {treatment.status?.toUpperCase() || 'ONGOING'}
                                      </span>
                                      {treatment.surgeryRequired && (
                                        <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                                          SURGERY REQUIRED
                                        </span>
                                      )}
                                    </div>
                                    
                                    {treatment.medication && (
                                      <p className="text-sm text-blue-600 mt-1">
                                        💊 {treatment.medication} - {treatment.dosage}
                                      </p>
                                    )}
                                    
                                    {/* Daily Tracking Info */}
                                    {treatment.dailyTreatment && (
                                      <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
                                        <strong>Today's Treatment:</strong> {treatment.dailyTreatment}
                                      </div>
                                    )}
                                    
                                    <p className="text-xs text-gray-500 mt-2">
                                      {new Date(treatment.createdAt).toLocaleDateString()}
                                    </p>
                                  </div>
                                  
                                  {/* Action Buttons */}
                                  <div className="flex flex-col space-y-1 ml-4">
                                    <button
                                      onClick={() => updateTreatmentPlan(treatment._id, { status: 'completed' })}
                                      className="px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                                    >
                                      Complete
                                    </button>
                                    <button
                                      onClick={() => updateTreatmentPlan(treatment._id, { status: 'paused' })}
                                      className="px-2 py-1 bg-yellow-600 text-white rounded text-xs hover:bg-yellow-700"
                                    >
                                      Pause
                                    </button>
                                    <button
                                      onClick={() => openTreatmentModal(treatment)}
                                      className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                                    >
                                      Edit
                                    </button>
                                  </div>
                                </div>
                                
                                {/* Progress Images */}
                                {treatment.progressImages && treatment.progressImages.length > 0 && (
                                  <div className="mt-3 pt-3 border-t border-gray-200">
                                    <p className="text-xs font-medium text-gray-700 mb-2">Progress Images:</p>
                                    <div className="flex space-x-2 overflow-x-auto">
                                      {treatment.progressImages.map((img, index) => (
                                        <img 
                                          key={index}
                                          src={img} 
                                          alt={`Progress ${index + 1}`}
                                          className="h-16 w-16 object-cover rounded border cursor-pointer hover:opacity-75"
                                          onClick={() => window.open(img, '_blank')}
                                        />
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Inventory Tab */}
                  {activeTab === 'inventory' && (
                    <div className="bg-white rounded-2xl shadow-sm p-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Add Medication */}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800 mb-4">Add Medication to Inventory</h3>
                          <form onSubmit={addMedication} className="bg-gray-50 rounded-lg p-6">
                            <div className="mb-4">
                              <label className="block text-sm font-medium text-gray-700 mb-2">Medication Name</label>
                              <input
                                type="text"
                                value={medicationForm.name}
                                onChange={(e) => setMedicationForm({...medicationForm, name: e.target.value})}
                                required
                                className="w-full border border-gray-300 rounded-md px-3 py-2"
                                placeholder="Medication name"
                              />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Batch Number</label>
                                <input
                                  type="text"
                                  value={medicationForm.batchNumber}
                                  onChange={(e) => setMedicationForm({...medicationForm, batchNumber: e.target.value})}
                                  required
                                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                                  placeholder="Batch number"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                                <input
                                  type="number"
                                  value={medicationForm.quantity}
                                  onChange={(e) => setMedicationForm({...medicationForm, quantity: e.target.value})}
                                  required
                                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                                  placeholder="Quantity"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                                <input
                                  type="date"
                                  value={medicationForm.expiryDate}
                                  onChange={(e) => setMedicationForm({...medicationForm, expiryDate: e.target.value})}
                                  required
                                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Supplier</label>
                                <input
                                  type="text"
                                  value={medicationForm.supplier}
                                  onChange={(e) => setMedicationForm({...medicationForm, supplier: e.target.value})}
                                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                                  placeholder="Supplier name"
                                />
                              </div>
                            </div>
                            <button
                              type="submit"
                              className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            >
                              📦 Add to Inventory
                            </button>
                          </form>
                        </div>

                        {/* Inventory List */}
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800 mb-4">Medication Inventory</h3>
                          <div className="space-y-4 max-h-96 overflow-y-auto">
                            {inventory.map((item) => (
                              <div key={item._id} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h4 className="font-medium text-gray-900">{item.name}</h4>
                                    <p className="text-sm text-gray-600">Batch: {item.batchNumber}</p>
                                    <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                                    <p className="text-sm text-gray-600">
                                      Expires: {new Date(item.expiryDate).toLocaleDateString()}
                                    </p>
                                  </div>
                                  <div className="flex flex-col space-y-1">
                                    {item.quantity < 10 && (
                                      <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                                        Low Stock
                                      </span>
                                    )}
                                    {new Date(item.expiryDate) < new Date(Date.now() + 30*24*60*60*1000) && (
                                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                                        Expiring Soon
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Collaboration Tab */}
                  {activeTab === 'collaboration' && (
                    <div className="bg-white rounded-2xl shadow-sm p-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Collaboration</h3>
                      <div className="text-center py-8">
                        <p className="text-gray-500">Collaboration features coming soon...</p>
                      </div>
                    </div>
                  )}

                  {/* Reports Tab */}
                  {activeTab === 'reports' && (
                    <div className="bg-white rounded-2xl shadow-sm p-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-6">Comprehensive Reports & Analytics</h3>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Report Generation Section */}
                        <div className="lg:col-span-2">
                          <div className="bg-gray-50 rounded-lg p-6">
                            <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                              📋 Generate Reports
                            </h4>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Individual Case Report */}
                              <div className="bg-white p-4 rounded-lg border border-gray-200">
                                <h5 className="font-medium text-gray-800 mb-2">📄 Individual Case Report</h5>
                                <p className="text-sm text-gray-600 mb-3">Detailed report for specific animal cases with treatments and outcomes.</p>
                                <select className="w-full mb-2 px-3 py-1 border border-gray-300 rounded text-sm">
                                  <option value="">All Cases</option>
                                  {animalCases.map(case_ => (
                                    <option key={case_._id} value={case_._id}>
                                      {case_.animalId} - {case_.species}
                                    </option>
                                  ))}
                                </select>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => generateReport('case-summary', { format: 'pdf' })}
                                    className="flex-1 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                                  >
                                    PDF
                                  </button>
                                  <button
                                    onClick={() => generateReport('case-summary', { format: 'csv' })}
                                    className="flex-1 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                                  >
                                    CSV
                                  </button>
                                  <button
                                    onClick={() => generateReport('case-summary', { format: 'json' })}
                                    className="flex-1 px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
                                  >
                                    JSON
                                  </button>
                                </div>
                              </div>

                              {/* Monthly Treatment Logs */}
                              <div className="bg-white p-4 rounded-lg border border-gray-200">
                                <h5 className="font-medium text-gray-800 mb-2">📊 Monthly Treatment Logs</h5>
                                <p className="text-sm text-gray-600 mb-3">Comprehensive treatment logs with statistics and success rates.</p>
                                <div className="grid grid-cols-2 gap-2 mb-2">
                                  <select className="px-3 py-1 border border-gray-300 rounded text-sm">
                                    <option value="">Current Month</option>
                                    <option value="1">January</option>
                                    <option value="2">February</option>
                                    <option value="3">March</option>
                                    <option value="4">April</option>
                                    <option value="5">May</option>
                                    <option value="6">June</option>
                                    <option value="7">July</option>
                                    <option value="8">August</option>
                                    <option value="9">September</option>
                                    <option value="10">October</option>
                                    <option value="11">November</option>
                                    <option value="12">December</option>
                                  </select>
                                  <select className="px-3 py-1 border border-gray-300 rounded text-sm">
                                    <option value="">Current Year</option>
                                    <option value="2024">2024</option>
                                    <option value="2023">2023</option>
                                    <option value="2022">2022</option>
                                  </select>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => generateReport('monthly', { format: 'pdf' })}
                                    className="flex-1 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                                  >
                                    PDF
                                  </button>
                                  <button
                                    onClick={() => generateReport('monthly', { format: 'csv' })}
                                    className="flex-1 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                                  >
                                    CSV
                                  </button>
                                  <button
                                    onClick={() => generateReport('monthly', { format: 'json' })}
                                    className="flex-1 px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
                                  >
                                    JSON
                                  </button>
                                </div>
                              </div>

                              {/* Medication Usage Report */}
                              <div className="bg-white p-4 rounded-lg border border-gray-200">
                                <h5 className="font-medium text-gray-800 mb-2">💊 Medication Usage Report</h5>
                                <p className="text-sm text-gray-600 mb-3">Inventory analysis with usage patterns and restock recommendations.</p>
                                <div className="grid grid-cols-2 gap-2 mb-2">
                                  <input
                                    type="date"
                                    className="px-3 py-1 border border-gray-300 rounded text-sm"
                                    placeholder="Start Date"
                                  />
                                  <input
                                    type="date"
                                    className="px-3 py-1 border border-gray-300 rounded text-sm"
                                    placeholder="End Date"
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => generateReport('medication-usage', { format: 'pdf' })}
                                    className="flex-1 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                                  >
                                    PDF
                                  </button>
                                  <button
                                    onClick={() => generateReport('medication-usage', { format: 'csv' })}
                                    className="flex-1 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                                  >
                                    CSV
                                  </button>
                                  <button
                                    onClick={() => generateReport('medication-usage', { format: 'json' })}
                                    className="flex-1 px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
                                  >
                                    JSON
                                  </button>
                                </div>
                              </div>

                              {/* Vet Activity Summary */}
                              <div className="bg-white p-4 rounded-lg border border-gray-200">
                                <h5 className="font-medium text-gray-800 mb-2">📈 Vet Activity Summary</h5>
                                <p className="text-sm text-gray-600 mb-3">Performance metrics, daily activity breakdown, and recommendations.</p>
                                <div className="grid grid-cols-2 gap-2 mb-2">
                                  <input
                                    type="date"
                                    className="px-3 py-1 border border-gray-300 rounded text-sm"
                                    placeholder="Start Date"
                                  />
                                  <input
                                    type="date"
                                    className="px-3 py-1 border border-gray-300 rounded text-sm"
                                    placeholder="End Date"
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => generateReport('activity-summary', { format: 'pdf' })}
                                    className="flex-1 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                                  >
                                    PDF
                                  </button>
                                  <button
                                    onClick={() => generateReport('activity-summary', { format: 'csv' })}
                                    className="flex-1 px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                                  >
                                    CSV
                                  </button>
                                  <button
                                    onClick={() => generateReport('activity-summary', { format: 'json' })}
                                    className="flex-1 px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
                                  >
                                    JSON
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Quick Export Options */}
                            <div className="mt-6 pt-6 border-t border-gray-200">
                              <h5 className="font-medium text-gray-800 mb-3">🚀 Quick Exports</h5>
                              <div className="flex flex-wrap gap-3">
                                <button
                                  onClick={() => generateReport('case-summary', { format: 'csv', caseId: null })}
                                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 text-sm"
                                >
                                  📋 All Cases (CSV)
                                </button>
                                <button
                                  onClick={() => generateReport('monthly', { format: 'pdf' })}
                                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                                >
                                  📊 This Month (PDF)
                                </button>
                                <button
                                  onClick={() => generateReport('medication-usage', { format: 'json' })}
                                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                                >
                                  💊 Inventory (JSON)
                                </button>
                                <button
                                  onClick={() => generateReport('activity-summary', { format: 'pdf' })}
                                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm"
                                >
                                  📈 My Performance (PDF)
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Statistics Dashboard */}
                        <div className="space-y-4">
                          <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="font-medium text-gray-900 mb-3">📊 Key Statistics</h4>
                            <div className="space-y-3 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Recovery Rate:</span>
                                <span className="font-medium text-green-600">
                                  {stats.totalCases > 0 ? ((stats.recoveredAnimals / stats.totalCases) * 100).toFixed(1) : 0}%
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Active Treatments:</span>
                                <span className="font-medium text-blue-600">{stats.activeCases}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Critical Cases:</span>
                                <span className="font-medium text-red-600">{stats.criticalCases}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Medication Items:</span>
                                <span className="font-medium text-gray-900">{inventory.length}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Low Stock Items:</span>
                                <span className="font-medium text-orange-600">
                                  {inventory.filter(item => item.quantity < 10).length}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Monthly Cases:</span>
                                <span className="font-medium text-purple-600">
                                  {animalCases.filter(c => new Date(c.createdAt).getMonth() === new Date().getMonth()).length}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="font-medium text-gray-900 mb-3">🏆 Performance Metrics</h4>
                            <div className="space-y-3 text-sm">
                              <div>
                                <div className="flex justify-between mb-1">
                                  <span className="text-gray-600">Success Rate</span>
                                  <span className="font-medium">
                                    {stats.totalCases > 0 ? ((stats.recoveredAnimals / stats.totalCases) * 100).toFixed(0) : 0}%
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-green-600 h-2 rounded-full" 
                                    style={{ 
                                      width: `${stats.totalCases > 0 ? ((stats.recoveredAnimals / stats.totalCases) * 100) : 0}%` 
                                    }}
                                  ></div>
                                </div>
                              </div>
                              <div>
                                <div className="flex justify-between mb-1">
                                  <span className="text-gray-600">Treatment Completion</span>
                                  <span className="font-medium">
                                    {treatments.length > 0 ? ((treatments.filter(t => t.status === 'completed').length / treatments.length) * 100).toFixed(0) : 0}%
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-blue-600 h-2 rounded-full" 
                                    style={{ 
                                      width: `${treatments.length > 0 ? ((treatments.filter(t => t.status === 'completed').length / treatments.length) * 100) : 0}%` 
                                    }}
                                  ></div>
                                </div>
                              </div>
                              <div>
                                <div className="flex justify-between mb-1">
                                  <span className="text-gray-600">Inventory Health</span>
                                  <span className="font-medium">
                                    {inventory.length > 0 ? (((inventory.length - inventory.filter(item => item.quantity < 10).length) / inventory.length) * 100).toFixed(0) : 0}%
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-purple-600 h-2 rounded-full" 
                                    style={{ 
                                      width: `${inventory.length > 0 ? (((inventory.length - inventory.filter(item => item.quantity < 10).length) / inventory.length) * 100) : 0}%` 
                                    }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="bg-gradient-to-r from-blue-50 to-emerald-50 rounded-lg p-4 border border-blue-200">
                            <h4 className="font-medium text-gray-900 mb-2">💡 Quick Insights</h4>
                            <div className="space-y-2 text-sm text-gray-700">
                              <p>• {stats.criticalCases} critical cases need immediate attention</p>
                              <p>• {inventory.filter(item => item.quantity < 10).length} medications require restocking</p>
                              <p>• Recovery rate is {stats.totalCases > 0 ? ((stats.recoveredAnimals / stats.totalCases) * 100).toFixed(1) : 0}% this period</p>
                              <p>• {treatments.filter(t => t.status === 'ongoing').length} active treatments in progress</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </main>

              {/* RIGHT WIDGETS */}
              <aside className="col-span-12 md:col-span-3">
                <div className="space-y-6">
                  {/* Profile mini */}
                  <div className="bg-white rounded-2xl shadow-sm p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold">
                        {(backendUser?.name || user?.name || 'Veterinarian').split(' ').slice(0, 2).map(s => s[0]?.toUpperCase()).join('') || 'V'}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800">Dr. {backendUser?.name || user?.name || 'Veterinarian'}</div>
                        <div className="text-xs text-gray-500">Veterinarian</div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Stats Widget */}
                  <div className="bg-white rounded-2xl shadow-sm p-5">
                    <h4 className="font-semibold text-gray-800 mb-3">Quick Stats</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Total Cases</span>
                        <span className="font-medium text-blue-600">{stats.totalCases}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Active Treatments</span>
                        <span className="font-medium text-yellow-600">{stats.activeCases}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Recovered Animals</span>
                        <span className="font-medium text-green-600">{stats.recoveredAnimals}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Critical Cases</span>
                        <span className="font-medium text-red-600">{stats.criticalCases}</span>
                      </div>
                    </div>
                  </div>

                  {/* Critical Cases Alert */}
                  {stats.criticalCases > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl shadow-sm p-5">
                      <h4 className="font-semibold text-red-800 mb-3">Critical Cases Alert</h4>
                      <div className="text-sm text-red-700 space-y-2">
                        <div>🚨 {stats.criticalCases} critical cases need immediate attention</div>
                      </div>
                      <button
                        onClick={() => setActiveTab('cases')}
                        className="mt-3 w-full bg-red-600 hover:bg-red-700 text-white rounded-lg px-3 py-2 text-sm font-medium"
                      >
                        Review Critical Cases
                      </button>
                    </div>
                  )}

                  {/* Recent Activity */}
                  <div className="bg-white rounded-2xl shadow-sm p-5">
                    <h4 className="font-semibold text-gray-800 mb-3">Recent Activity</h4>
                    <div className="space-y-3 text-sm">
                      {animalCases.slice(0, 3).map((case_) => (
                        <div key={case_._id} className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            case_.urgencyLevel === 'critical' ? 'bg-red-500' :
                            case_.urgencyLevel === 'high' ? 'bg-orange-500' :
                            case_.urgencyLevel === 'medium' ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`}></div>
                          <span className="text-gray-600">{case_.species} case registered</span>
                        </div>
                      ))}
                      {treatments.slice(0, 2).map((treatment) => (
                        <div key={treatment._id} className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-gray-600">Treatment added</span>
                        </div>
                      ))}
                      {(animalCases.length === 0 && treatments.length === 0) && (
                        <p className="text-gray-500 text-center py-4">No recent activity</p>
                      )}
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>

        {/* === COMPREHENSIVE MODAL COMPONENTS === */}
        
        {/* Advanced Animal Case Registration Modal */}
        {modals.showCaseModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900">
                    🐾 {caseForm.animalId ? 'Edit' : 'Register New'} Animal Case
                  </h3>
                  <button onClick={closeAllModals} className="text-gray-400 hover:text-gray-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <form onSubmit={createAnimalCase} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Animal ID</label>
                      <input
                        type="text"
                        value={caseForm.animalId}
                        onChange={(e) => setCaseForm({...caseForm, animalId: e.target.value})}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50"
                        placeholder="Auto-generated ID"
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Species</label>
                      <select
                        value={caseForm.species}
                        onChange={(e) => setCaseForm({...caseForm, species: e.target.value})}
                        required
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                      >
                        <option value="">Select Species</option>
                        <option value="Elephant">🐘 Elephant</option>
                        <option value="Leopard">🐆 Leopard</option>
                        <option value="Monkey">🐵 Monkey</option>
                        <option value="Bird">🦅 Bird</option>
                        <option value="Deer">🦌 Deer</option>
                        <option value="Bear">🐻 Bear</option>
                        <option value="Other">🐾 Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Sex</label>
                      <select
                        value={caseForm.sex}
                        onChange={(e) => setCaseForm({...caseForm, sex: e.target.value})}
                        required
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                      >
                        <option value="">Select Sex</option>
                        <option value="Male">♂️ Male</option>
                        <option value="Female">♀️ Female</option>
                        <option value="Unknown">❓ Unknown</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Age (Estimated)</label>
                      <input
                        type="text"
                        value={caseForm.age}
                        onChange={(e) => setCaseForm({...caseForm, age: e.target.value})}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                        placeholder="e.g., 2 years, Adult, Juvenile"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Urgency Level</label>
                      <select
                        value={caseForm.urgencyLevel}
                        onChange={(e) => setCaseForm({...caseForm, urgencyLevel: e.target.value})}
                        required
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                      >
                        <option value="low">🟢 Low</option>
                        <option value="medium">🟡 Medium</option>
                        <option value="high">🟠 High</option>
                        <option value="critical">🔴 Critical</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Current Status</label>
                      <select
                        value={caseForm.status}
                        onChange={(e) => setCaseForm({...caseForm, status: e.target.value})}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                      >
                        <option value="rescued">🚨 Rescued</option>
                        <option value="in-treatment">🏥 In Treatment</option>
                        <option value="recovering">💊 Recovering</option>
                        <option value="ready-for-release">✅ Ready for Release</option>
                        <option value="released">🌿 Released</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Condition/Injury Description</label>
                    <textarea
                      value={caseForm.condition}
                      onChange={(e) => setCaseForm({...caseForm, condition: e.target.value})}
                      required
                      rows="4"
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="Detailed description of the animal's condition, injuries, or illness..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Found/Rescue Location</label>
                    <textarea
                      value={caseForm.foundLocation}
                      onChange={(e) => setCaseForm({...caseForm, foundLocation: e.target.value})}
                      required
                      rows="2"
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="Specific location details, GPS coordinates if available..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Upload Images</label>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleCaseImageUpload}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                    {caseForm.images.length > 0 && (
                      <div className="mt-3 grid grid-cols-3 gap-3">
                        {caseForm.images.map((image, index) => (
                          <div key={index} className="relative">
                            <img
                              src={URL.createObjectURL(image)}
                              alt={`Case image ${index + 1}`}
                              className="w-full h-24 object-cover rounded-md"
                            />
                            <button
                              type="button"
                              onClick={() => removeCaseImage(index)}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex justify-end space-x-4">
                    <button
                      type="button"
                      onClick={closeAllModals}
                      className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      🐾 {caseForm.animalId ? 'Update' : 'Register'} Case
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Advanced Treatment Plan Modal */}
        {modals.showTreatmentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900">
                    💊 Create Comprehensive Treatment Plan
                  </h3>
                  <button onClick={closeAllModals} className="text-gray-400 hover:text-gray-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <form onSubmit={createTreatmentPlan} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Select Animal Case</label>
                      <select
                        value={treatmentPlanForm.caseId}
                        onChange={(e) => setTreatmentPlanForm({...treatmentPlanForm, caseId: e.target.value})}
                        required
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                      >
                        <option value="">Choose Animal Case</option>
                        {animalCases.map(case_ => (
                          <option key={case_._id} value={case_._id}>
                            {case_.animalId} - {case_.species} ({case_.condition})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Treatment Type</label>
                      <select
                        value={treatmentPlanForm.treatmentType}
                        onChange={(e) => setTreatmentPlanForm({...treatmentPlanForm, treatmentType: e.target.value})}
                        required
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                      >
                        <option value="">Select Treatment Type</option>
                        <option value="medical">💊 Medical Treatment</option>
                        <option value="surgical">🔬 Surgical Intervention</option>
                        <option value="rehabilitation">🏃 Rehabilitation</option>
                        <option value="emergency">🚨 Emergency Care</option>
                        <option value="preventive">🛡️ Preventive Care</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Primary Diagnosis</label>
                    <textarea
                      value={treatmentPlanForm.diagnosis}
                      onChange={(e) => setTreatmentPlanForm({...treatmentPlanForm, diagnosis: e.target.value})}
                      required
                      rows="3"
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="Detailed diagnosis based on examination and tests..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Treatment Medications</label>
                    <div className="space-y-3">
                      {treatmentPlanForm.medications.map((med, index) => (
                        <div key={med.id} className="grid grid-cols-5 gap-3 p-3 border border-gray-200 rounded-md">
                          <input
                            type="text"
                            placeholder="Medication name"
                            value={med.name}
                            onChange={(e) => {
                              const newMeds = [...treatmentPlanForm.medications];
                              newMeds[index].name = e.target.value;
                              setTreatmentPlanForm({...treatmentPlanForm, medications: newMeds});
                            }}
                            className="border border-gray-300 rounded px-2 py-1"
                          />
                          <input
                            type="text"
                            placeholder="Dosage"
                            value={med.dosage}
                            onChange={(e) => {
                              const newMeds = [...treatmentPlanForm.medications];
                              newMeds[index].dosage = e.target.value;
                              setTreatmentPlanForm({...treatmentPlanForm, medications: newMeds});
                            }}
                            className="border border-gray-300 rounded px-2 py-1"
                          />
                          <input
                            type="text"
                            placeholder="Frequency"
                            value={med.frequency}
                            onChange={(e) => {
                              const newMeds = [...treatmentPlanForm.medications];
                              newMeds[index].frequency = e.target.value;
                              setTreatmentPlanForm({...treatmentPlanForm, medications: newMeds});
                            }}
                            className="border border-gray-300 rounded px-2 py-1"
                          />
                          <input
                            type="text"
                            placeholder="Duration"
                            value={med.duration}
                            onChange={(e) => {
                              const newMeds = [...treatmentPlanForm.medications];
                              newMeds[index].duration = e.target.value;
                              setTreatmentPlanForm({...treatmentPlanForm, medications: newMeds});
                            }}
                            className="border border-gray-300 rounded px-2 py-1"
                          />
                          <button
                            type="button"
                            onClick={() => removeMedicationFromPlan(med.id)}
                            className="bg-red-500 text-white rounded px-2 py-1 hover:bg-red-600"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addMedicationToPlan}
                        className="w-full px-4 py-2 border-2 border-dashed border-gray-300 text-gray-600 rounded-md hover:border-blue-400 hover:text-blue-600"
                      >
                        + Add Medication
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Surgical Plan</label>
                      <textarea
                        value={treatmentPlanForm.surgicalPlan}
                        onChange={(e) => setTreatmentPlanForm({...treatmentPlanForm, surgicalPlan: e.target.value})}
                        rows="4"
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                        placeholder="If surgical intervention required, describe the plan..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Recovery Plan</label>
                      <textarea
                        value={treatmentPlanForm.recoveryPlan}
                        onChange={(e) => setTreatmentPlanForm({...treatmentPlanForm, recoveryPlan: e.target.value})}
                        rows="4"
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                        placeholder="Post-treatment recovery procedures and care..."
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Progress Images</label>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={addProgressImage}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-4">
                    <button
                      type="button"
                      onClick={closeAllModals}
                      className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      💊 Create Treatment Plan
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Medication Inventory Modal */}
        {modals.showMedicationModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900">
                    💊 Add Medication to Inventory
                  </h3>
                  <button onClick={closeAllModals} className="text-gray-400 hover:text-gray-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <form onSubmit={addMedication} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Medication Name</label>
                    <input
                      type="text"
                      value={medicationForm.name}
                      onChange={(e) => setMedicationForm({...medicationForm, name: e.target.value})}
                      required
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="Enter medication name"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Batch Number</label>
                      <input
                        type="text"
                        value={medicationForm.batchNumber}
                        onChange={(e) => setMedicationForm({...medicationForm, batchNumber: e.target.value})}
                        required
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                        placeholder="Batch number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                      <input
                        type="number"
                        value={medicationForm.quantity}
                        onChange={(e) => setMedicationForm({...medicationForm, quantity: e.target.value})}
                        required
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                        placeholder="Quantity in stock"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                      <input
                        type="date"
                        value={medicationForm.expiryDate}
                        onChange={(e) => setMedicationForm({...medicationForm, expiryDate: e.target.value})}
                        required
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Supplier</label>
                      <input
                        type="text"
                        value={medicationForm.supplier}
                        onChange={(e) => setMedicationForm({...medicationForm, supplier: e.target.value})}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                        placeholder="Supplier name"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-4 mt-6">
                    <button
                      type="button"
                      onClick={closeAllModals}
                      className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                    >
                      💊 Add to Inventory
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Collaboration Modal */}
        {modals.showCollaborationModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-lg w-full mx-4">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-900">
                    🤝 Vet Collaboration
                  </h3>
                  <button onClick={closeAllModals} className="text-gray-400 hover:text-gray-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <form onSubmit={(e) => {
                  e.preventDefault();
                  sendVetMessage(collaborationForm.targetVet, collaborationForm.message, collaborationForm.caseId);
                }} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Target Veterinarian</label>
                    <select
                      value={collaborationForm.targetVet}
                      onChange={(e) => setCollaborationForm({...collaborationForm, targetVet: e.target.value})}
                      required
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="">Select Veterinarian</option>
                      <option value="vet1">Dr. Sarah Johnson</option>
                      <option value="vet2">Dr. Michael Chen</option>
                      <option value="vet3">Dr. Emily Rodriguez</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Related Case (Optional)</label>
                    <select
                      value={collaborationForm.caseId}
                      onChange={(e) => setCollaborationForm({...collaborationForm, caseId: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="">No specific case</option>
                      {animalCases.map(case_ => (
                        <option key={case_._id} value={case_._id}>
                          {case_.animalId} - {case_.species}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                    <textarea
                      value={collaborationForm.message}
                      onChange={(e) => setCollaborationForm({...collaborationForm, message: e.target.value})}
                      required
                      rows="4"
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="Enter your message or consultation request..."
                    />
                  </div>
                  <div className="flex justify-end space-x-4">
                    <button
                      type="button"
                      onClick={closeAllModals}
                      className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      🤝 Send Message
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* GPS Tracking Modal */}
        {showGPSTracking && selectedCase && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">GPS Tracking - {selectedCase.animal?.name || selectedCase.species}</h3>
                <button
                  onClick={() => setShowGPSTracking(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Real-time Map View */}
                  <div className="lg:col-span-2">
                    <div className="bg-gray-100 rounded-lg h-96 flex items-center justify-center mb-4">
                      <div className="text-center">
                        <MapPin className="w-16 h-16 text-blue-500 mx-auto mb-2" />
                        <p className="text-gray-600 mb-2">Real-time GPS Map</p>
                        <p className="text-sm text-gray-500">
                          Current Location: {selectedCase.gpsData?.latitude?.toFixed(6) || 'N/A'}, {selectedCase.gpsData?.longitude?.toFixed(6) || 'N/A'}
                        </p>
                        <p className="text-sm text-gray-500">
                          Last Updated: {selectedCase.gpsData?.lastUpdate ? new Date(selectedCase.gpsData.lastUpdate).toLocaleString() : 'Never'}
                        </p>
                      </div>
                    </div>
                    
                    {/* Quick GPS Actions */}
                    <div className="flex gap-3 mb-4">
                      <button
                        onClick={() => {
                          // Simulate GPS update
                          const simulatedData = {
                            latitude: 6.9271 + (Math.random() - 0.5) * 0.01,
                            longitude: 79.8612 + (Math.random() - 0.5) * 0.01,
                            lastUpdate: new Date().toISOString(),
                            signal: ['strong', 'weak', 'poor'][Math.floor(Math.random() * 3)],
                            battery: Math.floor(Math.random() * 100),
                            speed: Math.floor(Math.random() * 15)
                          };
                          trackAnimal(selectedCase._id, simulatedData);
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Update Location
                      </button>
                      <button
                        onClick={() => setShowGeofenceModal(true)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                      >
                        <Shield className="w-4 h-4" />
                        Set Safe Zone
                      </button>
                      <button
                        onClick={() => {
                          // Simulate center map on animal
                          setError('Map centered on animal location');
                          setTimeout(() => setError(null), 2000);
                        }}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
                      >
                        <Target className="w-4 h-4" />
                        Center Map
                      </button>
                    </div>
                  </div>
                  
                  {/* GPS Status & Controls */}
                  <div className="space-y-4">
                    {/* GPS Status */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                        <Activity className="w-4 h-4" />
                        GPS Status
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Signal:</span>
                          <span className={`text-sm font-medium ${
                            selectedCase.gpsData?.signal === 'strong' ? 'text-green-600' : 
                            selectedCase.gpsData?.signal === 'weak' ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {selectedCase.gpsData?.signal || 'Unknown'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Battery:</span>
                          <span className={`text-sm font-medium ${
                            (selectedCase.gpsData?.battery || 0) > 50 ? 'text-green-600' : 
                            (selectedCase.gpsData?.battery || 0) > 20 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {selectedCase.gpsData?.battery || 0}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Speed:</span>
                          <span className="text-sm text-gray-900">
                            {selectedCase.gpsData?.speed || 0} km/h
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Geofence Status */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                        <Shield className="w-4 h-4" />
                        Safe Zone Status
                      </h4>
                      {selectedCase.geofence ? (
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Status:</span>
                            <span className={`text-sm font-medium ${
                              checkGeofenceViolations(selectedCase.gpsData, selectedCase.geofence) 
                                ? 'text-red-600' : 'text-green-600'
                            }`}>
                              {checkGeofenceViolations(selectedCase.gpsData, selectedCase.geofence) 
                                ? 'Outside Safe Zone' : 'Inside Safe Zone'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Radius:</span>
                            <span className="text-sm text-gray-900">
                              {selectedCase.geofence.radius} km
                            </span>
                          </div>
                          <button
                            onClick={() => setGeofence(selectedCase._id, null)}
                            className="w-full mt-2 px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                          >
                            Remove Safe Zone
                          </button>
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <p className="text-sm text-gray-500 mb-2">No safe zone set</p>
                          <button
                            onClick={() => setShowGeofenceModal(true)}
                            className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
                          >
                            Set Safe Zone
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {/* Movement Alerts */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Movement Alerts
                      </h4>
                      {(() => {
                        const alert = checkMovementAlerts(selectedCase.gpsHistory);
                        if (alert) {
                          return (
                            <div className={`p-3 rounded-lg ${alert.type === 'no_movement' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                              <p className="text-sm font-medium">{alert.message}</p>
                            </div>
                          );
                        }
                        return (
                          <div className="bg-green-100 text-green-800 p-3 rounded-lg">
                            <p className="text-sm font-medium">Normal movement patterns</p>
                          </div>
                        );
                      })()}
                    </div>
                    
                    {/* Recent GPS History */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Recent Locations
                      </h4>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {(selectedCase.gpsHistory || []).slice(-5).reverse().map((location, index) => (
                          <div key={index} className="text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">
                                {new Date(location.timestamp).toLocaleTimeString()}
                              </span>
                              <span className="text-gray-900">
                                {location.latitude?.toFixed(4)}, {location.longitude?.toFixed(4)}
                              </span>
                            </div>
                          </div>
                        ))}
                        {(!selectedCase.gpsHistory || selectedCase.gpsHistory.length === 0) && (
                          <p className="text-sm text-gray-500">No GPS history available</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Geofence Setup Modal */}
        {showGeofenceModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Set Safe Zone</h3>
                <button
                  onClick={() => setShowGeofenceModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6">
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const geofenceData = {
                    centerLat: parseFloat(geofenceForm.centerLat),
                    centerLng: parseFloat(geofenceForm.centerLng),
                    radius: parseFloat(geofenceForm.radius),
                    alertType: geofenceForm.alertType,
                    description: geofenceForm.description
                  };
                  setGeofence(selectedCase._id, geofenceData);
                  setShowGeofenceModal(false);
                  setGeofenceForm({
                    centerLat: '',
                    centerLng: '',
                    radius: 1,
                    alertType: 'both',
                    description: ''
                  });
                }} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Center Latitude</label>
                      <input
                        type="number"
                        step="any"
                        value={geofenceForm.centerLat}
                        onChange={(e) => setGeofenceForm({...geofenceForm, centerLat: e.target.value})}
                        required
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                        placeholder="6.9271"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Center Longitude</label>
                      <input
                        type="number"
                        step="any"
                        value={geofenceForm.centerLng}
                        onChange={(e) => setGeofenceForm({...geofenceForm, centerLng: e.target.value})}
                        required
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                        placeholder="79.8612"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Radius (km)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={geofenceForm.radius}
                      onChange={(e) => setGeofenceForm({...geofenceForm, radius: e.target.value})}
                      required
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Alert Type</label>
                    <select
                      value={geofenceForm.alertType}
                      onChange={(e) => setGeofenceForm({...geofenceForm, alertType: e.target.value})}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="both">Alert on Exit & Entry</option>
                      <option value="exit">Alert on Exit Only</option>
                      <option value="enter">Alert on Entry Only</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      value={geofenceForm.description}
                      onChange={(e) => setGeofenceForm({...geofenceForm, description: e.target.value})}
                      rows="3"
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="Describe this safe zone..."
                    />
                  </div>
                  <div className="flex justify-end space-x-4">
                    <button
                      type="button"
                      onClick={() => setShowGeofenceModal(false)}
                      className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      Create Safe Zone
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        <Footer />
      </div>
    </ProtectedRoute>
  );
};

/* ===== Small UI helpers ===== */
const StatCard = ({ title, value, color = 'blue', iconPath }) => {
  const colorMap = {
    blue: 'bg-blue-100 text-blue-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600'
  };
  return (
    <div className="bg-white rounded-2xl shadow-sm p-4">
      <div className="flex items-center">
        <span className={`p-2 rounded-xl ${colorMap[color]}`}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={iconPath} /></svg>
        </span>
        <div className="ml-3">
          <div className="text-xs text-gray-500">{title}</div>
          <div className="text-xl font-bold text-gray-800">{value}</div>
        </div>
      </div>
    </div>
  );
};

export default VetDashboard;