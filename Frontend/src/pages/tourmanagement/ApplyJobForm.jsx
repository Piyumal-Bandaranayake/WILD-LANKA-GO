import { useState } from "react";
import axios from "axios";
import bgImage from "./img6.jpg"; // ✅ Ensure correct path

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
  const [role, setRole] = useState("TourGuide");
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
    if (r === "TourGuide") {
      setForm((p) => ({ ...p, LicenceNumber: "", vechicleType: "", vechicleNumber: "" }));
    } else {
      setForm((p) => ({ ...p, Guide_Registration_No: "", Experience_Year: "" }));
    }
  };

  const formatError = (e) => {
    if (!e) return "Submit failed";
    if (e.response) {
      const { status, statusText, data } = e.response;
      const serverMsg = data?.message || data?.error || data?.msg;
      return `${status} ${statusText || ""}${serverMsg ? ` – ${serverMsg}` : ""}`.trim();
    }
    if (e.request) {
      return "Network error: could not reach API (is the backend running on http://localhost:5001?)";
    }
    return e.message || "Submit failed";
  };

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

      if (role === "TourGuide") {
        delete payload.LicenceNumber;
        delete payload.vechicleType;
        delete payload.vechicleNumber;
        if (payload.Experience_Year !== "") payload.Experience_Year = Number(payload.Experience_Year);
      } else {
        delete payload.Guide_Registration_No;
        delete payload.Experience_Year;
      }

      const resultMsg = await (onSubmit
        ? onSubmit(payload)
        : axios.post('http://localhost:5001/api/applications/apply', payload).then(res => res.data.message));

      setMsg(typeof resultMsg === "string" ? resultMsg : "Application submitted");
      setForm(EMPTY);
    } catch (e2) {
      const pretty = formatError(e2);
      setErr(pretty);
      console.error("Application submit failed:", e2);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* 🔳 Full Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${bgImage})`, height: "100vh" }} // Ensure it covers full viewport height
      ></div>

      {/* 🌓 Overlay */}
      <div className="absolute inset-0 bg-black/30"></div>

      {/* 🌟 Foreground Form Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4 py-10">
        <div className="max-w-3xl w-full p-6 bg-white/60 shadow-xl rounded-2xl backdrop-blur-md border border-white/30">
          <h1 className="text-2xl font-semibold mb-4 text-center text-black">Apply for a Job</h1>

          {/* 🔔 Messages */}
          {msg && (
            <div className="mb-4 rounded-lg bg-emerald-100 text-emerald-900 px-4 py-2 border border-emerald-200" role="status">
              {msg}
            </div>
          )}
          {err && (
            <div className="mb-4 rounded-lg bg-red-100 text-red-900 px-4 py-2 border border-red-200" role="alert">
              {err}
            </div>
          )}
          {fieldErrors.length > 0 && (
            <ul className="mb-4 rounded-lg bg-yellow-100 text-yellow-900 px-4 py-2 border border-yellow-200 list-disc list-inside">
              {fieldErrors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          )}

          {/* 👥 Role Switch */}
          <div className="inline-flex rounded-xl border bg-white/40 p-1 mb-6">
            {["TourGuide", "Driver"].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => onRoleChange(r)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  role === r ? "bg-white text-black shadow" : "text-black"
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* 📄 The Form */}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1 text-black">First name</label>
              <input name="firstname" value={form.firstname} onChange={onChange} className="w-full rounded-lg border px-3 py-2" placeholder="e.g., Amal" required />
            </div>

            <div>
              <label className="block text-sm mb-1 text-black">Last name</label>
              <input name="lastname" value={form.lastname} onChange={onChange} className="w-full rounded-lg border px-3 py-2" placeholder="e.g., Perera" required />
            </div>

            <div>
              <label className="block text-sm mb-1 text-black">Email</label>
              <input name="email" type="email" value={form.email} onChange={onChange} className="w-full rounded-lg border px-3 py-2" placeholder="you@example.com" required />
            </div>

            <div>
              <label className="block text-sm mb-1 text-black">Phone</label>
              <input name="phone" value={form.phone} onChange={onChange} className="w-full rounded-lg border px-3 py-2" placeholder="07XXXXXXXX" required />
            </div>

            {/* 🧭 Tour Guide Fields */}
            {role === "TourGuide" && (
              <>
                <div>
                  <label className="block text-sm mb-1 text-black">Guide Registration No</label>
                  <input name="Guide_Registration_No" value={form.Guide_Registration_No} onChange={onChange} className="w-full rounded-lg border px-3 py-2" placeholder="G-12345" required />
                </div>

                <div>
                  <label className="block text-sm mb-1 text-black">Experience (years)</label>
                  <input name="Experience_Year" type="number" min="0" value={form.Experience_Year} onChange={onChange} className="w-full rounded-lg border px-3 py-2" placeholder="e.g., 3" required />
                </div>
              </>
            )}

            {/* 🚙 Driver Fields */}
            {role === "Driver" && (
              <>
                <div>
                  <label className="block text-sm mb-1 text-black">Licence Number</label>
                  <input name="LicenceNumber" value={form.LicenceNumber} onChange={onChange} className="w-full rounded-lg border px-3 py-2" placeholder="B1234567" required />
                </div>

                <div>
                  <label className="block text-sm mb-1 text-black">Vehicle Type</label>
                  <input name="vechicleType" value={form.vechicleType} onChange={onChange} className="w-full rounded-lg border px-3 py-2" placeholder="Safari Jeep" required />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm mb-1 text-black">Vehicle Number</label>
                  <input name="vechicleNumber" value={form.vechicleNumber} onChange={onChange} className="w-full rounded-lg border px-3 py-2" placeholder="WP-AB-1234" required />
                </div>
              </>
            )}

            <div className="md:col-span-2 mt-2 flex items-center gap-3">
              <button type="submit" disabled={loading} className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-white ${loading ? "bg-gray-400" : "bg-emerald-600 hover:bg-emerald-700"}`}>
                {loading ? "Submitting..." : "Submit Application"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
