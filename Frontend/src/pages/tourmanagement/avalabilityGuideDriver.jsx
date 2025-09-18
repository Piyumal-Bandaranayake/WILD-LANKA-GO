import React, { useEffect, useState } from "react";
import axios from "axios";

const TourGuideAndDriverPage = () => {
  const [tourGuides, setTourGuides] = useState([]);
  const [safariDrivers, setSafariDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Fetch all Tour Guides
    const fetchTourGuides = async () => {
      try {
        const res = await axios.get("http://localhost:5001/api/tourGuides");
        setTourGuides(res.data);
      } catch (err) {
        setError("Error fetching tour guides");
      }
    };

    // Fetch all Safari Drivers
    const fetchSafariDrivers = async () => {
      try {
        const res = await axios.get("http://localhost:5001/api/drivers");
        setSafariDrivers(res.data);
      } catch (err) {
        setError("Error fetching safari drivers");
      }
    };

    fetchTourGuides();
    fetchSafariDrivers();
  }, []);

  // Helper function to determine the status class
  const getStatusClass = (status) => {
    switch (status) {
      case "Available":
        return "bg-green-100 text-green-800";
      case "Busy":
        return "bg-red-100 text-red-800";
      case "OnLeave":
        return "bg-yellow-100 text-yellow-800";
      case "Inactive":
        return "bg-gray-100 text-gray-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold text-center mb-8">Tour Guides and Safari Drivers</h1>

      {error && <div className="text-red-500 text-center mb-4">{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        {/* Tour Guides */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-700">Tour Guides</h2>
          <div className="space-y-4">
            {tourGuides.map((guide) => (
              <div
                key={guide._id}
                className="p-6 border rounded-xl shadow-lg bg-white flex flex-col sm:flex-row justify-between items-start hover:shadow-xl transition-shadow duration-300 ease-in-out"
              >
                <div className="mb-4 sm:mb-0 sm:w-3/4">
                  <h3 className="font-medium text-lg text-gray-900">{`${guide.firstname} ${guide.lastname}`}</h3>
                  <p className="text-sm text-gray-500">
                    <strong>Email:</strong> {guide.email}
                  </p>
                  <p className="text-sm text-gray-500">
                    <strong>Phone:</strong> {guide.phone}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Status:</strong> {guide.Status}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Experience:</strong> {guide.Experience_Year} years
                  </p>
                  {/* Display availability with status highlight */}
                  <div
                    className={`inline-flex rounded-full px-3 py-1.5 text-xs font-medium ${getStatusClass(
                      guide.availability
                    )}`}
                  >
                    <strong>Availability:</strong> {guide.availability}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Safari Drivers */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-700">Safari Drivers</h2>
          <div className="space-y-4">
            {safariDrivers.map((driver) => (
              <div
                key={driver._id}
                className="p-6 border rounded-xl shadow-lg bg-white flex flex-col sm:flex-row justify-between items-start hover:shadow-xl transition-shadow duration-300 ease-in-out"
              >
                <div className="mb-4 sm:mb-0 sm:w-3/4">
                  <h3 className="font-medium text-lg text-gray-900">{driver.DriverName}</h3>
                  <p className="text-sm text-gray-500">
                    <strong>Email:</strong> {driver.Email}
                  </p>
                  <p className="text-sm text-gray-500">
                    <strong>Phone:</strong> {driver.PhoneNumber}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Licence No:</strong> {driver.LicenceNumber}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Vehicle Type:</strong> {driver.vechicleType}
                  </p>
                  {/* Display availability with status highlight */}
                  <div
                    className={`inline-flex rounded-full px-3 py-1.5 text-xs font-medium ${getStatusClass(
                      driver.availability
                    )}`}
                  >
                    <strong>Availability:</strong> {driver.availability}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TourGuideAndDriverPage;
