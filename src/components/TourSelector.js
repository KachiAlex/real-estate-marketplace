import React, { useState, useRef, useEffect } from 'react';
import { FaPlay, FaUser, FaStore, FaHome, FaCheckCircle, FaClock, FaMicrophone, FaVolumeUp } from 'react-icons/fa';
import { useTour } from '../contexts/TourContext';
import { useAuth } from '../contexts/AuthContext';

const TourSelector = ({ onClose }) => {
  const { startTour, availableTours, isTourCompleted } = useTour();
  const { user } = useAuth();
  const [selectedTour, setSelectedTour] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speakingRef = useRef(false);

  // Speak welcome message when component mounts
  useEffect(() => {
    const welcomeMessage = "Hello there! Welcome toPropertyArk! I'm yourPropertyArkAI assistant. I'm so excited to show you around our platform! I can give you a wonderful guided tour that will help you discover all the amazing features we have. Please choose from the available tours below to get started. I'll be speaking to you throughout the tour, so make sure your speakers are on!";
    speakText(welcomeMessage);
  }, []);

  // Speak tour instructions with natural, human-like voice
  const speakText = (text) => {
    try {
      if (!window.speechSynthesis) return;
      
      // Wait for voices to load
      const speakWithVoice = () => {
        const voices = window.speechSynthesis.getVoices();
        let selectedVoice = null;
        
        // Priority list of natural female voices (most natural first)
        const naturalFemaleVoices = [
          'Samantha', // macOS - Very natural
          'Karen', // macOS - Natural
          'Victoria', // macOS - Natural
          'Fiona', // macOS - Natural
          'Moira', // macOS - Natural
          'Tessa', // macOS - Natural
          'Veena', // macOS - Natural
          'Microsoft Zira Desktop', // Windows - Natural
          'Microsoft Hazel Desktop', // Windows - Natural
          'Microsoft Susan Desktop', // Windows - Natural
          'Microsoft Eva Desktop', // Windows - Natural
          'Google UK English Female', // Chrome - Natural
          'Google US English Female', // Chrome - Natural
          'Google Australian English Female', // Chrome - Natural
          'Google Canadian English Female', // Chrome - Natural
          'Google Indian English Female', // Chrome - Natural
          'Google Irish English Female', // Chrome - Natural
          'Google New Zealand English Female', // Chrome - Natural
          'Google South African English Female', // Chrome - Natural
          'Google UK English Female', // Chrome - Natural
          'Google US English Female', // Chrome - Natural
          'Google Welsh English Female' // Chrome - Natural
        ];
        
        // Look for the most natural female voice
        selectedVoice = voices.find(voice => 
          naturalFemaleVoices.some(name => voice.name.includes(name))
        );
        
        // If no natural female voice found, look for any female voice
        if (!selectedVoice) {
          selectedVoice = voices.find(voice => 
            voice.name.toLowerCase().includes('female') ||
            voice.name.toLowerCase().includes('woman') ||
            voice.name.toLowerCase().includes('girl')
          );
        }
        
        // If still no female voice, use the first available voice
        if (!selectedVoice && voices.length > 0) {
          selectedVoice = voices[0];
        }
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        
        // Natural speech parameters for human-like voice
        utterance.rate = 0.85; // Slightly slower for natural conversation
        utterance.pitch = 1.15; // Slightly higher for female voice
        utterance.volume = 0.9; // Slightly softer for warmth
        
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }
        
        // Add natural pauses and emphasis
        const naturalText = text
          .replace(/\./g, '. ') // Add pause after periods
          .replace(/,/g, ', ') // Add pause after commas
          .replace(/:/g, ': ') // Add pause after colons
          .replace(/;/g, '; ') // Add pause after semicolons
          .replace(/!/g, '! ') // Add pause after exclamations
          .replace(/\?/g, '? ') // Add pause after questions
          .replace(/\s+/g, ' '); // Clean up extra spaces
        
        utterance.text = naturalText;
        
        speakingRef.current = true;
        setIsSpeaking(true);
        
        utterance.onend = () => { 
          speakingRef.current = false; 
          setIsSpeaking(false);
        };
        
        utterance.onerror = () => { 
          speakingRef.current = false; 
          setIsSpeaking(false);
        };
        
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
      };
      
      // If voices are already loaded, speak immediately
      if (window.speechSynthesis.getVoices().length > 0) {
        speakWithVoice();
      } else {
        // Wait for voices to load
        window.speechSynthesis.addEventListener('voiceschanged', speakWithVoice, { once: true });
      }
    } catch (error) {
      console.error('Error speaking text:', error);
    }
  };

  const getTourIcon = (tourId) => {
    switch (tourId) {
      case 'comprehensive':
        return FaPlay;
      case 'new-user':
        return FaHome;
      case 'vendor-tour':
        return FaStore;
      case 'buyer-tour':
        return FaUser;
      default:
        return FaPlay;
    }
  };

  const getTourDescription = (tourId) => {
    switch (tourId) {
      case 'comprehensive':
        return 'Complete tour showcasing all platform features and pages';
      case 'new-user':
        return 'Perfect for new users to get familiar with the platform';
      case 'vendor-tour':
        return 'Learn how to list and manage your properties effectively';
      case 'buyer-tour':
        return 'Discover how to find and purchase your perfect property';
      default:
        return 'Explore platform features and functionality';
    }
  };

  const handleStartTour = (tourId) => {
    startTour(tourId);
    if (onClose) onClose();
  };

  return (
    <div className="bg-white rounded-lg shadow-xl max-w-2xl mx-auto p-6">
      <div className="text-center mb-6">
        <div className="flex items-center justify-center space-x-2 mb-2">
          <h2 className="text-2xl font-bold text-gray-900">
            Welcome toPropertyArk! 
          </h2>
          {isSpeaking && <FaVolumeUp className="text-blue-500 animate-pulse" />}
        </div>
        <p className="text-gray-600">
          Let me show you around our platform. Choose a tour that best fits your needs:
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {Object.entries(availableTours).map(([tourId, tour]) => {
          const Icon = getTourIcon(tourId);
          const isCompleted = isTourCompleted(tourId);
          const isRecommended = 
            tourId === 'comprehensive' ||
            (tourId === 'new-user' && !user) ||
            (tourId === 'vendor-tour' && user?.role === 'vendor') ||
            (tourId === 'buyer-tour' && user?.role === 'user');

          return (
            <div
              key={tourId}
              className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                selectedTour === tourId
                  ? 'border-blue-500 bg-blue-50'
                  : isCompleted
                  ? 'border-green-200 bg-green-50'
                  : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
              }`}
              onClick={() => setSelectedTour(tourId)}
            >
              {/* Completed Badge */}
              {isCompleted && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <FaCheckCircle className="text-white text-xs" />
                </div>
              )}

              {/* Recommended Badge */}
              {isRecommended && !isCompleted && (
                <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                  Recommended
                </div>
              )}

              <div className="text-center">
                <div className="flex justify-center mb-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    isCompleted ? 'bg-green-100' : 'bg-blue-100'
                  }`}>
                    <Icon className={`text-xl ${isCompleted ? 'text-green-600' : 'text-blue-600'}`} />
                  </div>
                </div>
                
                <h3 className="font-semibold text-gray-900 mb-2">
                  {tour.name}
                </h3>
                
                <p className="text-sm text-gray-600 mb-3">
                  {getTourDescription(tourId)}
                </p>

                <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
                  <FaClock />
                  <span>{tour.duration}</span>
                </div>

                {isCompleted && (
                  <div className="mt-2 text-xs text-green-600 font-medium">
                    ✓ Completed
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4 border-t">
        <button
          onClick={onClose}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          Maybe Later
        </button>
        
        <button
          onClick={() => selectedTour && handleStartTour(selectedTour)}
          disabled={!selectedTour}
          className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          <FaPlay size={14} />
          <span>Start Tour</span>
        </button>
      </div>

      {/* Tour Tips */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">
          <strong>Tip:</strong> You can take multiple tours and revisit them anytime. 
          Each tour is designed to help you get the most out of our platform.
        </p>
      </div>
    </div>
  );
};

export default TourSelector;



