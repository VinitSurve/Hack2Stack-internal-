import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState('student');
  
  const { login, signInWithGoogle, currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Extract role from URL query parameters if present
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const roleParam = params.get('role');
    if (roleParam && ['student', 'faculty', 'event-leader'].includes(roleParam)) {
      setRole(roleParam);
    }
  }, [location]);

  // Redirect if already logged in
  useEffect(() => {
    if (currentUser) {
      navigate('/'); // Redirect to home page (which will further redirect to appropriate dashboard)
    }
  }, [currentUser, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setError('');
      setLoading(true);
      await login(email, password);
      // Successful login will trigger redirect via the useEffect above
    } catch (error) {
      console.error('Login error:', error);
      setError('Failed to log in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      setLoading(true);
      await signInWithGoogle();
      // Successful login will trigger redirect via the useEffect above
    } catch (error) {
      console.error('Google sign-in error:', error);
      setError('Failed to sign in with Google.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="container">
        <div className="auth-card">
          <div className="auth-header">
            <h2 className="auth-title">Log In as {role.charAt(0).toUpperCase() + role.slice(1)}</h2>
            <p className="auth-subtitle">
              Enter your credentials to access your account
            </p>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email" className="form-label">Email</label>
              <input
                type="email"
                id="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">Password</label>
              <input
                type="password"
                id="password"
                className="form-control"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <div className="form-check">
                <input
                  type="radio"
                  id="student"
                  name="role"
                  value="student"
                  checked={role === 'student'}
                  onChange={() => setRole('student')}
                  className="form-check-input"
                />
                <label htmlFor="student" className="form-check-label">Student</label>
              </div>

              <div className="form-check">
                <input
                  type="radio"
                  id="faculty"
                  name="role"
                  value="faculty"
                  checked={role === 'faculty'}
                  onChange={() => setRole('faculty')}
                  className="form-check-input"
                />
                <label htmlFor="faculty" className="form-check-label">Faculty</label>
              </div>

              <div className="form-check">
                <input
                  type="radio"
                  id="event-leader"
                  name="role"
                  value="event-leader"
                  checked={role === 'event-leader'}
                  onChange={() => setRole('event-leader')}
                  className="form-check-input"
                />
                <label htmlFor="event-leader" className="form-check-label">Event Leader</label>
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary btn-block" 
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Log In'}
            </button>
          </form>

          <div className="auth-separator">
            <span>OR</span>
          </div>

          <button 
            type="button" 
            className="btn btn-outline google-btn" 
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            <img src="/src/google.png" alt="Google" className="google-icon" />
            Sign in with Google
          
          </button>

          <div className="auth-footer">
            <p>
              Don't have an account? <Link to="/register">Register</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;