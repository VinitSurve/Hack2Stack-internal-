import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  getNotificationsRealtime, 
  getUnreadNotificationsCount, 
  markNotificationAsRead, 
  markAllNotificationsAsRead
} from '../services/notificationService';
import './Notifications.css';

const Notifications = () => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const notificationRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) return;

    // Set up listeners for notifications and unread count
    const unsubscribeNotifications = getNotificationsRealtime(
      currentUser.uid,
      (notificationsData) => {
        setNotifications(notificationsData);
      }
    );

    const unsubscribeCount = getUnreadNotificationsCount(
      currentUser.uid,
      (count) => {
        setUnreadCount(count);
      }
    );

    // Handle click outside notifications panel to close it
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      unsubscribeNotifications();
      unsubscribeCount();
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [currentUser]);

  const handleNotificationClick = async (notification) => {
    // Mark as read if not already
    if (!notification.isRead) {
      await markNotificationAsRead(notification.id);
    }

    // Navigate to relevant page if there's a link
    if (notification.link) {
      navigate(notification.link);
    }

    // Close notifications panel
    setIsOpen(false);
  };

  const handleMarkAllAsRead = async () => {
    if (!currentUser || notifications.length === 0) return;
    
    await markAllNotificationsAsRead(currentUser.uid);
  };

  const toggleNotificationsPanel = () => {
    setIsOpen(!isOpen);
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
    
    // If more than a week, show the date
    return date.toLocaleDateString();
  };

  if (!currentUser) return null;

  return (
    <div className="notifications-container" ref={notificationRef}>
      <div className="notification-bell" onClick={toggleNotificationsPanel}>
        <i className="feather-bell"></i>
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </div>
      
      {isOpen && (
        <div className="notifications-panel">
          <div className="notifications-header">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button className="mark-read-btn" onClick={handleMarkAllAsRead}>
                Mark all as read
              </button>
            )}
          </div>
          
          <div className="notifications-list">
            {notifications.length === 0 ? (
              <div className="no-notifications">
                <i className="feather-inbox"></i>
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-icon">
                    {notification.type === 'od_request_status' && (
                      notification.status === 'approved' ? (
                        <i className="feather-check-circle"></i>
                      ) : notification.status === 'rejected' ? (
                        <i className="feather-x-circle"></i>
                      ) : (
                        <i className="feather-info"></i>
                      )
                    )}
                  </div>
                  <div className="notification-content">
                    <p className="notification-message">{notification.message}</p>
                    {notification.comments && (
                      <p className="notification-comments">{notification.comments}</p>
                    )}
                    <p className="notification-time">{formatTimeAgo(notification.createdAt)}</p>
                  </div>
                  {!notification.isRead && (
                    <div className="notification-dot"></div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;