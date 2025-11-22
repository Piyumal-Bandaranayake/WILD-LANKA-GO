import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { protectedApi } from '../../services/authService';
import RoleGuard from '../../components/RoleGuard';
import Navbar from '../../components/Navbar';
import Footer from '../../components/footer';

const DriverManagement = () => {
  const { backendUser, user } = useAuth();
  const [activeTab, setActiveTab] = useState('applications');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Data states
  const [approvedApplications, setApprovedApplications] = useState([]);
  const [allDrivers, setAllDrivers] = useState([]);
  const [availableDrivers, setAvailableDrivers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [showDriverModal, setShowDriverModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch approved applications and drivers in parallel
      const [applicationsRes, driversRes, availableRes] = await Promise.all([
        protectedApi.getApplications({ status: 'ApprovedByWPO', role: 'Driver' }),
        protectedApi.getDrivers(),
        protectedApi.getAvailableDrivers()
      ]);

      setApprovedApplications(applicationsRes.data || []);
      setAllDrivers(driversRes.data || []);
      setAvailableDrivers(availableRes.data || []);

    } catch (error) {
      console.error('Failed to fetch data:', error);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const createDriverFromApplication = async (applicationId) => {
    try {
      setError(null);
      setSuccessMessage(null);

      const response = await protectedApi.createDriverFromApplication(applicationId);
      
      setSuccessMessage(`Driver account created successfully! Username: ${response.data.user.Username}`);
      
      // Refresh data
      await fetchData();
      
    } catch (error) {
      console.error('Failed to create driver:', error);
      setError(error.response?.data?.message || 'Failed to create driver account');
    }
  };

  const toggleDriverAvailability = async (driverId, currentStatus) => {
    try {
      setError(null);
      setSuccessMessage(null);

      await protectedApi.updateDriverAvailability(driverId, { 
        isAvailable: !currentStatus 
      });
      
      setSuccessMessage(`Driver ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      
      // Refresh data
      await fetchData();
      
    } catch (error) {
      console.error('Failed to toggle availability:', error);
      setError(error.response?.data?.message || 'Failed to update driver availability');
    }
  };

  const updateDriverStatus = async (driverId, status) => {
    try {
      setError(null);
      setSuccessMessage(null);

      await protectedApi.updateDriverStatus(driverId, { status });
      
      setSuccessMessage(`Driver status updated to ${status}`);
      
      // Refresh data
      await fetchData();
      
    } catch (error) {
      console.error('Failed to update status:', error);
      setError(error.response?.data?.message || 'Failed to update driver status');
    }
  };

  const filteredApplications = approvedApplications.filter(app => 
    app.firstname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.lastname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.phone?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDrivers = allDrivers.filter(driver => 
    driver.DriverName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    driver.Email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    driver.PhoneNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    driver.vehicleNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status) => {
    const statusConfig = {
      'approved': { color: 'bg-green-100 text-green-800', text: 'Approved' },
      'pending': { color: 'bg-yellow-100 text-yellow-800', text: 'Pending' },
      'rejected': { color: 'bg-red-100 text-red-800', text: 'Rejected' },
      'inactive': { color: 'bg-gray-100 text-gray-800', text: 'Inactive' }
    };
    
    const config = statusConfig[status] || statusConfig['pending'];
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const getAvailabilityBadge = (isAvailable) => {
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        isAvailable 
          ? 'bg-green-100 text-green-800' 
          : 'bg-red-100 text-red-800'
      }`}>
        {isAvailable ? 'Available' : 'Unavailable'}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading driver data...</p>
        </div>
      </div>
    );
  }

  return (
    <RoleGuard allowedRoles={['Wildlife Officer', 'Admin']}>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Driver Management</h1>
            <p className="mt-2 text-gray-600">Manage driver applications and existing drivers</p>
          </div>

          {/* Alerts */}
          {error && (
            <div className="mb-6 rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-2 text-sm text-red-700">{error}</div>
                </div>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 rounded-md bg-green-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-green-800">Success</h3>
                  <div className="mt-2 text-sm text-green-700">{successMessage}</div>
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('applications')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'applications'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Approved Applications ({approvedApplications.length})
                </button>
                <button
                  onClick={() => setActiveTab('drivers')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'drivers'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  All Drivers ({allDrivers.length})
                </button>
                <button
                  onClick={() => setActiveTab('available')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'available'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Available Drivers ({availableDrivers.length})
                </button>
              </nav>
            </div>
          </div>

          {/* Search */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search by name, email, phone, or vehicle number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Applications Tab */}
          {activeTab === 'applications' && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Approved Driver Applications</h3>
                <p className="mt-1 text-sm text-gray-500">Create driver accounts from approved applications</p>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Applicant
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Vehicle Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Applied
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredApplications.map((app) => (
                      <tr key={app._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <span className="text-sm font-medium text-blue-600">
                                  {app.firstname?.[0]}{app.lastname?.[0]}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {app.firstname} {app.lastname}
                              </div>
                              <div className="text-sm text-gray-500">{app.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{app.phone}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            <div>License: {app.LicenceNumber}</div>
                            <div>Vehicle: {app.vechicleType} - {app.vechicleNumber}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(app.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => createDriverFromApplication(app._id)}
                            className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md"
                          >
                            Create Driver Account
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {filteredApplications.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-gray-500">No approved applications found</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Drivers Tab */}
          {activeTab === 'drivers' && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">All Drivers</h3>
                <p className="mt-1 text-sm text-gray-500">Manage all registered drivers</p>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Driver
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Vehicle
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Availability
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredDrivers.map((driver) => (
                      <tr key={driver._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                                <span className="text-sm font-medium text-green-600">
                                  {driver.DriverName?.[0]}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {driver.DriverName}
                              </div>
                              <div className="text-sm text-gray-500">@{driver.username}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{driver.Email}</div>
                          <div className="text-sm text-gray-500">{driver.PhoneNumber}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            <div>{driver.vehicleType}</div>
                            <div className="text-gray-500">{driver.vehicleNumber}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(driver.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getAvailabilityBadge(driver.isAvailable)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() => toggleDriverAvailability(driver._id, driver.isAvailable)}
                            className={`px-3 py-1 rounded-md text-xs ${
                              driver.isAvailable
                                ? 'text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100'
                                : 'text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100'
                            }`}
                          >
                            {driver.isAvailable ? 'Deactivate' : 'Activate'}
                          </button>
                          
                          {driver.status === 'pending' && (
                            <button
                              onClick={() => updateDriverStatus(driver._id, 'approved')}
                              className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md text-xs"
                            >
                              Approve
                            </button>
                          )}
                          
                          <button
                            onClick={() => {
                              setSelectedDriver(driver);
                              setShowDriverModal(true);
                            }}
                            className="text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 px-3 py-1 rounded-md text-xs"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {filteredDrivers.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-gray-500">No drivers found</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Available Drivers Tab */}
          {activeTab === 'available' && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Available Drivers</h3>
                <p className="mt-1 text-sm text-gray-500">Drivers currently available for assignment</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                {availableDrivers.map((driver) => (
                  <div key={driver._id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center mb-3">
                      <div className="flex-shrink-0 h-12 w-12">
                        <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                          <span className="text-lg font-medium text-green-600">
                            {driver.DriverName?.[0]}
                          </span>
                        </div>
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">
                          {driver.DriverName}
                        </div>
                        <div className="text-sm text-gray-500">@{driver.username}</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600">
                      <div>📧 {driver.Email}</div>
                      <div>📱 {driver.PhoneNumber}</div>
                      <div>🚗 {driver.vehicleType} - {driver.vehicleNumber}</div>
                      <div>🆔 License: {driver.LicenceNumber}</div>
                    </div>
                    
                    <div className="mt-3 flex items-center justify-between">
                      {getAvailabilityBadge(driver.isAvailable)}
                      <button
                        onClick={() => {
                          setSelectedDriver(driver);
                          setShowDriverModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 text-xs"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
                
                {availableDrivers.length === 0 && (
                  <div className="col-span-full text-center py-12">
                    <div className="text-gray-500">No available drivers found</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Driver Details Modal */}
        {showDriverModal && selectedDriver && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={() => setShowDriverModal(false)}></div>
              </div>

              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                        Driver Details
                      </h3>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Name</label>
                          <p className="mt-1 text-sm text-gray-900">{selectedDriver.DriverName}</p>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Email</label>
                          <p className="mt-1 text-sm text-gray-900">{selectedDriver.Email}</p>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Phone</label>
                          <p className="mt-1 text-sm text-gray-900">{selectedDriver.PhoneNumber}</p>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Username</label>
                          <p className="mt-1 text-sm text-gray-900">@{selectedDriver.username}</p>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700">License Number</label>
                          <p className="mt-1 text-sm text-gray-900">{selectedDriver.LicenceNumber}</p>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Vehicle</label>
                          <p className="mt-1 text-sm text-gray-900">
                            {selectedDriver.vehicleType} - {selectedDriver.vehicleNumber}
                          </p>
                        </div>
                        
                        <div className="flex space-x-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Status</label>
                            <div className="mt-1">{getStatusBadge(selectedDriver.status)}</div>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Availability</label>
                            <div className="mt-1">{getAvailabilityBadge(selectedDriver.isAvailable)}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={() => setShowDriverModal(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <Footer />
      </div>
    </RoleGuard>
  );
};

export default DriverManagement;
