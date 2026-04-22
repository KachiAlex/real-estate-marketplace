// Utility functions for property verification status

export const getVerificationStatus = (propertyId) => {
  if (!propertyId) return null;
  
  try {
    const verificationStatus = JSON.parse(localStorage.getItem('propertyVerificationStatus') || '{}');
    return verificationStatus[propertyId] || null;
  } catch (error) {
    console.error('Error getting verification status:', error);
    return null;
  }
};

export const isVerificationRequested = (propertyId) => {
  const status = getVerificationStatus(propertyId);
  return status?.status === 'requested';
};

export const isVerificationApproved = (propertyId) => {
  const status = getVerificationStatus(propertyId);
  return status?.status === 'approved';
};

export const setVerificationStatus = (propertyId, status, additionalData = {}) => {
  if (!propertyId) return;
  
  try {
    const verificationStatus = JSON.parse(localStorage.getItem('propertyVerificationStatus') || '{}');
    verificationStatus[propertyId] = {
      status,
      updatedAt: new Date().toISOString(),
      ...additionalData
    };
    localStorage.setItem('propertyVerificationStatus', JSON.stringify(verificationStatus));
  } catch (error) {
    console.error('Error setting verification status:', error);
  }
};

export const getVerificationButtonText = (propertyId) => {
  if (isVerificationApproved(propertyId)) {
    return 'Verified';
  }
  if (isVerificationRequested(propertyId)) {
    return 'Verification Requested';
  }
  return 'Get Verified';
};

export const getVerificationButtonClass = (propertyId) => {
  if (isVerificationApproved(propertyId)) {
    return 'bg-green-600 text-white cursor-not-allowed';
  }
  if (isVerificationRequested(propertyId)) {
    return 'bg-yellow-600 text-white cursor-not-allowed';
  }
  return 'bg-blue-600 text-white hover:bg-blue-700';
};
