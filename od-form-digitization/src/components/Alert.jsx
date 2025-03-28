import { useState, useEffect } from 'react';

function Alert({ message, type = 'info', duration = 5000, onClose }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setVisible(false);
        if (onClose) onClose();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  if (!visible || !message) return null;

  const alertClass = `alert alert-${type}`;

  return (
    <div className={alertClass} role="alert">
      <div className="alert-content">
        {message}
      </div>
      <button 
        type="button" 
        className="alert-close" 
        aria-label="Close" 
        onClick={() => {
          setVisible(false);
          if (onClose) onClose();
        }}
      >
        &times;
      </button>
    </div>
  );
}

export default Alert;
