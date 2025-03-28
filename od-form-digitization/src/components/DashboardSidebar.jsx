import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUnreadNotificationsCount } from '../services/notificationService';
import './DashboardSidebar.css';

const NotificationBadge = ({ count }) => {
  if (!count || count <= 0) return null;
  
  return (
    <span className="notification-badge sidebar-badge">
      {count > 99 ? '99+' : count}
    </span>
  );
};

function DashboardSidebar({ userType }) {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { currentUser } = useAuth();
  const [pendingRequests, setPendingRequests] = useState(0);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Get unread notifications count for relevant sections
  useEffect(() => {
    if (!currentUser) return;
    
    const unsubscribe = getUnreadNotificationsCount(currentUser.uid, (count) => {
      setPendingRequests(count);
    });
    
    return () => unsubscribe();
  }, [currentUser]);

  // Links based on user type
  const navigationLinks = {
    'student': [
      { to: '/student-dashboard', icon: 'dashboard', label: 'Dashboard' },
      { to: '/student-dashboard/requests', icon: 'list', label: 'My Requests' },
      { to: '/student-dashboard/events', icon: 'calendar', label: 'Events' },
      { to: '/student-dashboard/profile', icon: 'user', label: 'Profile' },
    ],
    'faculty': [
      { to: '/faculty-dashboard', icon: 'dashboard', label: 'Dashboard' },
      { to: '/faculty-dashboard/requests', icon: 'list', label: 'OD Requests' },
      { to: '/faculty-dashboard/reports', icon: 'chart', label: 'Reports' },
      { to: '/faculty-dashboard/profile', icon: 'user', label: 'Profile' },
    ],
    'event_leader': [
      { to: '/event-leader-dashboard', icon: 'dashboard', label: 'Dashboard' },
      { to: '/event-leader-dashboard/requests', icon: 'list', label: 'OD Requests' },
      { to: '/event-leader-dashboard/events', icon: 'calendar', label: 'My Events' },
      { to: '/event-leader-dashboard/profile', icon: 'user', label: 'Profile' },
    ]
  };

  // Choose which navigation links to display based on role
  const links = navigationLinks[userType] || [];

  return (
    <aside className={`dashboard-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <h2 className="sidebar-title">
          {isCollapsed ? 'OD' : 'OD Forms'}
        </h2>
        <button className="collapse-btn" onClick={toggleSidebar}>
          <i className={`icon-${isCollapsed ? 'right' : 'left'}`}></i>
        </button>
      </div>
      
      <nav className="sidebar-nav">
        <ul>
          {links.map((link, index) => (
            <li key={index}>
              <Link 
                to={link.to} 
                className={`nav-link ${location.pathname === link.to ? 'active' : ''}`}
              >
                <i className={`icon-${link.icon}`}></i>
                {!isCollapsed && <span>{link.label}</span>}
                {link.label === 'OD Requests' && pendingRequests > 0 && (
                  <NotificationBadge count={pendingRequests} />
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="sidebar-footer">
        <div className="app-version">v1.0.0</div>
      </div>
    </aside>
  );
}

export default DashboardSidebar;
