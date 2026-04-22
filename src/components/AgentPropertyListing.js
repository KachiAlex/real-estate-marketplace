import React, { useState } from 'react';
import { FaFileUpload, FaCheck, FaExclamationTriangle, FaUser, FaBuilding } from 'react-icons/fa';

const AgentPropertyListing = ({ 
  isAgent, 
  isPropertyOwner, 
  isListingAsAgent, 
  setIsListingAsAgent, 
  attestationLetter, 
  setAttestationLetter,
  documentStatus,
  onAttestationUpload,
  errors 
}) => {
  const [dragActive, setDragActive] = useState(false);

  const handleFileUpload = (file) => {
    if (file && file.type === 'application/pdf') {
      setAttestationLetter(file);
      onAttestationUpload(file);
    } else {
      alert('Please upload a PDF file for the attestation letter.');
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  const getDocumentStatusIcon = () => {
    if (!documentStatus?.hasAttestationLetter) {
      return <FaExclamationTriangle className="text-red-500" />;
    }
    switch (documentStatus.attestationStatus) {
      case 'verified':
        return <FaCheck className="text-green-500" />;
      case 'pending':
        return <FaExclamationTriangle className="text-yellow-500" />;
      case 'rejected':
        return <FaExclamationTriangle className="text-red-500" />;
      default:
        return <FaExclamationTriangle className="text-gray-500" />;
    }
  };

  const getDocumentStatusText = () => {
    if (!documentStatus?.hasAttestationLetter) {
      return 'No attestation letter uploaded';
    }
    switch (documentStatus.attestationStatus) {
      case 'verified':
        return 'Attestation letter verified';
      case 'pending':
        return 'Attestation letter pending review';
      case 'rejected':
        return 'Attestation letter rejected - please upload a new one';
      default:
        return 'Attestation letter status unknown';
    }
  };

  const getDocumentStatusColor = () => {
    if (!documentStatus?.hasAttestationLetter) {
      return 'text-red-600 bg-red-50 border-red-200';
    }
    switch (documentStatus.attestationStatus) {
      case 'verified':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'rejected':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <FaUser className="mr-2" />
        Property Listing Type
      </h3>

      {/* Role Selection */}
      <div className="space-y-4 mb-6">
        <div className="flex items-center space-x-4">
          <label className="flex items-center">
            <input
              type="radio"
              name="listingType"
              value="owner"
              checked={!isListingAsAgent}
              onChange={() => setIsListingAsAgent(false)}
              className="mr-2"
            />
            <div className="flex items-center">
              <FaBuilding className="mr-2 text-blue-500" />
              <span className="font-medium">I am the property owner</span>
            </div>
          </label>
        </div>

        <div className="flex items-center space-x-4">
          <label className="flex items-center">
            <input
              type="radio"
              name="listingType"
              value="agent"
              checked={isListingAsAgent}
              onChange={() => setIsListingAsAgent(true)}
              className="mr-2"
            />
            <div className="flex items-center">
              <FaUser className="mr-2 text-orange-500" />
              <span className="font-medium">I am an agent listing for a client</span>
            </div>
          </label>
        </div>
      </div>

      {/* Agent-specific requirements */}
      {isListingAsAgent && (
        <div className="border-t pt-6">
          <div className="mb-4">
            <h4 className="text-md font-semibold text-gray-900 mb-2">
              Agent Requirements
            </h4>
            <p className="text-sm text-gray-600 mb-4">
              As an agent, you must upload a letter of attestation from the property owner 
              authorizing you to list this property. This document will be verified by our 
              admin team before the property is published.
            </p>
          </div>

          {/* Document Status */}
          <div className={`p-4 rounded-lg border ${getDocumentStatusColor()} mb-4`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {getDocumentStatusIcon()}
                <span className="ml-2 font-medium">{getDocumentStatusText()}</span>
              </div>
              {documentStatus?.attestationStatus === 'verified' && (
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  Ready to list
                </span>
              )}
            </div>
          </div>

          {/* File Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragActive 
                ? 'border-blue-400 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <FaFileUpload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <div className="text-sm text-gray-600 mb-2">
              <span className="font-medium">Upload Attestation Letter</span>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Drag and drop your PDF file here, or click to browse
            </p>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileInput}
              className="hidden"
              id="attestation-upload"
            />
            <label
              htmlFor="attestation-upload"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
            >
              Choose File
            </label>
            {attestationLetter && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center">
                  <FaCheck className="text-green-500 mr-2" />
                  <span className="text-sm text-green-700">
                    {attestationLetter.name}
                  </span>
                </div>
              </div>
            )}
          </div>

          {errors.attestationLetter && (
            <p className="mt-2 text-sm text-red-600">{errors.attestationLetter}</p>
          )}

          {/* Important Notice */}
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex">
              <FaExclamationTriangle className="text-yellow-500 mr-2 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium">Important Notice:</p>
                <p className="mt-1">
                  Properties listed by agents without verified attestation letters will not be 
                  published until the document is reviewed and approved by our admin team. 
                  This process typically takes 1-2 business days.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Property Owner Notice */}
      {!isListingAsAgent && (
        <div className="border-t pt-6">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex">
              <FaBuilding className="text-blue-500 mr-2 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">Property Owner Listing:</p>
                <p className="mt-1">
                  As the property owner, you can list your property immediately without 
                  additional documentation requirements. Your property will be published 
                  after basic verification.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentPropertyListing;
