// Frontend/src/component/ApplyJobForm.jsx
import { useState } from "react";

const EMPTY = {
  firstname: "",
  lastname: "",
  email: "",
  phone: "",
  Guide_Registration_No: "",
  Experience_Year: "",
  LicenceNumber: "",
  vechicleType: "",
  vechicleNumber: "",
};

export default function ApplyJobForm({ onSubmit }) {
  const [role, setRole] = useState("TourGuide"); // "TourGuide" | "Driver"
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [fieldErrors, setFieldErrors] = useState([]);

  const onChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErr("");
    setMsg("");
  };

  const onRoleChange = (r) => {
    setRole(r);
    setErr("");
    setMsg("");
    // clear fields not used by the selected role
    if (r === "TourGuide") {
      setForm((p) => ({ ...p, LicenceNumber: "", vechicleType: "", vechicleNumber: "" }));
    } else {
      setForm((p) => ({ ...p, Guide_Registration_No: "", Experience_Year: "" }));
    }
  };

  // Show helpful reason for failure (server vs network)
  const formatError = (e) => {
    if (!e) return "Submit failed";
    // axios-style error with server response
    if (e.response) {
      const { status, statusText, data } = e.response;
      const serverMsg = data?.message || data?.error || data?.msg;
      return `${status} ${statusText || ""}${serverMsg ? ` – ${serverMsg}` : ""}`.trim();
    }
    // axios-style error where request was made but no response (CORS/backend down)
    if (e.request) {
      return "Network error: could not reach API (is the backend running on http://localhost:5001?)";
    }
    // anything else
    return e.message || "Submit failed";
  };

  // minimal pre-submit validation (complements HTML `required`)
  const validate = () => {
    const errs = [];
    if (!form.firstname.trim()) errs.push("First name is required.");
    if (!form.lastname.trim()) errs.push("Last name is required.");
    if (!form.email.trim()) errs.push("Email is required.");
    if (!form.phone.trim()) errs.push("Phone is required.");

    if (role === "TourGuide") {
      if (!form.Guide_Registration_No.trim()) errs.push("Guide Registration No is required.");
      if (form.Experience_Year === "" || Number.isNaN(Number(form.Experience_Year))) {
        errs.push("Experience (years) must be a number.");
      }
    }

    if (role === "Driver") {
      if (!form.LicenceNumber.trim()) errs.push("Licence Number is required.");
      if (!form.vechicleType.trim()) errs.push("Vehicle Type is required.");
      if (!form.vechicleNumber.trim()) errs.push("Vehicle Number is required.");
    }

    setFieldErrors(errs);
    return errs.length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");
    setErr("");
    setFieldErrors([]);

    if (!validate()) return;

    setLoading(true);
    try {
      const payload = { role, ...form };

      // send only relevant fields
      if (role === "TourGuide") {
        delete payload.LicenceNumber;
        delete payload.vechicleType;
        delete payload.vechicleNumber;
        if (payload.Experience_Year !== "") payload.Experience_Year = Number(payload.Experience_Year);
      } else {
        delete payload.Guide_Registration_No;
        delete payload.Experience_Year;
      }

      const resultMsg = await (onSubmit ? onSubmit(payload) : Promise.resolve("Application submitted"));
      setMsg(typeof resultMsg === "string" ? resultMsg : "Application submitted");
      setForm(EMPTY);
    } catch (e2) {
      const pretty = formatError(e2);
      setErr(pretty);
      // For quick debugging in the console:
      // eslint-disable-next-line no-console
      console.error("Application submit failed:", e2);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white shadow rounded-2xl">
      <h1 className="text-2xl font-semibold mb-4">Apply for a Job</h1>

      {/* Success / Error banners */}
      {msg && (
        <div className="mb-4 rounded-lg bg-emerald-50 text-emerald-800 px-4 py-2 border border-emerald-200" role="status" aria-live="polite">
          {msg}
        </div>
      )}
      {err && (
        <div className="mb-4 rounded-lg bg-red-50 text-red-700 px-4 py-2 border border-red-200" role="alert" aria-live="assertive">
          {err}
        </div>
      )}
      {fieldErrors.length > 0 && (
        <ul className="mb-4 rounded-lg bg-amber-50 text-amber-800 px-4 py-2 border border-amber-200 list-disc list-inside">
          {fieldErrors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}

      {/* Role switch */}
      <div className="inline-flex rounded-xl border bg-gray-50 p-1 mb-6">
        {["TourGuide", "Driver"].map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => onRoleChange(r)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              role === r ? "bg-white shadow" : "text-gray-600"
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Common fields */}
        <div>
          <label className="block text-sm mb-1">First name</label>
          <input
            name="firstname"
            value={form.firstname}
            onChange={onChange}
            className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring"
            placeholder="e.g., Amal"
            required
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Last name</label>
          <input
            name="lastname"
            value={form.lastname}
            onChange={onChange}
            className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring"
            placeholder="e.g., Perera"
            required
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Email</label>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={onChange}
            className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring"
            placeholder="you@example.com"
            required
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Phone</label>
          <input
            name="phone"
            value={form.phone}
            onChange={onChange}
            className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring"
            placeholder="07XXXXXXXX"
            required
          />
        </div>

        {/* TourGuide-only */}
        {role === "TourGuide" && (
          <>
            <div>
              <label className="block text-sm mb-1">Guide Registration No</label>
              <input
                name="Guide_Registration_No"
                value={form.Guide_Registration_No}
                onChange={onChange}
                className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring"
                placeholder="G-12345"
                required
              />
            </div>

            <div>
              <label className="block text-sm mb-1">Experience (years)</label>
              <input
                name="Experience_Year"
                type="number"
                min="0"
                value={form.Experience_Year}
                onChange={onChange}
                className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring"
                placeholder="e.g., 3"
                required
              />
            </div>
          </>
        )}

        {/* Driver-only */}
        {role === "Driver" && (
          <>
            <div>
              <label className="block text-sm mb-1">Licence Number</label>
              <input
                name="LicenceNumber"
                value={form.LicenceNumber}
                onChange={onChange}
                className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring"
                placeholder="B1234567"
                required
              />
            </div>

            <div>
              <label className="block text-sm mb-1">Vehicle Type</label>
              <input
                name="vechicleType"
                value={form.vechicleType}
                onChange={onChange}
                className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring"
                placeholder="Safari Jeep"
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm mb-1">Vehicle Number</label>
              <input
                name="vechicleNumber"
                value={form.vechicleNumber}
                onChange={onChange}
                className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring"
                placeholder="WP-AB-1234"
                required
              />
            </div>
          </>
        )}

        <div className="md:col-span-2 mt-2 flex items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-white ${
              loading ? "bg-gray-400" : "bg-emerald-600 hover:bg-emerald-700"
            }`}
          >
            {loading ? "Submitting..." : "Submit Application"}
          </button>
        </div>
      </form>
    </div>
  );
}
