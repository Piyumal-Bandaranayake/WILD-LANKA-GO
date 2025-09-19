import React, { useState, useEffect } from 'react';
import { protectedApi } from '../../services/authService';
import { useAuthContext } from '../../contexts/AuthContext';
import Navbar from '../../components/Navbar';
import Footer from '../../components/footer';

const EventList = () => {
    const { backendUser } = useAuthContext();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState(null);

    const [newEvent, setNewEvent] = useState({
        title: '',
        description: '',
        date: '',
        time: '',
        location: '',
        maxSlots: '',
        price: '',
        imageUrl: ''
    });

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            setLoading(true);
            const response = await protectedApi.getEvents();
            setEvents(response.data || []);
        } catch (error) {
            console.error('Failed to fetch events:', error);
            setError('Failed to load events');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateEvent = async (e) => {
        e.preventDefault();
        try {
            await protectedApi.createEvent({
                ...newEvent,
                maxSlots: parseInt(newEvent.maxSlots),
                price: parseFloat(newEvent.price)
            });
            setShowCreateModal(false);
            setNewEvent({
                title: '',
                description: '',
                date: '',
                time: '',
                location: '',
                maxSlots: '',
                price: '',
                imageUrl: ''
            });
            fetchEvents();
        } catch (error) {
            console.error('Failed to create event:', error);
            setError('Failed to create event');
        }
    };

    const handleRegisterForEvent = async (eventId) => {
        try {
            await protectedApi.registerForEvent(eventId);
            fetchEvents(); // Refresh to show updated registration count
        } catch (error) {
            console.error('Failed to register for event:', error);
            setError('Failed to register for event');
        }
    };

    const handleDeleteEvent = async (id) => {
        if (window.confirm('Are you sure you want to delete this event?')) {
            try {
                await protectedApi.deleteEvent(id);
                fetchEvents();
            } catch (error) {
                console.error('Failed to delete event:', error);
                setError('Failed to delete event');
            }
        }
    };

    const isAdmin = backendUser?.role === 'admin';

    if (loading) {
        return (
            <div className="flex flex-col min-h-screen">
                <Navbar />
                <div className="flex-1 flex items-center justify-center pt-32">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading events...</p>
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
                        <h1 className="text-3xl font-bold text-gray-800">Events</h1>
                        {isAdmin && (
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                            >
                                Create Event
                            </button>
                        )}
                    </div>

                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {events.map((event) => (
                            <div key={event._id} className="bg-white rounded-lg shadow-md overflow-hidden">
                                {event.imageUrl && (
                                    <img
                                        src={event.imageUrl}
                                        alt={event.title}
                                        className="w-full h-48 object-cover"
                                    />
                                )}
                                <div className="p-6">
                                    <h3 className="text-xl font-semibold mb-2">{event.title}</h3>
                                    <p className="text-gray-600 mb-4">{event.description}</p>
                                    <div className="space-y-2 text-sm">
                                        <p><span className="font-medium">Date:</span> {new Date(event.date).toLocaleDateString()}</p>
                                        <p><span className="font-medium">Time:</span> {event.time}</p>
                                        <p><span className="font-medium">Location:</span> {event.location}</p>
                                        <p><span className="font-medium">Price:</span> ${event.price}</p>
                                        <p><span className="font-medium">Available Slots:</span> {event.availableSlots || event.maxSlots} / {event.maxSlots}</p>
                                    </div>
                                    <div className="mt-4 flex gap-2">
                                        {!isAdmin && (
                                            <button
                                                onClick={() => handleRegisterForEvent(event._id)}
                                                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors flex-1"
                                                disabled={event.availableSlots === 0}
                                            >
                                                {event.availableSlots === 0 ? 'Full' : 'Register'}
                                            </button>
                                        )}
                                        {isAdmin && (
                                            <button
                                                onClick={() => handleDeleteEvent(event._id)}
                                                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
                                            >
                                                Delete
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {events.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-gray-500 text-lg">No events available</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Event Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <h2 className="text-2xl font-bold mb-4">Create New Event</h2>
                        <form onSubmit={handleCreateEvent}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Title</label>
                                    <input
                                        type="text"
                                        value={newEvent.title}
                                        onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Description</label>
                                    <textarea
                                        value={newEvent.description}
                                        onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        rows="3"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Date</label>
                                    <input
                                        type="date"
                                        value={newEvent.date}
                                        onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Time</label>
                                    <input
                                        type="time"
                                        value={newEvent.time}
                                        onChange={(e) => setNewEvent({...newEvent, time: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Location</label>
                                    <input
                                        type="text"
                                        value={newEvent.location}
                                        onChange={(e) => setNewEvent({...newEvent, location: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Max Slots</label>
                                    <input
                                        type="number"
                                        value={newEvent.maxSlots}
                                        onChange={(e) => setNewEvent({...newEvent, maxSlots: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Price ($)</label>
                                    <input
                                        type="number"
                                        value={newEvent.price}
                                        onChange={(e) => setNewEvent({...newEvent, price: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        step="0.01"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Image URL</label>
                                    <input
                                        type="url"
                                        value={newEvent.imageUrl}
                                        onChange={(e) => setNewEvent({...newEvent, imageUrl: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
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
                                    Create
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

export default EventList;