import React from 'react';
import { useTour } from '../contexts/TourContext';
import TourStartModal from './TourStartModal';

const TourModalWrapper = () => {
  const { showTourStartModal, handleTourStart, handleTourSkip, setShowTourStartModal } = useTour();

  if (!showTourStartModal) return null;

  return (
    <TourStartModal 
      onStartTour={handleTourStart}
      onSkipTour={handleTourSkip}
      onClose={() => setShowTourStartModal(false)}
    />
  );
};

export default TourModalWrapper;
