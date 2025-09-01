import axios from "axios";
import ApplyJobForm from "./component/ApplyJobForm.jsx";  // Correct path for ApplyJobForm
import ApplicationList from './component/ApplicationList';  // Correct path for ApplicationList
import "./App.css";

// ✅ Call your backend directly (bypass proxy confusion)
axios.defaults.baseURL = "http://localhost:5001";

export default function App() {
  const submitToAPI = async (payload) => {
    // hit exactly the URL you confirmed works in Postman
    const { data } = await axios.post("/api/applications/apply", payload);
    return data?.message || "Application submitted";
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* ApplyJobForm Component for submitting applications */}
      <ApplyJobForm onSubmit={submitToAPI} />

      {/* ApplicationList Component for displaying submitted applications */}
      <ApplicationList />
    </div>
  );
}
