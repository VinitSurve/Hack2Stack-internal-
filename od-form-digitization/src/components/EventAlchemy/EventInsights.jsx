function EventInsights({ event, stats }) {
  if (!event || !stats) {
    return <div className="loading-spinner">Loading insights...</div>;
  }

  // Generate insights based on event data
  const insights = generateEventInsights(event, stats);

  return (
    <div className="event-insights">
      <h3>Event Insights</h3>
      <p className="insights-intro">
        AI-powered insights to help you understand your event performance and opportunities.
      </p>

      <div className="insights-list">
        {insights.map((insight, index) => (
          <div key={index} className="insight-card">
            <div className="insight-icon">
              <i className={insight.icon}></i>
            </div>
            <div className="insight-content">
              <h4 className="insight-title">{insight.title}</h4>
              <p className="insight-description">{insight.description}</p>
              {insight.action && (
                <div className="insight-action">
                  <span>Recommendation: </span>
                  {insight.action}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="ai-disclaimer">
        <p>
          <i className="icon-ai"></i> These insights are generated using data pattern analysis and AI algorithms. 
          Always use your judgment when making decisions based on these insights.
        </p>
      </div>
    </div>
  );
}

function generateEventInsights(event, stats) {
  const insights = [];
  const now = new Date();
  const startDate = new Date(event.startDate);
  const endDate = new Date(event.endDate);
  
  // Participation insight
  if (stats.status !== 'completed') {
    if (stats.participationRate < 30) {
      insights.push({
        icon: 'icon-alert',
        title: 'Low Participation Rate',
        description: `Your event currently has a ${stats.participationRate}% participation rate, which is lower than the average of 65%.`,
        action: 'Consider promoting your event through additional channels or offering incentives for participation.'
      });
    } else if (stats.participationRate > 80) {
      insights.push({
        icon: 'icon-check',
        title: 'Excellent Participation Rate',
        description: `Your event has achieved a ${stats.participationRate}% participation rate, which is higher than the average of 65%.`,
        action: 'Consider expanding the event capacity or planning similar events in the future.'
      });
    }
  }
  
  // Timing insight
  if (stats.status === 'upcoming' && stats.daysUntilStart < 7) {
    insights.push({
      icon: 'icon-clock',
      title: 'Approaching Start Date',
      description: `Your event starts in ${stats.daysUntilStart} days, which is a critical time for final preparations.`,
      action: 'Send reminders to registered participants and finalize all logistics arrangements.'
    });
  } else if (stats.status === 'ongoing' && stats.daysLeft < 3) {
    insights.push({
      icon: 'icon-warning',
      title: 'Event Ending Soon',
      description: `Your event has only ${stats.daysLeft} days remaining until completion.`,
      action: 'Prepare to collect feedback from participants and begin post-event follow-up.'
    });
  }
  
  // Event description insight
  if (event.description && event.description.length < 50) {
    insights.push({
      icon: 'icon-edit',
      title: 'Brief Event Description',
      description: 'Your event has a very short description, which may not provide enough information to potential participants.',
      action: 'Enhance your event description with more details about activities, benefits, and what participants can expect.'
    });
  }
  
  // Duration insight
  if (stats.duration > 14) {
    insights.push({
      icon: 'icon-calendar',
      title: 'Extended Event Duration',
      description: `Your event spans ${stats.duration} days, which is longer than typical events.`,
      action: 'Consider breaking it into smaller segments or providing clear milestones to maintain participant engagement throughout.'
    });
  } else if (stats.duration === 1) {
    insights.push({
      icon: 'icon-time',
      title: 'Single-Day Event',
      description: 'Your event is scheduled for just one day, which requires efficient time management.',
      action: 'Ensure your agenda is well-planned to maximize value in the limited time available.'
    });
  }
  
  // Capacity insight
  if (event.maxParticipants && stats.formCount > event.maxParticipants * 0.9 && stats.status !== 'completed') {
    insights.push({
      icon: 'icon-users',
      title: 'Near Capacity',
      description: `Your event is at ${stats.participationRate}% capacity, with limited spots remaining.`,
      action: 'Consider creating a waiting list or expanding capacity if possible.'
    });
  }
  
  // Location insight
  if (!event.location || event.location.trim() === '') {
    insights.push({
      icon: 'icon-map',
      title: 'Missing Location Information',
      description: 'Your event does not have a specified location, which may cause confusion for participants.',
      action: 'Add location details to provide clarity for participants.'
    });
  }
  
  // If we don't have many insights, add a generic one
  if (insights.length < 2) {
    insights.push({
      icon: 'icon-lightbulb',
      title: 'Event Health Check',
      description: `Your event "${event.name}" appears to be well-configured with appropriate details and settings.`,
      action: 'Continue monitoring participation and engagement as the event progresses.'
    });
  }
  
  return insights;
}

export default EventInsights;
