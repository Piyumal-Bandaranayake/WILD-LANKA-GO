import React, { useState } from 'react';
import { touristDebugger, testValidation, debugHelpers } from '../services/touristDebugger.js';
import { touristService } from '../services/touristService.js';

/**
 * Tourist API Tester Component
 * Use this component to test and debug tourist API calls
 */
const TouristApiTester = () => {
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);
  const [testData, setTestData] = useState({
    activityId: '',
    eventId: '',
    bookingDate: '2025-01-15',
    numberOfParticipants: 2
  });

  const runTest = async (testName, testFunction) => {
    setLoading(true);
    try {
      const result = await testFunction();
      setResults(prev => ({
        ...prev,
        [testName]: result
      }));
    } catch (error) {
      setResults(prev => ({
        ...prev,
        [testName]: { success: false, error: error.message }
      }));
    } finally {
      setLoading(false);
    }
  };

  const renderResult = (testName, result) => {
    if (!result) return null;
    
    return (
      <div className={`test-result ${result.success ? 'success' : 'error'}`}>
        <h4>{testName}</h4>
        {result.success ? (
          <div>
            <span className="status">✅ Success</span>
            <pre>{JSON.stringify(result.data, null, 2)}</pre>
          </div>
        ) : (
          <div>
            <span className="status">❌ Error</span>
            <p>{result.error || result.errors?.join(', ')}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="tourist-api-tester">
      <h2>🧪 Tourist API Tester</h2>
      
      {/* Test Configuration */}
      <div className="test-config">
        <h3>Test Configuration</h3>
        <div className="form-row">
          <label>
            Activity ID:
            <input
              type="text"
              value={testData.activityId}
              onChange={(e) => setTestData(prev => ({ ...prev, activityId: e.target.value }))}
              placeholder="Enter activity ObjectId"
            />
          </label>
          <label>
            Event ID:
            <input
              type="text"
              value={testData.eventId}
              onChange={(e) => setTestData(prev => ({ ...prev, eventId: e.target.value }))}
              placeholder="Enter event ObjectId"
            />
          </label>
        </div>
        <div className="form-row">
          <label>
            Booking Date:
            <input
              type="date"
              value={testData.bookingDate}
              onChange={(e) => setTestData(prev => ({ ...prev, bookingDate: e.target.value }))}
            />
          </label>
          <label>
            Participants:
            <input
              type="number"
              value={testData.numberOfParticipants}
              onChange={(e) => setTestData(prev => ({ ...prev, numberOfParticipants: parseInt(e.target.value) }))}
              min="1"
              max="20"
            />
          </label>
        </div>
      </div>

      {/* Test Buttons */}
      <div className="test-buttons">
        <h3>API Tests</h3>
        <div className="button-grid">
          <button 
            onClick={() => runTest('Dashboard Data', () => touristDebugger.testDashboardData())}
            disabled={loading}
          >
            Test Dashboard Data
          </button>
          
          <button 
            onClick={() => runTest('Check Slots', () => 
              testData.activityId 
                ? touristDebugger.testCheckSlots(testData.activityId, testData.bookingDate)
                : Promise.reject(new Error('Activity ID required'))
            )}
            disabled={loading || !testData.activityId}
          >
            Test Check Slots
          </button>
          
          <button 
            onClick={() => runTest('Create Booking', () => 
              testData.activityId 
                ? touristDebugger.testBooking(testData.activityId)
                : Promise.reject(new Error('Activity ID required'))
            )}
            disabled={loading || !testData.activityId}
          >
            Test Create Booking
          </button>
          
          <button 
            onClick={() => runTest('Event Registration', () => 
              testData.eventId 
                ? touristDebugger.testEventRegistration(testData.eventId)
                : Promise.reject(new Error('Event ID required'))
            )}
            disabled={loading || !testData.eventId}
          >
            Test Event Registration
          </button>
          
          <button 
            onClick={() => runTest('Create Donation', () => touristDebugger.testDonation())}
            disabled={loading}
          >
            Test Create Donation
          </button>
          
          <button 
            onClick={() => runTest('Create Feedback', () => touristDebugger.testFeedback())}
            disabled={loading}
          >
            Test Create Feedback
          </button>
          
          <button 
            onClick={() => runTest('Create Complaint', () => touristDebugger.testComplaint())}
            disabled={loading}
          >
            Test Create Complaint
          </button>
        </div>
      </div>

      {/* Validation Tests */}
      <div className="validation-tests">
        <h3>Validation Tests</h3>
        <button 
          onClick={() => {
            testValidation.runValidationTests();
            alert('Check console for validation test results');
          }}
        >
          Run Validation Tests
        </button>
        
        <button 
          onClick={() => {
            debugHelpers.logConfig();
            debugHelpers.logSampleData();
            alert('Check console for configuration and sample data');
          }}
        >
          Log Configuration
        </button>
      </div>

      {/* Manual Test Section */}
      <div className="manual-test">
        <h3>Manual API Call Test</h3>
        <ManualApiTest />
      </div>

      {/* Results Display */}
      <div className="test-results">
        <h3>Test Results</h3>
        {loading && <p>Running test...</p>}
        {Object.entries(results).map(([testName, result]) => 
          renderResult(testName, result)
        )}
      </div>

      <style jsx>{`
        .tourist-api-tester {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .test-config, .test-buttons, .validation-tests, .manual-test {
          margin: 20px 0;
          padding: 15px;
          border: 1px solid #ddd;
          border-radius: 8px;
        }
        
        .form-row {
          display: flex;
          gap: 15px;
          margin: 10px 0;
        }
        
        .form-row label {
          display: flex;
          flex-direction: column;
          flex: 1;
        }
        
        .form-row input {
          margin-top: 5px;
          padding: 8px;
          border: 1px solid #ccc;
          border-radius: 4px;
        }
        
        .button-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 10px;
        }
        
        .button-grid button, .validation-tests button, .manual-test button {
          padding: 10px 15px;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .button-grid button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }
        
        .button-grid button:hover:not(:disabled) {
          background: #0056b3;
        }
        
        .test-results {
          margin-top: 20px;
        }
        
        .test-result {
          margin: 10px 0;
          padding: 15px;
          border-radius: 8px;
        }
        
        .test-result.success {
          background: #d4edda;
          border: 1px solid #c3e6cb;
        }
        
        .test-result.error {
          background: #f8d7da;
          border: 1px solid #f5c6cb;
        }
        
        .test-result pre {
          background: #f8f9fa;
          padding: 10px;
          border-radius: 4px;
          overflow-x: auto;
          max-height: 300px;
        }
        
        .status {
          font-weight: bold;
          display: block;
          margin-bottom: 10px;
        }
      `}</style>
    </div>
  );
};

/**
 * Manual API Test Component
 */
const ManualApiTest = () => {
  const [endpoint, setEndpoint] = useState('dashboard/stats');
  const [method, setMethod] = useState('GET');
  const [requestBody, setRequestBody] = useState('{}');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  const endpoints = [
    'dashboard/stats',
    'my-bookings', 
    'my-registrations',
    'my-donations',
    'my-feedback',
    'my-complaints',
    'bookings',
    'registrations',
    'donations',
    'feedback',
    'complaints',
    'emergency'
  ];

  const makeApiCall = async () => {
    setLoading(true);
    try {
      let result;
      const body = method !== 'GET' ? JSON.parse(requestBody) : undefined;
      
      switch (method) {
        case 'GET':
          if (endpoint === 'dashboard/stats') {
            result = await touristService.getDashboardStats();
          } else if (endpoint === 'my-bookings') {
            result = await touristService.getMyBookings();
          } else if (endpoint === 'my-registrations') {
            result = await touristService.getMyEventRegistrations();
          } else if (endpoint === 'my-donations') {
            result = await touristService.getMyDonations();
          } else if (endpoint === 'my-feedback') {
            result = await touristService.getMyFeedback();
          } else if (endpoint === 'my-complaints') {
            result = await touristService.getMyComplaints();
          }
          break;
          
        case 'POST':
          if (endpoint === 'bookings') {
            result = await touristService.createBooking(body);
          } else if (endpoint === 'registrations') {
            result = await touristService.registerForEvent(body);
          } else if (endpoint === 'donations') {
            result = await touristService.createDonation(body);
          } else if (endpoint === 'feedback') {
            result = await touristService.createFeedback(body);
          } else if (endpoint === 'complaints') {
            result = await touristService.createComplaint(body);
          } else if (endpoint === 'emergency') {
            result = await touristService.reportEmergency(body);
          }
          break;
      }
      
      setResponse({ success: true, data: result?.data });
    } catch (error) {
      setResponse({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="manual-api-test">
      <div className="api-form">
        <div className="form-row">
          <label>
            Method:
            <select value={method} onChange={(e) => setMethod(e.target.value)}>
              <option value="GET">GET</option>
              <option value="POST">POST</option>
            </select>
          </label>
          <label>
            Endpoint:
            <select value={endpoint} onChange={(e) => setEndpoint(e.target.value)}>
              {endpoints.map(ep => (
                <option key={ep} value={ep}>{ep}</option>
              ))}
            </select>
          </label>
        </div>
        
        {method !== 'GET' && (
          <label>
            Request Body (JSON):
            <textarea
              value={requestBody}
              onChange={(e) => setRequestBody(e.target.value)}
              rows={6}
              placeholder='{"key": "value"}'
            />
          </label>
        )}
        
        <button onClick={makeApiCall} disabled={loading}>
          {loading ? 'Making API Call...' : 'Make API Call'}
        </button>
      </div>
      
      {response && (
        <div className={`api-response ${response.success ? 'success' : 'error'}`}>
          <h4>Response:</h4>
          <pre>{JSON.stringify(response, null, 2)}</pre>
        </div>
      )}
      
      <style jsx>{`
        .api-form label {
          display: block;
          margin: 10px 0;
        }
        
        .api-form select, .api-form textarea {
          width: 100%;
          padding: 8px;
          margin-top: 5px;
          border: 1px solid #ccc;
          border-radius: 4px;
        }
        
        .api-response {
          margin-top: 15px;
          padding: 15px;
          border-radius: 8px;
        }
        
        .api-response.success {
          background: #d4edda;
          border: 1px solid #c3e6cb;
        }
        
        .api-response.error {
          background: #f8d7da;
          border: 1px solid #f5c6cb;
        }
        
        .api-response pre {
          background: #f8f9fa;
          padding: 10px;
          border-radius: 4px;
          overflow-x: auto;
          max-height: 400px;
        }
      `}</style>
    </div>
  );
};

export default TouristApiTester;