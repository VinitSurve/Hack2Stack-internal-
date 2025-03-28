import { useState } from 'react';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import Modal from './Modal';

function EventForm({ isOpen, onClose, onSuccess, eventData = null }) {
  const { currentUser } = useAuth();
  const isEditMode = Boolean(eventData);
  
  const [formData, setFormData] = useState({
    name: eventData?.name || '',
    description: eventData?.description || '',
    location: eventData?.location || '',
    startDate: eventData?.startDate || '',
    endDate: eventData?.endDate || '',
    maxParticipants: eventData?.maxParticipants || ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.name || !formData.startDate || !formData.endDate) {
      setError('Please fill in all required fields');
      return;
    }
    
    // Validate dates
    const startDate = new Date(formData.startDate);
    const endDate = new Date(formData.endDate);
    
    if (endDate < startDate) {
      setError('End date cannot be before start date');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Format dates as YYYY-MM-DD strings for consistency
      const formattedStartDate = formData.startDate.split('T')[0];
      const formattedEndDate = formData.endDate.split('T')[0];
      
      const eventDetails = {
        name: formData.name,
        description: formData.description || '',
        location: formData.location || '',
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : null,
        eventLeaderId: currentUser.uid,
        eventLeaderName: currentUser.displayName || 'Event Leader',
        active: true,
        updatedAt: new Date().toISOString()
      };
      
      if (isEditMode) {
        // Update existing event
        await updateDoc(doc(db, 'events', eventData.id), eventDetails);
        console.log("Event updated successfully:", eventData.id);
      } else {
        // Create new event
        eventDetails.createdAt = new Date().toISOString();
        eventDetails.participantCount = 0;
        const docRef = await addDoc(collection(db, 'events'), eventDetails);
        console.log("Event created successfully with ID:", docRef.id);
      }
      
      setSuccess(true);
      
      // Reset form if creating new event
      if (!isEditMode) {
        setFormData({
          name: '',
          description: '',
          location: '',
          startDate: '',
          endDate: '',
          maxParticipants: ''
        });
      }
      
      // Notify parent component
      if (onSuccess) {
        onSuccess();
      }
      
      // Close modal after a brief delay to show success message
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 2000);
      
    } catch (error) {
      console.error('Error submitting event:', error);
      setError(`Failed to ${isEditMode ? 'update' : 'create'} event: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const renderForm = () => {
    if (success) {
      return (
        <div className="alert alert-success">
          Event {isEditMode ? 'updated' : 'created'} successfully!
        </div>
      );
    }
    
    return (
      <form onSubmit={handleSubmit}>
        {error && <div className="alert alert-danger">{error}</div>}
        
        <div className="form-group">
          <label htmlFor="name" className="form-label">Event Name *</label>
          <input
            type="text"
            id="name"
            name="name"
            className="form-control"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="description" className="form-label">Description</label>
          <textarea
            id="description"
            name="description"
            className="form-control"
            value={formData.description}
            onChange={handleChange}
            rows="3"
          ></textarea>
        </div>
        
        <div className="form-group">
          <label htmlFor="location" className="form-label">Location</label>
          <input
            type="text"
            id="location"
            name="location"
            className="form-control"
            value={formData.location}
            onChange={handleChange}
          />
        </div>
        
        <div className="form-row">
          <div className="form-col">
            <div className="form-group">
              <label htmlFor="startDate" className="form-label">Start Date *</label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                className="form-control"
                value={formData.startDate}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          <div className="form-col">
            <div className="form-group">
              <label htmlFor="endDate" className="form-label">End Date *</label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                className="form-control"
                value={formData.endDate}
                onChange={handleChange}
                required
              />
            </div>
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="maxParticipants" className="form-label">Maximum Participants</label>
          <input
            type="number"
            id="maxParticipants"
            name="maxParticipants"
            className="form-control"
            value={formData.maxParticipants}
            onChange={handleChange}
            min="1"
          />
          <small className="form-text">Leave empty for unlimited participants</small>
        </div>
        
        <div className="form-action-buttons">
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Event' : 'Create Event')}
          </button>
        </div>
      </form>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={!loading ? onClose : undefined}
      title={isEditMode ? 'Edit Event' : 'Create New Event'}
    >
      {renderForm()}
    </Modal>
  );
}

export default EventForm;
