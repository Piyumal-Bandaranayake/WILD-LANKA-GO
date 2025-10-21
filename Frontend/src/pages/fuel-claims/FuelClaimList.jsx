import React, { useState, useEffect } from 'react';
import { protectedApi } from '../../services/authService';
import { useAuthContext } from '../../contexts/AuthContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/footer';

const FuelClaimList = () => {
    const { backendUser, user } = useAuthContext();
    const [fuelClaims, setFuelClaims] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showClaimModal, setShowClaimModal] = useState(false);
    const [showOdometerModal, setShowOdometerModal] = useState(false);
    const [selectedTour, setSelectedTour] = useState(null);

    const [newClaim, setNewClaim] = useState({
        tourId: '',
        startOdometer: '',
        endOdometer: '',
        startPhoto: null,
        endPhoto: null,
        totalDistance: 0,
        calculatedFuelCost: 0,
        notes: ''
    });

    const [odometerData, setOdometerData] = useState({
        tourId: '',
        type: 'start', // 'start' or 'end'
        reading: '',
        photo: null
    });

    useEffect(() => {
        fetchFuelClaims();
    }, []);

    const fetchFuelClaims = async () => {
        try {
            setLoading(true);
            const response = await protectedApi.getFuelClaims();
            setFuelClaims(response.data || []);
        } catch (error) {
            console.error('Failed to fetch fuel claims:', error);
            setError('Failed to load fuel claims');
        } finally {
            setLoading(false);
        }
    };

    const handleUploadOdometer = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('tourId', odometerData.tourId);
            formData.append('type', odometerData.type);
            formData.append('reading', odometerData.reading);
            formData.append('photo', odometerData.photo);
            formData.append('uploadedBy', user?.name || 'Driver');

            await protectedApi.uploadOdometerReading(formData);
            setShowOdometerModal(false);
            setOdometerData({
                tourId: '',
                type: 'start',
                reading: '',
                photo: null
            });
            alert('Odometer reading uploaded successfully!');
        } catch (error) {
            console.error('Failed to upload odometer reading:', error);
            setError('Failed to upload odometer reading');
        }
    };

    const handleSubmitClaim = async (e) => {
        e.preventDefault();
        try {
            const totalDistance = newClaim.endOdometer - newClaim.startOdometer;
            const fuelCostPerKm = 0.15; // Default fuel cost per km (can be configured)
            const calculatedFuelCost = totalDistance * fuelCostPerKm;

            await protectedApi.submitFuelClaim({
                ...newClaim,
                totalDistance,
                calculatedFuelCost,
                submittedBy: user?.name || 'Driver',
                submissionDate: new Date().toISOString(),
                status: 'pending'
            });

            setShowClaimModal(false);
            setNewClaim({
                tourId: '',
                startOdometer: '',
                endOdometer: '',
                startPhoto: null,
                endPhoto: null,
                totalDistance: 0,
                calculatedFuelCost: 0,
                notes: ''
            });
            fetchFuelClaims();
            alert('Fuel claim submitted successfully!');
        } catch (error) {
            console.error('Failed to submit fuel claim:', error);
            setError('Failed to submit fuel claim');
        }
    };

    const handleApproveClaim = async (claimId) => {
        try {
            await protectedApi.updateFuelClaimStatus(claimId, 'approved');
            fetchFuelClaims();
        } catch (error) {
            console.error('Failed to approve fuel claim:', error);
            setError('Failed to approve fuel claim');
        }
    };

    const handleRejectClaim = async (claimId) => {
        try {
            await protectedApi.updateFuelClaimStatus(claimId, 'rejected');
            fetchFuelClaims();
        } catch (error) {
            console.error('Failed to reject fuel claim:', error);
            setError('Failed to reject fuel claim');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'approved': return 'bg-green-100 text-green-800';
            case 'rejected': return 'bg-red-100 text-red-800';
            case 'paid': return 'bg-blue-100 text-blue-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    // Role-based permissions
    const isSafariDriver = backendUser?.role === 'safariDriver';
    const isWildlifeOfficer = backendUser?.role === 'wildlifeOfficer';
    const isAdmin = backendUser?.role === 'admin';

    // Safari Drivers can upload odometer readings and submit claims
    const canSubmitClaims = isSafariDriver;
    // Wildlife Park Officers process driver fuel cost claims
    const canProcessClaims = isWildlifeOfficer || isAdmin;

    if (loading) {
        return (
            <div className="flex flex-col min-h-screen">
                <Navbar />
                <div className="flex-1 flex items-center justify-center pt-32">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading fuel claims...</p>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen">
            <Navbar />
            <div className="flex-1 pt-32 pb-16">
                <div className="container mx-auto px-4">
                    <div className="flex justify-between items-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-800">Fuel Claims Management</h1>
                        <div className="flex gap-4">
                            {canSubmitClaims && (
                                <>
                                    <button
                                        onClick={() => setShowOdometerModal(true)}
                                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        Upload Odometer
                                    </button>
                                    <button
                                        onClick={() => setShowClaimModal(true)}
                                        className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                                    >
                                        Submit Claim
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {fuelClaims.map((claim) => (
                            <div key={claim._id} className="bg-white rounded-lg shadow-md p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-lg font-semibold">Fuel Claim #{claim._id?.slice(-6)}</h3>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(claim.status)}`}>
                                        {claim.status}
                                    </span>
                                </div>

                                <div className="space-y-2 text-sm">
                                    <p><span className="font-medium">Tour ID:</span> {claim.tourId}</p>
                                    <p><span className="font-medium">Driver:</span> {claim.submittedBy}</p>
                                    <p><span className="font-medium">Start Odometer:</span> {claim.startOdometer} km</p>
                                    <p><span className="font-medium">End Odometer:</span> {claim.endOdometer} km</p>
                                    <p><span className="font-medium">Total Distance:</span> {claim.totalDistance} km</p>
                                    <p><span className="font-medium">Calculated Cost:</span> ${claim.calculatedFuelCost?.toFixed(2)}</p>
                                    <p><span className="font-medium">Submitted:</span> {new Date(claim.submissionDate).toLocaleDateString()}</p>
                                    {claim.notes && (
                                        <p><span className="font-medium">Notes:</span> {claim.notes}</p>
                                    )}
                                </div>

                                <div className="mt-6 flex gap-2">
                                    {canProcessClaims && claim.status === 'pending' && (
                                        <>
                                            <button
                                                onClick={() => handleApproveClaim(claim._id)}
                                                className="bg-green-600 text-white px-3 py-1 text-sm rounded hover:bg-green-700 transition-colors flex-1"
                                            >
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => handleRejectClaim(claim._id)}
                                                className="bg-red-600 text-white px-3 py-1 text-sm rounded hover:bg-red-700 transition-colors flex-1"
                                            >
                                                Reject
                                            </button>
                                        </>
                                    )}
                                    <button
                                        onClick={() => alert(`Fuel Claim Details:\n\nClaim ID: ${claim._id}\nTour ID: ${claim.tourId}\nDriver: ${claim.submittedBy}\nStart Odometer: ${claim.startOdometer} km\nEnd Odometer: ${claim.endOdometer} km\nTotal Distance: ${claim.totalDistance} km\nCalculated Cost: $${claim.calculatedFuelCost?.toFixed(2)}\nStatus: ${claim.status}\nSubmitted: ${new Date(claim.submissionDate).toLocaleString()}\nNotes: ${claim.notes || 'None'}`)}
                                        className="bg-gray-600 text-white px-3 py-1 text-sm rounded hover:bg-gray-700 transition-colors"
                                    >
                                        View Details
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {fuelClaims.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-gray-500 text-lg">No fuel claims submitted</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Upload Odometer Modal */}
            {showOdometerModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-2xl font-bold mb-4">Upload Odometer Reading</h2>
                        <form onSubmit={handleUploadOdometer}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Tour ID</label>
                                    <input
                                        type="text"
                                        value={odometerData.tourId}
                                        onChange={(e) => setOdometerData({...odometerData, tourId: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Reading Type</label>
                                    <select
                                        value={odometerData.type}
                                        onChange={(e) => setOdometerData({...odometerData, type: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                    >
                                        <option value="start">Before Tour (Start)</option>
                                        <option value="end">After Tour (End)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Odometer Reading (km)</label>
                                    <input
                                        type="number"
                                        value={odometerData.reading}
                                        onChange={(e) => setOdometerData({...odometerData, reading: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Odometer Photo</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => setOdometerData({...odometerData, photo: e.target.files[0]})}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        required
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Upload a clear photo of the odometer reading</p>
                                </div>
                            </div>
                            <div className="flex gap-4 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowOdometerModal(false)}
                                    className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Upload
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Submit Fuel Claim Modal */}
            {showClaimModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-2xl font-bold mb-4">Submit Fuel Claim</h2>
                        <form onSubmit={handleSubmitClaim}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Tour ID</label>
                                    <input
                                        type="text"
                                        value={newClaim.tourId}
                                        onChange={(e) => setNewClaim({...newClaim, tourId: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Start Odometer Reading (km)</label>
                                    <input
                                        type="number"
                                        value={newClaim.startOdometer}
                                        onChange={(e) => setNewClaim({...newClaim, startOdometer: parseInt(e.target.value)})}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">End Odometer Reading (km)</label>
                                    <input
                                        type="number"
                                        value={newClaim.endOdometer}
                                        onChange={(e) => setNewClaim({...newClaim, endOdometer: parseInt(e.target.value)})}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Additional Notes</label>
                                    <textarea
                                        value={newClaim.notes}
                                        onChange={(e) => setNewClaim({...newClaim, notes: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        rows="3"
                                        placeholder="Any additional information about the fuel usage..."
                                    />
                                </div>
                                {newClaim.startOdometer && newClaim.endOdometer && newClaim.endOdometer > newClaim.startOdometer && (
                                    <div className="bg-blue-50 p-3 rounded-lg">
                                        <p className="text-sm font-medium text-blue-800">
                                            Distance: {newClaim.endOdometer - newClaim.startOdometer} km
                                        </p>
                                        <p className="text-sm font-medium text-blue-800">
                                            Estimated Cost: ${((newClaim.endOdometer - newClaim.startOdometer) * 0.15).toFixed(2)}
                                        </p>
                                        <p className="text-xs text-blue-600 mt-1">
                                            Rate: $0.15 per km
                                        </p>
                                    </div>
                                )}
                            </div>
                            <div className="flex gap-4 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowClaimModal(false)}
                                    className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors"
                                >
                                    Submit Claim
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
};

export default FuelClaimList;