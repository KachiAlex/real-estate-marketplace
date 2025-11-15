import React, { useState, useEffect } from 'react';
import { FaPlay, FaTimes, FaRobot, FaVolumeUp } from 'react-icons/fa';
import { useTour } from '../contexts/TourContext';

const AutoTourPopup = () => {
  const { isFirstTimeVisitor, startTour, skipTour } = useTour();
  const [showPopup, setShowPopup] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    // Show popup for first-time visitors after a delay
    if (isFirstTimeVisitor()) {
      setTimeout(() => {
        setShowPopup(true);
        speakWelcomeMessage();
      }, 3000); // Wait 3 seconds for page to load
    }
  }, [isFirstTimeVisitor]);

  const speakWelcomeMessage = () => {
    try {
      if (!window.speechSynthesis) return;
      
      const voices = window.speechSynthesis.getVoices();
      let selectedVoice = null;
      
      // Try to find a natural female voice
      const naturalFemaleVoices = [
        'Samantha', 'Karen', 'Victoria', 'Fiona', 'Moira', 'Tessa', 'Veena',
        'Microsoft Zira Desktop', 'Microsoft Hazel Desktop', 'Microsoft Susan Desktop',
        'Google UK English Female', 'Google US English Female'
      ];
      
      selectedVoice = voices.find(voice => 
        naturalFemaleVoices.some(name => voice.name.includes(name))
      );
      
      if (!selectedVoice && voices.length > 0) {
        selectedVoice = voices[0];
      }
      
      const welcomeText = "Welcome to Property Ark! I'm your Property Ark AI assistant. I'm so excited to meet you! I'd love to give you a comprehensive tour of our amazing platform. Would you like me to show you around?";
      
      const utterance = new SpeechSynthesisUtterance(welcomeText);
      utterance.lang = 'en-US';
      utterance.rate = 0.85;
      utterance.pitch = 1.15;
      utterance.volume = 0.9;
      
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      
      setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('Error speaking welcome message:', error);
    }
  };

  const handleStartTour = () => {
    setShowPopup(false);
    startTour('comprehensive');
  };

  const handleSkipTour = () => {
    setShowPopup(false);
    skipTour();
  };

  if (!showPopup) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md mx-auto p-6 relative">
        {/* Close button */}
        <button
          onClick={handleSkipTour}
          className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
        >
          <FaTimes className="text-gray-600" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <FaRobot className="text-white text-2xl" />
            </div>
            {isSpeaking && <FaVolumeUp className="text-blue-500 animate-pulse text-xl" />}
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome to Property Ark! 
          </h2>
          <p className="text-gray-600">
            I'm your Property Ark AI assistant! I'm so excited to meet you and show you around our amazing platform.
          </p>
        </div>

        {/* Content */}
        <div className="mb-6">
          <p className="text-gray-700 leading-relaxed mb-4">
            I'd love to give you a comprehensive tour that will showcase all the wonderful features we have to offer. 
            You'll get to see our property listings, investment opportunities, vendor dashboard, and so much more!
          </p>
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Voice-Guided Tour:</strong> I'll speak to you throughout the tour and you can use voice commands to navigate hands-free!
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleSkipTour}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Maybe Later
          </button>
          
          <button
            onClick={handleStartTour}
            className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
          >
            <FaPlay size={14} />
            <span>Start Tour</span>
          </button>
        </div>

        {/* Tour Features */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            <strong>What you'll discover:</strong> Property search, investment opportunities, vendor features, 
            personal dashboard, and much more!
          </p>
        </div>
      </div>
    </div>
  );
};

export default AutoTourPopup;


