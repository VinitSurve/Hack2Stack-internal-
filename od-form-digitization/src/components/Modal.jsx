import React, { useState, useEffect } from 'react';
import './Modal.css'; // Add CSS import

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  // Prevent body scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClass = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-3xl',
    xl: 'max-w-5xl',
    full: 'max-w-full'
  }[size] || 'max-w-lg';

  return (
    <div className="modal-backdrop">
      <div className="modal-overlay"></div>
      <div className="modal-container">
        <div className={`modal ${sizeClass}`}>
          <div className="modal-header">
            <h4 className="modal-title">{title}</h4>
            <button 
              className="modal-close"
              onClick={onClose}
            >
              <i className="feather-x"></i>
            </button>
          </div>
          <div className="modal-body">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
