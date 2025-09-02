import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import axios from 'axios';

export default function NewBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [query, setQuery] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let ignore = false;

    // Function to load bookings from the backend
    async function load() {
      setLoading(true);
      setErr(""); // Reset error message
      try {
        // Make the API request to fetch bookings
        const res = await axios.get('http://localhost:5001/api/bookings'); // Direct API URL

        // If request is successful, store the data in state
        if (!ignore) setBookings(res.data);
      } catch (e) {
        // If fetch fails, set error
        if (!ignore) setErr(e.message || "Failed to fetch bookings");
      } finally {
        // End loading state
        if (!ignore) setLoading(false);
      }
    }

    load(); // Call the load function to fetch the bookings data
    return () => {
      ignore = true; // Clean up if the component unmounts
    };
  }, [refreshKey]); // Dependency array to trigger when refreshKey changes

  // Helper function to format tourist label (name or ID)
  const touristLabel = (b) => {
    const t = b?.touristId;
    if (!t) return "—";
    if (typeof t === "string") return t.slice(0, 6) + "…" + t.slice(-4);
    return t.name || t.fullName || t.email || t.username || t._id || "—";
  };

  // Helper function to format activity label (title or ID)
  const activityLabel = (b) => {
    const a = b?.activityId;
    if (!a) return "—";
    if (typeof a === "string") return a.slice(0, 6) + "…" + a.slice(-4);
    return a.title || a.name || a._id || "—";
  };

  // Helper function to format dates
  const fmtDate = (d) => {
    try {
      return new Date(d).toLocaleDateString();
    } catch {
      return "—";
    }
  };

  // Filter bookings based on the search query
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return bookings; // If no query, return all bookings
    return bookings.filter((b) => {
      const t = String(touristLabel(b)).toLowerCase();
      const a = String(activityLabel(b)).toLowerCase();
      const id = String(b?._id || "").toLowerCase();
      return t.includes(q) || a.includes(q) || id.includes(q); // Filter by tourist, activity, or ID
    });
  }, [bookings, query]);

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
            {/* Search input */}
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)} // Update search query
              placeholder="Search by tourist, activity, or ID…"
              className="w-64 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {/* Refresh button */}
            <button
              onClick={() => setRefreshKey((k) => k + 1)} // Trigger refresh by updating refreshKey
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Content Section */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          {loading && (
            <div className="p-6 text-sm text-gray-500">Loading bookings…</div> // Display loading text
          )}

          {err && !loading && (
            <div className="p-6 text-sm text-red-600">
              Failed to load: {err} // Show error if fetch fails
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
                      <Td className="text-right">
                        <Link
                          to={`/assign/${b._id}`}
                          className="inline-flex items-center rounded-xl bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
                        >
                          Assign
                        </Link>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
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
