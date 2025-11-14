import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTour } from '../contexts/TourContext';
import { FaRobot, FaTimes, FaVolumeUp, FaMicrophone } from 'react-icons/fa';

const AITourGuide = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [showDialogue, setShowDialogue] = useState(false);
  const [autoNavigate, setAutoNavigate] = useState(true);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  
  const { isTourActive, tourSteps, completeTour, skipTour } = useTour();
  const navigate = useNavigate();
  const location = useLocation();
  const speakingRef = useRef(false);
  const timeoutRef = useRef(null);

  // Auto-navigation steps with dialogue
  const tourDialogue = [
    {
      message: "Hi there! I'm your Property Ark AI assistant! Welcome to Property Ark! 🏠",
      action: null,
      delay: 3000
    },
    {
      message: "Let me show you around our amazing platform. First, let's explore the home page where you can find beautiful properties!",
      action: () => navigate('/'),
      delay: 4000
    },
    {
      message: "Here you can browse through our extensive collection of properties. You can filter by location, price, and amenities!",
      action: null,
      delay: 4000
    },
    {
      message: "Now let's check out the properties section where you can see all available listings!",
      action: () => navigate('/properties'),
      delay: 4000
    },
    {
      message: "This is where you can search and filter properties based on your preferences. Pretty neat, right?",
      action: null,
      delay: 4000
    },
    {
      message: "Let's explore the investment opportunities! This is where you can invest in real estate projects!",
      action: () => navigate('/investment'),
      delay: 4000
    },
    {
      message: "Here you can invest in various real estate projects and earn returns. It's a great way to grow your money!",
      action: null,
      delay: 4000
    },
    {
      message: "Now let's check out the mortgage section where you can get financing for your property purchases!",
      action: () => navigate('/mortgage'),
      delay: 4000
    },
    {
      message: "This section helps you calculate mortgage payments and explore financing options for your dream home!",
      action: null,
      delay: 4000
    },
    {
      message: "Let's go back to the home page to see the complete experience!",
      action: () => navigate('/'),
      delay: 4000
    },
    {
      message: "Perfect! You've now seen the main features of our platform. I hope you enjoyed the tour!",
      action: null,
      delay: 4000
    },
    {
      message: "That's it for our tour! Feel free to explore more on your own. I'm always here to help if you need anything!",
      action: () => completeTour(),
      delay: 3000
    }
  ];

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

  // Auto-navigate through the tour
  const startAutoTour = () => {
    if (currentStepIndex >= tourDialogue.length) {
      completeTour();
      return;
    }

    const currentStep = tourDialogue[currentStepIndex];
    setCurrentMessage(currentStep.message);
    setShowDialogue(true);
    setIsAnimating(true);
    
    // Speak the message
    speakText(currentStep.message);
    
    // Execute action if any
    if (currentStep.action) {
      setTimeout(() => {
        currentStep.action();
      }, 1000);
    }
    
    // Move to next step after delay
    timeoutRef.current = setTimeout(() => {
      setIsAnimating(false);
      setShowDialogue(false);
      setCurrentStepIndex(prev => prev + 1);
    }, currentStep.delay);
  };

  // Start tour when component mounts
  useEffect(() => {
    if (isTourActive) {
      setIsVisible(true);
      setTimeout(() => {
        startAutoTour();
      }, 1000);
    } else {
      setIsVisible(false);
    }
  }, [isTourActive]);

  // Continue auto-tour when step changes
  useEffect(() => {
    if (isTourActive && currentStepIndex > 0) {
      setTimeout(() => {
        startAutoTour();
      }, 1000);
    }
  }, [currentStepIndex]);

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleSkipTour = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    skipTour();
    setIsVisible(false);
    setShowDialogue(false);
  };

  if (!isVisible || !isTourActive) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* AI Character */}
      <div className="relative">
        {/* Dialogue Bubble */}
        {showDialogue && (
          <div className={`absolute bottom-16 right-0 mb-2 transition-all duration-500 ${
            isAnimating ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
          }`}>
            <div className="bg-white rounded-2xl shadow-lg border-2 border-purple-200 p-4 max-w-xs">
              {/* Dialogue Tail */}
              <div className="absolute bottom-0 right-4 transform translate-y-full">
                <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white"></div>
              </div>
              
              {/* Message */}
              <p className="text-gray-800 text-sm leading-relaxed">
                {currentMessage}
              </p>
              
              {/* Speaking Indicator */}
              {isSpeaking && (
                <div className="flex items-center mt-2 space-x-1">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* AI Character Icon */}
        <div className="relative">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer">
            <FaRobot className="text-white text-2xl" />
          </div>
          
          {/* Skip Button */}
          <button
            onClick={handleSkipTour}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
            title="Skip Tour"
          >
            <FaTimes size={10} />
          </button>
          
          {/* Speaking Indicator */}
          {isSpeaking && (
            <div className="absolute -top-1 -left-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
              <FaVolumeUp className="text-white text-xs" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AITourGuide;


