import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register, currentUser, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (currentUser) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if passwords match
    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }
    
    // Simple password validation
    if (password.length < 6) {
      return setError('Password should be at least 6 characters');
    }
    
    try {
      setError('');
      setLoading(true);
      await register(email, password, displayName, role);
      navigate('/');
    } catch (error) {
      console.error('Registration error:', error);
      setError('Failed to create an account: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      setLoading(true);
      await signInWithGoogle();
      navigate('/');
    } catch (error) {
      console.error('Google sign-in error:', error);
      setError('Failed to sign in with Google.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="container">
        <div className="auth-card">
          <div className="auth-header">
            <h2 className="auth-title">Create an Account</h2>
            <p className="auth-subtitle">
              Register to access the OD Form System
            </p>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="displayName" className="form-label">Full Name</label>
              <input
                type="text"
                id="displayName"
                className="form-control"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
              />
            </div>

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
              <small className="form-text text-muted">
                Password must be at least 6 characters
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                className="form-control"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Register as</label>
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
              {loading ? 'Creating Account...' : 'Register'}
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
            Sign up with Google
          </button>

          <div className="auth-footer">
            <p>
              Already have an account? <Link to="/login">Log In</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;