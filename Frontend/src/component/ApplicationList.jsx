import { useState, useEffect } from 'react';
import axios from 'axios';

export default function ApplicationList() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Fetch applications from the backend
    const fetchApplications = async () => {
      try {
        const response = await axios.get('http://localhost:5001/api/applications'); // Update with your backend API endpoint
        setApplications(response.data);
      } catch (e) {
        setError('Failed to fetch applications.');
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white shadow rounded-2xl">
      <h1 className="text-2xl font-semibold mb-4">Applications</h1>

      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && applications.length === 0 && <p>No applications found.</p>}

      {/* Display the list of applications */}
      <ul>
        {applications.map((app) => (
          <li key={app._id} className="border-b border-gray-200 py-4">
            <h3 className="text-xl font-semibold">{app.firstname} {app.lastname}</h3>
            <p className="text-sm text-gray-600">{app.role}</p>
            <p>Status: <span className={`font-semibold ${app.status === 'ApprovedByWPO' ? 'text-green-600' : app.status === 'RejectedByWPO' ? 'text-red-600' : 'text-yellow-600'}`}>{app.status}</span></p>
            <p>Email: {app.email}</p>
            <p>Phone: {app.phone}</p>
            {app.role === 'TourGuide' && (
              <>
                <p>Guide Registration No: {app.Guide_Registration_No}</p>
                <p>Experience: {app.Experience_Year} years</p>
              </>
            )}
            {app.role === 'Driver' && (
              <>
                <p>Licence Number: {app.LicenceNumber}</p>
                <p>Vehicle Type: {app.vechicleType}</p>
                <p>Vehicle Number: {app.vechicleNumber}</p>
              </>
            )}
            <p>Notes: {app.notes || 'No remarks'}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
