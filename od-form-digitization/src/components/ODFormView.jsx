import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import Modal from './Modal';

function ODFormView({ formId, isOpen, onClose }) {
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchFormData() {
      if (!formId) return;

      try {
        setLoading(true);
        const formRef = doc(db, 'odForms', formId);
        const formSnap = await getDoc(formRef);

        if (formSnap.exists()) {
          setForm({ id: formSnap.id, ...formSnap.data() });
        } else {
          setError('Form not found');
        }
      } catch (error) {
        console.error('Error fetching form:', error);
        setError('Failed to load form data');
      } finally {
        setLoading(false);
      }
    }

    if (isOpen) {
      fetchFormData();
    }
  }, [formId, isOpen]);

  const getStatusClass = (status) => {
    switch (status) {
      case 'approved': return 'text-success';
      case 'rejected': return 'text-danger';
      default: return 'text-warning';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const renderFormContent = () => {
    if (loading) return <div className="loading-spinner">Loading form details...</div>;
    if (error) return <div className="alert alert-danger">{error}</div>;
    if (!form) return <div>No form data available</div>;

    return (
      <div className="od-form-view">
        <div className="mb-4">
          <h4>Form Details</h4>
          <div className="form-preview">
            <p><strong>Form ID:</strong> {form.id}</p>
            <p><strong>Status:</strong> <span className={getStatusClass(form.status)}>
              {form.status.charAt(0).toUpperCase() + form.status.slice(1)}
            </span></p>
            <p><strong>Submitted:</strong> {formatDate(form.createdAt)}</p>
            {form.reviewedAt && (
              <p><strong>Reviewed:</strong> {formatDate(form.reviewedAt)}</p>
            )}
          </div>
        </div>

        <div className="mb-4">
          <h4>Event Information</h4>
          <div className="form-preview">
            <p><strong>Event Name:</strong> {form.eventName}</p>
            <p><strong>Start Date:</strong> {formatDate(form.startDate)}</p>
            <p><strong>End Date:</strong> {formatDate(form.endDate)}</p>
            {form.eventLocation && (
              <p><strong>Location:</strong> {form.eventLocation}</p>
            )}
            {form.eventDescription && (
              <p><strong>Description:</strong> {form.eventDescription}</p>
            )}
          </div>
        </div>

        <div className="mb-4">
          <h4>Student Information</h4>
          <div className="form-preview">
            <p><strong>Name:</strong> {form.studentName}</p>
            <p><strong>Roll Number:</strong> {form.studentRollNumber}</p>
            {form.studentDepartment && (
              <p><strong>Department:</strong> {form.studentDepartment}</p>
            )}
            {form.studentYear && (
              <p><strong>Year:</strong> {form.studentYear}</p>
            )}
          </div>
        </div>

        {form.reason && (
          <div className="mb-4">
            <h4>Reason for OD</h4>
            <div className="form-preview">
              <p>{form.reason}</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  const footerButtons = (
    <>
      {form && form.status === 'approved' && (
        <button className="btn btn-secondary">
          Download PDF
        </button>
      )}
      <button className="btn btn-primary" onClick={onClose}>
        Close
      </button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="OD Form Details"
      footer={footerButtons}
    >
      {renderFormContent()}
    </Modal>
  );
}

export default ODFormView;
