import React, { useState, useEffect, useMemo } from 'react';
import { protectedApi } from '../../services/authService';
import { useAuthContext } from '../../contexts/AuthContext';
import RoleGuard from '../../components/RoleGuard';
import RoleBasedFeature from '../../components/RoleBasedFeature';
import Navbar from '../../components/Navbar';
import Footer from '../../components/footer';

/**
 * AdminDashboard – single-file version, full functional + restyled
 * - Left Sidebar (icons + labels with active highlight)
 * - Top greeting banner with search + "Add New"
 * - Stat cards row
 * - Center panels: Users / Applications / Activities / Events / Donations (tabs)
 * - Right widgets: Mini weekly calendar + New Applicants + Quick Actions
 * - All existing CRUD & modals preserved
 */

const AdminDashboard = () => {
  const { backendUser, user } = useAuthContext();

  // Core state
  const [users, setUsers] = useState([]);
  const [applications, setApplications] = useState([]);
  const [activities, setActivities] = useState([]);
  const [events, setEvents] = useState([]);
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // UI state
  const [activeTab, setActiveTab] = useState('users'); // users | applications | activities | events | donations
  const [sidebarActive, setSidebarActive] = useState('dashboard'); // for left sidebar visual only
  const [search, setSearch] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);

  // Selections
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Forms
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'tourGuide',
    password: '',
    phone: '',
    specialization: '',
    experience: ''
  });

  const [newActivity, setNewActivity] = useState({
    name: '',
    description: '',
    price: '',
    duration: '',
    maxParticipants: '',
    location: '',
    category: 'wildlife',
    availableSlots: '',
    requirements: ''
  });

  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    maxAttendees: '',
    category: 'educational',
    registrationFee: '',
    requirements: ''
  });

  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingApplications: 0,
    activeActivities: 0,
    totalDonations: 0,
    totalEvents: 0,
    recentBookings: 0,
    monthlyRevenue: 0,
    systemHealth: 'Good'
  });

  useEffect(() => {
    if (backendUser?.role === 'admin') fetchAllData();
  }, [backendUser]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [usersRes, appsRes, activitiesRes, eventsRes, donationsRes] = await Promise.all([
        protectedApi.getAllUsers(),
        protectedApi.getApplications(),
        protectedApi.getActivities(),
        protectedApi.getEvents(),
        protectedApi.getDonations()
      ]);

      const usersData = usersRes.data || [];
      const appsData = appsRes.data || [];
      const activitiesData = activitiesRes.data || [];
      const eventsData = eventsRes.data || [];
      const donationsData = donationsRes.data || [];

      setUsers(usersData);
      setApplications(appsData);
      setActivities(activitiesData);
      setEvents(eventsData);
      setDonations(donationsData);

      setStats({
        totalUsers: usersData.length,
        pendingApplications: appsData.filter(a => a.status === 'pending').length,
        activeActivities: activitiesData.length,
        totalDonations: donationsData.length,
        totalEvents: eventsData.length,
        recentBookings: 45, // placeholder until you wire bookings
        monthlyRevenue: donationsData.reduce((sum, d) => sum + (Number(d.amount) || 0), 0),
        systemHealth: 'Good'
      });
    } catch (err) {
      console.error('Failed to fetch admin data:', err);
      setError('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  // ===== Helpers =====
  const getRoleColor = (role) => {
    const colors = {
      admin: 'bg-purple-100 text-purple-800',
      wildlifeOfficer: 'bg-green-100 text-green-800',
      emergencyOfficer: 'bg-red-100 text-red-800',
      callOperator: 'bg-blue-100 text-blue-800',
      tourGuide: 'bg-yellow-100 text-yellow-800',
      safariDriver: 'bg-orange-100 text-orange-800',
      vet: 'bg-pink-100 text-pink-800',
      tourist: 'bg-gray-100 text-gray-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const currency = (n) => `\$${Number(n || 0).toLocaleString()}`;

  const avatarOf = (obj) => {
    const src = obj?.avatar || obj?.photo || obj?.profileImageUrl;
    if (src) return <img src={src} alt={obj?.name || obj?.fullName} className="w-10 h-10 rounded-full object-cover" />;
    const name = (obj?.name || obj?.fullName || 'U N').trim();
    const initials = name.split(' ').slice(0, 2).map(s => s[0]?.toUpperCase()).join('') || 'U';
    return (
      <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold">
        {initials}
      </div>
    );
  };

  // ===== CRUD Handlers =====
  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await protectedApi.createUser({ ...newUser, createdBy: user?.name || 'Admin' });
      setShowCreateModal(false);
      setNewUser({ name: '', email: '', role: 'tourGuide', password: '', phone: '', specialization: '', experience: '' });
      fetchAllData();
      alert('User created successfully! Login credentials have been sent via email.');
    } catch (err) {
      console.error('Failed to create user:', err);
      setError('Failed to create user');
    }
  };

  const handleUpdateUserRole = async (userId, newRole) => {
    try {
      await protectedApi.updateUserRole(userId, newRole);
      fetchAllData();
      setShowRoleModal(false);
      setSelectedUser(null);
    } catch (err) {
      console.error('Failed to update user role:', err);
      setError('Failed to update user role');
    }
  };

  const handleDeactivateUser = async (userId) => {
    if (!window.confirm('Are you sure you want to deactivate this user?')) return;
    try {
      await protectedApi.deactivateUser(userId);
      fetchAllData();
    } catch (err) {
      console.error('Failed to deactivate user:', err);
      setError('Failed to deactivate user');
    }
  };

  const handleApproveApplication = async (appId) => {
    const application = applications.find(a => a._id === appId);
    if (!application) return;

    try {
      await protectedApi.updateApplicationStatus(appId, 'approved');
      await protectedApi.createUser({
        name: application.fullName,
        email: application.email,
        role: application.vehicleType ? 'safariDriver' : 'tourGuide',
        phone: application.phone,
        experience: application.experience,
        skills: application.skills,
        languages: application.languages,
        createdBy: user?.name || 'Admin'
      });

      fetchAllData();
      alert('Application approved and user account created! Login credentials sent via email.');
    } catch (err) {
      console.error('Failed to approve application:', err);
      setError('Failed to approve application');
    }
  };

  const handleRejectApplication = async (appId) => {
    try {
      await protectedApi.updateApplicationStatus(appId, 'rejected');
      fetchAllData();
    } catch (err) {
      console.error('Failed to reject application:', err);
      setError('Failed to reject application');
    }
  };

  const handleCreateActivity = async (e) => {
    e.preventDefault();
    try {
      if (selectedActivity) {
        await protectedApi.updateActivity(selectedActivity._id, {
          ...newActivity,
          price: parseFloat(newActivity.price),
          maxParticipants: parseInt(newActivity.maxParticipants),
          availableSlots: parseInt(newActivity.availableSlots)
        });
      } else {
        await protectedApi.createActivity({
          ...newActivity,
          price: parseFloat(newActivity.price),
          maxParticipants: parseInt(newActivity.maxParticipants),
          availableSlots: parseInt(newActivity.availableSlots),
          createdBy: user?.name || 'Admin'
        });
      }
      setShowActivityModal(false);
      setSelectedActivity(null);
      setNewActivity({
        name: '',
        description: '',
        price: '',
        duration: '',
        maxParticipants: '',
        location: '',
        category: 'wildlife',
        availableSlots: '',
        requirements: ''
      });
      fetchAllData();
      alert(`Activity ${selectedActivity ? 'updated' : 'created'} successfully!`);
    } catch (err) {
      console.error('Failed to save activity:', err);
      setError('Failed to save activity');
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    try {
      if (selectedEvent) {
        await protectedApi.updateEvent(selectedEvent._id, {
          ...newEvent,
          maxAttendees: parseInt(newEvent.maxAttendees),
          registrationFee: parseFloat(newEvent.registrationFee) || 0
        });
      } else {
        await protectedApi.createEvent({
          ...newEvent,
          maxAttendees: parseInt(newEvent.maxAttendees),
          registrationFee: parseFloat(newEvent.registrationFee) || 0,
          createdBy: user?.name || 'Admin'
        });
      }
      setShowEventModal(false);
      setSelectedEvent(null);
      setNewEvent({
        title: '',
        description: '',
        date: '',
        time: '',
        location: '',
        maxAttendees: '',
        category: 'educational',
        registrationFee: '',
        requirements: ''
      });
      fetchAllData();
      alert(`Event ${selectedEvent ? 'updated' : 'created'} successfully!`);
    } catch (err) {
      console.error('Failed to save event:', err);
      setError('Failed to save event');
    }
  };

  const handleDeleteActivity = async (activityId) => {
    if (!window.confirm('Are you sure you want to delete this activity?')) return;
    try {
      await protectedApi.deleteActivity(activityId);
      fetchAllData();
    } catch (err) {
      console.error('Failed to delete activity:', err);
      setError('Failed to delete activity');
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    try {
      await protectedApi.deleteEvent(eventId);
      fetchAllData();
    } catch (err) {
      console.error('Failed to delete event:', err);
      setError('Failed to delete event');
    }
  };

  const handleEditActivity = (activity) => {
    setSelectedActivity(activity);
    setNewActivity({
      name: activity.name,
      description: activity.description,
      price: activity.price?.toString() || '',
      duration: activity.duration || '',
      maxParticipants: activity.maxParticipants?.toString() || '',
      location: activity.location || '',
      category: activity.category || 'wildlife',
      availableSlots: activity.availableSlots?.toString() || '',
      requirements: activity.requirements || ''
    });
    setShowActivityModal(true);
  };

  const handleEditEvent = (event) => {
    setSelectedEvent(event);
    setNewEvent({
      title: event.title || '',
      description: event.description || '',
      date: event.date ? new Date(event.date).toISOString().split('T')[0] : '',
      time: event.time || '',
      location: event.location || '',
      maxAttendees: event.maxAttendees?.toString() || '',
      category: event.category || 'educational',
      registrationFee: (event.registrationFee || 0).toString(),
      requirements: event.requirements || ''
    });
    setShowEventModal(true);
  };

  // ===== Derived lists for right panel =====
  const pendingApplicants = useMemo(
    () => (applications || []).filter(a => a.status === 'pending').slice(0, 6),
    [applications]
  );

  const approvedRecent = useMemo(
    () => (applications || [])
      .filter(a => a.status === 'approved')
      .slice(-6)
      .reverse(),
    [applications]
  );

  // ===== Calendar (this week mini) =====
  const week = useMemo(() => {
    const base = new Date();
    const day = base.getDay(); // 0 Sun - 6 Sat
    const mondayOffset = ((day + 6) % 7); // days since Monday
    const monday = new Date(base);
    monday.setDate(base.getDate() - mondayOffset);
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d;
    });
  }, []);

  // Role-based access control is handled by RoleGuard wrapper

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-1 flex items-center justify-center pt-32">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <RoleGuard requiredRole="admin">
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
                  <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">H</div>
                  <div className="font-semibold">Hireism</div>
                </div>

                {[
                  { key: 'dashboard', label: 'Dashboard', icon: (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0h6" />
                      </svg>
                  )},
                  { key: 'users', label: 'Users', icon: (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-1a6 6 0 00-9-5.197M9 20H4v-1a6 6 0 019-5.197M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                  )},
                  { key: 'applications', label: 'Applications', icon: (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      </svg>
                  )},
                  { key: 'activities', label: 'Activities', icon: (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                  )},
                  { key: 'events', label: 'Events', icon: (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                  )},
                  { key: 'donations', label: 'Donations', icon: (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636 10.682 6.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                  )}
                ].map(item => (
                  <button
                    key={item.key}
                    onClick={() => { setSidebarActive(item.key); if (['users','applications','activities','events','donations'].includes(item.key)) setActiveTab(item.key); }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl mb-1 transition
                      ${sidebarActive === item.key ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    <span className={`p-2 rounded-lg ${sidebarActive === item.key ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500'}`}>
                      {item.icon}
                    </span>
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
                ))}

                <div className="mt-4 border-t pt-3">
                  <RoleBasedFeature requiredRole="admin">
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-3 py-2 text-sm font-semibold"
                    >
                      Create User
                    </button>
                  </RoleBasedFeature>
                </div>
              </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className="col-span-12 md:col-span-7">
              {/* Top search + greeting banner */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="relative flex-1">
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search something..."
                      className="w-full bg-white rounded-xl pl-10 pr-4 py-2.5 shadow-sm border border-gray-200 focus:outline-none"
                    />
                    <svg className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M16 10.5A5.5 5.5 0 105.5 16 5.5 5.5 0 0016 10.5z" />
                    </svg>
                  </div>
                  <button
                    onClick={() => setShowEventModal(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-4 py-2.5 shadow-sm"
                  >
                    Add New
                  </button>
                </div>

                <div className="bg-indigo-600 text-white rounded-2xl p-5 flex items-center justify-between shadow-sm">
                  <div>
                    <h2 className="text-lg md:text-xl font-semibold">
                      {`Good ${new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}, ${backendUser?.name?.split(' ')[0] || 'Admin'}`}
                    </h2>
                    <p className="text-sm opacity-90 mt-1">
                      You have {stats.pendingApplications} new applications. It’s a lot of work for today!
                    </p>
                    <button
                      onClick={() => { setActiveTab('applications'); setSidebarActive('applications'); }}
                      className="mt-3 bg-white/20 hover:bg-white/30 text-white rounded-lg px-3 py-1.5 text-sm"
                    >
                      Review it
                    </button>
                  </div>
                  <div className="hidden md:block">
                    {/* simple illustration block */}
                    <div className="w-28 h-20 rounded-xl bg-white/10 backdrop-blur-sm" />
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <StatCard title="Total Users" value={stats.totalUsers} color="blue" iconPath="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" />
                <StatCard title="Pending Apps" value={stats.pendingApplications} color="yellow" iconPath="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2" />
                <StatCard title="Activities" value={stats.activeActivities} color="green" iconPath="M13 10V3L4 14h7v7l9-11h-7z" />
                <StatCard title="Revenue" value={currency(stats.monthlyRevenue)} color="purple" iconPath="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2" />
              </div>

              {/* Tab buttons (for center area) */}
              <div className="flex flex-wrap gap-2 mb-4">
                {[
                  { k: 'users', t: 'User Management' },
                  { k: 'applications', t: 'Staff Applications' },
                  { k: 'activities', t: 'Activity Management' },
                  { k: 'events', t: 'Event Management' },
                  { k: 'donations', t: 'Donation Management' }
                ].map(({ k, t }) => (
                  <button
                    key={k}
                    onClick={() => { setActiveTab(k); setSidebarActive(k); }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition
                    ${activeTab === k ? 'bg-green-600 text-white' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* CENTER PANELS (match your existing functionality, restyled) */}
              <div className="space-y-6">
                {/* USERS */}
                {activeTab === 'users' && (
                  <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-800">System Users</h3>
                      <button onClick={() => setShowCreateModal(true)} className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">+ Create</button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-gray-50">
                          <tr>
                            {['Name', 'Email', 'Role', 'Status', 'Actions'].map(h => (
                              <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                          {users
                            .filter(u => (u?.name || '').toLowerCase().includes(search.toLowerCase()) || (u?.email || '').toLowerCase().includes(search.toLowerCase()))
                            .map(u => (
                            <tr key={u._id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-3">
                                  {avatarOf(u)}
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">{u.name}</div>
                                    <div className="text-xs text-gray-500">{u.phone}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{u.email}</td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${getRoleColor(u.role)}`}>{u.role}</span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${u.isActive !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                  {u.isActive !== false ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                                <RoleBasedFeature requiredRole="admin">
                                  <button
                                    onClick={() => { setSelectedUser(u); setShowRoleModal(true); }}
                                    className="text-blue-600 hover:text-blue-800"
                                  >
                                    Change Role
                                  </button>
                                </RoleBasedFeature>
                                <RoleBasedFeature 
                                  requiredRole="admin"
                                  fallback={
                                    <span className="text-gray-400 text-sm">No permissions</span>
                                  }
                                  hideIfNoAccess={false}
                                >
                                  {u.role !== 'admin' && (
                                    <button
                                      onClick={() => handleDeactivateUser(u._id)}
                                      className="text-red-600 hover:text-red-800"
                                    >
                                      Deactivate
                                    </button>
                                  )}
                                </RoleBasedFeature>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* APPLICATIONS */}
                {activeTab === 'applications' && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {applications.map(app => (
                      <div key={app._id} className="bg-white rounded-2xl shadow-sm p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            {avatarOf({ ...app, name: app.fullName })}
                            <div>
                              <h4 className="font-semibold">{app.fullName}</h4>
                              <div className="text-xs text-gray-500">{app.email}</div>
                            </div>
                          </div>
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-medium
                            ${app.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              app.status === 'approved' ? 'bg-green-100 text-green-800' :
                              'bg-red-100 text-red-800'}`}
                          >
                            {app.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-sm mt-4">
                          <Item label="Phone" value={app.phone} />
                          <Item label="Position" value={app.vehicleType ? 'Safari Driver' : 'Tour Guide'} />
                          <Item label="Experience" value={app.experience} />
                          <Item label="Languages" value={app.languages} />
                          {app.vehicleType && <Item label="Vehicle Type" value={app.vehicleType} />}
                          {app.vehicleType && <Item label="License" value={app.licenseNumber} />}
                          <Item label="Applied" value={app.applicationDate ? new Date(app.applicationDate).toLocaleDateString() : '-'} />
                        </div>

                        {app.status === 'pending' && (
                          <div className="mt-5 flex gap-2">
                            <button
                              onClick={() => handleApproveApplication(app._id)}
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-lg px-4 py-2"
                            >
                              Approve & Create Account
                            </button>
                            <button
                              onClick={() => handleRejectApplication(app._id)}
                              className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-lg px-4 py-2"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    ))}

                    {applications.length === 0 && (
                      <div className="col-span-2 text-center py-12 bg-white rounded-2xl shadow-sm">
                        <p className="text-gray-500 text-lg">No applications submitted</p>
                      </div>
                    )}
                  </div>
                )}

                {/* ACTIVITIES */}
                {activeTab === 'activities' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-800">Activity Management</h3>
                      <button
                        onClick={() => {
                          setSelectedActivity(null);
                          setNewActivity({ name: '', description: '', price: '', duration: '', maxParticipants: '', location: '', category: 'wildlife', availableSlots: '', requirements: '' });
                          setShowActivityModal(true);
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white rounded-lg px-4 py-2"
                      >
                        Create New Activity
                      </button>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100">
                          <thead className="bg-gray-50">
                            <tr>
                              {['Activity', 'Category', 'Price', 'Slots', 'Location', 'Actions'].map(h => (
                                <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-100">
                            {activities
                              .filter(a => (a?.name || '').toLowerCase().includes(search.toLowerCase()))
                              .map(a => (
                              <tr key={a._id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                  <div className="text-sm font-medium text-gray-900">{a.name}</div>
                                  <div className="text-xs text-gray-500">{a.duration}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 capitalize">{a.category}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{currency(a.price)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{a.availableSlots}/{a.maxParticipants}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{a.location}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                                  <button onClick={() => handleEditActivity(a)} className="text-blue-600 hover:text-blue-800">Edit</button>
                                  <button onClick={() => handleDeleteActivity(a._id)} className="text-red-600 hover:text-red-800">Delete</button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* EVENTS */}
                {activeTab === 'events' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-800">Event Management</h3>
                      <button
                        onClick={() => {
                          setSelectedEvent(null);
                          setNewEvent({ title: '', description: '', date: '', time: '', location: '', maxAttendees: '', category: 'educational', registrationFee: '', requirements: '' });
                          setShowEventModal(true);
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white rounded-lg px-4 py-2"
                      >
                        Create New Event
                      </button>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100">
                          <thead className="bg-gray-50">
                            <tr>
                              {['Event', 'Date & Time', 'Category', 'Fee', 'Attendees', 'Actions'].map(h => (
                                <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-100">
                            {events
                              .filter(e => (e?.title || '').toLowerCase().includes(search.toLowerCase()))
                              .map(ev => (
                              <tr key={ev._id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                  <div className="text-sm font-medium text-gray-900">{ev.title}</div>
                                  <div className="text-xs text-gray-500">{ev.location}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                  {ev.date ? new Date(ev.date).toLocaleDateString() : '-'}<br />{ev.time || '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 capitalize">{ev.category}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{currency(ev.registrationFee || 0)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{(ev.registrations?.length || 0)}/{ev.maxAttendees}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                                  <button onClick={() => handleEditEvent(ev)} className="text-blue-600 hover:text-blue-800">Edit</button>
                                  <button onClick={() => handleDeleteEvent(ev._id)} className="text-red-600 hover:text-red-800">Delete</button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* DONATIONS */}
                {activeTab === 'donations' && (
                  <div className="space-y-4">
                    <div className="bg-white rounded-2xl shadow-sm p-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Donation Overview</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <KPI label="Total Donations" value={currency(stats.monthlyRevenue)} accent="text-green-600" />
                        <KPI label="Number of Donors" value={donations.length} accent="text-blue-600" />
                        <KPI label="Average Donation" value={currency(donations.length ? Math.round(stats.monthlyRevenue / donations.length) : 0)} accent="text-purple-600" />
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                      <div className="px-6 py-4 border-b border-gray-100">
                        <h4 className="text-md font-semibold text-gray-800">Recent Donations</h4>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100">
                          <thead className="bg-gray-50">
                            <tr>
                              {['Donor', 'Amount', 'Purpose', 'Date', 'Status'].map(h => (
                                <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-100">
                            {donations.map(d => (
                              <tr key={d._id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm font-medium text-gray-900">{d.donorName}</div>
                                  <div className="text-xs text-gray-500">{d.email}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{currency(d.amount)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{d.purpose || 'General Fund'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{new Date(d.createdAt || d.date).toLocaleDateString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className="inline-flex px-2.5 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Completed</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
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
                    {avatarOf(backendUser || user)}
                    <div>
                      <div className="font-semibold text-gray-800">{backendUser?.name || user?.displayName || 'Admin'}</div>
                      <div className="text-xs text-gray-500">View profile</div>
                    </div>
                  </div>
                </div>

                {/* Calendar */}
                <div className="bg-white rounded-2xl shadow-sm p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-800">Schedule Calendar</h4>
                    <div className="text-xs text-gray-400">{new Date().toLocaleString('default', { month: 'short', year: 'numeric' })}</div>
                </div>
                  <div className="grid grid-cols-7 gap-2">
                    {week.map((d, idx) => {
                      const isToday = new Date().toDateString() === d.toDateString();
                      return (
                        <div key={idx} className={`rounded-xl text-center py-2 ${isToday ? 'bg-indigo-600 text-white' : 'bg-gray-50 text-gray-700'}`}>
                          <div className="text-[10px] uppercase">{d.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                          <div className="text-sm font-semibold">{d.getDate()}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* New Applicants */}
                <div className="bg-white rounded-2xl shadow-sm p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-800">New Applicants</h4>
                    <button
                      onClick={() => { setActiveTab('applications'); setSidebarActive('applications'); }}
                      className="text-xs text-indigo-600 hover:underline"
                    >
                      View All
                    </button>
                  </div>

                  <div className="space-y-3">
                    {pendingApplicants.map(a => (
                      <div key={a._id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {avatarOf({ ...a, name: a.fullName })}
                          <div>
                            <div className="text-sm font-medium text-gray-900">{a.fullName}</div>
                            <div className="text-xs text-gray-500">Applied for {a.vehicleType ? 'Safari Driver' : 'Tour Guide'}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleApproveApplication(a._id)}
                          className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-lg hover:bg-green-200"
                        >
                          Approve
                        </button>
                      </div>
                    ))}

                    {pendingApplicants.length === 0 && (
                      <div className="text-sm text-gray-500">No new applicants</div>
                    )}
                  </div>
                </div>

                {/* Ready For Training / Quick Actions */}
                <div className="bg-white rounded-2xl shadow-sm p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-800">Ready For Training</h4>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {approvedRecent.map(a => (
                      <div key={a._id} className="text-center">
                        <div className="mx-auto mb-1">{avatarOf({ ...a, name: a.fullName })}</div>
                        <div className="text-[11px] font-medium line-clamp-1">{a.fullName}</div>
                        <button className="mt-1 text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">Start Training</button>
                      </div>
                    ))}
                    {approvedRecent.length === 0 && <div className="text-sm text-gray-500 col-span-3">No approved applicants yet</div>}
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>

      {/* ===== Modals ===== */}

      {/* Create User Modal */}
      {showCreateModal && (
        <Modal onClose={() => setShowCreateModal(false)} title="Create User Account" size="md">
          <form onSubmit={handleCreateUser} className="space-y-4">
            <Field label="Full Name">
              <input type="text" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} className="Input" required />
            </Field>
            <Field label="Email">
              <input type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} className="Input" required />
            </Field>
            <Field label="Role">
              <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })} className="Input">
                <option value="tourGuide">Tour Guide</option>
                <option value="safariDriver">Safari Driver</option>
                <option value="wildlifeOfficer">Wildlife Park Officer</option>
                <option value="emergencyOfficer">Emergency Officer</option>
                <option value="callOperator">Call Operator</option>
                <option value="vet">Veterinarian</option>
                <option value="admin">Admin</option>
              </select>
            </Field>
            <Field label="Phone">
              <input type="tel" value={newUser.phone} onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })} className="Input" />
            </Field>
            <Field label="Temporary Password">
              <input type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} className="Input" required placeholder="Will be sent via email" />
            </Field>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowCreateModal(false)} className="Btn secondary">Cancel</button>
              <button type="submit" className="Btn primary">Create Account</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Create/Edit Activity Modal */}
      {showActivityModal && (
        <Modal onClose={() => setShowActivityModal(false)} title={selectedActivity ? 'Edit Activity' : 'Create New Activity'} size="lg">
          <form onSubmit={handleCreateActivity} className="space-y-4">
            <Field label="Activity Name"><input className="Input" value={newActivity.name} onChange={(e) => setNewActivity({ ...newActivity, name: e.target.value })} required /></Field>
            <Field label="Description"><textarea className="Input" rows={3} value={newActivity.description} onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })} required /></Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Price ($)"><input type="number" className="Input" value={newActivity.price} onChange={(e) => setNewActivity({ ...newActivity, price: e.target.value })} required /></Field>
              <Field label="Duration"><input className="Input" placeholder="e.g., 2 hours" value={newActivity.duration} onChange={(e) => setNewActivity({ ...newActivity, duration: e.target.value })} required /></Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Max Participants"><input type="number" className="Input" value={newActivity.maxParticipants} onChange={(e) => setNewActivity({ ...newActivity, maxParticipants: e.target.value })} required /></Field>
              <Field label="Available Slots"><input type="number" className="Input" value={newActivity.availableSlots} onChange={(e) => setNewActivity({ ...newActivity, availableSlots: e.target.value })} required /></Field>
            </div>
            <Field label="Location"><input className="Input" value={newActivity.location} onChange={(e) => setNewActivity({ ...newActivity, location: e.target.value })} required /></Field>
            <Field label="Category">
              <select className="Input" value={newActivity.category} onChange={(e) => setNewActivity({ ...newActivity, category: e.target.value })}>
                <option value="wildlife">Wildlife</option>
                <option value="adventure">Adventure</option>
                <option value="cultural">Cultural</option>
                <option value="educational">Educational</option>
                <option value="conservation">Conservation</option>
              </select>
            </Field>
            <Field label="Requirements (Optional)"><textarea rows={2} className="Input" value={newActivity.requirements} onChange={(e) => setNewActivity({ ...newActivity, requirements: e.target.value })} /></Field>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowActivityModal(false)} className="Btn secondary">Cancel</button>
              <button type="submit" className="Btn primary">{selectedActivity ? 'Update' : 'Create'} Activity</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Create/Edit Event Modal */}
      {showEventModal && (
        <Modal onClose={() => setShowEventModal(false)} title={selectedEvent ? 'Edit Event' : 'Create New Event'} size="lg">
          <form onSubmit={handleCreateEvent} className="space-y-4">
            <Field label="Event Title"><input className="Input" value={newEvent.title} onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })} required /></Field>
            <Field label="Description"><textarea rows={3} className="Input" value={newEvent.description} onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })} required /></Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Date"><input type="date" className="Input" value={newEvent.date} onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })} required /></Field>
              <Field label="Time"><input type="time" className="Input" value={newEvent.time} onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })} required /></Field>
            </div>
            <Field label="Location"><input className="Input" value={newEvent.location} onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })} required /></Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Max Attendees"><input type="number" className="Input" value={newEvent.maxAttendees} onChange={(e) => setNewEvent({ ...newEvent, maxAttendees: e.target.value })} required /></Field>
              <Field label="Registration Fee ($)"><input type="number" className="Input" value={newEvent.registrationFee} onChange={(e) => setNewEvent({ ...newEvent, registrationFee: e.target.value })} placeholder="0 for free" /></Field>
            </div>
            <Field label="Category">
              <select className="Input" value={newEvent.category} onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value })}>
                <option value="educational">Educational</option>
                <option value="conservation">Conservation</option>
                <option value="awareness">Awareness</option>
                <option value="fundraising">Fundraising</option>
                <option value="community">Community</option>
              </select>
            </Field>
            <Field label="Requirements (Optional)"><textarea rows={2} className="Input" value={newEvent.requirements} onChange={(e) => setNewEvent({ ...newEvent, requirements: e.target.value })} /></Field>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowEventModal(false)} className="Btn secondary">Cancel</button>
              <button type="submit" className="Btn primary">{selectedEvent ? 'Update' : 'Create'} Event</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Change Role Modal */}
      {showRoleModal && selectedUser && (
        <Modal onClose={() => { setShowRoleModal(false); setSelectedUser(null); }} title="Change User Role" size="md">
          <div className="mb-4">
            <p><span className="font-medium">User:</span> {selectedUser.name}</p>
            <p><span className="font-medium">Current Role:</span> {selectedUser.role}</p>
          </div>
          <div className="space-y-2">
            {['tourGuide', 'safariDriver', 'wildlifeOfficer', 'emergencyOfficer', 'callOperator', 'vet', 'admin'].map(role => (
              <button
                key={role}
                onClick={() => handleUpdateUserRole(selectedUser._id, role)}
                className={`w-full text-left px-3 py-2 rounded-lg border transition
                  ${selectedUser.role === role ? 'bg-green-50 border-green-200 text-green-800' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
              >
                {role}
              </button>
            ))}
          </div>
          <div className="mt-4">
            <button onClick={() => { setShowRoleModal(false); setSelectedUser(null); }} className="Btn secondary w-full">Close</button>
          </div>
        </Modal>
      )}

      <Footer />
    </div>
    </RoleGuard>
  );
};

/* ===== Small UI helpers (inside same file) ===== */
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

const KPI = ({ label, value, accent }) => (
  <div className="text-center">
    <div className={`text-3xl font-bold ${accent}`}>{value}</div>
    <div className="text-sm text-gray-600">{label}</div>
  </div>
);

const Item = ({ label, value }) => (
  <div>
    <div className="text-gray-500 text-xs">{label}</div>
    <div className="text-sm font-medium text-gray-800">{value || '-'}</div>
  </div>
);

const Modal = ({ children, onClose, title, size = 'md' }) => {
  const width = size === 'lg' ? 'max-w-2xl' : size === 'md' ? 'max-w-md' : 'max-w-sm';
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-3">
      <div className={`bg-white rounded-2xl p-6 w-full ${width} max-h-[85vh] overflow-y-auto`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

const Field = ({ label, children }) => (
  <label className="block">
    <span className="block text-sm font-medium mb-1">{label}</span>
    {children}
  </label>
);

// Tailwind helper class used in inputs/buttons above
// (put these in your global.css if you want, but inline works fine with Tailwind JIT)
const _style = `
  .Input { @apply w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-200; }
  .Btn { @apply rounded-lg px-4 py-2 font-medium; }
  .Btn.primary { @apply bg-green-600 text-white hover:bg-green-700; }
  .Btn.secondary { @apply bg-gray-500 text-white hover:bg-gray-600; }
`;
// Inject the small style shim
if (typeof document !== 'undefined' && !document.getElementById('admin-inline-style')) {
  const s = document.createElement('style');
  s.id = 'admin-inline-style';
  s.innerHTML = _style;
  document.head.appendChild(s);
}

export default AdminDashboard;
