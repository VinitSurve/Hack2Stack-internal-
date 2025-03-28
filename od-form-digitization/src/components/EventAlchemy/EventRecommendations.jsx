import './EventRecommendations.css';

function EventRecommendations({ event, stats }) {
  if (!event || !stats) {
    return <div className="loading-spinner">Loading recommendations...</div>;
  }

  // Generate recommendations based on event data
  const recommendations = generateRecommendations(event, stats);

  return (
    <div className="event-recommendations">
      <h3>Smart Recommendations</h3>
      <p className="recommendations-intro">
        AI-powered recommendations to enhance your event success.
      </p>

      <div className="recommendations-list">
        {recommendations.map((recommendation, index) => (
          <div key={index} className="recommendation-card">
            <div className="recommendation-header">
              <div className={`recommendation-priority ${recommendation.priority}`}>
                <span className="priority-indicator"></span>
                {recommendation.priority.charAt(0).toUpperCase() + recommendation.priority.slice(1)} Priority
              </div>
              <div className="recommendation-category">{recommendation.category}</div>
            </div>
            <h4 className="recommendation-title">{recommendation.title}</h4>
            <p className="recommendation-description">{recommendation.description}</p>
            <div className="recommendation-actions">
              <h5>Suggested Actions:</h5>
              <ul>
                {recommendation.actions.map((action, actionIndex) => (
                  <li key={actionIndex}>{action}</li>
                ))}
              </ul>
            </div>
            <div className="recommendation-timeline">
              <i className="icon-time"></i> Best implemented: {recommendation.timeline}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Helper function to generate recommendations based on event data
function generateRecommendations(event, stats) {
  // This is a placeholder function - in a real application,
  // this would analyze the event data and generate smart recommendations
  
  const recommendations = [
    {
      priority: 'high',
      category: 'Marketing',
      title: 'Increase Social Media Presence',
      description: 'Based on current registration numbers, your event needs more visibility on social platforms.',
      actions: [
        'Create 3 promotional posts per week on Instagram and Twitter',
        'Run targeted ads to your identified demographic',
        'Encourage speakers to share the event with their networks'
      ],
      timeline: '4-6 weeks before event'
    },
    {
      priority: 'medium',
      category: 'Logistics',
      title: 'Optimize Check-in Process',
      description: 'Previous similar events had check-in bottlenecks. Plan for a smoother attendee arrival experience.',
      actions: [
        'Set up 2 additional check-in stations',
        'Implement mobile check-in to reduce lines',
        'Schedule staggered arrival times if possible'
      ],
      timeline: '2-3 weeks before event'
    },
    {
      priority: 'low',
      category: 'Engagement',
      title: 'Add Interactive Elements',
      description: 'Add more ways for attendees to engage with content and each other during the event.',
      actions: [
        'Incorporate live polling during sessions',
        'Set up a networking area with conversation prompts',
        'Create a photo wall for social sharing'
      ],
      timeline: '1-2 weeks before event'
    }
  ];
  
  return recommendations;
}

export default EventRecommendations;
