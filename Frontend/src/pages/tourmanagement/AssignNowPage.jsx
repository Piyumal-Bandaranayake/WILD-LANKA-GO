import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";  // For navigating and accessing the bookingId
import axios from 'axios';

export default function AssignNowPage() {
  const { bookingId } = useParams();  // Getting bookingId from URL
  const navigate = useNavigate();

  const [tourDetails, setTourDetails] = useState(null);
  const [tourGuide, setTourGuide] = useState('');
  const [safariDriver, setSafariDriver] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch the tour details based on the bookingId
    async function fetchTourDetails() {
      try {
        const res = await axios.get(`http://localhost:5001/api/tours/${bookingId}`);
        setTourDetails(res.data);
      } catch (error) {
        setError("Error fetching tour details");
      } finally {
        setLoading(false);
      }
    }

    fetchTourDetails();
  }, [bookingId]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Send the update request to backend to assign guide and driver
    try {
      const res = await axios.put('http://localhost:5001/api/tours/assign', {
        bookingId,
        assignedTourGuide: tourGuide,
        assignedDriver: safariDriver,
      });

      alert("Tour successfully assigned!");
      navigate('/new-bookings'); // Redirect to New Bookings page or anywhere else
    } catch (error) {
      setError("Failed to assign tour guide and driver");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <h1 className="text-2xl font-semibold text-gray-900">Assign Tour Guide & Driver</h1>

      {loading && <p>Loading tour details...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {tourDetails && (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Booking Details</h2>
            <p><strong>Booking ID:</strong> {tourDetails.bookingId._id}</p>
            <p><strong>Tourist:</strong> {tourDetails.bookingId.touristId.name}</p>
            <p><strong>Activity:</strong> {tourDetails.bookingId.activityId.title}</p>
            <p><strong>Preferred Date:</strong> {new Date(tourDetails.bookingId.preferredDate).toLocaleDateString()}</p>
          </div>

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
              onClick={() => navigate('/new-bookings')}  // Navigate back to the bookings page
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
      )}
    </div>
  );
}
