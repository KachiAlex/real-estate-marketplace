import React from 'react';
import EnhancedFileUpload from './EnhancedFileUpload';

const PropertyDocumentUpload = ({ 
  propertyId, 
  onDocumentsChange, 
  initialDocuments = [], 
  maxDocuments = 10,
  disabled = false,
  className = ''
}) => {
  return (
    <EnhancedFileUpload
      propertyId={propertyId}
      onFilesChange={onDocumentsChange}
      initialFiles={initialDocuments}
      maxFiles={maxDocuments}
      maxSize={25 * 1024 * 1024} // 25MB
      allowedTypes={[
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'application/rtf',
        'application/vnd.oasis.opendocument.text'
      ]}
      type="document"
      disabled={disabled}
      className={className}
    />
  );
};

export default PropertyDocumentUpload;
