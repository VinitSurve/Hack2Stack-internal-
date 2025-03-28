import React, { useState, useEffect } from 'react';
import DashboardHeader from '../components/DashboardHeader';
import DashboardSidebar from '../components/DashboardSidebar';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import ToastContainer from '../components/ToastContainer';
import useODRequests from '../hooks/useODRequests';
import '../styles/FacultyDashboard.css';

const FacultyDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionType, setActionType] = useState(null); // 'approve' or 'reject'
  const [comments, setComments] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [viewWorkflowHistory, setViewWorkflowHistory] = useState(false);

  // Use the hook with 'faculty' role explicitly
  const {
    requests,
    isLoading,
    error,
    stats,
    activeFilter,
    searchTerm,
    setActiveFilter,
    setSearchTerm,
    updateRequestStatus
  } = useODRequests('faculty');

  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleAction = (request, action) => {
    setSelectedRequest(request);
    setActionType(action);
    setComments('');
    setViewWorkflowHistory(false);
    setIsModalOpen(true);
  };
  
  const handleViewWorkflow = (request) => {
    setSelectedRequest(request);
    setActionType(null);
    setViewWorkflowHistory(true);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRequest(null);
    setActionType(null);
    setComments('');
    setViewWorkflowHistory(false);
  };

  const handleSubmitAction = async () => {
    if (!selectedRequest || !actionType) return;

    setIsProcessing(true);

    try {
      // Ensure we have a valid rtdbPath - it's crucial for the update to work
      let rtdbPath = selectedRequest.rtdbPath;
      
      // If rtdbPath is missing, construct it using userId and id (or firestoreId)
      if (!rtdbPath && selectedRequest.userId) {
        const requestId = selectedRequest.firestoreId || selectedRequest.id;
        rtdbPath = `odRequests/${selectedRequest.userId}/${requestId}`;
      }
      
      if (!rtdbPath) {
        throw new Error('Cannot determine database path for the request');
      }
      
      console.log('Updating request with path:', rtdbPath);
      
      // Pass 'faculty' role explicitly in additionalData
      await updateRequestStatus(
        selectedRequest.id,
        rtdbPath,
        actionType === 'approve' ? 'approved' : 'rejected',
        comments,
        'faculty' // Explicitly pass the faculty role
      );

      // Show success toast
      if (window.showToast) {
        const message = actionType === 'approve' 
          ? 'OD Request approved! The student will be notified.'
          : 'OD Request rejected. The student will be notified.';
          
        window.showToast(message, 'success');
      }

      // Close modal
      handleCloseModal();
    } catch (error) {
      console.error(`Error ${actionType}ing request:`, error);
      
      // Show error toast
      if (window.showToast) {
        window.showToast(
          `Failed to ${actionType} request. ${error.message}`,
          'error'
        );
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    try {
      // If it's a Firebase timestamp
      if (timestamp.toDate) {
        return timestamp.toDate().toLocaleDateString();
      }
      
      // If it's a unix timestamp in milliseconds
      if (typeof timestamp === 'number') {
        return new Date(timestamp).toLocaleDateString() + ' ' + 
               new Date(timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      }
      
      // If it's a string date
      return new Date(timestamp).toLocaleDateString();
    } catch (error) {
      console.error("Error formatting date:", error);
      return 'Invalid Date';
    }
  };

  // Render status badges
  const renderStatusBadge = (request) => {
    if (!request) return null;
    
    const status = request.status;
    const workflowStage = request.workflow?.stage;
    
    let badgeText = status || 'Unknown';
    let badgeClass = '';
    
    if (workflowStage === 'event_leader_pending') {
      badgeText = 'Event Leader Review';
      badgeClass = 'badge-pending';
    } else if (workflowStage === 'faculty_pending') {
      badgeText = 'Faculty Review';
      badgeClass = 'badge-pending';
    } else if (workflowStage === 'completed') {
      badgeText = 'Approved';
      badgeClass = 'badge-approved';
    } else if (workflowStage === 'rejected_by_event_leader') {
      badgeText = 'Rejected by Event Leader';
      badgeClass = 'badge-rejected';
    } else if (workflowStage === 'rejected_by_faculty') {
      badgeText = 'Rejected by Faculty';
      badgeClass = 'badge-rejected';
    } else {
      badgeClass = {
        pending: 'badge-pending',
        approved: 'badge-approved',
        rejected: 'badge-rejected'
      }[status?.toLowerCase()] || '';
    }
    
    return <span className={`badge ${badgeClass}`}>{badgeText}</span>;
  };

  // Render workflow history
  const renderWorkflowHistory = (request) => {
    if (!request || !request.workflow || !request.workflow.history) {
      return <p>No workflow history available.</p>;
    }
    
    return (
      <div className="workflow-history">
        <h4>Workflow History</h4>
        <div className="timeline">
          {request.workflow.history.map((item, index) => (
            <div className="timeline-item" key={index}>
              <div className="timeline-marker"></div>
              <div className="timeline-content">
                <h5>{item.stage}</h5>
                <p className="timeline-date">{formatDate(item.timestamp)}</p>
                <p className="timeline-actor">By: {item.by || 'System'}</p>
                {item.comments && <p className="timeline-comments">{item.comments}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="student-dashboard-container">
      <DashboardHeader 
        title="Faculty Dashboard" 
        onToggleSidebar={handleToggleSidebar} 
      />
      
      <div className="dashboard-content">
        <DashboardSidebar isOpen={sidebarOpen} userType="faculty" />
        
        <main className={`dashboard-main ${!sidebarOpen ? 'sidebar-collapsed' : ''}`}>
          <div className="faculty-dashboard">
            <div className="dashboard-stats">
              <div className="stats-card">
                <div className="stats-icon pending">
                  <i className="feather-clock"></i>
                </div>
                <div className="stats-info">
                  <h4 className="stats-value">{stats.facultyPending || 0}</h4>
                  <p className="stats-label">Pending Review</p>
                </div>
              </div>
              
              <div className="stats-card">
                <div className="stats-icon approved">
                  <i className="feather-check-circle"></i>
                </div>
                <div className="stats-info">
                  <h4 className="stats-value">{stats.approved || 0}</h4>
                  <p className="stats-label">Approved Requests</p>
                </div>
              </div>
              
              <div className="stats-card">
                <div className="stats-icon rejected">
                  <i className="feather-x-circle"></i>
                </div>
                <div className="stats-info">
                  <h4 className="stats-value">{stats.rejected || 0}</h4>
                  <p className="stats-label">Rejected Requests</p>
                </div>
              </div>
              
              <div className="stats-card">
                <div className="stats-icon total">
                  <i className="feather-layers"></i>
                </div>
                <div className="stats-info">
                  <h4 className="stats-value">{stats.total || 0}</h4>
                  <p className="stats-label">Total Requests</p>
                </div>
              </div>
            </div>
            
            <div className="filter-controls">
              <div className="filter-tabs">
                <button 
                  className={`filter-tab ${activeFilter === 'pending' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('pending')}
                >
                  Pending Review
                </button>
                <button 
                  className={`filter-tab ${activeFilter === 'faculty_pending' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('faculty_pending')}
                >
                  Faculty Pending
                </button>
                <button 
                  className={`filter-tab ${activeFilter === 'event_leader_pending' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('event_leader_pending')}
                >
                  Event Leader Pending
                </button>
                <button 
                  className={`filter-tab ${activeFilter === 'approved' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('approved')}
                >
                  Approved
                </button>
                <button 
                  className={`filter-tab ${activeFilter === 'rejected' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('rejected')}
                >
                  Rejected
                </button>
                <button 
                  className={`filter-tab ${activeFilter === 'all' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('all')}
                >
                  All Requests
                </button>
              </div>
              
              <div className="search-box">
                <i className="feather-search"></i>
                <input 
                  type="text" 
                  placeholder="Search by student name or event..." 
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
              </div>
            </div>
            
            {error && (
              <div className="error-container">
                <p><i className="feather-alert-circle"></i> {error}</p>
              </div>
            )}
            
            {isLoading ? (
              <div className="loading-container">
                <LoadingSpinner />
              </div>
            ) : requests.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <i className="feather-inbox"></i>
                </div>
                <h3>No OD Requests Found</h3>
                <p>
                  {searchTerm ? 
                    'No requests match your search criteria. Try adjusting your filters.' :
                    activeFilter === 'all' ? 
                      'There are no OD requests in the system yet.' : 
                      `There are no ${activeFilter} OD requests.`
                  }
                </p>
              </div>
            ) : (
              <div className="requests-table-container">
                <div className="table-responsive">
                  <table className="requests-table">
                    <thead>
                      <tr>
                        <th>Student Name</th>
                        <th>Student ID</th>
                        <th>Branch & Year</th>
                        <th>Event Name</th>
                        <th>Date</th>
                        <th>Reason</th>
                        <th>Document</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requests.map((request) => (
                        <tr key={request.id}>
                          <td>{request.userName || 'N/A'}</td>
                          <td>{request.studentId || 'N/A'}</td>
                          <td>{`${request.branch || 'N/A'} - ${request.year || 'N/A'}`}</td>
                          <td className="truncate">{request.eventName || 'N/A'}</td>
                          <td>
                            {request.fromDate && request.toDate ? 
                              `${formatDate(request.fromDate)} - ${formatDate(request.toDate)}` : 
                              formatDate(request.eventDate || request.fromDate || request.createdAt)
                            }
                          </td>
                          <td className="truncate">{request.reason || 'N/A'}</td>
                          <td>
                            {request.documentURL ? (
                              <a 
                                href={request.documentURL} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="btn-download"
                              >
                                <i className="feather-download"></i> Download
                              </a>
                            ) : 'No Document'}
                          </td>
                          <td>{renderStatusBadge(request)}</td>
                          <td>
                            <div className="request-actions">
                              {request.workflow?.stage === 'faculty_pending' && (
                                <>
                                  <button 
                                    className="btn-approve"
                                    onClick={() => handleAction(request, 'approve')}
                                  >
                                    <i className="feather-check"></i> Approve
                                  </button>
                                  <button 
                                    className="btn-reject"
                                    onClick={() => handleAction(request, 'reject')}
                                  >
                                    <i className="feather-x"></i> Reject
                                  </button>
                                </>
                              )}
                              
                              <button 
                                className="btn-view"
                                onClick={() => handleViewWorkflow(request)}
                              >
                                <i className="feather-eye"></i> View
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
      
      {/* Action Modal */}
      {isModalOpen && !viewWorkflowHistory && (
        <Modal 
          isOpen={isModalOpen} 
          onClose={handleCloseModal}
          title={actionType === 'approve' ? 'Approve OD Request' : 'Reject OD Request'}
        >
          <div className="action-modal-content">
            {selectedRequest && (
              <div className="action-modal-header">
                <p>
                  <strong>Student:</strong> {selectedRequest.userName || 'N/A'}
                </p>
                <p>
                  <strong>Student ID:</strong> {selectedRequest.studentId || 'N/A'}
                </p>
                <p>
                  <strong>Event:</strong> {selectedRequest.eventName || 'N/A'}
                </p>
                <p>
                  <strong>Reason:</strong> {selectedRequest.reason || 'N/A'}
                </p>
                {selectedRequest.workflow?.stage === 'faculty_pending' && (
                  <p>
                    <strong>Event Leader Approval:</strong> This request has been approved by the Event Leader
                    {selectedRequest.workflow?.history
                      .filter(h => h.stage === 'faculty_pending')
                      .map(h => h.comments ? ` with comment: "${h.comments}"` : '')
                    }
                  </p>
                )}
              </div>
            )}
            
            <div className="action-form-group">
              <label htmlFor="comments">
                {actionType === 'approve' ? 'Approval Comments (Optional)' : 'Reason for Rejection'}
              </label>
              <textarea
                id="comments"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder={
                  actionType === 'approve' 
                    ? 'Add any notes or comments about this approval...' 
                    : 'Please provide a reason for rejecting this OD request...'
                }
                required={actionType === 'reject'}
              />
            </div>
            
            <div className="action-modal-footer">
              <button 
                className="btn-cancel"
                onClick={handleCloseModal}
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button 
                className={actionType === 'approve' ? 'btn-submit-approve' : 'btn-submit-reject'}
                onClick={handleSubmitAction}
                disabled={isProcessing || (actionType === 'reject' && !comments.trim())}
              >
                {isProcessing ? (
                  <span>Processing...</span>
                ) : actionType === 'approve' ? (
                  <span>Confirm Approval</span>
                ) : (
                  <span>Confirm Rejection</span>
                )}
              </button>
            </div>
          </div>
        </Modal>
      )}
      
      {/* Workflow History Modal */}
      {isModalOpen && viewWorkflowHistory && (
        <Modal 
          isOpen={isModalOpen} 
          onClose={handleCloseModal}
          title="OD Request Workflow History"
          size="lg"
        >
          <div className="action-modal-content">
            {selectedRequest && (
              <div className="action-modal-header">
                <p>
                  <strong>Student:</strong> {selectedRequest.userName || 'N/A'}
                </p>
                <p>
                  <strong>Student ID:</strong> {selectedRequest.studentId || 'N/A'}
                </p>
                <p>
                  <strong>Event:</strong> {selectedRequest.eventName || 'N/A'}
                </p>
                <p>
                  <strong>Reason:</strong> {selectedRequest.reason || 'N/A'}
                </p>
                <p>
                  <strong>Current Status:</strong> {renderStatusBadge(selectedRequest)}
                </p>
              </div>
            )}
            
            {selectedRequest && renderWorkflowHistory(selectedRequest)}
            
            <div className="action-modal-footer">
              <button 
                className="btn-cancel"
                onClick={handleCloseModal}
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
      
      {/* Toast Container */}
      <ToastContainer />
    </div>
  );
};

export default FacultyDashboard;