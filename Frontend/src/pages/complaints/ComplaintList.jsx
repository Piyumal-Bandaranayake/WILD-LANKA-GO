import React, { useState, useEffect } from 'react';
import { protectedApi } from '../../services/authService';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/footer';

const ComplaintList = () => {
  const { backendUser, user, loading: authLoading } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingComplaint, setEditingComplaint] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  const [newComplaint, setNewComplaint] = useState({
    message: '',
    location: '',
    email: ''
  });

  useEffect(() => {
    // Only fetch complaints when auth is ready and user is authenticated
    if (!authLoading && (backendUser || user)) {
      fetchComplaints();
    } else if (!authLoading && !backendUser && !user) {
      // If auth is loaded but no user, set loading to false
      setLoading(false);
      setError('Please log in to view complaints');
    }
  }, [authLoading, backendUser, user]);

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validateComplaint = (complaint) => {
    const errors = {};
    if (!complaint.email || complaint.email.trim() === '') {
      errors.email = 'Email address is required';
    } else if (!validateEmail(complaint.email)) {
      errors.email = 'Please enter a valid email address';
    }
    if (!complaint.message || complaint.message.trim() === '') {
      errors.message = 'Complaint message is required';
    } else if (complaint.message.trim().length < 10) {
      errors.message = 'Complaint message must be at least 10 characters long';
    } else if (complaint.message.trim().length > 1000) {
      errors.message = 'Complaint message must be less than 1000 characters';
    }
    if (complaint.location && complaint.location.trim().length > 200) {
      errors.location = 'Location must be less than 200 characters';
    }
    return errors;
  };

  const clearValidationErrors = () => setValidationErrors({});

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching complaints for user:', backendUser?.email || user?.email);
      // Use the tourist-specific endpoint to get only user's complaints
      const response = await protectedApi.getMyComplaints();
      console.log('📥 Full API response:', response);
      console.log('📥 Response data:', response.data);
      const userComplaints = response.data?.data?.data || response.data?.data || response.data || [];
      console.log('📋 User complaints:', userComplaints);
      console.log('📋 Complaints count:', userComplaints.length);
      setComplaints(Array.isArray(userComplaints) ? userComplaints : []);
    } catch (error) {
      console.error('❌ Failed to fetch complaints:', error);
      console.error('❌ Error details:', error.response?.data || error.message);
      setError('Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateComplaint = async (e) => {
    e.preventDefault();
    console.log('🔍 Form submission started');
    console.log('📝 Form data:', newComplaint);
    
    const errors = validateComplaint(newComplaint);
    console.log('✅ Validation errors:', errors);
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      console.log('❌ Validation failed, stopping submission');
      return;
    }
    
    try {
      console.log('🚀 Starting API call...');
      const complaintData = {
        username: user?.name || 'Anonymous',
        email: newComplaint.email || user?.email || '',
        role: 'Tourist',
        message: newComplaint.message.trim(),
        location: newComplaint.location?.trim() || ''
      };
      console.log('📤 Sending complaint data:', complaintData);
      
      const response = await protectedApi.createComplaint(complaintData);
      console.log('✅ Complaint created successfully:', response);
      
      setShowCreateModal(false);
      setNewComplaint({ message: '', location: '', email: '' });
      clearValidationErrors();
      fetchComplaints();
      alert('Complaint submitted successfully!');
    } catch (error) {
      console.error('❌ Failed to create complaint:', error);
      console.error('❌ Error details:', error.response?.data || error.message);
      setError('Failed to submit complaint');
    }
  };

  const handleReplyToComplaint = async (complaintId) => {
    if (!replyText.trim()) return;
    try {
      await protectedApi.addReply(complaintId, {
        officerUsername: user?.name || 'Officer',
        message: replyText
      });
      setReplyText('');
      setSelectedComplaint(null);
      fetchComplaints();
      alert('Reply sent successfully!');
    } catch (error) {
      console.error('Failed to reply to complaint:', error);
      setError('Failed to send reply');
    }
  };

  const handleDeleteComplaint = async (id) => {
    if (window.confirm('Are you sure you want to delete this complaint?')) {
      try {
        const complaint = complaints.find(c => c._id === id);
        const userEmail = user?.email || backendUser?.email || complaint?.email;
        if (!userEmail) return setError('Unable to identify user email for deletion');
        await protectedApi.deleteComplaint(id, userEmail);
        fetchComplaints();
      } catch (error) {
        console.error('Failed to delete complaint:', error);
        setError('Failed to delete complaint');
      }
    }
  };

  const handleEditComplaint = (complaint) => {
    setEditingComplaint(complaint);
    setNewComplaint({
      message: complaint.message,
      location: complaint.location || '',
      email: complaint.email || ''
    });
    setShowEditModal(true);
  };

  const handleUpdateComplaint = async (e) => {
    e.preventDefault();
    const errors = validateComplaint(newComplaint);
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    try {
      const complaintData = {
        message: newComplaint.message.trim(),
        location: newComplaint.location?.trim() || '',
        username: user?.name || backendUser?.name || 'Anonymous'
      };
      await protectedApi.updateComplaint(editingComplaint._id, complaintData);
      setShowEditModal(false);
      setEditingComplaint(null);
      setNewComplaint({ message: '', location: '', email: '' });
      clearValidationErrors();
      fetchComplaints();
      alert('Complaint updated successfully!');
    } catch (error) {
      console.error('Failed to update complaint:', error);
      setError('Failed to update complaint');
    }
  };

  const isTourist = backendUser?.role === 'tourist' || !backendUser?.role;
  const isDriver = backendUser?.role === 'safariDriver';
  const isGuide = backendUser?.role === 'tourGuide';
  const isWildlifeOfficer = backendUser?.role === 'wildlifeOfficer';
  const isAdmin = backendUser?.role === 'admin';
  const canFileComplaint = isTourist || isDriver || isGuide;
  const canManageComplaints = isWildlifeOfficer || isAdmin;
  const canEditDeleteComplaint = (c) => {
    const currentUserName = user?.name || backendUser?.name || backendUser?.firstName + ' ' + backendUser?.lastName;
    const currentUserEmail = user?.email || backendUser?.email;
    
    console.log('🔍 Checking edit/delete permissions for complaint:', c._id);
    console.log('🔍 Current user name:', currentUserName);
    console.log('🔍 Current user email:', currentUserEmail);
    console.log('🔍 Complaint username:', c.username);
    console.log('🔍 Complaint email:', c.email);
    console.log('🔍 Is admin/wildlife officer:', isAdmin || isWildlifeOfficer);
    console.log('🔍 Is tourist/driver/guide:', isTourist || isDriver || isGuide);
    console.log('🔍 Username match:', c.username === currentUserName);
    console.log('🔍 Email match:', c.email === currentUserEmail);
    
    const canEdit = isAdmin || isWildlifeOfficer ||
      ((isTourist || isDriver || isGuide) &&
        c.username === currentUserName &&
        c.email === currentUserEmail);
    
    console.log('🔍 Can edit/delete:', canEdit);
    return canEdit;
  };

  if (authLoading || loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-1 flex items-center justify-center pt-32">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">
              {authLoading ? 'Loading authentication...' : 'Loading complaints...'}
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex-1 pt-32 pb-16 bg-gradient-to-br from-red-50 via-white to-green-50 min-h-screen">
        <div className="container mx-auto px-4">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-red-500 to-green-500 rounded-full mb-4 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-red-600 to-green-600 bg-clip-text text-transparent mb-4">
              File a Complaint
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
              Report any issue or concern to us. Our team will review and respond promptly.
            </p>
            {canFileComplaint && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-red-500 to-green-500 text-white px-8 py-3 rounded-xl hover:from-red-600 hover:to-green-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Submit Complaint
              </button>
            )}
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {complaints.map((c) => (
              <div key={c._id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-red-100 overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">Complaint #{c._id.slice(-6)}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium shadow-sm ${c.replies?.length > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {c.replies?.length > 0 ? 'Replied' : 'Open'}
                    </span>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <p className="text-gray-700 leading-relaxed">{c.message}</p>
                    {c.location && (
                      <p className="text-sm text-gray-600 mt-2"><span className="font-medium">Location:</span> {c.location}</p>
                    )}
                    <p className="text-sm text-gray-600 mt-2"><span className="font-medium">Filed by:</span> {c.username} ({c.role === 'tourist' ? 'Tourist' : c.role})</p>
                    <p className="text-sm text-gray-600 mt-1"><span className="font-medium">Email:</span> {c.email}</p>
                    <p className="text-sm text-gray-500 mt-1">{new Date(c.date).toLocaleDateString()}</p>
                  </div>

                  {c.replies && c.replies.length > 0 && (
                    <div className="bg-gradient-to-r from-green-50 to-green-100 p-3 rounded-lg mb-4">
                      <p className="font-semibold text-green-700 mb-2">Officer Replies:</p>
                      {c.replies.map((r, i) => (
                        <div key={i} className="border-l-4 border-green-400 pl-3 mb-2">
                          <p className="text-gray-700">{r.message}</p>
                          <p className="text-xs text-gray-500">- {r.officerUsername} ({new Date(r.date).toLocaleDateString()})</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2 flex-wrap">
                    {canManageComplaints && (
                      <button
                        onClick={() => setSelectedComplaint(c)}
                        className="bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1.5 text-sm rounded-lg hover:from-green-600 hover:to-green-700 transition-all"
                      >
                        Reply
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedComplaint(c)}
                      className="bg-gray-600 text-white px-4 py-2 text-sm rounded-lg hover:bg-gray-700 transition-all"
                    >
                      View
                    </button>
                    {canEditDeleteComplaint(c) && (
                      <>
                        <button
                          onClick={() => handleEditComplaint(c)}
                          className="bg-orange-500 text-white px-4 py-2 text-sm rounded-lg hover:bg-orange-600 transition-all"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteComplaint(c._id)}
                          className="bg-red-500 text-white px-4 py-2 text-sm rounded-lg hover:bg-red-600 transition-all"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {complaints.length === 0 && (
            <div className="text-center py-12 bg-gradient-to-br from-red-50 to-green-50 rounded-xl border-2 border-dashed border-red-200">
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No complaints yet</h3>
              <p className="text-gray-500 mb-6">Submit your first complaint now</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-red-500 to-green-500 text-white px-6 py-3 rounded-xl hover:from-red-600 hover:to-green-600 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Submit Complaint
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Create Complaint Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-red-200">
            <div className="bg-gradient-to-r from-red-500 to-green-500 p-6 rounded-t-2xl">
              <h2 className="text-2xl font-bold text-white">File a Complaint</h2>
              <p className="text-white text-opacity-80">Describe your concern</p>
            </div>
            <div className="p-6">
              <form onSubmit={handleCreateComplaint}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Email *</label>
                    <input
                      type="email"
                      value={newComplaint.email}
                      onChange={(e) => setNewComplaint({ ...newComplaint, email: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2 border-gray-300"
                      placeholder="your.email@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Location</label>
                    <input
                      type="text"
                      value={newComplaint.location}
                      onChange={(e) => setNewComplaint({ ...newComplaint, location: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2 border-gray-300"
                      placeholder="Location (optional)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Complaint *</label>
                    <textarea
                      value={newComplaint.message}
                      onChange={(e) => setNewComplaint({ ...newComplaint, message: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2 border-gray-300"
                      rows="4"
                      placeholder="Describe your issue..."
                    />
                  </div>
                </div>
                <div className="flex gap-4 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    onClick={() => console.log('🔘 Submit button clicked')}
                    className="flex-1 bg-gradient-to-r from-red-500 to-green-500 text-white py-2 rounded-lg hover:from-red-600 hover:to-green-600"
                  >
                    Submit
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Complaint Modal */}
      {selectedComplaint && !canManageComplaints && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Complaint Details</h2>
              <button
                onClick={() => setSelectedComplaint(null)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-2">Complaint #{selectedComplaint._id.slice(-6)}</h3>
                <p className="text-gray-700 leading-relaxed mb-3">{selectedComplaint.message}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Location:</span>
                    <p className="text-gray-800">{selectedComplaint.location || 'Not specified'}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Status:</span>
                    <p className="text-gray-800 capitalize">{selectedComplaint.status}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Filed by:</span>
                    <p className="text-gray-800">{selectedComplaint.username} ({selectedComplaint.role === 'tourist' ? 'Tourist' : selectedComplaint.role})</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Email:</span>
                    <p className="text-gray-800">{selectedComplaint.email}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Date:</span>
                    <p className="text-gray-800">{new Date(selectedComplaint.date).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {selectedComplaint.replies && selectedComplaint.replies.length > 0 && (
                <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4">
                  <h4 className="font-semibold text-green-700 mb-3">Officer Replies ({selectedComplaint.replies.length})</h4>
                  {selectedComplaint.replies.map((reply, index) => (
                    <div key={index} className="bg-white rounded-lg p-3 mb-3 border-l-4 border-green-400">
                      <p className="text-gray-700 mb-2">{reply.message}</p>
                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <span>By: {reply.officerUsername}</span>
                        <span>{new Date(reply.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setSelectedComplaint(null)}
                className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reply Modal */}
      {selectedComplaint && canManageComplaints && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Reply to Complaint</h2>
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="font-medium">{selectedComplaint.message}</p>
            </div>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4"
              rows="4"
              placeholder="Enter your reply..."
            />
            <div className="flex gap-4">
              <button
                onClick={() => { setSelectedComplaint(null); setReplyText(''); }}
                className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReplyToComplaint(selectedComplaint._id)}
                className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white py-2 rounded-lg hover:from-green-600 hover:to-green-700"
              >
                Send Reply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Complaint Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-green-200">
            <div className="bg-gradient-to-r from-green-500 to-red-500 p-6 rounded-t-2xl">
              <h2 className="text-2xl font-bold text-white">Edit Complaint</h2>
            </div>
            <div className="p-6">
              <form onSubmit={handleUpdateComplaint}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Email *</label>
                    <input
                      type="email"
                      value={newComplaint.email}
                      onChange={(e) => setNewComplaint({ ...newComplaint, email: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2 border-gray-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Location</label>
                    <input
                      type="text"
                      value={newComplaint.location}
                      onChange={(e) => setNewComplaint({ ...newComplaint, location: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2 border-gray-300"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Complaint</label>
                    <textarea
                      value={newComplaint.message}
                      onChange={(e) => setNewComplaint({ ...newComplaint, message: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2 border-gray-300"
                      rows="4"
                    />
                  </div>
                </div>
                <div className="flex gap-4 mt-6">
                  <button
                    type="button"
                    onClick={() => { setShowEditModal(false); setEditingComplaint(null); }}
                    className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-yellow-500 to-green-500 text-white py-2 rounded-lg hover:from-yellow-600 hover:to-green-600"
                  >
                    Update
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
};

export default ComplaintList;
