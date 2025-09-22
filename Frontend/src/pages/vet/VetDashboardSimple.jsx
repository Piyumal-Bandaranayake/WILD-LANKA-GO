import React, { useState, useEffect } from 'react';
import { useAuthContext } from '../../contexts/AuthContext';
import RoleGuard from '../../components/RoleGuard';
import RoleBasedFeature from '../../components/RoleBasedFeature';
import publicApiService from '../../services/publicApi';
import Navbar from '../../components/Navbar';
import Footer from '../../components/footer';

const VetDashboardSimple = () => {
  const { backendUser } = useAuthContext();
  const [animalCases, setAnimalCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTreatmentModal, setShowTreatmentModal] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [selectedCaseForTreatment, setSelectedCaseForTreatment] = useState(null);
  const [selectedCaseForEdit, setSelectedCaseForEdit] = useState(null);
  const [stats, setStats] = useState(null);
  const [treatments, setTreatments] = useState([]);
  
  // Tab management
  const [activeTab, setActiveTab] = useState('cases');
  
  // Medication/Inventory state
  const [medications, setMedications] = useState([]);
  const [showMedicationModal, setShowMedicationModal] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState(null);
  const [medicationForm, setMedicationForm] = useState({
    name: '',
    description: '',
    category: '',
    form: '',
    strength: '',
    quantity: '',
    unit: '',
    threshold: '',
    batchNumber: '',
    manufacturingDate: '',
    expiryDate: '',
    manufacturer: '',
    supplierName: '',
    supplierEmail: '',
    costPerUnit: ''
  });

  // Form state for creating new case
  const [newCase, setNewCase] = useState({
    animalType: '',
    speciesScientificName: '',
    ageSize: '',
    gender: 'Male',
    priority: 'Medium',
    location: '',
    reportedBy: '',
    primaryCondition: '',
    symptomsObservations: '',
    initialTreatmentPlan: '',
    additionalNotes: '',
    images: []
  });

  // Form state for treatment
  const [treatmentForm, setTreatmentForm] = useState({
    treatmentType: '',
    description: '',
    medicationsUsed: '',
    dosage: '',
    treatmentDate: new Date().toISOString().split('T')[0],
    followUpRequired: false,
    followUpDate: '',
    treatmentImages: [],
    assignedVet: backendUser?._id || '68cc4103bac0e0d48a6199f9' // Default vet ID
  });

  // Form state for editing case (will be populated when editing)
  const [editCase, setEditCase] = useState({
    animalType: '',
    speciesScientificName: '',
    ageSize: '',
    gender: 'Male',
    priority: 'Medium',
    location: '',
    reportedBy: '',
    primaryCondition: '',
    symptomsObservations: '',
    initialTreatmentPlan: '',
    additionalNotes: '',
    images: []
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch animal cases
      const casesResponse = await publicApiService.getAnimalCases();
      console.log('Cases response:', casesResponse.data);
      
      if (casesResponse.data && casesResponse.data.cases) {
        setAnimalCases(casesResponse.data.cases);
      } else if (Array.isArray(casesResponse.data)) {
        setAnimalCases(casesResponse.data);
      }

      // Fetch dashboard stats
      try {
        const statsResponse = await publicApiService.getVetDashboardStats();
        setStats(statsResponse.data);
      } catch (statsError) {
        console.warn('Could not fetch stats:', statsError);
        // Continue without stats
      }

      // Fetch medications
      try {
        const medicationsResponse = await publicApiService.getMedications();
        console.log('Medications response:', medicationsResponse.data);
        
        if (medicationsResponse.data && medicationsResponse.data.medications) {
          setMedications(medicationsResponse.data.medications);
        } else if (Array.isArray(medicationsResponse.data)) {
          setMedications(medicationsResponse.data);
        }
      } catch (medicationError) {
        console.warn('Could not fetch medications:', medicationError);
        // Continue without medications
      }

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCase = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      const formData = new FormData();
      Object.keys(newCase).forEach(key => {
        if (key === 'images') {
          Array.from(newCase.images).forEach(file => {
            formData.append('images', file);
          });
        } else {
          formData.append(key, newCase[key]);
        }
      });

      await publicApiService.createAnimalCase(formData);
      
      // Reset form and close modal
      setNewCase({
        animalType: '',
        speciesScientificName: '',
        ageSize: '',
        gender: 'Male',
        priority: 'Medium',
        location: '',
        reportedBy: '',
        primaryCondition: '',
        symptomsObservations: '',
        initialTreatmentPlan: '',
        additionalNotes: '',
        images: []
      });
      setShowCreateModal(false);
      
      // Refresh the list
      fetchDashboardData();
    } catch (error) {
      console.error('Failed to create case:', error);
      setError('Failed to create case');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCase = async (caseId) => {
    if (window.confirm('Are you sure you want to delete this case?')) {
      try {
        await publicApiService.deleteAnimalCase(caseId);
        fetchDashboardData(); // Refresh the list
      } catch (error) {
        console.error('Failed to delete case:', error);
        setError('Failed to delete case');
      }
    }
  };

  const handleEditCase = (animalCase) => {
    setSelectedCaseForEdit(animalCase);
    setEditCase({
      animalType: animalCase.animalType || '',
      speciesScientificName: animalCase.speciesScientificName || '',
      ageSize: animalCase.ageSize || '',
      gender: animalCase.gender || 'Male',
      priority: animalCase.priority || 'Medium',
      location: animalCase.location || '',
      reportedBy: animalCase.reportedBy || '',
      primaryCondition: animalCase.primaryCondition || '',
      symptomsObservations: animalCase.symptomsObservations || '',
      initialTreatmentPlan: animalCase.initialTreatmentPlan || '',
      additionalNotes: animalCase.additionalNotes || '',
      images: []
    });
    setShowEditModal(true);
  };

  const handleUpdateCase = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      const formData = new FormData();
      Object.keys(editCase).forEach(key => {
        if (key === 'images') {
          Array.from(editCase.images).forEach(file => {
            formData.append('images', file);
          });
        } else {
          formData.append(key, editCase[key]);
        }
      });

      await publicApiService.updateAnimalCase(selectedCaseForEdit._id, formData);
      
      setShowEditModal(false);
      setSelectedCaseForEdit(null);
      fetchDashboardData();
    } catch (error) {
      console.error('Failed to update case:', error);
      setError('Failed to update case');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTreatment = (animalCase) => {
    setSelectedCaseForTreatment(animalCase);
    setTreatmentForm({
      treatmentType: '',
      description: '',
      medicationsUsed: '',
      dosage: '',
      treatmentDate: new Date().toISOString().split('T')[0],
      followUpRequired: false,
      followUpDate: '',
      treatmentImages: []
    });
    setShowTreatmentModal(true);
  };

  const handleCreateTreatment = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      const formData = new FormData();
      Object.keys(treatmentForm).forEach(key => {
        if (key === 'treatmentImages') {
          Array.from(treatmentForm.treatmentImages).forEach(file => {
            formData.append('treatmentImages', file);
          });
        } else {
          formData.append(key, treatmentForm[key]);
        }
      });

      await publicApiService.createTreatment(selectedCaseForTreatment._id, formData);
      
      setShowTreatmentModal(false);
      setSelectedCaseForTreatment(null);
      fetchDashboardData();
    } catch (error) {
      console.error('Failed to create treatment:', error);
      setError('Failed to create treatment');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async (animalCase) => {
    try {
      // Generate and download a simple text report
      const reportContent = generateCaseReport(animalCase);
      
      // Create a blob and download it
      const blob = new Blob([reportContent], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `animal_case_report_${animalCase.caseId || animalCase._id}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to generate report:', error);
      setError('Failed to generate report');
    }
  };

  const generateCaseReport = (animalCase) => {
    const report = `
ANIMAL CASE REPORT
==================

Case ID: ${animalCase.caseId || animalCase._id}
Generated on: ${new Date().toLocaleString()}

BASIC INFORMATION
-----------------
Animal Type: ${animalCase.animalType}
Scientific Name: ${animalCase.speciesScientificName}
Age/Size: ${animalCase.ageSize}
Gender: ${animalCase.gender}
Priority: ${animalCase.priority}
Status: ${animalCase.status}
Location: ${animalCase.location}
Reported By: ${animalCase.reportedBy}
Date Reported: ${new Date(animalCase.createdAt).toLocaleDateString()}

MEDICAL INFORMATION
-------------------
Primary Condition: ${animalCase.primaryCondition}
Symptoms & Observations: ${animalCase.symptomsObservations}
Initial Treatment Plan: ${animalCase.initialTreatmentPlan}
${animalCase.additionalNotes ? 'Additional Notes: ' + animalCase.additionalNotes : ''}

ASSIGNMENT INFORMATION
----------------------
${animalCase.assignedVet ? 'Assigned Veterinarian: ' + animalCase.assignedVet.name : 'Status: Unassigned'}
${animalCase.assignedDate ? 'Assigned Date: ' + new Date(animalCase.assignedDate).toLocaleDateString() : ''}

DOCUMENTATION
-------------
Number of Photos: ${animalCase.photosDocumentation ? animalCase.photosDocumentation.length : 0}
${animalCase.completedDate ? 'Completed Date: ' + new Date(animalCase.completedDate).toLocaleDateString() : ''}

---
Report generated by Wild Lanka Animal Care Management System
    `;
    return report;
  };

  // Medication management functions
  const handleCreateMedication = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      // Transform form data to match backend expectations
      const medicationData = {
        ...medicationForm,
        supplier: {
          name: medicationForm.supplierName,
          email: medicationForm.supplierEmail
        }
      };
      
      await publicApiService.createMedication(medicationData);
      
      // Reset form and close modal
      setMedicationForm({
        name: '',
        description: '',
        category: '',
        form: '',
        strength: '',
        quantity: '',
        unit: '',
        threshold: '',
        batchNumber: '',
        manufacturingDate: '',
        expiryDate: '',
        manufacturer: '',
        supplierName: '',
        supplierEmail: '',
        costPerUnit: ''
      });
      setShowMedicationModal(false);
      
      // Refresh the list
      fetchDashboardData();
    } catch (error) {
      console.error('Failed to create medication:', error);
      setError('Failed to create medication');
    } finally {
      setLoading(false);
    }
  };

  const handleEditMedication = (medication) => {
    setSelectedMedication(medication);
    setMedicationForm({
      name: medication.name || '',
      description: medication.description || '',
      category: medication.category || '',
      form: medication.form || '',
      strength: medication.strength || '',
      quantity: medication.quantity || '',
      unit: medication.unit || '',
      threshold: medication.threshold || '',
      batchNumber: medication.batchNumber || '',
      manufacturingDate: medication.manufacturingDate ? medication.manufacturingDate.split('T')[0] : '',
      expiryDate: medication.expiryDate ? medication.expiryDate.split('T')[0] : '',
      manufacturer: medication.manufacturer || '',
      supplierName: medication.supplier?.name || '',
      supplierEmail: medication.supplier?.email || '',
      costPerUnit: medication.costPerUnit || ''
    });
    setShowMedicationModal(true);
  };

  const handleUpdateMedication = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      // Transform form data to match backend expectations
      const medicationData = {
        ...medicationForm,
        supplier: {
          name: medicationForm.supplierName,
          email: medicationForm.supplierEmail
        }
      };
      
      await publicApiService.updateMedication(selectedMedication._id, medicationData);
      
      setShowMedicationModal(false);
      setSelectedMedication(null);
      fetchDashboardData();
    } catch (error) {
      console.error('Failed to update medication:', error);
      setError('Failed to update medication');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMedication = async (medicationId) => {
    if (window.confirm('Are you sure you want to delete this medication?')) {
      try {
        await publicApiService.deleteMedication(medicationId);
        fetchDashboardData(); // Refresh the list
      } catch (error) {
        console.error('Failed to delete medication:', error);
        setError('Failed to delete medication');
      }
    }
  };

  const getLowStockColor = (quantity, threshold) => {
    if (quantity <= threshold) {
      return 'bg-red-100 text-red-800';
    } else if (quantity <= threshold * 1.5) {
      return 'bg-yellow-100 text-yellow-800';
    }
    return 'bg-green-100 text-green-800';
  };

  const getStatusColor = (status) => {
    const colors = {
      'Unassigned': 'bg-gray-100 text-gray-800',
      'Assigned': 'bg-blue-100 text-blue-800',
      'In Progress': 'bg-yellow-100 text-yellow-800',
      'Completed': 'bg-green-100 text-green-800'
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

  if (loading && animalCases.length === 0) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-1 flex items-center justify-center pt-32">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <RoleGuard requiredRole="vet">
      <div className="flex flex-col min-h-screen">
        <Navbar />
      <div className="flex-1 pt-32 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Animal Cases Dashboard</h1>
            <p className="text-gray-600 mt-2">
              Manage animal cases and treatments
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-800">Total Cases</h3>
                <p className="text-3xl font-bold text-blue-600">{stats.total_cases || 0}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-800">Active Cases</h3>
                <p className="text-3xl font-bold text-yellow-600">{stats.active_cases || 0}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-800">Completed</h3>
                <p className="text-3xl font-bold text-green-600">{stats.completed_cases || 0}</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-800">Critical</h3>
                <p className="text-3xl font-bold text-red-600">{stats.critical_cases || 0}</p>
              </div>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('cases')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'cases'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Animal Cases
                </button>
                <button
                  onClick={() => setActiveTab('inventory')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'inventory'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Medication Inventory
                </button>
              </nav>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mb-6">
            {activeTab === 'cases' ? (
              <>
                <RoleBasedFeature requiredRole="vet">
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    + Create New Case
                  </button>
                </RoleBasedFeature>
                <button
                  onClick={fetchDashboardData}
                  className="ml-3 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Refresh
                </button>
              </>
            ) : (
              <>
                <RoleBasedFeature requiredRole="vet">
                  <button
                    onClick={() => setShowMedicationModal(true)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    + Add Medication
                  </button>
                </RoleBasedFeature>
                <button
                  onClick={fetchDashboardData}
                  className="ml-3 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Refresh
                </button>
              </>
            )}
          </div>

          {/* Content based on active tab */}
          {activeTab === 'cases' ? (
            /* Cases List */
            <div className="bg-white rounded-lg shadow">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Animal Cases</h2>
                
                {animalCases.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No animal cases found.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {animalCases.map((animalCase) => (
                    <div key={animalCase._id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-2">
                            <h3 className="text-lg font-semibold text-gray-800">
                              {animalCase.caseId || animalCase._id}
                            </h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(animalCase.status)}`}>
                              {animalCase.status}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(animalCase.priority)}`}>
                              {animalCase.priority}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                            <div>
                              <p><strong>Animal:</strong> {animalCase.animalType}</p>
                              <p><strong>Species:</strong> {animalCase.speciesScientificName}</p>
                              <p><strong>Location:</strong> {animalCase.location}</p>
                            </div>
                            <div>
                              <p><strong>Reported By:</strong> {animalCase.reportedBy}</p>
                              <p><strong>Age/Size:</strong> {animalCase.ageSize}</p>
                              <p><strong>Gender:</strong> {animalCase.gender}</p>
                            </div>
                          </div>
                          
                          {animalCase.primaryCondition && (
                            <div className="mt-3">
                              <p className="text-sm text-gray-600">
                                <strong>Condition:</strong> {animalCase.primaryCondition}
                              </p>
                            </div>
                          )}
                          
                          {animalCase.assignedVet && (
                            <div className="mt-3">
                              <p className="text-sm text-gray-600">
                                <strong>Assigned Vet:</strong> {animalCase.assignedVet.name}
                              </p>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => setSelectedCase(animalCase)}
                            className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700 transition-colors"
                          >
                            View Details
                          </button>
                          <button
                            onClick={() => handleAddTreatment(animalCase)}
                            className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                          >
                            Add Treatment
                          </button>
                          <button
                            onClick={() => handleEditCase(animalCase)}
                            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleGenerateReport(animalCase)}
                            className="bg-indigo-600 text-white px-3 py-1 rounded text-sm hover:bg-indigo-700 transition-colors"
                          >
                            Download Report
                          </button>
                          <button
                            onClick={() => handleDeleteCase(animalCase._id)}
                            className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Medication Inventory */
            <div className="bg-white rounded-lg shadow">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Medication Inventory</h2>
                
                {medications.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No medications found.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {medications.map((medication) => (
                      <div key={medication._id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-4 mb-2">
                              <h3 className="text-lg font-semibold text-gray-800">
                                {medication.name}
                              </h3>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLowStockColor(medication.quantity, medication.threshold)}`}>
                                Stock: {medication.quantity} {medication.unit}
                              </span>
                              {medication.quantity <= medication.threshold && (
                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  Low Stock Alert
                                </span>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                              <div>
                                <p><strong>Description:</strong> {medication.description}</p>
                                <p><strong>Supplier:</strong> {medication.supplierEmail}</p>
                                <p><strong>Unit:</strong> {medication.unit}</p>
                              </div>
                              <div>
                                <p><strong>Threshold:</strong> {medication.threshold} {medication.unit}</p>
                                <p><strong>Cost:</strong> ${medication.cost || 'N/A'}</p>
                                {medication.expiryDate && (
                                  <p><strong>Expiry:</strong> {new Date(medication.expiryDate).toLocaleDateString()}</p>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={() => handleEditMedication(medication)}
                              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteMedication(medication._id)}
                              className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Case Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Create New Animal Case</h2>
              
              <form onSubmit={handleCreateCase}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Animal Type *
                    </label>
                    <input
                      type="text"
                      required
                      value={newCase.animalType}
                      onChange={(e) => setNewCase({...newCase, animalType: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Scientific Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={newCase.speciesScientificName}
                      onChange={(e) => setNewCase({...newCase, speciesScientificName: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Age/Size *
                    </label>
                    <select
                      required
                      value={newCase.ageSize}
                      onChange={(e) => setNewCase({...newCase, ageSize: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Select Age/Size</option>
                      <option value="Adult">Adult</option>
                      <option value="Juvenile">Juvenile</option>
                      <option value="Calf">Calf</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gender
                    </label>
                    <select
                      value={newCase.gender}
                      onChange={(e) => setNewCase({...newCase, gender: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Unknown">Unknown</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priority
                    </label>
                    <select
                      value={newCase.priority}
                      onChange={(e) => setNewCase({...newCase, priority: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location *
                    </label>
                    <input
                      type="text"
                      required
                      value={newCase.location}
                      onChange={(e) => setNewCase({...newCase, location: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reported By
                  </label>
                  <input
                    type="text"
                    value={newCase.reportedBy}
                    onChange={(e) => setNewCase({...newCase, reportedBy: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Primary Condition
                  </label>
                  <textarea
                    value={newCase.primaryCondition}
                    onChange={(e) => setNewCase({...newCase, primaryCondition: e.target.value})}
                    rows="3"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Symptoms & Observations *
                  </label>
                  <textarea
                    required
                    value={newCase.symptomsObservations}
                    onChange={(e) => setNewCase({...newCase, symptomsObservations: e.target.value})}
                    rows="3"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Initial Treatment Plan *
                  </label>
                  <textarea
                    required
                    value={newCase.initialTreatmentPlan}
                    onChange={(e) => setNewCase({...newCase, initialTreatmentPlan: e.target.value})}
                    rows="3"
                    placeholder="Describe the initial treatment approach..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Images
                  </label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => setNewCase({...newCase, images: e.target.files})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                
                <div className="flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Creating...' : 'Create Case'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Case Details Modal */}
      {selectedCase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  Case Details - {selectedCase.caseId || selectedCase._id}
                </h2>
                <button
                  onClick={() => setSelectedCase(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <span className="text-2xl">&times;</span>
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Basic Information</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Animal Type:</strong> {selectedCase.animalType}</p>
                    <p><strong>Species:</strong> {selectedCase.speciesScientificName}</p>
                    <p><strong>Age/Size:</strong> {selectedCase.ageSize}</p>
                    <p><strong>Gender:</strong> {selectedCase.gender}</p>
                    <p><strong>Priority:</strong> {selectedCase.priority}</p>
                    <p><strong>Status:</strong> {selectedCase.status}</p>
                    <p><strong>Location:</strong> {selectedCase.location}</p>
                    <p><strong>Reported By:</strong> {selectedCase.reportedBy}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Medical Information</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Primary Condition:</strong> {selectedCase.primaryCondition}</p>
                    <p><strong>Symptoms:</strong> {selectedCase.symptomsObservations}</p>
                    <p><strong>Treatment Plan:</strong> {selectedCase.initialTreatmentPlan}</p>
                    {selectedCase.assignedVet && (
                      <p><strong>Assigned Vet:</strong> {selectedCase.assignedVet.name}</p>
                    )}
                  </div>
                </div>
              </div>
              
              {selectedCase.photosDocumentation && selectedCase.photosDocumentation.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Photos</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {selectedCase.photosDocumentation.map((photo, index) => (
                      <img
                        key={index}
                        src={photo.thumbnail_url || photo.url}
                        alt={`Case photo ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border border-gray-200"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Case Modal */}
      {showEditModal && selectedCaseForEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Edit Animal Case</h2>
              
              <form onSubmit={handleUpdateCase}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Animal Type *
                    </label>
                    <input
                      type="text"
                      required
                      value={editCase.animalType}
                      onChange={(e) => setEditCase({...editCase, animalType: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Scientific Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={editCase.speciesScientificName}
                      onChange={(e) => setEditCase({...editCase, speciesScientificName: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Age/Size
                    </label>
                    <select
                      value={editCase.ageSize}
                      onChange={(e) => setEditCase({...editCase, ageSize: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Select Age/Size</option>
                      <option value="Adult">Adult</option>
                      <option value="Juvenile">Juvenile</option>
                      <option value="Calf">Calf</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gender
                    </label>
                    <select
                      value={editCase.gender}
                      onChange={(e) => setEditCase({...editCase, gender: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Unknown">Unknown</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priority
                    </label>
                    <select
                      value={editCase.priority}
                      onChange={(e) => setEditCase({...editCase, priority: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location *
                    </label>
                    <input
                      type="text"
                      required
                      value={editCase.location}
                      onChange={(e) => setEditCase({...editCase, location: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reported By
                  </label>
                  <input
                    type="text"
                    value={editCase.reportedBy}
                    onChange={(e) => setEditCase({...editCase, reportedBy: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Primary Condition *
                  </label>
                  <textarea
                    required
                    value={editCase.primaryCondition}
                    onChange={(e) => setEditCase({...editCase, primaryCondition: e.target.value})}
                    rows="3"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Symptoms & Observations *
                  </label>
                  <textarea
                    required
                    value={editCase.symptomsObservations}
                    onChange={(e) => setEditCase({...editCase, symptomsObservations: e.target.value})}
                    rows="3"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Initial Treatment Plan *
                  </label>
                  <textarea
                    required
                    value={editCase.initialTreatmentPlan}
                    onChange={(e) => setEditCase({...editCase, initialTreatmentPlan: e.target.value})}
                    rows="3"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Images
                  </label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => setEditCase({...editCase, images: e.target.files})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                
                <div className="flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Updating...' : 'Update Case'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Treatment Modal */}
      {showTreatmentModal && selectedCaseForTreatment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                Add Treatment for {selectedCaseForTreatment.caseId || selectedCaseForTreatment._id}
              </h2>
              
              <form onSubmit={handleCreateTreatment}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Treatment Type *
                    </label>
                    <input
                      type="text"
                      required
                      value={treatmentForm.treatmentType}
                      onChange={(e) => setTreatmentForm({...treatmentForm, treatmentType: e.target.value})}
                      placeholder="e.g., Medication, Surgery, Therapy"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Treatment Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={treatmentForm.treatmentDate}
                      onChange={(e) => setTreatmentForm({...treatmentForm, treatmentDate: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Treatment Description *
                  </label>
                  <textarea
                    required
                    value={treatmentForm.description}
                    onChange={(e) => setTreatmentForm({...treatmentForm, description: e.target.value})}
                    rows="4"
                    placeholder="Describe the treatment procedure, observations, and outcomes..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Medications Used
                    </label>
                    <input
                      type="text"
                      value={treatmentForm.medicationsUsed}
                      onChange={(e) => setTreatmentForm({...treatmentForm, medicationsUsed: e.target.value})}
                      placeholder="List medications and drugs used"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dosage
                    </label>
                    <input
                      type="text"
                      value={treatmentForm.dosage}
                      onChange={(e) => setTreatmentForm({...treatmentForm, dosage: e.target.value})}
                      placeholder="Dosage information"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
                
                <div className="mb-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={treatmentForm.followUpRequired}
                      onChange={(e) => setTreatmentForm({...treatmentForm, followUpRequired: e.target.checked})}
                      className="mr-2"
                    />
                    <label className="text-sm font-medium text-gray-700">
                      Follow-up Required
                    </label>
                  </div>
                </div>
                
                {treatmentForm.followUpRequired && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Follow-up Date
                    </label>
                    <input
                      type="date"
                      value={treatmentForm.followUpDate}
                      onChange={(e) => setTreatmentForm({...treatmentForm, followUpDate: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                )}
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Treatment Images
                  </label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => setTreatmentForm({...treatmentForm, treatmentImages: e.target.files})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                
                <div className="flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => setShowTreatmentModal(false)}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Adding...' : 'Add Treatment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Medication Modal */}
      {showMedicationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                {selectedMedication ? 'Edit Medication' : 'Add New Medication'}
              </h2>
              
              <form onSubmit={selectedMedication ? handleUpdateMedication : handleCreateMedication}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Medication Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={medicationForm.name}
                      onChange={(e) => setMedicationForm({...medicationForm, name: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category *
                    </label>
                    <select
                      required
                      value={medicationForm.category}
                      onChange={(e) => setMedicationForm({...medicationForm, category: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Select Category</option>
                      <option value="Antibiotic">Antibiotic</option>
                      <option value="Painkiller">Painkiller</option>
                      <option value="Anti-inflammatory">Anti-inflammatory</option>
                      <option value="Anesthetic">Anesthetic</option>
                      <option value="Vaccine">Vaccine</option>
                      <option value="Supplement">Supplement</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Form *
                    </label>
                    <select
                      required
                      value={medicationForm.form}
                      onChange={(e) => setMedicationForm({...medicationForm, form: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Select Form</option>
                      <option value="Tablet">Tablet</option>
                      <option value="Capsule">Capsule</option>
                      <option value="Liquid">Liquid</option>
                      <option value="Injection">Injection</option>
                      <option value="Topical">Topical</option>
                      <option value="Powder">Powder</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Strength *
                    </label>
                    <input
                      type="text"
                      required
                      value={medicationForm.strength}
                      onChange={(e) => setMedicationForm({...medicationForm, strength: e.target.value})}
                      placeholder="e.g., 500mg, 10ml"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Unit *
                    </label>
                    <select
                      required
                      value={medicationForm.unit}
                      onChange={(e) => setMedicationForm({...medicationForm, unit: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="">Select Unit</option>
                      <option value="tablets">Tablets</option>
                      <option value="capsules">Capsules</option>
                      <option value="ml">ML</option>
                      <option value="bottles">Bottles</option>
                      <option value="vials">Vials</option>
                      <option value="ampules">Ampules</option>
                      <option value="grams">Grams</option>
                      <option value="kg">KG</option>
                      <option value="units">Units</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Batch Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={medicationForm.batchNumber}
                      onChange={(e) => setMedicationForm({...medicationForm, batchNumber: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantity *
                    </label>
                    <input
                      type="number"
                      required
                      value={medicationForm.quantity}
                      onChange={(e) => setMedicationForm({...medicationForm, quantity: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Low Stock Threshold *
                    </label>
                    <input
                      type="number"
                      required
                      value={medicationForm.threshold}
                      onChange={(e) => setMedicationForm({...medicationForm, threshold: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cost Per Unit *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={medicationForm.costPerUnit}
                      onChange={(e) => setMedicationForm({...medicationForm, costPerUnit: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Manufacturer *
                    </label>
                    <input
                      type="text"
                      required
                      value={medicationForm.manufacturer}
                      onChange={(e) => setMedicationForm({...medicationForm, manufacturer: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Manufacturing Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={medicationForm.manufacturingDate}
                      onChange={(e) => setMedicationForm({...medicationForm, manufacturingDate: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expiry Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={medicationForm.expiryDate}
                      onChange={(e) => setMedicationForm({...medicationForm, expiryDate: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Supplier Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={medicationForm.supplierName}
                      onChange={(e) => setMedicationForm({...medicationForm, supplierName: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Supplier Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={medicationForm.supplierEmail}
                      onChange={(e) => setMedicationForm({...medicationForm, supplierEmail: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={medicationForm.description}
                    onChange={(e) => setMedicationForm({...medicationForm, description: e.target.value})}
                    rows="3"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Supplier Email
                  </label>
                  <input
                    type="email"
                    value={medicationForm.supplierEmail}
                    onChange={(e) => setMedicationForm({...medicationForm, supplierEmail: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                
                <div className="flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowMedicationModal(false);
                      setSelectedMedication(null);
                      setMedicationForm({
                        name: '',
                        description: '',
                        category: '',
                        form: '',
                        strength: '',
                        quantity: '',
                        unit: '',
                        threshold: '',
                        batchNumber: '',
                        manufacturingDate: '',
                        expiryDate: '',
                        manufacturer: '',
                        supplierName: '',
                        supplierEmail: '',
                        costPerUnit: ''
                      });
                    }}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? (selectedMedication ? 'Updating...' : 'Adding...') : (selectedMedication ? 'Update Medication' : 'Add Medication')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
    </RoleGuard>
  );
};

export default VetDashboardSimple;