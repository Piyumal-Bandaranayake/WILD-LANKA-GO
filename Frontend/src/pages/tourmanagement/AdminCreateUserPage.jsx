import React, { useEffect, useState } from "react";
import axios from "axios";

// Badge Component to style the status labels
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

export default function AdminCreateUserPage() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch only approved applications
  useEffect(() => {
    async function loadApprovedApplications() {
      setLoading(true);
      setErr("");
      setSuccess("");
      try {
        const res = await axios.get("http://localhost:5001/api/applications?status=ApprovedByWPO");
        setApps(res.data || []);
      } catch (e) {
        setErr(e?.response?.data?.message || e.message || "Failed to load approved applications");
      } finally {
        setLoading(false);
      }
    }

    loadApprovedApplications();
  }, []);

  // Function to handle account creation
  const createAccount = async (id) => {
    setErr("");
    setSuccess("");
    try {
      const res = await axios.post(`http://localhost:5001/api/applications/${id}/admin-create-account`);
      setSuccess("Account created successfully!");
      // Optionally, you can remove the created application from the list
      setApps((prev) => prev.filter((app) => app._id !== id));
    } catch (e) {
      setErr(e?.response?.data?.message || e.message || "Account creation failed");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Approved Applications</h1>
            <p className="text-sm text-gray-600">Manage approved applications and create user accounts.</p>
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

        {/* Approved Applications Table */}
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-600">Loading…</div>
          ) : apps.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
              <div className="text-lg font-medium text-gray-900">No approved applications</div>
              <div className="text-sm text-gray-600">Check back later for new applications.</div>
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
                  {apps.map((a) => (
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
                        <Badge tone="amber">{a.status || "Approved"}</Badge>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => createAccount(a._id)}
                            className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
                          >
                            Create Account
                          </button>
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
    </div>
  );
}
