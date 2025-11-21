/**
 * Test component to demonstrate real-time validation functionality
 * This can be used to test the validation system
 */

import React, { useState } from 'react';
import { 
  validateBookingForm, 
  getValidationClasses, 
  getValidationMessageClasses 
} from '../utils/formValidation';

const ValidationTest = () => {
  const [formData, setFormData] = useState({
    touristName: '',
    touristEmail: '',
    touristPhone: '',
    date: '',
    participants: 1,
    specialRequests: '',
    requestTourGuide: false
  });

  const [validationState, setValidationState] = useState({});
  const [touchedFields, setTouchedFields] = useState({});

  const handleFieldChange = (fieldName, value) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
    setTouchedFields(prev => ({ ...prev, [fieldName]: true }));
    
    const validation = validateBookingForm(formData, {}, 0);
    setValidationState(validation.validations);
  };

  const mockActivity = {
    name: 'Wildlife Safari',
    price: 5000,
    capacity: 20,
    minAdvanceBookingDays: 1,
    maxAdvanceBookingDays: 30
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Activity Booking Form Validation Test</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            type="text"
            value={formData.touristName}
            onChange={(e) => handleFieldChange('touristName', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${getValidationClasses(validationState.touristName || {}, touchedFields.touristName)}`}
            placeholder="Enter your name"
          />
          {touchedFields.touristName && validationState.touristName?.message && (
            <p className={getValidationMessageClasses(validationState.touristName.severity)}>
              {validationState.touristName.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={formData.touristEmail}
            onChange={(e) => handleFieldChange('touristEmail', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${getValidationClasses(validationState.touristEmail || {}, touchedFields.touristEmail)}`}
            placeholder="Enter your email"
          />
          {touchedFields.touristEmail && validationState.touristEmail?.message && (
            <p className={getValidationMessageClasses(validationState.touristEmail.severity)}>
              {validationState.touristEmail.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input
            type="tel"
            value={formData.touristPhone}
            onChange={(e) => handleFieldChange('touristPhone', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${getValidationClasses(validationState.touristPhone || {}, touchedFields.touristPhone)}`}
            placeholder="Enter your phone number"
          />
          {touchedFields.touristPhone && validationState.touristPhone?.message && (
            <p className={getValidationMessageClasses(validationState.touristPhone.severity)}>
              {validationState.touristPhone.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => handleFieldChange('date', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${getValidationClasses(validationState.date || {}, touchedFields.date)}`}
            min={new Date().toISOString().split('T')[0]}
          />
          {touchedFields.date && validationState.date?.message && (
            <p className={getValidationMessageClasses(validationState.date.severity)}>
              {validationState.date.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Participants</label>
          <input
            type="number"
            value={formData.participants}
            onChange={(e) => handleFieldChange('participants', parseInt(e.target.value) || 1)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${getValidationClasses(validationState.participants || {}, touchedFields.participants)}`}
            min="1"
            max="20"
          />
          {touchedFields.participants && validationState.participants?.message && (
            <p className={getValidationMessageClasses(validationState.participants.severity)}>
              {validationState.participants.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Special Requests</label>
          <textarea
            value={formData.specialRequests}
            onChange={(e) => handleFieldChange('specialRequests', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 resize-none ${getValidationClasses(validationState.specialRequests || {}, touchedFields.specialRequests)}`}
            rows="3"
            placeholder="Any special requirements..."
          />
          {touchedFields.specialRequests && validationState.specialRequests?.message && (
            <p className={getValidationMessageClasses(validationState.specialRequests.severity)}>
              {validationState.specialRequests.message}
            </p>
          )}
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="tourGuide"
            checked={formData.requestTourGuide}
            onChange={(e) => handleFieldChange('requestTourGuide', e.target.checked)}
            className="mr-2"
          />
          <label htmlFor="tourGuide" className="text-sm font-medium text-gray-700">
            Request Tour Guide (+LKR 5,000)
          </label>
        </div>
        {touchedFields.requestTourGuide && validationState.tourGuide?.message && (
          <p className={getValidationMessageClasses(validationState.tourGuide.severity)}>
            {validationState.tourGuide.message}
          </p>
        )}
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-gray-800 mb-2">Validation Summary:</h3>
        <div className="text-sm space-y-1">
          {Object.entries(validationState)
            .filter(([_, validation]) => validation.message) // Only show fields with messages
            .map(([field, validation]) => (
              <div key={field} className={`p-2 rounded ${validation.severity === 'error' ? 'bg-red-100 text-red-800' : validation.severity === 'warning' ? 'bg-yellow-100 text-yellow-800' : validation.severity === 'success' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                <strong>{field}:</strong> {validation.message}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default ValidationTest;
