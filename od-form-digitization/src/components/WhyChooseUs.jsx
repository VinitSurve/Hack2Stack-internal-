import React from 'react';
import './WhyChooseUs.css';

// Custom SVG icons
const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12 6 12 12 16 14"></polyline>
  </svg>
);

const ChartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"></line>
    <line x1="12" y1="20" x2="12" y2="4"></line>
    <line x1="6" y1="20" x2="6" y2="14"></line>
  </svg>
);

const ShieldIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
  </svg>
);

function WhyChooseUs() {
  const benefits = [
    {
      icon: <ClockIcon />,
      title: 'Save Valuable Time',
      description: 'Eliminate paperwork and bureaucracy. Submit your OD forms in minutes and focus on your event preparation instead of administrative tasks.',
      metric: '80%',
      metricLabel: 'Time Saved'
    },
    {
      icon: <ChartIcon />,
      title: 'Real-time Tracking',
      description: 'Instantly track your form\'s journey from submission to approval. Receive timely notifications at every stage of the process.',
      metric: '100%',
      metricLabel: 'Transparency'
    },
    {
      icon: <ShieldIcon />,
      title: 'Secure & Reliable',
      description: 'Your data is protected with enterprise-grade security. Access control ensures only authorized personnel can view your information.',
      metric: '24/7',
      metricLabel: 'Accessibility'
    }
  ];

  return (
    <section className="why-choose-us">
      <div className="container">
        <h2 className="section-title">Why Choose Our Platform?</h2>
        
        <div className="benefits-grid">
          {benefits.map((benefit, index) => (
            <div className="benefit-card" key={index}>
              <div className="benefit-header">
                <div className="benefit-icon-wrapper">
                  {benefit.icon}
                </div>
                <div className="benefit-metric">
                  <span className="metric-value">{benefit.metric}</span>
                  <span className="metric-label">{benefit.metricLabel}</span>
                </div>
              </div>
              
              <h3 className="benefit-title">{benefit.title}</h3>
              <p className="benefit-description">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default WhyChooseUs;
