import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ children, requiredRole }) {
  const { currentUser, userRole } = useAuth();

  // If not authenticated, redirect to login
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // If role is required and user doesn't have that role, redirect to appropriate dashboard
  if (requiredRole && userRole !== requiredRole) {
    if (userRole === 'student') {
      return <Navigate to="/student-dashboard" replace />;
    } else if (userRole === 'faculty') {
      return <Navigate to="/faculty-dashboard" replace />;
    } else if (userRole === 'event-leader') {
      return <Navigate to="/event-leader-dashboard" replace />;
    } else {
      // If role is unknown, redirect to home
      return <Navigate to="/" replace />;
    }
  }

  // If authenticated and has required role (or no specific role is required), render children
  return children;
}

export default ProtectedRoute; 