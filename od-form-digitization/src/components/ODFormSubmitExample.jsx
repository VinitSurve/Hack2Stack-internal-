import React, { useState } from 'react';
import { createODRequest, updateODRequestStatus, trackUserActivity } from '../services/firebaseDbUtils';
import { auth } from '../firebase';

const ODFormSubmitExample = () => {
  const [formData, setFormData] = useState({
    reason: '',
    fromDate: '',
    toDate: '',
    description: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setResult(null);

    try {
      // Add current user ID to form data
      const currentUser = auth.currentUser;
      const userId = currentUser ? currentUser.uid : 'anonymous';
      const completeFormData = {
        ...formData,
        userId,
        userEmail: currentUser?.email || 'anonymous',
        userName: currentUser?.displayName || 'Anonymous User',
      };

      // Write to both databases
      const saveResult = await createODRequest(completeFormData);
      
      // Track user activity
      await trackUserActivity(userId, 'od_form_submitted', {
        formId: saveResult.firestoreId,
        device: navigator.userAgent,
        browser: navigator.vendor,
      });

      setResult(saveResult);
      setFormData({
        reason: '',
        fromDate: '',
        toDate: '',
        description: ''
      });
    } catch (err) {
      console.error('Error submitting form:', err);
      setError(err.message || 'An error occurred while submitting the form');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="od-form-submit-example">
      <h2>Submit OD Form</h2>
      <p>This form will save data to both Firestore and Realtime Database</p>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="reason">Reason for OD</label>
          <input
            type="text"
            id="reason"
            name="reason"
            value={formData.reason}
            onChange={handleChange}
            required
            className="form-control"
          />
        </div>

        <div className="form-group">
          <label htmlFor="fromDate">From Date</label>
          <input
            type="date"
            id="fromDate"
            name="fromDate"
            value={formData.fromDate}
            onChange={handleChange}
            required
            className="form-control"
          />
        </div>

        <div className="form-group">
          <label htmlFor="toDate">To Date</label>
          <input
            type="date"
            id="toDate"
            name="toDate"
            value={formData.toDate}
            onChange={handleChange}
            required
            className="form-control"
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="4"
            className="form-control"
            required
          />
        </div>

        <button 
          type="submit" 
          className="btn btn-primary" 
          disabled={submitting}
        >
          {submitting ? 'Submitting...' : 'Submit OD Request'}
        </button>
      </form>

      {error && (
        <div className="alert alert-danger mt-3">
          <p>{error}</p>
        </div>
      )}

      {result && (
        <div className="alert alert-success mt-3">
          <h5>Form submitted successfully!</h5>
          <p>Form saved to both databases:</p>
          <ul>
            <li><strong>Firestore ID:</strong> {result.firestoreId}</li>
            <li><strong>Firestore Path:</strong> {result.firestorePath}</li>
            <li><strong>RTDB Key:</strong> {result.rtdbKey}</li>
            <li><strong>RTDB Path:</strong> {result.rtdbPath}</li>
          </ul>
        </div>
      )}

      {/* Example for admin to update status - normally this would be in a separate component */}
      {result && (
        <div className="mt-4 p-3 border">
          <h5>Admin Actions (Example)</h5>
          <p>Update the status of this OD request:</p>
          <div className="btn-group">
            <button 
              className="btn btn-success"
              onClick={async () => {
                try {
                  await updateODRequestStatus(
                    result.firestoreId, 
                    result.rtdbPath, 
                    'approved', 
                    { approvedBy: 'Admin User', approvedNotes: 'Approved by system' }
                  );
                  alert('Status updated to Approved in both databases');
                } catch (err) {
                  console.error(err);
                  alert('Error updating status: ' + err.message);
                }
              }}
            >
              Approve
            </button>
            <button 
              className="btn btn-danger"
              onClick={async () => {
                try {
                  await updateODRequestStatus(
                    result.firestoreId, 
                    result.rtdbPath, 
                    'rejected', 
                    { rejectedBy: 'Admin User', rejectionReason: 'Reason not valid' }
                  );
                  alert('Status updated to Rejected in both databases');
                } catch (err) {
                  console.error(err);
                  alert('Error updating status: ' + err.message);
                }
              }}
            >
              Reject
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ODFormSubmitExample;