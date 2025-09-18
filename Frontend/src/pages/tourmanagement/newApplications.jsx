import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

/* ========================= BACKEND CONNECT (no env vars) =========================
   LIST     GET   http://localhost:5001/api/applications?status=Submitted[&role=TourGuide|Driver]
   APPROVE  PATCH http://localhost:5001/api/applications/:id/wpo   body: { action: "approve" }
   REJECT   PATCH http://localhost:5001/api/applications/:id/wpo   body: { action: "reject", notes }
================================================================================= */

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

function RejectDialog({ open, onClose, onConfirm }) {
  const [notes, setNotes] = useState("");
  useEffect(() => {
    if (open) setNotes("");
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
        <h3 className="text-lg font-semibold text-gray-900">Reject Application</h3>
        <p className="mt-1 text-sm text-gray-600">
          Add an optional reason. The applicant will be notified by email.
        </p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={5}
          placeholder="Reason for rejection (optional)"
          className="mt-3 w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10"
        />
        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(notes)}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}

export default function NewApplications() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [query, setQuery] = useState("");
  const [rejectOpen, setRejectOpen] = useState(false);
  const [currentRejectId, setCurrentRejectId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // ----------------------- CONNECT: list all apps -----------------------
  useEffect(() => {
    let ignore = false;

    async function load() {
      setLoading(true);
      setErr("");
      setSuccess("");
      try {
        const params = new URLSearchParams();
        if (roleFilter !== "ALL") params.set("role", roleFilter);
        const res = await axios.get(
          `http://localhost:5001/api/applications?${params.toString()}`
        );
        if (!ignore) setApps(res.data || []);
      } catch (e) {
        if (!ignore) setErr(e?.response?.data?.message || e.message || "Failed to load applications");
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();
    return () => { ignore = true; };
  }, [roleFilter, refreshKey]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return apps;
    return apps.filter((a) => {
      const hay =
        `${a.firstname || ""} ${a.lastname || ""} ${a.email || ""} ${a.phone || ""} ${a.role || ""} ${
          a.Guide_Registration_No || ""
        } ${a.LicenceNumber || ""} ${a.vechicleType || ""} ${a.vechicleNumber || ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [apps, query]);

  // ------------------------ CONNECT: approve application ----------------------
  const approve = async (id) => {
    setErr("");
    setSuccess("");
    try {
      await axios.patch(`http://localhost:5001/api/applications/${id}/wpo`, {
        action: "approve",
      });

      // Update status locally to reflect approval in UI
      setApps((prev) =>
        prev.map((x) =>
          String(x._id) === String(id)
            ? { ...x, status: "ApprovedByWPO", notes: "" }
            : x
        )
      );

      setSuccess("Application approved.");
      setRefreshKey((k) => k + 1); // Ensure the UI stays in sync with backend
    } catch (e) {
      setErr(e?.response?.data?.message || e.message || "Approval failed");
    }
  };

  // ------------------------- CONNECT: reject application ----------------------
  const openReject = (id) => {
    setCurrentRejectId(id);
    setRejectOpen(true);
  };

  const confirmReject = async (notes) => {
    if (!currentRejectId) return;
    setErr("");
    setSuccess("");
    try {
      await axios.patch(`http://localhost:5001/api/applications/${currentRejectId}/wpo`, {
        action: "reject",
        notes,
      });

      // Update status and notes locally
      setApps((prev) =>
        prev.map((x) =>
          String(x._id) === String(currentRejectId)
            ? { ...x, status: "RejectedByWPO", notes }
            : x
        )
      );

      setSuccess("Application rejected. Email sent to applicant.");
      setRefreshKey((k) => k + 1); // Ensure the UI stays in sync with backend
    } catch (e) {
      setErr(e?.response?.data?.message || e.message || "Rejection failed");
    } finally {
      setRejectOpen(false);
      setCurrentRejectId(null);
    }
  };

  const resetFilters = () => {
    setRoleFilter("ALL");
    setQuery("");
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-6xl">
        {/* Simple header (no navbar/footer) */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">New Applications</h1>
            <p className="text-sm text-gray-600">Review and approve/reject newly submitted applications.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={resetFilters}
              className="rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-white"
            >
              Reset
            </button>
            <button
              onClick={() => setRefreshKey((k) => k + 1)}
              className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <div className="sm:col-span-1">
            <label className="mb-1 block text-sm text-gray-700">Role</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10"
            >
              <option value="ALL">All</option>
              <option value="TourGuide">Tour Guide</option>
              <option value="Driver">Driver</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm text-gray-700">Search</label>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, email, phone, reg/licence #, vehicle..."
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10"
            />
          </div>
        </div>

        {/* Alerts */}
        {err ? (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</div>
        ) : null}
        {success ? (
          <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700">
            {success}
          </div>
        ) : null}

        {/* Table */}
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-600">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
              <div className="text-lg font-medium text-gray-900">No new applications</div>
              <div className="text-sm text-gray-600">Check back later or adjust your filters.</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-3 py-3">Applicant</th>
                    <th className="px-3 py-3">Role</th>
                    <th className="px-3 py-3">Contact</th>
                    <th className="px-3 py-3">Details</th>
                    <th className="px-3 py-3">Submitted</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-3 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((a) => (
                    <tr key={a._id} className="align-top">
                      <td className="px-3 py-3">
                        <div className="font-medium text-gray-900">
                          {a.firstname || a.lastname ? `${a.firstname || ""} ${a.lastname || ""}`.trim() : "—"}
                        </div>
                        <div className="text-xs text-gray-600 break-all">{a.email}</div>
                        {a.phone ? <div className="text-xs text-gray-600">{a.phone}</div> : null}
                      </td>
                      <td className="px-3 py-3">
                        <Badge tone="blue">{a.role}</Badge>
                      </td>
                      <td className="px-3 py-3">
                        <div className="text-xs text-gray-700">
                          <span className="text-gray-500">Email:</span> {a.email}
                        </div>
                        {a.phone && (
                          <div className="text-xs text-gray-700">
                            <span className="text-gray-500">Phone:</span> {a.phone}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        {a.role === "TourGuide" ? (
                          <div className="space-y-1 text-xs text-gray-700">
                            <div>
                              <span className="text-gray-500">Reg. No:</span> {a.Guide_Registration_No || "—"}
                            </div>
                            <div>
                              <span className="text-gray-500">Experience:</span>{" "}
                              {typeof a.Experience_Year === "number" ? `${a.Experience_Year} yr(s)` : "—"}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1 text-xs text-gray-700">
                            <div>
                              <span className="text-gray-500">Licence:</span> {a.LicenceNumber || "—"}
                            </div>
                            <div>
                              <span className="text-gray-500">Vehicle:</span>{" "}
                              {a.vechicleType || "—"} {a.vechicleNumber ? `• ${a.vechicleNumber}` : ""}
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <div className="text-xs text-gray-700">
                          {a.createdAt ? new Date(a.createdAt).toLocaleString() : "—"}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <Badge tone="amber">{a.status || "Submitted"}</Badge>
                        {a.notes ? (
                          <div className="mt-1 max-w-[220px] truncate text-xs text-gray-500" title={a.notes}>
                            Notes: {a.notes}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {a.status === "ApprovedByWPO" ? (
                            <span className="text-green-700 text-xs font-semibold">Approved</span>
                          ) : a.status === "RejectedByWPO" ? (
                            <span className="text-red-700 text-xs font-semibold">Rejected</span>
                          ) : (
                            <>
                              <button
                                onClick={() => approve(a._id)}
                                className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => openReject(a._id)}
                                className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <RejectDialog open={rejectOpen} onClose={() => setRejectOpen(false)} onConfirm={confirmReject} />
    </div>
  );
}
