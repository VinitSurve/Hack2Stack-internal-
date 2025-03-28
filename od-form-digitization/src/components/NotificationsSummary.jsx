import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getNotificationsRealtime, markNotificationAsRead } from '../services/notificationService';
import './NotificationsSummary.css';

const NotificationsSummary = ({ limit = 5, onlyUnread = false, title = "Recent Notifications" }) => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) return;
    
    setLoading(true);
    
    console.log("Setting up notifications listener for user:", currentUser.uid);
    
    // Set up real-time listener for notifications
    try {
      const unsubscribe = getNotificationsRealtime(
        currentUser.uid,
        (notificationsData) => {
          console.log(`Received ${notificationsData.length} notifications for user ${currentUser.uid}`);
          
          // Debug notification contents - especially important for faculty approvals
          if (notificationsData.length > 0) {
            notificationsData.forEach((notif, index) => {
              console.log(`Notification ${index + 1}:`, {
                id: notif.id,
                type: notif.type,
                message: notif.message,
                status: notif.status,
                stage: notif.stage,
                actor: notif.actor,
                isRead: notif.isRead,
                createdAt: notif.createdAt
              });
            });
          }
          
          // Filter if onlyUnread is true
          let filteredData = onlyUnread 
            ? notificationsData.filter(notif => !notif.isRead)
            : notificationsData;
          
          // Limit to specified number
          filteredData = filteredData.slice(0, limit);
          
          setNotifications(filteredData);
          setLoading(false);
        }
      );
      
      return () => {
        console.log("Unsubscribing from notifications listener");
        unsubscribe();
      };
    } catch (err) {
      console.error("Error setting up notifications listener:", err);
      setError("Failed to load notifications: " + err.message);
      setLoading(false);
    }
  }, [currentUser, limit, onlyUnread]);

  const handleNotificationClick = async (notification) => {
    try {
      // Mark as read if not already
      if (!notification.isRead) {
        await markNotificationAsRead(notification.id);
      }
      
      // Navigate to relevant page if link is provided
      if (notification.link) {
        navigate(notification.link);
      }
    } catch (err) {
      console.error("Error handling notification click:", err);
    }
  };

  // Format the timestamp to a readable format
  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return '';

    const now = new Date();
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    const secondsDiff = Math.floor((now - date) / 1000);

    if (secondsDiff < 60) return 'just now';
    if (secondsDiff < 3600) return `${Math.floor(secondsDiff / 60)}m ago`;
    if (secondsDiff < 86400) return `${Math.floor(secondsDiff / 3600)}h ago`;
    if (secondsDiff < 604800) return `${Math.floor(secondsDiff / 86400)}d ago`;
    
    return date.toLocaleDateString();
  };

  // Render notification icon based on type and status
  const renderNotificationIcon = (notification) => {
    if (notification.type === 'od_request_status') {
      if (notification.status === 'approved') {
        return <i className="feather-check-circle success-icon"></i>;
      } else if (notification.status === 'rejected') {
        return <i className="feather-x-circle danger-icon"></i>;
      }
    } else if (notification.type === 'new_od_request') {
      return <i className="feather-file-text primary-icon"></i>;
    }
    
    return <i className="feather-bell"></i>;
  };

  if (!currentUser) {
    console.log("NotificationsSummary: No current user, returning null");
    return null;
  }

  return (
    <div className="notifications-summary">
      <div className="notifications-summary-header">
        <h3>{title}</h3>
        {notifications.length > 0 && (
          <button onClick={() => navigate('/notifications')} className="view-all-btn">
            View All
          </button>
        )}
      </div>
      
      <div className="notifications-summary-content">
        {loading ? (
          <div className="loading-state">Loading notifications...</div>
        ) : error ? (
          <div className="error-state">
            <i className="feather-alert-circle"></i>
            <p>{error}</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="empty-state">
            <i className="feather-inbox"></i>
            <p>No {onlyUnread ? 'unread ' : ''}notifications yet</p>
          </div>
        ) : (
          <div className="notification-list">
            {notifications.map(notification => (
              <div 
                key={notification.id}
                className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="notification-icon">
                  {renderNotificationIcon(notification)}
                </div>
                <div className="notification-content">
                  <p className="notification-message">{notification.message}</p>
                  {notification.comments && (
                    <p className="notification-comments">{notification.comments}</p>
                  )}
                  <p className="notification-time">{formatTimeAgo(notification.createdAt)}</p>
                </div>
                {!notification.isRead && <div className="unread-indicator"></div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsSummary; 