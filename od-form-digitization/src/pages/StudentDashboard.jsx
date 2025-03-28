import { useState, useEffect } from 'react';
import { useNavigate, Link, Routes, Route } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useODRequests from '../hooks/useODRequests'; // Import the hook
import ODFormCreate from '../components/ODFormCreate';
import ODFormView from '../components/ODFormView';
import Notifications from '../components/Notifications';
import './StudentDashboard.css';

// Dashboard sub-pages
import DashboardHome from './student/DashboardHome';
import MyODRequests from './student/MyODRequests';

function StudentDashboard() {
  const { currentUser, logout, userRole } = useAuth();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedFormId, setSelectedFormId] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const navigate = useNavigate();
  
  // Use the OD requests hook for student role
  const { 
    requests: odForms, 
    isLoading: loading, 
    stats, 
    error 
  } = useODRequests('student');
  
  // Set the current user in window for legacy support
  useEffect(() => {
    if (currentUser) {
      window.currentUser = currentUser;
    }
    return () => {
      delete window.currentUser;
    };
  }, [currentUser]);
  
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  const toggleSidebar = () => {
    // On mobile: toggle open/close
    if (window.innerWidth <= 992) {
      setSidebarOpen(!sidebarOpen);
    } 
    // On desktop: toggle collapsed/expanded
    else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  const handleCreateFormSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Close sidebar on window resize if in mobile view
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 992) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!currentUser) {
    return null; // Protected route should handle redirecting
  }

  return (
    <div className="student-dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <button 
            className="sidebar-toggle" 
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
          >
            <span className="toggle-icon"></span>
          </button>
          <h1 className="dashboard-title">Student OD Form System</h1>
        </div>
        <div className="header-right">
          <Notifications />
          <div className="user-profile">
            <span className="user-name">{currentUser.displayName}</span>
            <div className="user-avatar">
              {currentUser.photoURL ? (
                <img src={currentUser.photoURL} alt="Profile" />
              ) : (
                <span>{currentUser.displayName?.charAt(0) || 'S'}</span>
              )}
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <i className="icon-logout"></i>
            <span>Logout</span>
          </button>
        </div>
      </header>

      <div className="dashboard-content">
        {/* Sidebar - Updated with collapsed state */}
        <aside className={`dashboard-sidebar ${sidebarOpen ? 'open' : ''} ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <nav className="sidebar-nav">
            <ul>
              <li>
                <Link 
                  to="/student-dashboard" 
                  className="nav-link" 
                  onClick={() => window.innerWidth <= 992 && setSidebarOpen(false)}
                >
                  <i className="icon-dashboard"></i>
                  <span>Dashboard</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="#" 
                  className="nav-link"
                  onClick={() => {
                    setShowCreateForm(true);
                    window.innerWidth <= 992 && setSidebarOpen(false);
                  }}
                >
                  <i className="icon-form"></i>
                  <span>Submit OD Form</span>
                </Link>
              </li>
              <li>
                <Link 
                  to="/student-dashboard/requests" 
                  className="nav-link" 
                  onClick={() => window.innerWidth <= 992 && setSidebarOpen(false)}
                >
                  <i className="icon-list"></i>
                  <span>My OD Requests</span>
                </Link>
              </li>
            </ul>
          </nav>
        </aside>

        {/* Main Content - Add sidebar-collapsed class */}
        <main className={`dashboard-main ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
          <Routes>
            <Route path="/" element={
              <DashboardHome 
                stats={stats} 
                currentUser={currentUser} 
                loading={loading} 
                onCreateForm={() => setShowCreateForm(true)}
              />
            } />
            <Route path="/requests" element={
              <MyODRequests 
                forms={odForms} 
                loading={loading} 
                onViewForm={setSelectedFormId}
              />
            } />
          </Routes>
        </main>
      </div>

      {/* Form Creation Modal */}
      {showCreateForm && (
        <ODFormCreate 
          isOpen={showCreateForm} 
          onClose={() => setShowCreateForm(false)} 
          onSuccess={handleCreateFormSuccess}
        />
      )}
      
      {/* Form View Modal */}
      {selectedFormId && (
        <ODFormView 
          isOpen={!!selectedFormId} 
          onClose={() => setSelectedFormId(null)} 
          formId={selectedFormId}
        />
      )}
    </div>
  );
}

export default StudentDashboard;