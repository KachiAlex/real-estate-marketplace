import React, { useState, useRef, useEffect } from 'react';
import { FaRobot, FaPlay, FaVolumeUp } from 'react-icons/fa';
import { useTour } from '../contexts/TourContext';

const TourStartButton = () => {
  const { shouldShowTourButton, startTour } = useTour();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speakingRef = useRef(false);

  // Speak welcome message when component mounts
  useEffect(() => {
    if (shouldShowTourButton()) {
      const welcomeMessage = "Hi there! I'm KIKI, your friendly AI assistant! I'd love to give you a guided tour of our amazing platform. Click the 'Start Tour' button to begin!";
      speakText(welcomeMessage);
    }
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
    startTour('comprehensive');
  };

  if (!shouldShowTourButton()) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="relative">
        {/* AI Character */}
        <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer">
          <FaRobot className="text-white text-2xl" />
        </div>
        
        {/* Speaking Indicator */}
        {isSpeaking && (
          <div className="absolute -top-1 -left-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
            <FaVolumeUp className="text-white text-xs" />
          </div>
        )}

        {/* Start Tour Button */}
        <button
          onClick={handleStartTour}
          className="absolute -top-2 -right-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium transition-colors shadow-lg"
        >
          <FaPlay className="inline mr-1" size={8} />
          Start Tour
        </button>
      </div>
    </div>
  );
};

export default TourStartButton;
