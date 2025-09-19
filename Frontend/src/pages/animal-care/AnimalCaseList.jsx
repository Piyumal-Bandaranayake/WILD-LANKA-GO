import React, { useState, useEffect } from 'react';
import { protectedApi } from '../../services/authService';
import { useAuthContext } from '../../contexts/AuthContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/footer';

const AnimalCaseList = () => {
    const { backendUser } = useAuthContext();
    const [cases, setCases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedCase, setSelectedCase] = useState(null);

    // Debug logging
    console.log('🐾 AnimalCaseList - backendUser:', backendUser);
    console.log('🐾 AnimalCaseList - cases state:', cases, 'is array:', Array.isArray(cases));

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

    useEffect(() => {
        // Only fetch cases when user is authenticated with backend
        if (backendUser) {
            fetchCases();
        }
    }, [backendUser]);

    const fetchCases = async (retryCount = 0) => {
        try {
            setLoading(true);
            setError(null);
            
            // Check if user is authenticated
            if (!backendUser) {
                setError('Please wait for authentication to complete...');
                return;
            }
            
            // Add a small delay to ensure token is properly set
            if (retryCount === 0) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            
            console.log('🔄 Fetching animal cases for user:', backendUser.email);
            const response = await protectedApi.getAnimalCases();
            console.log('✅ API Response received:', response); // Debug log
            
            // Handle the correct backend response structure
            let casesData = [];
            if (response.data && response.data.cases && Array.isArray(response.data.cases)) {
                casesData = response.data.cases;
            } else if (Array.isArray(response.data)) {
                casesData = response.data;
            }
            
            console.log('📝 Setting cases data:', casesData.length, 'cases'); // Debug log
            setCases(casesData);
        } catch (error) {
            console.error('❌ Failed to fetch animal cases:', error);
            
            // Retry once if it's a 401 error and we haven't retried yet
            if (error.response?.status === 401 && retryCount === 0) {
                console.log('🔄 Retrying after 401 error...');
                setTimeout(() => fetchCases(1), 1000);
                return;
            }
            
            if (error.response?.status === 401) {
                setError('Authentication required. Please log in again.');
            } else {
                setError('Failed to load animal cases. Please try again.');
            }
            setCases([]); // Ensure cases is always an array
        } finally {
            setLoading(false);
        }
    };

    const handleImageSelect = (e) => {
        const files = Array.from(e.target.files);
        setSelectedImages(files);

        // Preview images
        const imageUrls = files.map(file => URL.createObjectURL(file));
        setNewCase({...newCase, previewImages: imageUrls});
    };

    const handleCreateCase = async (e) => {
        e.preventDefault();
        try {
            setUploadingImages(true);

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

            await protectedApi.createAnimalCaseWithImages(formData);

            setShowCreateModal(false);
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
            fetchCases();
        } catch (error) {
            console.error('Failed to create animal case:', error);
            setError('Failed to create animal case');
        } finally {
            setUploadingImages(false);
        }
    };

    const handleUpdateCaseStatus = async (caseId, newStatus) => {
        try {
            await protectedApi.updateAnimalCase(caseId, { status: newStatus });
            fetchCases();
        } catch (error) {
            console.error('Failed to update case status:', error);
            setError('Failed to update case status');
        }
    };

    const handleDeleteCase = async (id) => {
        if (window.confirm('Are you sure you want to delete this animal case?')) {
            try {
                await protectedApi.deleteAnimalCase(id);
                fetchCases();
            } catch (error) {
                console.error('Failed to delete animal case:', error);
                setError('Failed to delete animal case');
            }
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Open': return 'bg-red-100 text-red-800';
            case 'In Progress': return 'bg-yellow-100 text-yellow-800';
            case 'Resolved': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'High': return 'bg-red-500';
            case 'Medium': return 'bg-yellow-500';
            case 'Low': return 'bg-green-500';
            default: return 'bg-gray-500';
        }
    };

    const isVet = backendUser?.role === 'vet';
    const isWildlifeOfficer = backendUser?.role === 'wildlifeOfficer';
    const isAdmin = backendUser?.role === 'admin';
    const canAssignCases = isWildlifeOfficer || isAdmin; // Only WPO can assign cases
    const canTreatCases = isVet; // Only vets can treat cases
    const canViewCases = isVet || isWildlifeOfficer || isAdmin; // All can view

    if (loading) {
        return (
            <div className="flex flex-col min-h-screen">
                <Navbar />
                <div className="flex-1 flex items-center justify-center pt-32">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading animal cases...</p>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    // Safety check to ensure cases is always an array
    const safeCases = Array.isArray(cases) ? cases : [];
    
    console.log('🐾 Render - safeCases:', safeCases, 'length:', safeCases.length);

    // Show loading if not authenticated or if waiting for initial data
    if (!backendUser || loading) {
        return (
            <div className="flex flex-col min-h-screen">
                <Navbar />
                <div className="flex-1 pt-32 pb-16 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
                        <p className="text-gray-600">
                            {!backendUser ? 'Authenticating...' : 'Loading animal cases...'}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen">
            <Navbar />
            <div className="flex-1 pt-32 pb-16">
                <div className="container mx-auto px-4">
                    <div className="flex justify-between items-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-800">Animal Care Cases</h1>
                        <div className="flex gap-3">
                            <button
                                onClick={() => fetchCases()}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Refresh
                            </button>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                            >
                                Report New Case
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex justify-between items-center">
                            <span>{error}</span>
                            <button
                                onClick={() => fetchCases()}
                                className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
                            >
                                Retry
                            </button>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {safeCases.length > 0 ? (
                            safeCases.map((animalCase) => (
                                <div key={animalCase._id} className="bg-white rounded-lg shadow-md p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="text-xl font-semibold">Case #{animalCase.caseId || animalCase._id.slice(-6)}</h3>
                                        <div className="flex gap-2">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(animalCase.status)}`}>
                                                {animalCase.status}
                                        </span>
                                        <div className={`w-3 h-3 rounded-full ${getPriorityColor(animalCase.priority)}`} title={`${animalCase.priority} Priority`}></div>
                                    </div>
                                </div>

                                {/* Animal Images */}
                                {animalCase.images && animalCase.images.length > 0 && (
                                    <div className="mb-4">
                                        <h4 className="font-medium text-sm text-gray-700 mb-2">Animal Images</h4>
                                        <div className="grid grid-cols-2 gap-2">
                                            {animalCase.images.slice(0, 4).map((image, index) => (
                                                <div key={index} className="relative group">
                                                    <img
                                                        src={image.url || image.secure_url}
                                                        alt={`Animal case ${index + 1}`}
                                                        className="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                                        onClick={() => window.open(image.url || image.secure_url, '_blank')}
                                                    />
                                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
                                                        <span className="text-white text-xs opacity-0 group-hover:opacity-100">Click to enlarge</span>
                                                    </div>
                                                </div>
                                            ))}
                                            {animalCase.images.length > 4 && (
                                                <div className="w-full h-24 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 text-sm">
                                                    +{animalCase.images.length - 4} more
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-3 text-sm">
                                    <p><span className="font-medium">Animal:</span> {animalCase.animalType}</p>
                                    <p><span className="font-medium">Location:</span> {animalCase.location}</p>
                                    <p><span className="font-medium">Description:</span> {animalCase.description}</p>
                                    {animalCase.symptoms && (
                                        <p><span className="font-medium">Symptoms:</span> {animalCase.symptoms}</p>
                                    )}
                                    <p><span className="font-medium">Reported by:</span> {animalCase.reportedBy}</p>
                                    <p><span className="font-medium">Contact:</span> {animalCase.contactInfo}</p>
                                    <p><span className="font-medium">Date:</span> {new Date(animalCase.createdAt).toLocaleDateString()}</p>
                                </div>

                                {animalCase.photos && animalCase.photos.length > 0 && (
                                    <div className="mt-4">
                                        <p className="font-medium text-sm mb-2">Photos:</p>
                                        <div className="flex gap-2">
                                            {animalCase.photos.map((photo, index) => (
                                                <img
                                                    key={index}
                                                    src={photo}
                                                    alt={`Case photo ${index + 1}`}
                                                    className="w-16 h-16 object-cover rounded"
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="mt-6 flex gap-2">
                                    {/* Only Vets can start/complete treatment */}
                                    {canTreatCases && animalCase.status !== 'Resolved' && (
                                        <>
                                            {animalCase.status === 'Open' && (
                                                <button
                                                    onClick={() => handleUpdateCaseStatus(animalCase._id, 'In Progress')}
                                                    className="bg-yellow-600 text-white px-3 py-1 text-sm rounded hover:bg-yellow-700 transition-colors"
                                                >
                                                    Start Treatment
                                                </button>
                                            )}
                                            {animalCase.status === 'In Progress' && (
                                                <button
                                                    onClick={() => handleUpdateCaseStatus(animalCase._id, 'Resolved')}
                                                    className="bg-green-600 text-white px-3 py-1 text-sm rounded hover:bg-green-700 transition-colors"
                                                >
                                                    Mark Resolved
                                                </button>
                                            )}
                                        </>
                                    )}

                                    {/* Only WPO can assign cases to vets */}
                                    {canAssignCases && animalCase.status === 'Open' && (
                                        <button
                                            className="bg-purple-600 text-white px-3 py-1 text-sm rounded hover:bg-purple-700 transition-colors"
                                        >
                                            Assign to Vet
                                        </button>
                                    )}

                                    <button
                                        onClick={() => setSelectedCase(animalCase)}
                                        className="bg-blue-600 text-white px-3 py-1 text-sm rounded hover:bg-blue-700 transition-colors"
                                    >
                                        View Details
                                    </button>

                                    {/* Only WPO and Admin can delete cases */}
                                    {canAssignCases && (
                                        <button
                                            onClick={() => handleDeleteCase(animalCase._id)}
                                            className="bg-red-600 text-white px-3 py-1 text-sm rounded hover:bg-red-700 transition-colors"
                                        >
                                            Delete
                                        </button>
                                    )}
                                </div>
                            </div>
                            ))
                        ) : (
                            <div className="col-span-full text-center py-12">
                                <p className="text-gray-500 text-lg">
                                    {loading ? 'Loading animal cases...' : 'No animal cases found'}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Keep the existing empty state message for when there are 0 cases */}
                    {safeCases.length === 0 && !loading && (
                        <div className="text-center py-12">
                            <p className="text-gray-500 text-lg">No animal cases reported</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Case Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold mb-4">Report Animal Case</h2>
                        <form onSubmit={handleCreateCase}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Animal Type</label>
                                    <input
                                        type="text"
                                        value={newCase.animalType}
                                        onChange={(e) => setNewCase({...newCase, animalType: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        placeholder="e.g., Elephant, Leopard, etc."
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Location</label>
                                    <input
                                        type="text"
                                        value={newCase.location}
                                        onChange={(e) => setNewCase({...newCase, location: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Description</label>
                                    <textarea
                                        value={newCase.description}
                                        onChange={(e) => setNewCase({...newCase, description: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        rows="3"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Symptoms</label>
                                    <textarea
                                        value={newCase.symptoms}
                                        onChange={(e) => setNewCase({...newCase, symptoms: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        rows="2"
                                    />
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
                                        onChange={(e) => setNewCase({...newCase, reportedBy: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Contact Information</label>
                                    <input
                                        type="text"
                                        value={newCase.contactInfo}
                                        onChange={(e) => setNewCase({...newCase, contactInfo: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        placeholder="Phone number or email"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Estimated Age</label>
                                        <input
                                            type="text"
                                            value={newCase.estimatedAge}
                                            onChange={(e) => setNewCase({...newCase, estimatedAge: e.target.value})}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                            placeholder="e.g., Adult, Juvenile"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Weight (kg)</label>
                                        <input
                                            type="text"
                                            value={newCase.weight}
                                            onChange={(e) => setNewCase({...newCase, weight: e.target.value})}
                                            className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                            placeholder="Estimated weight"
                                        />
                                    </div>
                                </div>

                                {/* Image Upload Section */}
                                <div>
                                    <label className="block text-sm font-medium mb-1">Animal Images</label>
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        onChange={handleImageSelect}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Upload multiple images for better identification and monitoring (max 10 files)
                                    </p>
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
                                                        onClick={() => {
                                                            const newPreview = newCase.previewImages.filter((_, i) => i !== index);
                                                            const newFiles = selectedImages.filter((_, i) => i !== index);
                                                            setNewCase({...newCase, previewImages: newPreview});
                                                            setSelectedImages(newFiles);
                                                        }}
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
                                    disabled={uploadingImages}
                                    className={`flex-1 ${uploadingImages ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'} text-white py-2 rounded-lg transition-colors flex items-center justify-center`}
                                >
                                    {uploadingImages ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            Uploading Images...
                                        </>
                                    ) : (
                                        'Report Case'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Case Details Modal */}
            {selectedCase && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold">Case Details</h2>
                            <button
                                onClick={() => setSelectedCase(null)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ×
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <p><span className="font-medium">Case ID:</span> #{selectedCase.caseId || selectedCase._id.slice(-6)}</p>
                                <p><span className="font-medium">Status:</span>
                                    <span className={`ml-2 px-2 py-1 rounded-full text-xs ${getStatusColor(selectedCase.status)}`}>
                                        {selectedCase.status}
                                    </span>
                                </p>
                                <p><span className="font-medium">Animal:</span> {selectedCase.animalType}</p>
                                <p><span className="font-medium">Priority:</span> {selectedCase.priority}</p>
                                <p><span className="font-medium">Location:</span> {selectedCase.location}</p>
                                <p><span className="font-medium">Date:</span> {new Date(selectedCase.createdAt).toLocaleDateString()}</p>
                            </div>
                            <div>
                                <p className="font-medium">Description:</p>
                                <p className="mt-1 text-gray-700">{selectedCase.description}</p>
                            </div>
                            {selectedCase.symptoms && (
                                <div>
                                    <p className="font-medium">Symptoms:</p>
                                    <p className="mt-1 text-gray-700">{selectedCase.symptoms}</p>
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-4">
                                <p><span className="font-medium">Reported by:</span> {selectedCase.reportedBy}</p>
                                <p><span className="font-medium">Contact:</span> {selectedCase.contactInfo}</p>
                                {selectedCase.estimatedAge && (
                                    <p><span className="font-medium">Age:</span> {selectedCase.estimatedAge}</p>
                                )}
                                {selectedCase.weight && (
                                    <p><span className="font-medium">Weight:</span> {selectedCase.weight} kg</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
};

export default AnimalCaseList;