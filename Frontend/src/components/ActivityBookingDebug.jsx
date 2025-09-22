import React, { useState } from 'react';
import { touristService } from '../services/touristService.js';

/**
 * Activity Booking Debug Component
 * Use this to test and debug the specific booking issue
 */
const ActivityBookingDebug = () => {
  const [testData, setTestData] = useState({
    activityId: '',
    bookingDate: '2025-01-15',
    numberOfParticipants: 2,
    requestTourGuide: false
  });
  
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const testBooking = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      console.log('Testing booking with data:', testData);
      
      // First validate the data
      if (!testData.activityId) {
        throw new Error('Activity ID is required');
      }
      
      if (!testData.bookingDate) {
        throw new Error('Booking date is required');
      }
      
      if (!testData.numberOfParticipants || testData.numberOfParticipants < 1) {
        throw new Error('Number of participants must be at least 1');
      }
      
      // Test with exact same structure as ActivityList
      const bookingPayload = {
        activityId: testData.activityId,
        bookingDate: testData.bookingDate,
        numberOfParticipants: parseInt(testData.numberOfParticipants),
        requestTourGuide: Boolean(testData.requestTourGuide),
        preferredDate: testData.bookingDate
      };
      
      console.log('Sending booking payload:', bookingPayload);
      
      const response = await touristService.createBooking(bookingPayload);
      
      setResult({
        success: true,
        data: response.data,
        message: 'Booking successful!'
      });
      
      console.log('Booking response:', response.data);
      
    } catch (error) {
      console.error('Booking error:', error);
      
      let errorMessage = 'Unknown error';
      let errorDetails = {};
      
      if (error.response) {
        // Server error
        errorMessage = error.response.data?.message || `Server error: ${error.response.status}`;
        errorDetails = {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers
        };
      } else if (error.request) {
        // Network error
        errorMessage = 'Network error - could not reach server';
        errorDetails = { request: error.request };
      } else {
        // Other error
        errorMessage = error.message;
      }
      
      setResult({
        success: false,
        error: errorMessage,
        details: errorDetails
      });
    } finally {
      setLoading(false);
    }
  };

  const testSlotCheck = async () => {
    if (!testData.activityId || !testData.bookingDate) {
      alert('Please enter Activity ID and Date first');
      return;
    }
    
    setLoading(true);
    try {
      const response = await touristService.checkAvailableSlots(
        testData.activityId, 
        testData.bookingDate
      );
      
      setResult({
        success: true,
        data: response.data,
        message: 'Slot check successful!'
      });
      
      console.log('Slot check response:', response.data);
      
    } catch (error) {
      console.error('Slot check error:', error);
      setResult({
        success: false,
        error: error.response?.data?.message || error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">🧪 Activity Booking Debug Tool</h2>
      
      {/* Test Data Input */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Activity ID (Required)
          </label>
          <input
            type="text"
            value={testData.activityId}
            onChange={(e) => setTestData(prev => ({ ...prev, activityId: e.target.value }))}
            placeholder="Enter a valid activity ObjectId from your database"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Get this from your database - should be a valid MongoDB ObjectId
          </p>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Booking Date
            </label>
            <input
              type="date"
              value={testData.bookingDate}
              onChange={(e) => setTestData(prev => ({ ...prev, bookingDate: e.target.value }))}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Participants
            </label>
            <input
              type="number"
              value={testData.numberOfParticipants}
              onChange={(e) => setTestData(prev => ({ ...prev, numberOfParticipants: parseInt(e.target.value) }))}
              min="1"
              max="20"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={testData.requestTourGuide}
              onChange={(e) => setTestData(prev => ({ ...prev, requestTourGuide: e.target.checked }))}
              className="mr-2"
            />
            <span className="text-sm font-medium text-gray-700">Request Tour Guide (+LKR 1500)</span>
          </label>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={testSlotCheck}
          disabled={loading || !testData.activityId}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Testing...' : 'Test Slot Check'}
        </button>
        
        <button
          onClick={testBooking}
          disabled={loading || !testData.activityId}
          className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Testing...' : 'Test Booking'}
        </button>
      </div>
      
      {/* Current Test Data Display */}
      <div className="mb-6 p-4 bg-gray-50 rounded-md">
        <h3 className="font-medium text-gray-800 mb-2">Current Test Data:</h3>
        <pre className="text-sm text-gray-600 overflow-x-auto">
          {JSON.stringify(testData, null, 2)}
        </pre>
      </div>
      
      {/* Results Display */}
      {result && (
        <div className={`p-4 rounded-md ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <h3 className={`font-medium ${result.success ? 'text-green-800' : 'text-red-800'} mb-2`}>
            {result.success ? '✅ Success' : '❌ Error'}
          </h3>
          
          {result.success ? (
            <div>
              <p className="text-green-700 mb-2">{result.message}</p>
              <pre className="text-sm text-green-600 overflow-x-auto bg-green-100 p-2 rounded">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            </div>
          ) : (
            <div>
              <p className="text-red-700 mb-2">{result.error}</p>
              {result.details && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-red-600 font-medium">
                    Show Error Details
                  </summary>
                  <pre className="text-sm text-red-600 overflow-x-auto bg-red-100 p-2 rounded mt-2">
                    {JSON.stringify(result.details, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Quick Setup Instructions */}
      <div className="mt-6 p-4 bg-blue-50 rounded-md">
        <h3 className="font-medium text-blue-800 mb-2">🔧 Quick Setup</h3>
        <ol className="text-sm text-blue-700 space-y-1">
          <li>1. Get a valid Activity ID from your database (Activities collection)</li>
          <li>2. Make sure you're logged in as a tourist</li>
          <li>3. Test slot check first to verify the activity exists</li>
          <li>4. Then test the booking</li>
          <li>5. Check the browser console for detailed logs</li>
        </ol>
      </div>
    </div>
  );
};

export default ActivityBookingDebug;