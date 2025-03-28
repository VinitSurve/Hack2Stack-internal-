import { Link } from 'react-router-dom';

function NotFound() {
  return (
    <div className="not-found-page">
      <div className="container text-center">
        <h1 className="not-found-title">404</h1>
        <h2 className="not-found-subtitle">Page Not Found</h2>
        <p className="not-found-description">
          The page you are looking for does not exist or has been moved.
        </p>
        <Link to="/" className="btn btn-primary mt-4">
          Go to Home
        </Link>
      </div>
    </div>
  );
}

export default NotFound; 