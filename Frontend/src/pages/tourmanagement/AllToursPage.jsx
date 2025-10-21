import React, { useState, useEffect } from "react";
import axios from "axios";

const AllToursPage = () => {
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // State to manage assignment dialog visibility
  const [assigningTourId, setAssigningTourId] = useState(null);
  const [assignedGuide, setAssignedGuide] = useState(null);
  const [assignedDriver, setAssignedDriver] = useState(null);

  useEffect(() => {
    // Fetch all tours from the backend
    const fetchTours = async () => {
      try {
        const response = await axios.get("http://localhost:5001/api/tour"); // Adjust the URL based on your backend
        setTours(response.data);
        setLoading(false);
      } catch (err) {
        setError("Failed to fetch tours");
        setLoading(false);
      }
    };

    fetchTours();
  }, []);

  const handleAssign = async (tourId) => {
    try {
      // Update the backend with assigned guide and driver
      await axios.put(`http://localhost:5001/api/tour/assign/${tourId}`, {
        assignedTourGuide: assignedGuide,
        assignedDriver: assignedDriver,
      });

      // Update the tour status and assignment on the UI
      setTours((prevTours) =>
        prevTours.map((tour) =>
          tour._id === tourId
            ? { ...tour, assignedTourGuide, assignedDriver, status: "Confirmed" }
            : tour
        )
      );
      setAssigningTourId(null); // Close the dialog
    } catch (err) {
      setError("Failed to assign tour guide and driver");
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-6xl">
        {/* Simple header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">All Tours</h1>
            <p className="text-sm text-gray-600">View all tours along with their statuses and assigned guide/driver details.</p>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-600">Loading…</div>
          ) : tours.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
              <div className="text-lg font-medium text-gray-900">No tours available</div>
              <div className="text-sm text-gray-600">Check back later or adjust your filters.</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-3 py-3">Tour ID</th>
                    <th className="px-3 py-3">Booking ID</th>
                    <th className="px-3 py-3">Guide Assigned</th>
                    <th className="px-3 py-3">Driver Assigned</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {tours.map((tour) => (
                    <tr key={tour._id} className="align-top">
                      <td className="px-3 py-3">{tour._id}</td>
                      <td className="px-3 py-3">{tour.bookingId?._id}</td>
                      <td className="px-3 py-3">
                        {tour.assignedTourGuide ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700 ring-green-200">
                            Assigned
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-zinc-100 text-zinc-700 ring-zinc-200">
                            Not Assigned
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        {tour.assignedDriver ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700 ring-green-200">
                            Assigned
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-zinc-100 text-zinc-700 ring-zinc-200">
                            Not Assigned
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ${tour.status === 'Pending' ? 'bg-amber-100 text-amber-700 ring-amber-200' : 'bg-blue-100 text-blue-700 ring-blue-200'}`}>
                          {tour.status}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <button
                          onClick={() => setAssigningTourId(tour._id)}
                          className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
                        >
                          Assign
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Assignment Modal */}
        {assigningTourId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
              <h3 className="text-lg font-semibold text-gray-900">Assign Guide and Driver</h3>
              <div className="mt-4">
                <label className="text-sm text-gray-700">Select Guide</label>
                <select
                  value={assignedGuide}
                  onChange={(e) => setAssignedGuide(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 p-2.5 mt-2 text-sm"
                >
                  {/* Replace with your guide list */}
                  <option value="">Select Guide</option>
                  <option value="guide1">Guide 1</option>
                  <option value="guide2">Guide 2</option>
                </select>
              </div>
              <div className="mt-4">
                <label className="text-sm text-gray-700">Select Driver</label>
                <select
                  value={assignedDriver}
                  onChange={(e) => setAssignedDriver(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 p-2.5 mt-2 text-sm"
                >
                  {/* Replace with your driver list */}
                  <option value="">Select Driver</option>
                  <option value="driver1">Driver 1</option>
                  <option value="driver2">Driver 2</option>
                </select>
              </div>
              <div className="mt-4 flex items-center justify-end gap-2">
                <button
                  onClick={() => setAssigningTourId(null)} // Close modal
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleAssign(assigningTourId)}
                  className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                  disabled={!assignedGuide || !assignedDriver} // Disable button if guide or driver is not selected
                >
                  Assign
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllToursPage;
