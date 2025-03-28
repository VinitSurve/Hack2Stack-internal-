import { useState } from 'react';

function EventAnalytics({ event, stats }) {
  const [chartType, setChartType] = useState('participation');

  if (!event || !stats) {
    return <div className="loading-spinner">Loading analytics...</div>;
  }

  return (
    <div className="event-analytics">
      <div className="analytics-header">
        <h3>Event Analytics</h3>
        <div className="chart-selector">
          <button 
            className={`btn btn-sm ${chartType === 'participation' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setChartType('participation')}
          >
            Participation
          </button>
          <button 
            className={`btn btn-sm ${chartType === 'timeline' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setChartType('timeline')}
          >
            Timeline
          </button>
        </div>
      </div>

      <div className="analytics-content">
        {chartType === 'participation' ? (
          <div className="participation-chart">
            <div className="chart-container">
              <div className="progress-bar-container">
                <div 
                  className="progress-bar" 
                  style={{ width: `${stats.participationRate}%` }}
                >
                  {stats.participationRate}%
                </div>
              </div>
              <div className="chart-label">Participation Rate</div>
            </div>
            
            <div className="analytics-metrics">
              <div className="metric">
                <h4 className="metric-value">{stats.formCount}</h4>
                <p className="metric-label">OD Requests</p>
              </div>
              
              <div className="metric">
                <h4 className="metric-value">{event.maxParticipants || 'Unlimited'}</h4>
                <p className="metric-label">Max Capacity</p>
              </div>
              
              <div className="metric">
                <h4 className="metric-value">{stats.isFull ? 'Yes' : 'No'}</h4>
                <p className="metric-label">At Capacity</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="timeline-chart">
            <div className="timeline-container">
              <div className="timeline-bar">
                <div className="timeline-marker past" style={{ width: '33%' }}>
                  <span>Planning</span>
                </div>
                <div className={`timeline-marker ${stats.status === 'ongoing' ? 'current' : 'upcoming'}`} style={{ width: '34%' }}>
                  <span>Event</span>
                </div>
                <div className={`timeline-marker ${stats.status === 'completed' ? 'current' : 'future'}`} style={{ width: '33%' }}>
                  <span>Follow-up</span>
                </div>
              </div>
              <div className="timeline-progress" style={{ width: calculateTimelineProgress(stats) }}></div>
            </div>
            
            <div className="analytics-metrics">
              <div className="metric">
                <h4 className="metric-value">{stats.duration}</h4>
                <p className="metric-label">Duration (Days)</p>
              </div>
              
              <div className="metric">
                <h4 className="metric-value">
                  {stats.status === 'upcoming' ? `T-${stats.daysUntilStart}` : 
                   stats.status === 'ongoing' ? `${stats.daysLeft} left` : 
                   'Completed'}
                </h4>
                <p className="metric-label">Time Status</p>
              </div>
              
              <div className="metric">
                <h4 className="metric-value">{new Date(event.startDate).toLocaleDateString()}</h4>
                <p className="metric-label">Start Date</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="analytics-insight">
        <h4>📊 Analytics Insight</h4>
        <p>
          {generateInsight(event, stats)}
        </p>
      </div>
    </div>
  );
}

function calculateTimelineProgress(stats) {
  if (stats.status === 'upcoming') {
    return '20%';  // Planning phase
  } else if (stats.status === 'ongoing') {
    // Calculate how far along the event is
    const progressInEvent = 100 - ((stats.daysLeft / stats.duration) * 100);
    return `${33 + (progressInEvent / 3)}%`;
  } else {
    return '100%';  // Completed
  }
}

function generateInsight(event, stats) {
  if (stats.status === 'upcoming') {
    if (stats.formCount === 0) {
      return `Your event "${event.name}" is scheduled to start in ${stats.daysUntilStart} days, but there are no OD form requests yet. Consider promoting your event to increase participation.`;
    } else if (stats.participationRate < 30) {
      return `You have ${stats.formCount} OD form requests for "${event.name}" (${stats.participationRate}% of capacity). There's still time to increase participation before the event starts in ${stats.daysUntilStart} days.`;
    } else {
      return `Your event "${event.name}" is getting good traction with ${stats.formCount} OD requests (${stats.participationRate}% of capacity) with ${stats.daysUntilStart} days until it starts.`;
    }
  } else if (stats.status === 'ongoing') {
    if (stats.participationRate < 50) {
      return `Your event "${event.name}" is currently running with ${stats.participationRate}% participation. There are ${stats.daysLeft} days remaining to increase participation.`;
    } else if (stats.isFull) {
      return `Congratulations! Your event "${event.name}" has reached full capacity. The event runs for ${stats.daysLeft} more days.`;
    } else {
      return `Your event "${event.name}" is currently active with ${stats.formCount} participants (${stats.participationRate}% of capacity) and will continue for ${stats.daysLeft} more days.`;
    }
  } else {
    if (stats.participationRate < 30) {
      return `Your event "${event.name}" has concluded with ${stats.participationRate}% participation rate. Consider analyzing why the turnout was lower than expected for future planning.`;
    } else if (stats.participationRate > 80) {
      return `Great success! Your event "${event.name}" concluded with ${stats.participationRate}% participation rate, showing strong interest from the community.`;
    } else {
      return `Your event "${event.name}" has concluded with ${stats.formCount} total participants (${stats.participationRate}% of capacity). Consider collecting feedback to improve future events.`;
    }
  }
}

export default EventAnalytics;
