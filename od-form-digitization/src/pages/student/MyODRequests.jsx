import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import useODRequests from '../../hooks/useODRequests';
import LoadingSpinner from '../../components/LoadingSpinner';
import './MyODRequests.css';

const MyODRequests = () => {
  const { currentUser } = useAuth();
  const [selectedRequest, setSelectedRequest] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Use the hook to fetch OD requests
  const { 
    requests, 
    isLoading, 
    error,
    allRequests, // Added access to all requests for debugging
    stats
  } = useODRequests('student');

  // Check for request ID in URL query params to show details
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const requestId = params.get('id');
    
    if (requestId && requests.length > 0) {
      const foundRequest = requests.find(r => r.id === requestId);
      if (foundRequest) {
        setSelectedRequest(foundRequest);
      }
    }
  }, [location.search, requests]);

  // For debugging - log requests when they change
  useEffect(() => {
    console.log(`MyODRequests received ${requests.length} requests:`, { 
      currentUser: currentUser?.uid,
      hasRequests: requests.length > 0,
      stats: stats
    });
    
    if (requests.length > 0) {
      requests.forEach((req, idx) => {
        console.log(`Request ${idx + 1}:`, {
          id: req.id,
          eventName: req.eventName,
          status: req.status,
          workflow: req.workflow?.stage,
          date: req.fromDate || req.eventDate || req.createdAt
        });
      });
    }
  }, [requests, currentUser, stats]);

  // Format date for display
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    try {
      // If it's a Firebase timestamp
      if (timestamp.toDate) {
        return timestamp.toDate().toLocaleDateString();
      }
      
      // If it's a unix timestamp in milliseconds
      if (typeof timestamp === 'number') {
        return new Date(timestamp).toLocaleDateString();
      }
      
      // If it's a string date
      return new Date(timestamp).toLocaleDateString();
    } catch (error) {
      console.error("Error formatting date:", error);
      return 'Invalid Date';
    }
  };

  // Render status badge
  const getStatusBadge = (request) => {
    if (!request) return { label: 'Unknown', class: '' };
    
    console.log(`Getting status badge for request ${request.id}:`, {
      stage: request.workflow?.stage || 'no_stage',
      status: request.status || 'no_status'
    });
    
    const stage = request.workflow?.stage || '';
    const status = request.status || '';
    
    if (stage === 'event_leader_pending') {
      return { label: 'Event Leader Review', class: 'status-pending' };
    } else if (stage === 'faculty_pending') {
      return { label: 'Faculty Review', class: 'status-reviewing' };
    } else if (stage === 'completed') {
      return { label: 'Approved', class: 'status-approved' };
    } else if (stage === 'rejected_by_event_leader') {
      return { label: 'Rejected by Event Leader', class: 'status-rejected' };
    } else if (stage === 'rejected_by_faculty') {
      return { label: 'Rejected by Faculty', class: 'status-rejected' };
    } else if (status.toLowerCase() === 'approved') {
      return { label: 'Approved', class: 'status-approved' };
    } else if (status.toLowerCase() === 'rejected') {
      return { label: 'Rejected', class: 'status-rejected' };
    } else {
      return { label: 'Pending', class: 'status-pending' };
    }
  };

  // Handle clicking on a request to view details
  const handleRequestClick = (request) => {
    setSelectedRequest(request);
    
    // Update URL with request ID for sharing/bookmarking without reloading
    const newUrl = `${window.location.pathname}?id=${request.id}`;
    window.history.pushState({}, '', newUrl);
  };

  const handleBackToList = () => {
    setSelectedRequest(null);
    
    // Remove request ID from URL
    window.history.pushState({}, '', window.location.pathname);
  };

  // Render request workflow stages
  const renderWorkflowProgress = (request) => {
    if (!request || !request.workflow) return null;
    
    const stage = request.workflow.stage;
    const isRejected = stage === 'rejected_by_event_leader' || stage === 'rejected_by_faculty';
    
    const stages = [
      { key: 'submitted', label: 'Submitted' },
      { key: 'event_leader_pending', label: 'Event Leader Review' },
      { key: 'faculty_pending', label: 'Faculty Review' },
      { key: 'completed', label: 'Approved' }
    ];
    
    let currentStageIndex = -1;
    
    if (isRejected) {
      // For rejected requests, show which stage it was rejected at
      if (stage === 'rejected_by_event_leader') {
        currentStageIndex = 1; // Event Leader stage
      } else {
        currentStageIndex = 2; // Faculty stage
      }
    } else {
      // For non-rejected requests, find the current stage
      stages.forEach((s, index) => {
        if (s.key === stage) {
          currentStageIndex = index;
        }
      });
      
      // Handle completed stage
      if (stage === 'completed') {
        currentStageIndex = stages.length - 1;
      }
    }
    
    return (
      <div className="workflow-progress">
        {stages.map((s, index) => (
          <div 
            key={s.key} 
            className={`workflow-stage ${index <= currentStageIndex ? 'active' : ''} ${isRejected && index === currentStageIndex ? 'rejected' : ''}`}
          >
            <div className="stage-marker">
              {index < currentStageIndex ? (
                <i className="feather-check"></i>
              ) : (
                index === currentStageIndex && isRejected ? (
                  <i className="feather-x"></i>
                ) : (
                  <span>{index + 1}</span>
                )
              )}
            </div>
            <div className="stage-label">{s.label}</div>
            {index < stages.length - 1 && (
              <div className={`stage-connector ${index < currentStageIndex ? 'active' : ''}`}></div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Render request details
  const renderRequestDetails = (request) => {
    if (!request) return null;
    
    const statusBadge = getStatusBadge(request);
    
    return (
      <div className="request-details">
        <div className="request-details-header">
          <button className="back-button" onClick={handleBackToList}>
            <i className="feather-arrow-left"></i> Back to List
          </button>
          <h2>OD Request Details</h2>
          <span className={`status-badge ${statusBadge.class}`}>{statusBadge.label}</span>
        </div>
        
        {renderWorkflowProgress(request)}
        
        <div className="request-info-container">
          <div className="request-info-section">
            <h3>Request Information</h3>
            <div className="request-info-grid">
              <div className="info-item">
                <span className="info-label">Event Name</span>
                <span className="info-value">{request.eventName || 'N/A'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Request Date</span>
                <span className="info-value">{formatDate(request.createdAt)}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Event Date</span>
                <span className="info-value">
                  {request.fromDate && request.toDate ? 
                    `${formatDate(request.fromDate)} - ${formatDate(request.toDate)}` : 
                    formatDate(request.eventDate || request.fromDate)
                  }
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Reason</span>
                <span className="info-value">{request.reason || 'N/A'}</span>
              </div>
            </div>
          </div>
          
          {request.documentURL && (
            <div className="request-document-section">
              <h3>Supporting Document</h3>
              <a 
                href={request.documentURL} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="document-link"
              >
                <i className="feather-file"></i> View Document
              </a>
            </div>
          )}
          
          <div className="request-workflow-section">
            <h3>Approval History</h3>
            {request.workflow && request.workflow.history && request.workflow.history.length > 0 ? (
              <div className="workflow-history-timeline">
                {request.workflow.history.map((item, index) => (
                  <div className="history-item" key={index}>
                    <div className={`history-marker ${
                      item.status === 'approved' ? 'approved' : 
                      item.status === 'rejected' ? 'rejected' : ''
                    }`}>
                      {item.status === 'approved' ? (
                        <i className="feather-check"></i>
                      ) : item.status === 'rejected' ? (
                        <i className="feather-x"></i>
                      ) : (
                        <i className="feather-circle"></i>
                      )}
                    </div>
                    <div className="history-content">
                      <div className="history-header">
                        <span className="history-stage">{
                          item.stage === 'submitted' ? 'Request Submitted' :
                          item.stage === 'event_leader_pending' ? 'Sent to Event Leader' :
                          item.stage === 'faculty_pending' ? 'Approved by Event Leader' :
                          item.stage === 'completed' ? 'Approved by Faculty' :
                          item.stage === 'rejected_by_event_leader' ? 'Rejected by Event Leader' :
                          item.stage === 'rejected_by_faculty' ? 'Rejected by Faculty' :
                          item.stage
                        }</span>
                        <span className="history-date">{formatDate(item.timestamp)}</span>
                      </div>
                      {item.by && <div className="history-by">By: {item.by}</div>}
                      {item.comments && <div className="history-comments">{item.comments}</div>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-history">No workflow history available</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render request list
  const renderRequestsList = () => {
    console.log("Rendering requests list with", requests.length, "items");
    
    if (requests.length === 0) {
      return (
        <div className="empty-requests">
          <div className="empty-icon">
            <i className="feather-file-text"></i>
          </div>
          <h3>No OD Requests Found</h3>
          <p>You haven't submitted any OD requests yet or they may still be loading.</p>
          <button 
            className="create-request-btn" 
            onClick={() => navigate('/student-dashboard')}
          >
            <i className="feather-plus"></i> Submit New Request
          </button>
          
          {/* Add a refresh button to reload the requests */}
          <button 
            className="refresh-btn" 
            onClick={() => window.location.reload()}
            style={{ marginTop: '10px' }}
          >
            <i className="feather-refresh-cw"></i> Refresh
          </button>
        </div>
      );
    }
    
    return (
      <div className="requests-list-container">
        <div className="requests-header">
          <h2>My OD Requests ({requests.length})</h2>
          <button 
            className="create-request-btn" 
            onClick={() => navigate('/student-dashboard')}
          >
            <i className="feather-plus"></i> New Request
          </button>
        </div>
        
        <div className="request-filters">
          <p className="filter-summary">
            {stats?.approved > 0 && <span className="filter-badge approved">{stats.approved} Approved</span>}
            {stats?.pending > 0 && <span className="filter-badge pending">{stats.pending} Pending</span>}
            {stats?.rejected > 0 && <span className="filter-badge rejected">{stats.rejected} Rejected</span>}
          </p>
        </div>
        
        <div className="requests-list">
          {requests.map((request) => {
            const statusBadge = getStatusBadge(request);
            return (
              <div 
                key={request.id} 
                className="request-card" 
                onClick={() => handleRequestClick(request)}
              >
                <div className="request-card-header">
                  <h3 className="request-title">{request.eventName || 'Unnamed Event'}</h3>
                  <span className={`status-badge ${statusBadge.class}`}>{statusBadge.label}</span>
                </div>
                <div className="request-card-content">
                  <div className="request-info">
                    <div className="info-row">
                      <i className="feather-calendar"></i>
                      <span>
                        {request.fromDate && request.toDate ? 
                          `${formatDate(request.fromDate)} - ${formatDate(request.toDate)}` : 
                          formatDate(request.eventDate || request.fromDate || request.createdAt)
                        }
                      </span>
                    </div>
                    <div className="info-row">
                      <i className="feather-clock"></i>
                      <span>Submitted on {formatDate(request.createdAt)}</span>
                    </div>
                  </div>
                  <div className="request-card-footer">
                    <span className="reason-preview">{
                      request.reason?.length > 60 ? 
                        `${request.reason.substring(0, 60)}...` : 
                        request.reason || 'No reason provided'
                    }</span>
                    <button className="view-details-btn">
                      View Details <i className="feather-chevron-right"></i>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="my-od-requests-container">
      {isLoading ? (
        <div className="loading-container">
          <LoadingSpinner />
          <p>Loading your OD requests...</p>
        </div>
      ) : error ? (
        <div className="error-container">
          <i className="feather-alert-circle"></i>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Try Again</button>
        </div>
      ) : selectedRequest ? (
        renderRequestDetails(selectedRequest)
      ) : (
        renderRequestsList()
      )}
    </div>
  );
};

export default MyODRequests;
