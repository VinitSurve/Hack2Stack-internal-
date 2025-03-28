import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import Alert from '../components/Alert';
import WhyChooseUs from '../components/WhyChooseUs';
import { db } from '../firebase';
import { collection, getDocs, limit, query } from 'firebase/firestore';
import { retryOperation, isOnline } from '../utils/networkUtils';
import './Home.css';

function Home() {
  const { currentUser, userRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState(null);
  
  useEffect(() => {
    async function checkFirebaseConnection() {
      if (!isOnline()) {
        setConnectionError('You are currently offline. Some features may be unavailable.');
        setLoading(false);
        return;
      }

      try {
        // Test query to Firestore to verify connection, with retry
        const testQuery = query(collection(db, 'users'), limit(1));
        await retryOperation(() => getDocs(testQuery));
        setLoading(false);
        setConnectionError(null);
      } catch (error) {
        console.error('Firebase connection error:', error);
        setConnectionError('Could not connect to the database. Please check your internet connection.');
        setLoading(false);
      }
    }
    
    checkFirebaseConnection();
  }, []);

  // Function to get the appropriate dashboard link based on user role
  const getDashboardLink = () => {
    switch (userRole) {
      case 'student':
        return '/student-dashboard';
      case 'faculty':
        return '/faculty-dashboard';
      case 'event-leader':
        return '/event-leader-dashboard';
      default:
        return '/login';
    }
  };

  if (loading) {
    return (
      <div className="container mt-5">
        <LoadingSpinner text="Initializing application..." />
      </div>
    );
  }

  return (
    <div className="home-page">
      {connectionError && (
        <div className="container mt-3">
          <Alert 
            message={connectionError}
            type="warning"
          />
        </div>
      )}

      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">Effortless OD Form Submission & Tracking</h1>
            <p className="hero-subtitle">
              Submit and track your OD forms seamlessly, with real-time approval status.
            </p>
            <div className="hero-cta">
              {currentUser ? (
                <Link to={getDashboardLink()} className="btn btn-primary btn-lg">
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link to="/login" className="btn btn-primary btn-lg">
                    Get Started
                  </Link>
                  {/* <Link to="/register" className="btn btn-outline btn-lg">
                    Create Account
                  </Link> */}
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <WhyChooseUs />

      {/* Other sections of the home page */}
      {/* ... */}
    </div>
  );
}

export default Home;