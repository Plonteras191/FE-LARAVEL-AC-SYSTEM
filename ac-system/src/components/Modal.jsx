// src/components/Modal.jsx
import React from 'react';
import '../styles/Modal.css';

const Modal = ({ isOpen, title, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal">
        {title && <h2 className="modal-title">{title}</h2>}
        {message && <p className="modal-message">{message}</p>}
        <div className="modal-actions">
          <button className="modal-confirm" onClick={onConfirm}>Yes</button>
          <button className="modal-cancel" onClick={onCancel}>No</button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
