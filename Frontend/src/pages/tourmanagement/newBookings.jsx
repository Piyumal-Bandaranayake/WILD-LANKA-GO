import React, { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom"; // Import useNavigate
import axios from 'axios';

// Detail Modal Component
function DetailModal({ open, onClose, item }) {
  if (!open || !item) return null;

  const navigate = useNavigate(); // Hook to navigate to a different page
  const dt = new Date(item.bookingDate); // Format the booking date
  const Line = ({ label, children }) => (
    <div className="flex gap-3">
      <div className="w-36 text-sm text-[var(--muted)]">{label}</div>
      <div className="flex-1 text-[var(--ink)]">{children ?? "—"}</div>
    </div>
  );

  const assignNow = () => {
    // Navigate to the 'assignnow' page with the booking ID as a query parameter (or pass as state)
    navigate(`/assignnow/${item._id}`);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-xl p-6">
        <div className="flex items-start justify-between">
          <h4 className="text-lg font-semibold text-[var(--ink)]">Tourist Booking Information</h4>
        </div>
        <div className="mt-4 space-y-3">
          <Line label="Booking ID">{item._id}</Line>
          <Line label="Tourist">{item.touristId ? item.touristId.name : "—"}</Line>
          <Line label="Activity">{item.activityId ? item.activityId.title : "—"}</Line>
          <Line label="Booking Date">{dt ? dt.toLocaleDateString() : "—"}</Line>
          <Line label="Preferred Date">{item.preferredDate ? new Date(item.preferredDate).toLocaleDateString() : "—"}</Line>
          <Line label="Participants">{item.numberOfParticipants ?? "—"}</Line>
          <Line label="Request Guide">{item.requestTourGuide ? "Yes" : "No"}</Line>
          <Line label="Status">{item.status ?? "—"}</Line>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="border border-gray-300 text-[var(--ink)] px-4 py-2 rounded-lg hover:bg-gray-50">
            Close
          </button>
          {/* Assign Now Button */}
          <button
            onClick={assignNow} // Navigate to the 'assignnow' page
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Create Tour
          </button>
        </div>
      </div>
    </div>
  );
}

export default function NewBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [query, setQuery] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [showAvailabilityButton, setShowAvailabilityButton] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null); // State for selected booking
  const [isModalOpen, setIsModalOpen] = useState(false); // State to control modal visibility

  useEffect(() => {
    let ignore = false;

    // Function to load bookings from the backend
    async function load() {
      setLoading(true);
      setErr(""); // Reset error message
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
    if (typeof t === "string") return t.slice(0, 6) + "…" + t.slice(-4);
    return t.name || t.fullName || t.email || t.username || t._id || "—";
  };

  const activityLabel = (b) => {
    const a = b?.activityId;
    if (!a) return "—";
    if (typeof a === "string") return a.slice(0, 6) + "…" + a.slice(-4);
    return a.title || a.name || a._id || "—";
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

  // Handle modal open and close
  const openModal = (booking) => {
    setSelectedBooking(booking);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* Header Section */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">New Bookings</h1>
            <p className="text-sm text-gray-500">All tourist bookings awaiting assignment.</p>
          </div>

          <div className="flex items-center gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)} 
              placeholder="Search by tourist, activity, or ID…"
              className="w-64 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              onClick={() => setRefreshKey((k) => k + 1)} 
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Refresh
            </button>
            
            {/* Availability Button */}
            {showAvailabilityButton && (
              <Link
                to="/availabilityGuideDriver"
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Availability
              </Link> 
            )}
            <Link
                to="/guidedashboard"
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Dashboard
              </Link> 
          </div>
        </div>

        {/* Content Section */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          {loading && (
            <div className="p-6 text-sm text-gray-500">Loading bookings…</div> 
          )}

          {err && !loading && (
            <div className="p-6 text-sm text-red-600">
              Failed to load: {err}
            </div>
          )}

          {!loading && !err && filtered.length === 0 && (
            <div className="p-6 text-sm text-gray-500">
              No bookings found{query ? " for your search." : "."}
            </div>
          )}

          {!loading && !err && filtered.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <Th>Booking ID</Th>
                    <Th>Tourist</Th>
                    <Th>Activity</Th>
                    <Th>Booking Date</Th>
                    <Th>Preferred Date</Th>
                    <Th>Participants</Th>
                    <Th>Guide?</Th>
                    <Th>Tour Created</Th> {/* New column for Tour Created */}
                    <Th className="text-right">Action</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {filtered.map((b) => (
                    <tr key={b._id} className="hover:bg-gray-50/60">
                      <Td className="font-mono text-xs text-gray-700">{b._id}</Td>
                      <Td>{touristLabel(b)}</Td>
                      <Td>{activityLabel(b)}</Td>
                      <Td>{fmtDate(b.bookingDate)}</Td>
                      <Td>{fmtDate(b.preferredDate)}</Td>
                      <Td>{b.numberOfParticipants ?? "—"}</Td>
                      <Td>
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                            b.requestTourGuide
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {b.requestTourGuide ? "Requested" : "No"}
                        </span>
                      </Td>
                      <Td>{b.tourId ? "Yes" : "No"}</Td> {/* Display "Yes" or "No" for Tour Created */}
                      <Td className="text-right">
                        <button
                          onClick={() => openModal(b)}
                          className="inline-flex items-center rounded-xl bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
                        >
                          Show Details
                        </button>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal for showing booking details */}
      <DetailModal open={isModalOpen} onClose={closeModal} item={selectedBooking} />
    </div>
  );
}

// Table header component
function Th({ children, className = "" }) {
  return (
    <th
      scope="col"
      className={
        "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 " +
        className
      }
    >
      {children}
    </th>
  );
}

// Table data component
function Td({ children, className = "" }) {
  return <td className={"px-4 py-3 text-sm text-gray-800 " + className}>{children}</td>;
}
