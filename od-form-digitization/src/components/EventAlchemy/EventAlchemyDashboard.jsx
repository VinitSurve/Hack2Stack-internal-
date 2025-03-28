import React from 'react';
import './EventAlchemyDashboard.css';

function EventAlchemyDashboard({ events, loading, odFormsCount }) {
  if (loading) {
    return <div className="loading-container">Loading Event Alchemy data...</div>;
  }

  return (
    <div className="event-alchemy-dashboard">
      <header className="alchemy-header">
        <h2>Event Alchemy</h2>
        <p className="alchemy-description">
          Advanced analytics and insights to help you optimize your events
        </p>
      </header>

      {events.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <h3>No Events Available</h3>
          <p>Create an event to access advanced analytics with Event Alchemy.</p>
        </div>
      ) : (
        <div className="alchemy-content">
          <section className="analytics-overview">
            <h3>Event Performance Overview</h3>
            <div className="analytics-cards">
              <div className="analytics-card">
                <h4>Total Events</h4>
                <div className="analytics-value">{events.length}</div>
              </div>
              <div className="analytics-card">
                <h4>Total OD Forms</h4>
                <div className="analytics-value">
                  {Object.values(odFormsCount).reduce((sum, count) => sum + count, 0)}
                </div>
              </div>
              <div className="analytics-card">
                <h4>Active Events</h4>
                <div className="analytics-value">
                  {events.filter(event => event.active).length}
                </div>
              </div>
            </div>
          </section>

          <section className="insights-section">
            <h3>Event Insights</h3>
            <p>Select an event from the list below to view detailed insights and recommendations.</p>
            
            <div className="events-list">
              {events.map(event => (
                <div key={event.id} className="event-card">
                  <h4>{event.name}</h4>
                  <div className="event-details">
                    <div className="event-date">
                      {new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}
                    </div>
                    <div className="event-stats">
                      <span className="event-stat">
                        <i className="icon-forms"></i> {odFormsCount[event.id] || 0} Forms
                      </span>
                      <span className={`event-status ${event.active ? 'active' : 'inactive'}`}>
                        {event.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
          
          <section className="coming-soon-section">
            <h3>Coming Soon</h3>
            <div className="coming-soon-features">
              <div className="feature-card">
                <div className="feature-icon">📈</div>
                <h4>Trend Analysis</h4>
                <p>Identify patterns and trends across your events to optimize future planning.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">🎯</div>
                <h4>Attendance Predictions</h4>
                <p>AI-powered forecasting for more accurate attendance planning.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">🔍</div>
                <h4>Participant Insights</h4>
                <p>Understand your attendees better with detailed demographic analysis.</p>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default EventAlchemyDashboard;
