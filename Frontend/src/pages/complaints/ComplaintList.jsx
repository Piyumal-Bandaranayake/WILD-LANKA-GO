import React, { useState, useEffect } from 'react';
import { protectedApi } from '../../services/authService';
import { useAuthContext } from '../../contexts/AuthContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/footer';

const ComplaintList = () => {
    const { backendUser, user } = useAuthContext();
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedComplaint, setSelectedComplaint] = useState(null);
    const [replyText, setReplyText] = useState('');

    const [newComplaint, setNewComplaint] = useState({
        title: '',
        description: '',
        category: 'Service',
        priority: 'Medium'
    });

    useEffect(() => {
        fetchComplaints();
    }, []);

    const fetchComplaints = async () => {
        try {
            setLoading(true);
            const response = await protectedApi.getComplaints();
            setComplaints(response.data || []);
        } catch (error) {
            console.error('Failed to fetch complaints:', error);
            setError('Failed to load complaints');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateComplaint = async (e) => {
        e.preventDefault();
        try {
            await protectedApi.createComplaint({
                ...newComplaint,
                username: user?.name || 'Anonymous',
                email: user?.email || '',
                role: backendUser?.role || 'tourist'
            });
            setShowCreateModal(false);
            setNewComplaint({
                title: '',
                description: '',
                category: 'Service',
                priority: 'Medium'
            });
            fetchComplaints();
        } catch (error) {
            console.error('Failed to create complaint:', error);
            setError('Failed to submit complaint');
        }
    };

    const handleReplyToComplaint = async (complaintId) => {
        if (!replyText.trim()) return;

        try {
            await protectedApi.replyToComplaint(complaintId, {
                reply: replyText,
                repliedBy: user?.name || 'Officer'
            });
            setReplyText('');
            setSelectedComplaint(null);
            fetchComplaints();
        } catch (error) {
            console.error('Failed to reply to complaint:', error);
            setError('Failed to send reply');
        }
    };

    const handleDeleteComplaint = async (id) => {
        if (window.confirm('Are you sure you want to delete this complaint?')) {
            try {
                await protectedApi.deleteComplaint(id);
                fetchComplaints();
            } catch (error) {
                console.error('Failed to delete complaint:', error);
                setError('Failed to delete complaint');
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

    const isTourist = backendUser?.role === 'tourist' || !backendUser?.role;
    const isDriver = backendUser?.role === 'safariDriver';
    const isGuide = backendUser?.role === 'tourGuide';
    const isWildlifeOfficer = backendUser?.role === 'wildlifeOfficer';
    const isAdmin = backendUser?.role === 'admin';

    // Tourists, Drivers, and Guides can file complaints
    const canFileComplaint = isTourist || isDriver || isGuide;
    // Only Wildlife Park Officers can reply to and manage complaints
    const canManageComplaints = isWildlifeOfficer || isAdmin;

    if (loading) {
        return (
            <div className="flex flex-col min-h-screen">
                <Navbar />
                <div className="flex-1 flex items-center justify-center pt-32">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading complaints...</p>
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
                        <h1 className="text-3xl font-bold text-gray-800">Complaints</h1>
                        {canFileComplaint && (
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                            >
                                File Complaint
                            </button>
                        )}
                    </div>

                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {complaints.map((complaint) => (
                            <div key={complaint._id} className="bg-white rounded-lg shadow-md p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-lg font-semibold">{complaint.title}</h3>
                                    <div className="flex gap-2 items-center">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(complaint.status)}`}>
                                            {complaint.status || 'Open'}
                                        </span>
                                        <div className={`w-3 h-3 rounded-full ${getPriorityColor(complaint.priority)}`} title={`${complaint.priority} Priority`}></div>
                                    </div>
                                </div>

                                <div className="space-y-3 text-sm">
                                    <p><span className="font-medium">Category:</span> {complaint.category}</p>
                                    <p><span className="font-medium">Description:</span> {complaint.description}</p>
                                    <p><span className="font-medium">Filed by:</span> {complaint.username} ({complaint.role})</p>
                                    <p><span className="font-medium">Date:</span> {new Date(complaint.createdAt).toLocaleDateString()}</p>

                                    {complaint.reply && (
                                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                                            <p className="font-medium text-sm text-gray-700">Officer Reply:</p>
                                            <p className="text-sm text-gray-600 mt-1">{complaint.reply}</p>
                                            {complaint.repliedBy && (
                                                <p className="text-xs text-gray-500 mt-2">- {complaint.repliedBy}</p>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="mt-6 flex gap-2">
                                    {/* Only Wildlife Park Officers can reply to complaints */}
                                    {canManageComplaints && !complaint.reply && (
                                        <button
                                            onClick={() => setSelectedComplaint(complaint)}
                                            className="bg-blue-600 text-white px-3 py-1 text-sm rounded hover:bg-blue-700 transition-colors"
                                        >
                                            Reply
                                        </button>
                                    )}
                                    <button
                                        onClick={() => alert(`Complaint Details:\n\nTitle: ${complaint.title}\nCategory: ${complaint.category}\nPriority: ${complaint.priority}\nDescription: ${complaint.description}\nFiled by: ${complaint.username} (${complaint.role})\nDate: ${new Date(complaint.createdAt).toLocaleString()}`)}
                                        className="bg-gray-600 text-white px-3 py-1 text-sm rounded hover:bg-gray-700 transition-colors"
                                    >
                                        View Details
                                    </button>
                                    {/* Only Wildlife Park Officers can delete complaints */}
                                    {canManageComplaints && (
                                        <button
                                            onClick={() => handleDeleteComplaint(complaint._id)}
                                            className="bg-red-600 text-white px-3 py-1 text-sm rounded hover:bg-red-700 transition-colors"
                                        >
                                            Delete
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {complaints.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-gray-500 text-lg">No complaints filed</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Complaint Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-2xl font-bold mb-4">File Complaint</h2>
                        <form onSubmit={handleCreateComplaint}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Title</label>
                                    <input
                                        type="text"
                                        value={newComplaint.title}
                                        onChange={(e) => setNewComplaint({...newComplaint, title: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Category</label>
                                    <select
                                        value={newComplaint.category}
                                        onChange={(e) => setNewComplaint({...newComplaint, category: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                    >
                                        <option value="Service">Service</option>
                                        <option value="Tours">Tours</option>
                                        <option value="Activities">Activities</option>
                                        <option value="Staff">Staff Behavior</option>
                                        <option value="Facilities">Facilities</option>
                                        <option value="Safety">Safety</option>
                                        <option value="Booking">Booking Issues</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Priority</label>
                                    <select
                                        value={newComplaint.priority}
                                        onChange={(e) => setNewComplaint({...newComplaint, priority: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                    >
                                        <option value="Low">Low</option>
                                        <option value="Medium">Medium</option>
                                        <option value="High">High</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Description</label>
                                    <textarea
                                        value={newComplaint.description}
                                        onChange={(e) => setNewComplaint({...newComplaint, description: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        rows="4"
                                        placeholder="Please describe your complaint in detail..."
                                        required
                                    />
                                </div>
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
                                    className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors"
                                >
                                    Submit
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Reply Modal */}
            {selectedComplaint && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-2xl font-bold mb-4">Reply to Complaint</h2>
                        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                            <h3 className="font-medium">{selectedComplaint.title}</h3>
                            <p className="text-sm text-gray-600 mt-1">{selectedComplaint.description}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Your Reply</label>
                            <textarea
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                rows="4"
                                placeholder="Enter your reply to this complaint..."
                                required
                            />
                        </div>
                        <div className="flex gap-4 mt-6">
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedComplaint(null);
                                    setReplyText('');
                                }}
                                className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleReplyToComplaint(selectedComplaint._id)}
                                className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors"
                            >
                                Send Reply
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
};

export default ComplaintList;