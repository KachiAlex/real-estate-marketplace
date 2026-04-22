import React, { useState, useRef, useEffect } from 'react';
import { FaPlay, FaTimes, FaVolumeUp, FaMicrophone } from 'react-icons/fa';

const TourStartModal = ({ onStartTour, onSkipTour, onClose }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speakingRef = useRef(false);

  // Speak welcome message when component mounts
  useEffect(() => {
    const welcomeMessage = "Welcome to PropertyArk! I'm your PropertyArk AI assistant. I'd love to give you a guided tour of our amazing platform. The tour will be completely voice-guided, so I'll speak to you as we explore each section. You can use voice commands to navigate, and there will always be a skip button if you want to end the tour early. Would you like to start the tour?";
    speakText(welcomeMessage);
  }, []);

  // Speak text with natural, human-like voice
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

  const handleStartTour = () => {
    onStartTour();
    onClose();
  };

  const handleSkipTour = () => {
    onSkipTour();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <FaMicrophone className="text-white text-lg" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Welcome to PropertyArk!</h2>
              <p className="text-sm text-gray-600">Your PropertyArk AI Assistant</p>
            </div>
          </div>
          {isSpeaking && <FaVolumeUp className="text-blue-500 animate-pulse" />}
        </div>

        {/* Content */}
        <div className="mb-6">
          <p className="text-gray-700 mb-4">
            I'm your PropertyArk AI assistant! I'd love to give you a guided tour of our amazing platform.
          </p>
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Voice-Guided Tour Features:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Completely voice-guided experience</li>
              <li>• Navigate with voice commands</li>
              <li>• Skip button available anytime</li>
              <li>• Natural, conversational guidance</li>
            </ul>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={handleStartTour}
            className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-4 rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all duration-200 flex items-center justify-center space-x-2"
          >
            <FaPlay className="text-sm" />
            <span>Start Tour</span>
          </button>
          <button
            onClick={handleSkipTour}
            className="flex-1 bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors"
          >
            Skip Tour
          </button>
        </div>

        {/* Footer */}
        <p className="text-xs text-gray-500 mt-4 text-center">
          You can always start a tour later from the AI assistant
        </p>
      </div>
    </div>
  );
};

export default TourStartModal;



