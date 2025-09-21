import React, { useState, useEffect } from 'react';
import { useAuthContext } from '../../contexts/AuthContext';
import { protectedApi } from '../../services/authService';
import ProtectedRoute from '../../components/ProtectedRoute';
import Navbar from '../../components/Navbar';
import Footer from '../../components/footer';
import { DashboardLayout, TabbedContent } from '../../components/common/DashboardLayout';
import { 
  Modal, 
  Field, 
  Input, 
  Button, 
  StatusBadge, 
  Avatar, 
  DataTable, 
  Card, 
  LoadingSpinner, 
  EmptyState,
  MiniCalendar
} from '../../components/common/DashboardComponents';

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
  const [stats, setStats] = useState({
    totalCases: 0,
    activeCases: 0,
    recoveredAnimals: 0,
    criticalCases: 0
  });

  // Form states
  const [caseForm, setCaseForm] = useState({
    animalId: '',
    species: '',
    sex: '',
    age: '',
    condition: '',
    foundLocation: '',
    urgencyLevel: 'medium',
    images: []
  });

  const [treatmentForm, setTreatmentForm] = useState({
    caseId: '',
    diagnosis: '',
    medication: '',
    dosage: '',
    treatmentPlan: '',
    notes: ''
  });

  const [medicationForm, setMedicationForm] = useState({
    name: '',
    batchNumber: '',
    quantity: '',
    expiryDate: '',
    supplier: ''
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch animal cases first (most important)
      const casesRes = await protectedApi.getAnimalCases();
      const cases = casesRes.data?.cases || casesRes.data || [];
      setAnimalCases(cases);

      // Try to fetch other data with individual error handling
      const [
        medicationsRes,
        treatmentsRes,
        inventoryRes,
        collaborationsRes
      ] = await Promise.allSettled([
        protectedApi.getMedications().catch(err => ({ data: [] })),
        protectedApi.getTreatments().catch(err => ({ data: [] })),
        protectedApi.getMedicationInventory().catch(err => ({ data: [] })),
        protectedApi.getVetCollaborations().catch(err => ({ data: [] }))
      ]);

      setMedications(medicationsRes.value?.data || []);
      setTreatments(treatmentsRes.value?.data || []);
      setInventory(inventoryRes.value?.data || []);
      setCollaborations(collaborationsRes.value?.data || []);

      // Calculate stats
      setStats({
        totalCases: cases.length,
        activeCases: cases.filter(c => ['new', 'in-treatment', 'Assigned', 'In Progress'].includes(c.status)).length,
        recoveredAnimals: cases.filter(c => c.status === 'recovered' || c.status === 'Completed').length,
        criticalCases: cases.filter(c => c.urgencyLevel === 'critical' || c.priority === 'High').length
      });

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const createAnimalCase = async (e) => {
    e.preventDefault();
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
      setCaseForm({ animalId: '', species: '', sex: '', age: '', condition: '', foundLocation: '', urgencyLevel: 'medium', images: [] });
      await fetchDashboardData();
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
      await protectedApi.addTreatment(treatmentForm);
      setTreatmentForm({ caseId: '', diagnosis: '', medication: '', dosage: '', treatmentPlan: '', notes: '' });
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

  const generateReport = async (type) => {
    try {
      const response = await protectedApi.generateVetReport(type);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vet-${type}-report.pdf`;
      a.click();
    } catch (error) {
      setError(`Failed to generate ${type} report.`);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['vet']}>
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <div className="flex-1 flex items-center justify-center pt-32">
            <div className="text-center">
              <LoadingSpinner size="lg" />
              <p className="mt-4 text-gray-600">Loading veterinary dashboard...</p>
            </div>
          </div>
          <Footer />
        </div>
      </ProtectedRoute>
    );
  }

  // Define sidebar navigation items
  const sidebarItems = [
    { 
      key: 'overview', 
      label: 'Overview', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0h6" />
        </svg>
      )
    },
    { 
      key: 'cases', 
      label: 'Animal Cases', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636 10.682 6.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      )
    },
    { 
      key: 'treatments', 
      label: 'Treatments', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    { 
      key: 'inventory', 
      label: 'Inventory', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      )
    },
    { 
      key: 'collaboration', 
      label: 'Collaboration', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    { 
      key: 'reports', 
      label: 'Reports', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    }
  ];

  // Define stats cards
  const statsCards = [
    {
      title: "Total Cases",
      value: stats.totalCases,
      color: "blue",
      iconPath: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
    },
    {
      title: "Active Cases",
      value: stats.activeCases,
      color: "yellow",
      iconPath: "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    },
    {
      title: "Recovered",
      value: stats.recoveredAnimals,
      color: "green",
      iconPath: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    },
    {
      title: "Critical",
      value: stats.criticalCases,
      color: "red",
      iconPath: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
    }
  ];

  // Define tabs for main content
  const tabs = [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'cases', name: 'Animal Cases', icon: '🐾' },
    { id: 'treatments', name: 'Treatments', icon: '💊' },
    { id: 'inventory', name: 'Medication Inventory', icon: '📦' },
    { id: 'collaboration', name: 'Collaboration', icon: '🤝' },
    { id: 'reports', name: 'Reports', icon: '📄' }
  ];

  // Right widgets
  const rightWidgets = [
    <MiniCalendar />,
    <div>
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-gray-800">Quick Actions</h4>
      </div>
      <div className="space-y-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full justify-start"
          onClick={() => setActiveTab('cases')}
        >
          🐾 Register New Case
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full justify-start"
          onClick={() => setActiveTab('inventory')}
        >
          📦 Check Inventory
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full justify-start"
          onClick={() => generateReport('monthly')}
        >
          📄 Generate Report
        </Button>
      </div>
    </div>
  ];

  return (
    <ProtectedRoute allowedRoles={['vet']}>
      <div className="flex flex-col min-h-screen bg-[#F4F6FF]">
        <Navbar />
        
        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 mx-4 mt-28">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <DashboardLayout
          sidebarItems={sidebarItems}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          searchPlaceholder="Search cases, treatments..."
          greetingMessage={`Animal Care & Treatment Management`}
          statsCards={statsCards}
          rightWidgets={rightWidgets}
          headerColor="green"
        >

          <TabbedContent
            tabs={tabs}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            headerColor="green"
          >
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Veterinary Dashboard Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card title="Recent Critical Cases">
                    <div className="space-y-2 text-sm text-gray-600">
                      {animalCases.filter(c => c.urgencyLevel === 'critical').slice(0, 5).map((case_) => (
                        <div key={case_._id} className="flex justify-between">
                          <span className="text-red-600">🚨 {case_.species} - {case_.condition}</span>
                          <span>{case_.animalId}</span>
                        </div>
                      ))}
                      {animalCases.filter(c => c.urgencyLevel === 'critical').length === 0 && (
                        <p className="text-gray-500">No critical cases at the moment</p>
                      )}
                    </div>
                  </Card>
                  <Card title="Quick Actions">
                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => setActiveTab('cases')}
                      >
                        🐾 Register New Animal Case
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => setActiveTab('inventory')}
                      >
                        📦 Check Medication Inventory
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => generateReport('monthly')}
                      >
                        📄 Generate Monthly Report
                      </Button>
                    </div>
                  </Card>
                </div>
              </div>
            )}

                {/* Animal Cases Tab */}
                {activeTab === 'cases' && (
                  <div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Create New Case */}
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Register New Animal Case</h3>
                        <form onSubmit={createAnimalCase} className="bg-gray-50 rounded-lg p-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Species</label>
                              <input
                                type="text"
                                value={caseForm.species}
                                onChange={(e) => setCaseForm({...caseForm, species: e.target.value})}
                                required
                                className="w-full border border-gray-300 rounded-md px-3 py-2"
                                placeholder="e.g., Elephant, Leopard"
                              />
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
                              onChange={(e) => setCaseForm({...caseForm, condition: e.target.value})}
                              rows="3"
                              required
                              className="w-full border border-gray-300 rounded-md px-3 py-2"
                              placeholder="Describe the injury or sickness..."
                            />
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
                            className="mt-4 w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                          >
                            🐾 Register Animal Case
                          </button>
                        </form>
                      </div>

                      {/* Animal Cases Grid */}
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Animal Cases</h3>
                        <div className="space-y-4 max-h-96 overflow-y-auto">
                          {animalCases.map((case_) => (
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
                                  <button className="px-2 py-1 bg-purple-600 text-white rounded text-xs hover:bg-purple-700">
                                    View Details
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Treatments Tab */}
                {activeTab === 'treatments' && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Treatment Management</h3>
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
                        <h4 className="font-medium text-gray-900 mb-4">Recent Treatments</h4>
                        <div className="space-y-4 max-h-96 overflow-y-auto">
                          {treatments.map((treatment) => (
                            <div key={treatment._id} className="border border-gray-200 rounded-lg p-4">
                              <h5 className="font-medium text-gray-900">{treatment.caseDetails?.species} - {treatment.caseDetails?.animalId}</h5>
                              <p className="text-sm text-gray-600 mt-1">{treatment.diagnosis}</p>
                              <p className="text-sm text-gray-700 mt-2">{treatment.treatmentPlan}</p>
                              {treatment.medication && (
                                <p className="text-sm text-blue-600 mt-1">
                                  💊 {treatment.medication} - {treatment.dosage}
                                </p>
                              )}
                              <p className="text-xs text-gray-500 mt-2">
                                {new Date(treatment.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Medication Inventory Tab */}
                {activeTab === 'inventory' && (
                  <div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Add Medication */}
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Add Medication to Inventory</h3>
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
                            className="mt-4 w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                          >
                            📦 Add to Inventory
                          </button>
                        </form>
                      </div>

                      {/* Inventory List */}
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Medication Inventory</h3>
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

                {/* Reports Tab */}
                {activeTab === 'reports' && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Reports & Analytics</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gray-50 rounded-lg p-6">
                        <h4 className="font-medium text-gray-900 mb-4">Generate Reports</h4>
                        <div className="space-y-3">
                          <button
                            onClick={() => generateReport('case-summary')}
                            className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                          >
                            📄 Individual Case Report
                          </button>
                          <button
                            onClick={() => generateReport('monthly')}
                            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                          >
                            📊 Monthly Treatment Logs
                          </button>
                          <button
                            onClick={() => generateReport('medication-usage')}
                            className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                          >
                            💊 Medication Usage Report
                          </button>
                          <button
                            onClick={() => generateReport('activity-summary')}
                            className="w-full px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700"
                          >
                            📈 Vet Activity Summary
                          </button>
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-6">
                        <h4 className="font-medium text-gray-900 mb-4">Statistics</h4>
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex justify-between">
                            <span>Recovery Rate:</span>
                            <span className="font-medium text-green-600">
                              {stats.totalCases > 0 ? ((stats.recoveredAnimals / stats.totalCases) * 100).toFixed(1) : 0}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Active Treatments:</span>
                            <span className="font-medium text-gray-900">{stats.activeCases}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Critical Cases:</span>
                            <span className="font-medium text-red-600">{stats.criticalCases}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Medication Items:</span>
                            <span className="font-medium text-gray-900">{inventory.length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Low Stock Items:</span>
                            <span className="font-medium text-orange-600">
                              {inventory.filter(item => item.quantity < 10).length}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
          </TabbedContent>
        </DashboardLayout>
        <Footer />
      </div>
    </ProtectedRoute>
  );
};

export default VetDashboard;