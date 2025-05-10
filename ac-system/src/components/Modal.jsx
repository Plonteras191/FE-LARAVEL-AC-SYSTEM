import React from 'react';
import '../styles/Modal.css';

const Modal = ({ isOpen, title, message, onConfirm, onCancel, actionType }) => {
  if (!isOpen) return null;
  
  // Determine the correct class and text for the confirm button based on action type
  const getConfirmButtonConfig = () => {
    switch (actionType) {
      case 'reject':
        return { 
          className: 'modal-confirm-button modal-reject-confirm',
          text: 'Reject Appointment'
        };
      case 'accept':
        return { 
          className: 'modal-confirm-button modal-accept-confirm',
          text: 'Accept Appointment'
        };
      case 'complete':
        return { 
          className: 'modal-confirm-button modal-complete-confirm',
          text: 'Mark as Completed'
        };
      default:
        return { 
          className: 'modal-confirm-button',
          text: 'Confirm'
        };
    }
  };

  const buttonConfig = getConfirmButtonConfig();
  
  // Determine icon based on action type
  const getModalIcon = () => {
    switch (actionType) {
      case 'reject':
        return <div className="modal-icon modal-icon-reject">✕</div>;
      case 'accept':
        return <div className="modal-icon modal-icon-accept">✓</div>;
      case 'complete':
        return <div className="modal-icon modal-icon-complete">✓</div>;
      default:
        return <div className="modal-icon">!</div>;
    }
  };
  
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          {getModalIcon()}
          <h3 className="modal-title">{title}</h3>
        </div>
        <div className="modal-body">
          <p>{message}</p>
        </div>
        <div className="modal-footer">
          <button 
            className="modal-cancel-button"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button 
            className={buttonConfig.className}
            onClick={onConfirm}
          >
            {buttonConfig.text}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;