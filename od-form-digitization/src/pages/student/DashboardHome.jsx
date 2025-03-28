import { Link } from 'react-router-dom';
import NotificationsSummary from '../../components/NotificationsSummary';

function DashboardHome({ stats, currentUser, loading, onCreateForm }) {
  return (
    <div className="dashboard-home">
      {/* Welcome Section */}
      <section className="welcome-section">
        <div className="welcome-header">
          <h1 className="welcome-heading">Welcome, {currentUser?.displayName || 'Student'}!</h1>
          <p className="welcome-text">
            Track and manage your On-Duty form requests from your personalized dashboard.
          </p>
        </div>
        <div className="quick-actions">
          <button className="action-btn primary-action" onClick={onCreateForm}>
            <i className="icon-plus"></i> Submit New OD Form
          </button>
          <Link to="/student-dashboard/requests" className="action-btn">
            <i className="icon-list"></i> View My Requests
          </Link>
        </div>
      </section>

      {/* Stats Cards */}
      <section className="dashboard-stats">
        <h2 className="section-title">Your OD Form Statistics</h2>
        <div className="dashboard-cards">
          <div className="dashboard-card">
            <div className="card-content">
              <div className="card-icon">
                <i className="icon-file"></i>
              </div>
              <div className="card-info">
                <h2 className="card-value">{loading ? '...' : stats.total}</h2>
                <p className="card-label">Total Requests</p>
              </div>
            </div>
          </div>

          <div className="dashboard-card">
            <div className="card-content">
              <div className="card-icon pending">
                <i className="icon-clock"></i>
              </div>
              <div className="card-info">
                <h2 className="card-value">{loading ? '...' : stats.pending}</h2>
                <p className="card-label">Pending Requests</p>
              </div>
            </div>
          </div>

          <div className="dashboard-card">
            <div className="card-content">
              <div className="card-icon approved">
                <i className="icon-check"></i>
              </div>
              <div className="card-info">
                <h2 className="card-value">{loading ? '...' : stats.approved}</h2>
                <p className="card-label">Approved Requests</p>
              </div>
            </div>
          </div>

          <div className="dashboard-card">
            <div className="card-content">
              <div className="card-icon rejected">
                <i className="icon-x"></i>
              </div>
              <div className="card-info">
                <h2 className="card-value">{loading ? '...' : stats.rejected}</h2>
                <p className="card-label">Rejected Requests</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recent OD Requests and Notifications */}
      <div className="dashboard-row">
        <section className="recent-requests">
          <div className="section-header">
            <h2 className="section-title">Recent OD Requests</h2>
            <Link to="/student-dashboard/requests" className="view-all">View All</Link>
          </div>

          {loading ? (
            <div className="loading-spinner">Loading...</div>
          ) : stats.total === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📄</div>
              <h3>No OD Forms Submitted</h3>
              <p>You haven't submitted any OD forms yet.</p>
              <button className="btn btn-primary" onClick={onCreateForm}>
                Submit Your First OD Form
              </button>
            </div>
          ) : (
            <div className="recent-requests-list">
              {stats.total > 0 && (
                <Link to="/student-dashboard/requests" className="recent-request-link">
                  <div className="recent-request-item">
                    <div className="recent-request-icon">
                      <i className="icon-file"></i>
                    </div>
                    <div className="recent-request-content">
                      <h4 className="recent-request-title">
                        View your {stats.total} OD {stats.total === 1 ? 'Form' : 'Forms'}
                      </h4>
                      <p className="recent-request-details">
                        {stats.approved > 0 && `${stats.approved} approved • `}
                        {stats.pending > 0 && `${stats.pending} pending • `}
                        {stats.rejected > 0 && `${stats.rejected} rejected`}
                      </p>
                    </div>
                    <div className="recent-request-arrow">
                      <i className="icon-chevron-right"></i>
                    </div>
                  </div>
                </Link>
              )}
            </div>
          )}
        </section>
        
        {/* Recent Notifications */}
        <section className="recent-notifications">
          <NotificationsSummary limit={3} title="Recent Status Updates" />
        </section>
      </div>
    </div>
  );
}

export default DashboardHome;
