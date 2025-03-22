import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { logger } from '../../utils';

/**
 * File upload component for chat attachments
 */
const FileUpload = ({ onFileSelect, maxFileSize = 5 * 1024 * 1024, acceptedTypes = '*' }) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  // Handle drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  // Trigger file input click
  const handleButtonClick = () => {
    fileInputRef.current.click();
  };

  // Process the selected file
  const processFile = (file) => {
    setError('');
    
    // Validate file size
    if (file.size > maxFileSize) {
      const errorMsg = `File size exceeds the ${maxFileSize / (1024 * 1024)}MB limit`;
      setError(errorMsg);
      logger.warn('FileUpload', errorMsg, { fileSize: file.size });
      return;
    }
    
    // If there's a specific type validation
    if (acceptedTypes !== '*' && !file.type.match(acceptedTypes)) {
      const errorMsg = 'File type not supported';
      setError(errorMsg);
      logger.warn('FileUpload', errorMsg, { fileType: file.type });
      return;
    }
    
    logger.info('FileUpload', 'File selected', { fileName: file.name, fileSize: file.size });
    onFileSelect(file);
  };

  // Handle file drop
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  // Handle file input change
  const handleChange = (e) => {
    e.preventDefault();
    
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="file-upload">
      <div 
        className={`file-upload__dropzone ${dragActive ? 'file-upload__dropzone--active' : ''}`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
      >
        <input 
          ref={fileInputRef}
          type="file" 
          className="file-upload__input"
          onChange={handleChange}
          accept={acceptedTypes}
        />
        <button 
          className="file-upload__button"
          onClick={handleButtonClick}
          type="button"
        >
          <span className="file-upload__icon">📎</span>
          <span className="file-upload__text">Upload File</span>
        </button>
        {dragActive && (
          <div className="file-upload__drag-overlay">
            <p>Drop the file here</p>
          </div>
        )}
      </div>
      
      {error && (
        <div className="file-upload__error">
          {error}
        </div>
      )}
    </div>
  );
};

FileUpload.propTypes = {
  onFileSelect: PropTypes.func.isRequired,
  maxFileSize: PropTypes.number,
  acceptedTypes: PropTypes.string
};

export default FileUpload; 