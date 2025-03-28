import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Notifications from './Notifications';
import './DashboardHeader.css';

function DashboardHeader({ title, onToggleSidebar, userType }) {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  return (
    <header className="dashboard-header">
      <div className="header-left">
        <button className="sidebar-toggle" onClick={onToggleSidebar}>
          <i className="feather-menu"></i>
        </button>
        <h1 className="dashboard-title">{title}</h1>
      </div>
      <div className="header-right">
        <Notifications />
        <div className="user-profile">
          <span className="user-name">{currentUser?.displayName}</span>
          <div className="user-avatar">
            {currentUser?.photoURL ? (
              <img src={currentUser.photoURL} alt="Profile" />
            ) : (
              <span>{currentUser?.displayName?.charAt(0) || 'U'}</span>
            )}
          </div>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          <i className="feather-log-out"></i>
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
}

export default DashboardHeader;
