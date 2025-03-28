import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import Modal from './Modal';
import { createODRequest } from '../services/firebaseDbUtils';

function ODFormCreate({ isOpen, onClose, onSuccess }) {
  const { currentUser } = useAuth();
  const [events, setEvents] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    eventId: '',
    eventName: '',
    startDate: '',
    endDate: '',
    studentRollNumber: '',
    reason: '',
    facultyApprover: ''
  });

  // Fetch events and faculties when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchEvents();
      fetchFaculties();
    }
  }, [isOpen]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null); // Clear any previous errors
      
      // Get today's date for filtering
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Simplified query - using only active flag to avoid potential index issues
      const eventsQuery = query(
        collection(db, 'events'),
        where('active', '==', true)
      );
      
      const querySnapshot = await getDocs(eventsQuery);
      
      const eventsData = [];
      querySnapshot.forEach((doc) => {
        const eventData = { id: doc.id, ...doc.data() };
        
        // Add event leader info for display
        // Filter out expired events here in JavaScript instead of in the query
        const eventEndDate = new Date(eventData.endDate);
        if (eventEndDate >= today) {
          eventsData.push({
            ...eventData,
            eventLeaderInfo: eventData.eventLeaderName ? `(${eventData.eventLeaderName})` : ''
          });
        }
      });
      
      // Sort events by date
      eventsData.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
      
      setEvents(eventsData);
    } catch (error) {
      console.error('Error fetching events:', error);
      setError('Failed to load events: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchFaculties = async () => {
    try {
      setLoading(true);
      const facultiesQuery = query(collection(db, 'users'), where('role', '==', 'faculty'));
      const querySnapshot = await getDocs(facultiesQuery);
      
      const facultiesData = [];
      querySnapshot.forEach((doc) => {
        facultiesData.push({ id: doc.id, ...doc.data() });
      });
      
      setFaculties(facultiesData);
    } catch (error) {
      console.error('Error fetching faculties:', error);
      setError('Failed to load faculty list: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // If selecting an event, update the event name, start and end date
    if (name === 'eventId' && value) {
      const selectedEvent = events.find(event => event.id === value);
      if (selectedEvent) {
        setFormData({
          ...formData,
          eventId: value,
          eventName: selectedEvent.name,
          startDate: selectedEvent.startDate,
          endDate: selectedEvent.endDate,
          eventLeaderId: selectedEvent.eventLeaderId,
          eventLeaderName: selectedEvent.eventLeaderName
        });
        return;
      }
    }
    
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.eventId || !formData.facultyApprover || !formData.studentRollNumber) {
      setError('Please fill in all required fields');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Get current user information for submission
      if (!currentUser || !currentUser.uid) {
        throw new Error("You must be logged in to submit an OD request");
      }
      
      // Prepare data for submission to both databases
      const submissionData = {
        userId: currentUser.uid,
        studentId: currentUser.uid,
        userName: currentUser.displayName || 'Student',
        studentName: currentUser.displayName || 'Student',
        studentRollNumber: formData.studentRollNumber,
        studentEmail: currentUser.email || '',
        eventId: formData.eventId,
        eventName: formData.eventName,
        startDate: formData.startDate,
        endDate: formData.endDate,
        reason: formData.reason,
        facultyApprover: formData.facultyApprover,
        eventLeaderId: formData.eventLeaderId, // Add event leader ID for notifications
        eventLeaderName: formData.eventLeaderName, // Add event leader name for display
        status: 'pending',
        submittedAt: new Date().toISOString(),
        createdAt: new Date().getTime(),
        branch: currentUser.branch || '',
        year: currentUser.year || '',
      };
      
      console.log("Submitting OD request:", submissionData);
      
      // Use createODRequest utility to write to both Firestore and Realtime Database
      const result = await createODRequest(submissionData);
      console.log("OD request submission result:", result);
      
      setSuccess(true);
      
      // Reset form data
      setFormData({
        eventId: '',
        eventName: '',
        startDate: '',
        endDate: '',
        studentRollNumber: '',
        reason: '',
        facultyApprover: ''
      });
      
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
      console.error('Error submitting OD form:', error);
      setError('Failed to submit OD form. Please try again: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderForm = () => {
    if (loading && (events.length === 0 || faculties.length === 0)) {
      return <div className="loading-spinner">Loading form data...</div>;
    }
    
    if (success) {
      return (
        <div className="alert alert-success">
          OD form submitted successfully! You will be notified when it's approved.
        </div>
      );
    }
    
    return (
      <form onSubmit={handleSubmit}>
        {error && <div className="alert alert-danger">{error}</div>}
        
        <div className="form-group">
          <label htmlFor="eventId" className="form-label">Event *</label>
          <select
            id="eventId"
            name="eventId"
            className="form-control"
            value={formData.eventId}
            onChange={handleChange}
            required
          >
            <option value="">Select an event</option>
            {events.length > 0 ? (
              events.map(event => (
                <option key={event.id} value={event.id}>
                  {event.name} {event.eventLeaderInfo} ({new Date(event.startDate).toLocaleDateString()})
                </option>
              ))
            ) : (
              <option value="" disabled>No active events available</option>
            )}
          </select>
          <small className="form-text">Select the event you'll be attending</small>
        </div>
        
        {formData.eventId && (
          <div className="form-row">
            <div className="form-col">
              <div className="form-group">
                <label className="form-label">Event Date</label>
                <div className="form-control-static">
                  {new Date(formData.startDate).toLocaleDateString()}
                  {formData.startDate !== formData.endDate && 
                    ` - ${new Date(formData.endDate).toLocaleDateString()}`}
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="form-group">
          <label htmlFor="studentRollNumber" className="form-label">Roll Number *</label>
          <input
            type="text"
            id="studentRollNumber"
            name="studentRollNumber"
            className="form-control"
            value={formData.studentRollNumber}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="reason" className="form-label">Reason for OD Request *</label>
          <textarea
            id="reason"
            name="reason"
            className="form-control"
            value={formData.reason}
            onChange={handleChange}
            rows="3"
            required
          ></textarea>
        </div>
        
        <div className="form-group">
          <label htmlFor="facultyApprover" className="form-label">Faculty Approver *</label>
          <select
            id="facultyApprover"
            name="facultyApprover"
            className="form-control"
            value={formData.facultyApprover}
            onChange={handleChange}
            required
          >
            <option value="">Select faculty</option>
            {faculties.length > 0 ? (
              faculties.map(faculty => (
                <option key={faculty.id} value={faculty.id}>
                  {faculty.displayName} ({faculty.email})
                </option>
              ))
            ) : (
              <option value="" disabled>No faculty members available</option>
            )}
          </select>
          <small className="form-text">Select the faculty member who will approve your OD request</small>
        </div>
        
        <div className="form-action-buttons">
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit OD Request'}
          </button>
        </div>
      </form>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={!loading ? onClose : undefined}
      title="Submit OD Request"
      size="md"
    >
      <div className="od-form-create">
        {renderForm()}
      </div>
    </Modal>
  );
}

export default ODFormCreate;
