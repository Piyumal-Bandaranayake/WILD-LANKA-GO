import React, { useState } from 'react';
import { touristService } from '../services/touristService.js';

/**
 * Quick test component to verify tourist API functionality
 * This component tests the core tourist service methods to ensure they work correctly
 */
const TouristApiTest = () => {
    const [testResults, setTestResults] = useState([]);
    const [loading, setLoading] = useState(false);

    const addResult = (test, success, data, error) => {
        setTestResults(prev => [...prev, {
            test,
            success,
            data: success ? data : null,
            error: success ? null : error,
            timestamp: new Date().toLocaleTimeString()
        }]);
    };

    const runTests = async () => {
        setLoading(true);
        setTestResults([]);

        // Test 1: Get Dashboard Stats
        try {
            console.log('Testing getDashboardStats...');
            const stats = await touristService.getDashboardStats();
            addResult('getDashboardStats', true, stats.data);
        } catch (error) {
            addResult('getDashboardStats', false, null, error.message);
        }

        // Test 2: Get My Bookings
        try {
            console.log('Testing getMyBookings...');
            const bookings = await touristService.getMyBookings();
            addResult('getMyBookings', true, bookings.data);
        } catch (error) {
            addResult('getMyBookings', false, null, error.message);
        }

        // Test 3: Check Available Slots (requires activity ID)
        try {
            console.log('Testing checkAvailableSlots...');
            // Using a test activity ID and date
            const slots = await touristService.checkAvailableSlots('test-activity-id', '2024-01-20');
            addResult('checkAvailableSlots', true, slots.data);
        } catch (error) {
            addResult('checkAvailableSlots', false, null, error.message);
        }

        // Test 4: Test Booking Creation (with validation)
        try {
            console.log('Testing createBooking validation...');
            const testBooking = {
                activityId: 'test-activity-123',
                bookingDate: '2024-01-25',
                numberOfParticipants: '2', // String that should be converted to number
                requestTourGuide: 'true', // String that should be converted to boolean
                preferredDate: '2024-01-25'
            };
            
            // This should fail at the API level but pass validation
            const bookingResult = await touristService.createBooking(testBooking);
            addResult('createBooking', true, bookingResult.data);
        } catch (error) {
            // Expected to fail since we're using test data
            addResult('createBooking', false, null, `Expected error: ${error.message}`);
        }

        setLoading(false);
    };

    const clearResults = () => {
        setTestResults([]);
    };

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Tourist API Test Suite</h2>
            
            <div className="mb-6 space-x-4">
                <button
                    onClick={runTests}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                    {loading ? 'Running Tests...' : 'Run API Tests'}
                </button>
                
                <button
                    onClick={clearResults}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                    Clear Results
                </button>
            </div>

            {testResults.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-700">Test Results:</h3>
                    
                    {testResults.map((result, index) => (
                        <div
                            key={index}
                            className={`p-4 rounded-lg border-l-4 ${
                                result.success 
                                    ? 'bg-green-50 border-green-500' 
                                    : 'bg-red-50 border-red-500'
                            }`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="font-medium text-gray-800">{result.test}</h4>
                                <span className="text-sm text-gray-500">{result.timestamp}</span>
                            </div>
                            
                            <div className={`text-sm ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                                Status: {result.success ? '✅ Success' : '❌ Failed'}
                            </div>
                            
                            {result.error && (
                                <div className="mt-2 text-sm text-red-600">
                                    <strong>Error:</strong> {result.error}
                                </div>
                            )}
                            
                            {result.data && (
                                <div className="mt-2">
                                    <details className="text-sm">
                                        <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                                            Show Response Data
                                        </summary>
                                        <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-40">
                                            {JSON.stringify(result.data, null, 2)}
                                        </pre>
                                    </details>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-medium text-blue-800 mb-2">About This Test</h3>
                <p className="text-sm text-blue-700">
                    This test verifies that the tourist service API calls are working correctly after fixing 
                    the "protectedApi.post is not a function" error. The tests check various endpoints and 
                    validate that the authentication and API client configuration is properly set up.
                </p>
            </div>
        </div>
    );
};

export default TouristApiTest;