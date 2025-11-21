import { useState } from "react";
import axios from "axios";

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
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone) => {
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,15}$/;
    return phoneRegex.test(phone);
  };

  const validateName = (name) => {
    const nameRegex = /^[a-zA-Z\s]{2,50}$/;
    return nameRegex.test(name.trim());
  };

  const validateRegistrationNumber = (regNo) => {
    const regRegex = /^[A-Za-z0-9\-]{3,20}$/;
    return regRegex.test(regNo);
  };

  const validateLicenseNumber = (licenseNo) => {
    const licenseRegex = /^[A-Za-z0-9]{5,15}$/;
    return licenseRegex.test(licenseNo);
  };

  const validateVehicleNumber = (vehicleNo) => {
    const vehicleRegex = /^[A-Za-z0-9\-]{4,15}$/;
    return vehicleRegex.test(vehicleNo);
  };

  const validateExperience = (experience) => {
    const exp = parseInt(experience);
    return !isNaN(exp) && exp >= 0 && exp <= 50;
  };

  // Character count helpers
  const getCharacterCount = (value) => value ? value.length : 0;
  const getMaxLength = (fieldName) => {
    switch (fieldName) {
      case 'firstname':
      case 'lastname':
        return 50;
      case 'email':
        return 100;
      case 'phone':
        return 15;
      case 'Guide_Registration_No':
        return 20;
      case 'LicenceNumber':
        return 15;
      case 'vechicleType':
        return 30;
      case 'vechicleNumber':
        return 15;
      default:
        return 100;
    }
  };

  // Field validation status
  const getFieldStatus = (fieldName) => {
    const value = form[fieldName];
    const error = errors[fieldName];
    const isTouched = touched[fieldName];
    
    if (!isTouched && !value) return 'default';
    if (error) return 'error';
    if (value && !error) return 'success';
    return 'default';
  };

  // Form completion progress
  const getFormProgress = () => {
    const requiredFields = ['firstname', 'lastname', 'email', 'phone'];
    const roleSpecificFields = role === 'TourGuide' 
      ? ['Guide_Registration_No', 'Experience_Year']
      : ['LicenceNumber', 'vechicleType', 'vechicleNumber'];
    
    const allFields = [...requiredFields, ...roleSpecificFields];
    const completedFields = allFields.filter(field => {
      const value = form[field];
      return value && value.toString().trim() !== '';
    });
    
    return Math.round((completedFields.length / allFields.length) * 100);
  };

  // Field validation
  const validateField = (name, value) => {
    let error = '';

    switch (name) {
      case 'firstname':
        if (!value) error = 'First name is required';
        else if (!validateName(value)) error = 'First name must be 2-50 characters and contain only letters';
        break;
      case 'lastname':
        if (!value) error = 'Last name is required';
        else if (!validateName(value)) error = 'Last name must be 2-50 characters and contain only letters';
        break;
      case 'email':
        if (!value) error = 'Email is required';
        else if (!validateEmail(value)) error = 'Please enter a valid email address';
        break;
      case 'phone':
        if (!value) error = 'Phone number is required';
        else if (!validatePhone(value)) error = 'Please enter a valid phone number (10-15 digits)';
        break;
      case 'Guide_Registration_No':
        if (role === 'TourGuide' && value && !validateRegistrationNumber(value)) {
          error = 'Registration number must be 3-20 characters (letters, numbers, hyphens only)';
        }
        break;
      case 'Experience_Year':
        if (role === 'TourGuide' && value && !validateExperience(value)) {
          error = 'Experience must be a number between 0 and 50 years';
        }
        break;
      case 'LicenceNumber':
        if (role === 'Driver' && value && !validateLicenseNumber(value)) {
          error = 'License number must be 5-15 characters (letters and numbers only)';
        }
        break;
      case 'vechicleType':
        if (role === 'Driver' && value && value.length < 2) {
          error = 'Vehicle type must be at least 2 characters';
        }
        break;
      case 'vechicleNumber':
        if (role === 'Driver' && value && !validateVehicleNumber(value)) {
          error = 'Vehicle number must be 4-15 characters (letters, numbers, hyphens only)';
        }
        break;
      default:
        break;
    }

    return error;
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    setErr("");
    setMsg("");

    // Real-time validation as user types
    if (touched[name] || value.length > 0) {
      const error = validateField(name, value);
      setErrors(prev => ({
        ...prev,
        [name]: error
      }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));

    const error = validateField(name, value);
    setErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  const onRoleChange = (r) => {
    setRole(r);
    setErr("");
    setMsg("");
    setErrors({});
    setTouched({});
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
      {/* 🔳 Full Background */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-green-600 to-blue-800"
        style={{ height: "100vh" }} // Ensure it covers full viewport height
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

          {/* Form Progress Indicator */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-black">Form Progress</span>
              <span className="text-sm text-gray-600">{getFormProgress()}% Complete</span>
            </div>
            <div className="w-full bg-white/40 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-emerald-500 to-teal-600 h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${getFormProgress()}%` }}
              ></div>
            </div>
          </div>

          {/* 📄 The Form */}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1 text-black">First name</label>
              <div className="relative">
                <input 
                  name="firstname" 
                  value={form.firstname} 
                  onChange={onChange}
                  onBlur={handleBlur}
                  maxLength={getMaxLength('firstname')}
                  className={`w-full rounded-lg border px-3 py-2 pr-12 transition-all duration-200 ${
                    getFieldStatus('firstname') === 'error'
                      ? 'border-red-500 bg-red-50' 
                      : getFieldStatus('firstname') === 'success'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-300'
                  }`} 
                  placeholder="e.g., Amal" 
                  required 
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                  {getFieldStatus('firstname') === 'success' && (
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {getFieldStatus('firstname') === 'error' && (
                    <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                  <span className={`text-xs ${
                    getCharacterCount(form.firstname) > getMaxLength('firstname') * 0.8 
                      ? 'text-orange-500' 
                      : 'text-gray-400'
                  }`}>
                    {getCharacterCount(form.firstname)}/{getMaxLength('firstname')}
                  </span>
                </div>
              </div>
              {errors.firstname && touched.firstname && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {errors.firstname}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm mb-1 text-black">Last name</label>
              <div className="relative">
                <input 
                  name="lastname" 
                  value={form.lastname} 
                  onChange={onChange}
                  onBlur={handleBlur}
                  maxLength={getMaxLength('lastname')}
                  className={`w-full rounded-lg border px-3 py-2 pr-12 transition-all duration-200 ${
                    getFieldStatus('lastname') === 'error'
                      ? 'border-red-500 bg-red-50' 
                      : getFieldStatus('lastname') === 'success'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-300'
                  }`} 
                  placeholder="e.g., Perera" 
                  required 
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                  {getFieldStatus('lastname') === 'success' && (
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {getFieldStatus('lastname') === 'error' && (
                    <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                  <span className={`text-xs ${
                    getCharacterCount(form.lastname) > getMaxLength('lastname') * 0.8 
                      ? 'text-orange-500' 
                      : 'text-gray-400'
                  }`}>
                    {getCharacterCount(form.lastname)}/{getMaxLength('lastname')}
                  </span>
                </div>
              </div>
              {errors.lastname && touched.lastname && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {errors.lastname}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm mb-1 text-black">Email</label>
              <div className="relative">
                <input 
                  name="email" 
                  type="email" 
                  value={form.email} 
                  onChange={onChange}
                  onBlur={handleBlur}
                  maxLength={getMaxLength('email')}
                  className={`w-full rounded-lg border px-3 py-2 pr-12 transition-all duration-200 ${
                    getFieldStatus('email') === 'error'
                      ? 'border-red-500 bg-red-50' 
                      : getFieldStatus('email') === 'success'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-300'
                  }`} 
                  placeholder="you@example.com" 
                  required 
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                  {getFieldStatus('email') === 'success' && (
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {getFieldStatus('email') === 'error' && (
                    <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                  <span className={`text-xs ${
                    getCharacterCount(form.email) > getMaxLength('email') * 0.8 
                      ? 'text-orange-500' 
                      : 'text-gray-400'
                  }`}>
                    {getCharacterCount(form.email)}/{getMaxLength('email')}
                  </span>
                </div>
              </div>
              {errors.email && touched.email && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {errors.email}
                </p>
              )}
              {form.email && !errors.email && touched.email && (
                <p className="mt-1 text-sm text-green-600 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Valid email format
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm mb-1 text-black">Phone</label>
              <div className="relative">
                <input 
                  name="phone" 
                  value={form.phone} 
                  onChange={onChange}
                  onBlur={handleBlur}
                  maxLength={getMaxLength('phone')}
                  className={`w-full rounded-lg border px-3 py-2 pr-12 transition-all duration-200 ${
                    getFieldStatus('phone') === 'error'
                      ? 'border-red-500 bg-red-50' 
                      : getFieldStatus('phone') === 'success'
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-300'
                  }`} 
                  placeholder="07XXXXXXXX" 
                  required 
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                  {getFieldStatus('phone') === 'success' && (
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  {getFieldStatus('phone') === 'error' && (
                    <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                  <span className={`text-xs ${
                    getCharacterCount(form.phone) > getMaxLength('phone') * 0.8 
                      ? 'text-orange-500' 
                      : 'text-gray-400'
                  }`}>
                    {getCharacterCount(form.phone)}/{getMaxLength('phone')}
                  </span>
                </div>
              </div>
              {errors.phone && touched.phone && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {errors.phone}
                </p>
              )}
              {form.phone && !errors.phone && touched.phone && (
                <p className="mt-1 text-sm text-green-600 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Valid phone number format
                </p>
              )}
            </div>

            {/* 🧭 Tour Guide Fields */}
            {role === "TourGuide" && (
              <>
                <div>
                  <label className="block text-sm mb-1 text-black">Guide Registration No</label>
                  <div className="relative">
                    <input 
                      name="Guide_Registration_No" 
                      value={form.Guide_Registration_No} 
                      onChange={onChange}
                      onBlur={handleBlur}
                      maxLength={getMaxLength('Guide_Registration_No')}
                      className={`w-full rounded-lg border px-3 py-2 pr-12 transition-all duration-200 ${
                        getFieldStatus('Guide_Registration_No') === 'error'
                          ? 'border-red-500 bg-red-50' 
                          : getFieldStatus('Guide_Registration_No') === 'success'
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-300'
                      }`} 
                      placeholder="G-12345" 
                      required 
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                      {getFieldStatus('Guide_Registration_No') === 'success' && (
                        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {getFieldStatus('Guide_Registration_No') === 'error' && (
                        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                      <span className={`text-xs ${
                        getCharacterCount(form.Guide_Registration_No) > getMaxLength('Guide_Registration_No') * 0.8 
                          ? 'text-orange-500' 
                          : 'text-gray-400'
                      }`}>
                        {getCharacterCount(form.Guide_Registration_No)}/{getMaxLength('Guide_Registration_No')}
                      </span>
                    </div>
                  </div>
                  {errors.Guide_Registration_No && touched.Guide_Registration_No && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {errors.Guide_Registration_No}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm mb-1 text-black">Experience (years)</label>
                  <div className="relative">
                    <input 
                      name="Experience_Year" 
                      type="number" 
                      min="0" 
                      max="50"
                      value={form.Experience_Year} 
                      onChange={onChange}
                      onBlur={handleBlur}
                      className={`w-full rounded-lg border px-3 py-2 pr-12 transition-all duration-200 ${
                        getFieldStatus('Experience_Year') === 'error'
                          ? 'border-red-500 bg-red-50' 
                          : getFieldStatus('Experience_Year') === 'success'
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-300'
                      }`} 
                      placeholder="e.g., 3" 
                      required 
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                      {getFieldStatus('Experience_Year') === 'success' && (
                        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {getFieldStatus('Experience_Year') === 'error' && (
                        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                    </div>
                  </div>
                  {errors.Experience_Year && touched.Experience_Year && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {errors.Experience_Year}
                    </p>
                  )}
                </div>
              </>
            )}

            {/* 🚙 Driver Fields */}
            {role === "Driver" && (
              <>
                <div>
                  <label className="block text-sm mb-1 text-black">Licence Number</label>
                  <div className="relative">
                    <input 
                      name="LicenceNumber" 
                      value={form.LicenceNumber} 
                      onChange={onChange}
                      onBlur={handleBlur}
                      maxLength={getMaxLength('LicenceNumber')}
                      className={`w-full rounded-lg border px-3 py-2 pr-12 transition-all duration-200 ${
                        getFieldStatus('LicenceNumber') === 'error'
                          ? 'border-red-500 bg-red-50' 
                          : getFieldStatus('LicenceNumber') === 'success'
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-300'
                      }`} 
                      placeholder="B1234567" 
                      required 
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                      {getFieldStatus('LicenceNumber') === 'success' && (
                        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {getFieldStatus('LicenceNumber') === 'error' && (
                        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                      <span className={`text-xs ${
                        getCharacterCount(form.LicenceNumber) > getMaxLength('LicenceNumber') * 0.8 
                          ? 'text-orange-500' 
                          : 'text-gray-400'
                      }`}>
                        {getCharacterCount(form.LicenceNumber)}/{getMaxLength('LicenceNumber')}
                      </span>
                    </div>
                  </div>
                  {errors.LicenceNumber && touched.LicenceNumber && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {errors.LicenceNumber}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm mb-1 text-black">Vehicle Type</label>
                  <div className="relative">
                    <input 
                      name="vechicleType" 
                      value={form.vechicleType} 
                      onChange={onChange}
                      onBlur={handleBlur}
                      maxLength={getMaxLength('vechicleType')}
                      className={`w-full rounded-lg border px-3 py-2 pr-12 transition-all duration-200 ${
                        getFieldStatus('vechicleType') === 'error'
                          ? 'border-red-500 bg-red-50' 
                          : getFieldStatus('vechicleType') === 'success'
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-300'
                      }`} 
                      placeholder="Safari Jeep" 
                      required 
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                      {getFieldStatus('vechicleType') === 'success' && (
                        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {getFieldStatus('vechicleType') === 'error' && (
                        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                      <span className={`text-xs ${
                        getCharacterCount(form.vechicleType) > getMaxLength('vechicleType') * 0.8 
                          ? 'text-orange-500' 
                          : 'text-gray-400'
                      }`}>
                        {getCharacterCount(form.vechicleType)}/{getMaxLength('vechicleType')}
                      </span>
                    </div>
                  </div>
                  {errors.vechicleType && touched.vechicleType && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {errors.vechicleType}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm mb-1 text-black">Vehicle Number</label>
                  <div className="relative">
                    <input 
                      name="vechicleNumber" 
                      value={form.vechicleNumber} 
                      onChange={onChange}
                      onBlur={handleBlur}
                      maxLength={getMaxLength('vechicleNumber')}
                      className={`w-full rounded-lg border px-3 py-2 pr-12 transition-all duration-200 ${
                        getFieldStatus('vechicleNumber') === 'error'
                          ? 'border-red-500 bg-red-50' 
                          : getFieldStatus('vechicleNumber') === 'success'
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-300'
                      }`} 
                      placeholder="WP-AB-1234" 
                      required 
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                      {getFieldStatus('vechicleNumber') === 'success' && (
                        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {getFieldStatus('vechicleNumber') === 'error' && (
                        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                      <span className={`text-xs ${
                        getCharacterCount(form.vechicleNumber) > getMaxLength('vechicleNumber') * 0.8 
                          ? 'text-orange-500' 
                          : 'text-gray-400'
                      }`}>
                        {getCharacterCount(form.vechicleNumber)}/{getMaxLength('vechicleNumber')}
                      </span>
                    </div>
                  </div>
                  {errors.vechicleNumber && touched.vechicleNumber && (
                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {errors.vechicleNumber}
                    </p>
                  )}
                </div>
              </>
            )}

            <div className="md:col-span-2 mt-2 flex items-center gap-3">
              <button 
                type="submit" 
                disabled={loading || Object.keys(errors).some(key => errors[key])} 
                className={`inline-flex items-center justify-center rounded-lg px-4 py-2 text-white transition-all duration-200 ${
                  loading || Object.keys(errors).some(key => errors[key])
                    ? "bg-gray-400 cursor-not-allowed" 
                    : "bg-emerald-600 hover:bg-emerald-700 transform hover:scale-105"
                }`}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Submitting...
                  </div>
                ) : (
                  'Submit Application'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
