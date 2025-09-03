import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom"; 
import axios from 'axios';

export default function AssignNowPage() {
  const { bookingId } = useParams();  // Get bookingId from the URL
  const navigate = useNavigate();

  const [tourDetails, setTourDetails] = useState(null);
  const [bookingDetails, setBookingDetails] = useState(null);  // Store booking details
  const [tourGuide, setTourGuide] = useState('');
  const [safariDriver, setSafariDriver] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Function to handle tour creation and assignment of guide and driver
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Step 1: Create a new tour with the booking ID
      const newTourResponse = await axios.post('http://localhost:5001/api/tours/create', {
        bookingId, 
      });

      // Step 2: After tour is created, assign the tour guide and safari driver
      const updatedTourResponse = await axios.put('http://localhost:5001/api/tours/assign', {
        bookingId,
        assignedTourGuide: tourGuide,
        assignedDriver: safariDriver,
      });

      // Step 3: Fetch the details of the newly created tour
      const fetchTourDetailsResponse = await axios.get(`http://localhost:5001/api/tours/${newTourResponse.data.tour._id}`);
      setTourDetails(fetchTourDetailsResponse.data);  // Set the fetched tour details

      alert("Tour successfully created and assigned!");
      navigate('/new-bookings'); // Redirect to New Bookings page (or another page)

    } catch (error) {
      setError("Failed to create and assign the tour.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch booking details when the component is mounted
  useEffect(() => {
    const fetchBookingDetails = async () => {
      try {
        const response = await axios.get(`http://localhost:5001/api/bookings/${bookingId}`);
        setBookingDetails(response.data);  // Store booking details
      } catch (error) {
        setError("Failed to fetch booking details.");
      }
    };

    fetchBookingDetails();
  }, [bookingId]);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <h1 className="text-2xl font-semibold text-gray-900">Assign Tour Guide & Driver</h1>

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}
      
      {/* Booking Details */}
      {bookingDetails && (
        <div className="mt-6 space-y-4">
          <h2 className="text-xl font-semibold">Booking Details</h2>
          <p><strong>Booking ID:</strong> {bookingDetails._id}</p>
          <p><strong>Tourist Name:</strong> {bookingDetails.touristId?.name}</p>
          <p><strong>Activity:</strong> {bookingDetails.activityId?.title}</p>
          <p><strong>Preferred Date:</strong> {new Date(bookingDetails.preferredDate).toLocaleDateString()}</p>
          {/* Add other booking-related details here */}
        </div>
      )}

      {/* Tour Assignment Form */}
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="tourGuide" className="block text-sm font-medium text-gray-700">Tour Guide</label>
          <input
            id="tourGuide"
            type="text"
            value={tourGuide}
            onChange={(e) => setTourGuide(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            placeholder="Enter Tour Guide ID"
          />
        </div>

        <div>
          <label htmlFor="safariDriver" className="block text-sm font-medium text-gray-700">Safari Driver</label>
          <input
            id="safariDriver"
            type="text"
            value={safariDriver}
            onChange={(e) => setSafariDriver(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            placeholder="Enter Safari Driver ID"
          />
        </div>

        <div className="mt-4 flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/new-bookings')} 
            className="px-4 py-2 bg-gray-300 rounded-lg"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Assign Now
          </button>
        </div>
      </form>

      {/* Display New Tour Details */}
      {tourDetails && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold">New Tour Details</h2>
          <p><strong>Tour ID:</strong> {tourDetails._id}</p>
          <p><strong>Tour Guide:</strong> {tourDetails.assignedTourGuide ? tourDetails.assignedTourGuide : 'Not assigned'}</p>
          <p><strong>Safari Driver:</strong> {tourDetails.assignedDriver ? tourDetails.assignedDriver : 'Not assigned'}</p>
          <p><strong>Status:</strong> {tourDetails.status}</p>
        </div>
      )}
    </div>
  );
}
