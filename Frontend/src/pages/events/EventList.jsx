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
                <div className="flex-1 flex items-center justify-center">
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
        <>
            <Navbar />

            {/* Hero Section */}
            <section
                className="relative h-[50vh] bg-cover bg-center flex items-center justify-center"
                style={{
                    backgroundImage:
                        "url('https://images.unsplash.com/photo-1523580494863-6f3031224c94?q=80&w=1200&auto=format&fit=crop')",
                }}
            >
                <div className="absolute inset-0 bg-black/40"></div>
                <div className="relative text-center text-white max-w-3xl">
                    <h1 className="text-5xl font-bold mb-4">Upcoming Events</h1>
                    <p className="text-lg">
                        Join our conservation events, workshops, and community programs.
                    </p>
                </div>
            </section>

            {/* Events Section */}
            <div className="bg-gray-50 py-16">
                <div className="container mx-auto px-4">
                    <div className="flex justify-between items-center mb-8">
                        <h2 className="text-3xl font-bold text-gray-800">All Events</h2>
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

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {events.map((event) => (
                            <div key={event._id} className="bg-white rounded-lg shadow-lg overflow-hidden transform hover:-translate-y-2 transition-transform duration-300">
                                {event.imageUrl && (
                                    <img
                                        src={event.imageUrl}
                                        alt={event.title}
                                        className="w-full h-56 object-cover"
                                    />
                                )}
                                <div className="p-6">
                                    <h3 className="text-2xl font-semibold text-green-800 mb-3">{event.title}</h3>
                                    <p className="text-gray-700 mb-4">{event.description}</p>
                                    <div className="space-y-2 text-sm text-gray-600">
                                        <p><span className="font-medium text-gray-800">Date:</span> {new Date(event.date).toLocaleDateString()}</p>
                                        <p><span className="font-medium text-gray-800">Time:</span> {event.time}</p>
                                        <p><span className="font-medium text-gray-800">Location:</span> {event.location}</p>
                                        <p><span className="font-medium text-gray-800">Price:</span> ${event.price}</p>
                                        <p><span className="font-medium text-gray-800">Available Slots:</span> {event.availableSlots || event.maxSlots} / {event.maxSlots}</p>
                                    </div>
                                    <div className="mt-6 flex gap-4">
                                        {!isAdmin && (
                                            <button
                                                onClick={() => handleRegisterForEvent(event._id)}
                                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex-1"
                                                disabled={event.availableSlots === 0}
                                            >
                                                {event.availableSlots === 0 ? 'Full' : 'Register'}
                                            </button>
                                        )}
                                        {isAdmin && (
                                            <button
                                                onClick={() => handleDeleteEvent(event._id)}
                                                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                                            >
                                                Delete
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {events.length === 0 && !loading && (
                        <div className="text-center py-16">
                            <p className="text-gray-500 text-lg">No events available at the moment. Please check back later.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Event Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-8 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl">
                        <h2 className="text-2xl font-bold mb-6">Create New Event</h2>
                        <form onSubmit={handleCreateEvent}>
                           {/* Form fields... */}
                        </form>
                    </div>
                </div>
            )}

            <Footer />
        </>
    );
};

export default EventList;