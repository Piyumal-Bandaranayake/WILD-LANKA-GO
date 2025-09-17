import React, { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

// Detail Modal Component
function DetailModal({ open, onClose, item, onTourCreate }) {
  const navigate = useNavigate(); // useNavigate to handle redirection

  if (!open || !item) return null;

  const dt = new Date(item.bookingDate);
  const Line = ({ label, children }) => (
    <div className="flex gap-3">
      <div className="w-36 text-sm text-[var(--muted)]">{label}</div>
      <div className="flex-1 text-[var(--ink)]">{children ?? "—"}</div>
    </div>
  );

  // Function to create a tour
  const createTour = async () => {
    try {
      const response = await axios.post('http://localhost:5001/api/tour/create', {
        bookingId: item._id,  // Correctly pass the booking ID from the selected item
        preferredDate: item.preferredDate,  // You can also pass preferredDate or any other necessary data
      });

      if (response.status === 201) {
        // If the tour is successfully created, update UI by calling onTourCreate
        onTourCreate(item._id);  // This will update the "Tour Created" status to "Yes"

        // Close the modal
        onClose();

        // Redirect to the Tours Page after creating the tour
        navigate('/AllToursPage');
      }
    } catch (err) {
      console.error("Failed to create tour:", err);
      alert('Failed to create tour. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
        <div className="flex items-start justify-between">
          <h4 className="text-lg font-semibold text-gray-900">Tourist Booking Information</h4>
        </div>
        <div className="mt-4 space-y-3">
          <Line label="Booking ID">{item._id}</Line>
          <Line label="Tourist">{item.touristId ? item.touristId.name : "—"}</Line>
          <Line label="Activity">{item.activityId ? item.activityId.title : "—"}</Line>
          <Line label="Booking Date">{dt ? dt.toLocaleDateString() : "—"}</Line>
          <Line label="Preferred Date">{item.preferredDate ? new Date(item.preferredDate).toLocaleDateString() : "—"}</Line>
          <Line label="Participants">{item.numberOfParticipants ?? "—"}</Line>
          <Line label="Request Guide">{item.requestTourGuide ? "Yes" : "No"}</Line>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-gray-300 text-gray-700 px-4 py-2 text-sm hover:bg-gray-100">
            Close
          </button>
          <button
            onClick={createTour}  // When clicked, creates the tour and redirects
            className="rounded-lg bg-green-600 text-white px-4 py-2 text-sm font-medium hover:bg-green-700"
          >
            Create Tour
          </button>
        </div>
      </div>
    </div>
  );
}

// Badge Component
function Badge({ children, tone = "zinc" }) {
  const tones = {
    zinc: "bg-zinc-100 text-zinc-700 ring-zinc-200",
    green: "bg-green-100 text-green-700 ring-green-200",
    red: "bg-red-100 text-red-700 ring-red-200",
    blue: "bg-blue-100 text-blue-700 ring-blue-200",
    amber: "bg-amber-100 text-amber-700 ring-amber-200",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs ring-1 ${tones[tone] || tones.zinc}`}>
      {children}
    </span>
  );
}

export default function NewBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [query, setQuery] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function load() {
      setLoading(true);
      setErr("");
      try {
        const res = await axios.get('http://localhost:5001/api/bookings');
        if (!ignore) setBookings(res.data);
      } catch (e) {
        if (!ignore) setErr(e.message || "Failed to fetch bookings");
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, [refreshKey]);

  const touristLabel = (b) => {
    const t = b?.touristId;
    if (!t) return "—";
    return t.name || t.email || t._id || "—";
  };

  const activityLabel = (b) => {
    const a = b?.activityId;
    if (!a) return "—";
    return a.title || a._id || "—";
  };

  const fmtDate = (d) => {
    try {
      return new Date(d).toLocaleDateString();
    } catch {
      return "—";
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return bookings;
    return bookings.filter((b) => {
      const t = String(touristLabel(b)).toLowerCase();
      const a = String(activityLabel(b)).toLowerCase();
      const id = String(b?._id || "").toLowerCase();
      return t.includes(q) || a.includes(q) || id.includes(q);
    });
  }, [bookings, query]);

  const openModal = (booking) => {
    setSelectedBooking(booking);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const removeBooking = (bookingId) => {
    setBookings((prevBookings) => prevBookings.filter((b) => b._id !== bookingId));
  };

  // Callback to update booking status when tour is created
  const handleTourCreate = (tourId) => {
    setBookings((prevBookings) => prevBookings.map((booking) =>
      booking._id === tourId ? { ...booking, tourId: "Yes" } : booking  // Update status to "Yes"
    ));

    setRefreshKey((k) => k + 1); // Trigger a refresh for ToursPage
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">New Bookings</h1>
            <p className="text-sm text-gray-600">All tourist bookings awaiting assignment.</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by tourist, activity, or ID…"
              className="w-64 rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
            />
            <button
              onClick={() => setRefreshKey((k) => k + 1)}
              className="rounded-xl bg-gray-900 text-white px-4 py-2 text-sm font-medium hover:bg-black"
            >
              Refresh
            </button>

            {/* Buttons Group */}
            <Link
              to="/availabilityGuideDriver"
              className="rounded-xl bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700"
            >
              Availability
            </Link>
            <Link
              to="/guidedashboard"
              className="rounded-xl bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700"
            >
              Dashboard
            </Link>
            <Link
              to="/ApplyJobForm"
              className="rounded-xl bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700"
            >
              Job Apply
            </Link>
            <Link
              to="/newApplications"
              className="rounded-xl bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700"
            >
              New Applications
            </Link>
            <Link
              to="/AdminCreateuserPage"
              className="rounded-xl bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700"
            >
              Add New Account
            </Link>
            <Link
              to="/AllToursPage"
              className="rounded-xl bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700"
            >
              Tours
            </Link>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          {loading && <div className="p-6 text-sm text-gray-500">Loading bookings…</div>}

          {err && !loading && <div className="p-6 text-sm text-red-600">Failed to load: {err}</div>}

          {!loading && !err && filtered.length === 0 && <div className="p-6 text-sm text-gray-500">No bookings found{query ? " for your search." : "."}</div>}

          {!loading && !err && filtered.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-3 py-3">Booking ID</th>
                    <th className="px-3 py-3">Tourist</th>
                    <th className="px-3 py-3">Activity</th>
                    <th className="px-3 py-3">Booking Date</th>
                    <th className="px-3 py-3">Preferred Date</th>
                    <th className="px-3 py-3">Participants</th>
                    <th className="px-3 py-3">Guide?</th>
                    <th className="px-3 py-3">Tour Created</th>
                    <th className="px-3 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {filtered.map((b) => (
                    <tr key={b._id} className="hover:bg-gray-50/60">
                      <td className="px-3 py-3 text-gray-900">{b._id}</td>
                      <td className="px-3 py-3">{touristLabel(b)}</td>
                      <td className="px-3 py-3">{activityLabel(b)}</td>
                      <td className="px-3 py-3">{fmtDate(b.bookingDate)}</td>
                      <td className="px-3 py-3">{fmtDate(b.preferredDate)}</td>
                      <td className="px-3 py-3">{b.numberOfParticipants ?? "—"}</td>
                      <td className="px-3 py-3">
                        <Badge tone={b.requestTourGuide ? "green" : "zinc"}>{b.requestTourGuide ? "Requested" : "No"}</Badge>
                      </td>
                      <td className="px-3 py-3">
                        <Badge tone={b.tourId ? "green" : "zinc"}>{b.tourId ? "Yes" : "No"}</Badge>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <button
                          onClick={() => openModal(b)}
                          className="inline-flex items-center rounded-xl bg-green-600 text-white px-3 py-1.5 text-sm font-medium hover:bg-green-700"
                        >
                          Show Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      <DetailModal open={isModalOpen} onClose={() => setIsModalOpen(false)} item={selectedBooking} onTourCreate={handleTourCreate} />
    </div>
  );
}
