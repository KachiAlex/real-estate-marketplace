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
      message: "Hi there! I'm your PropertyArk AI assistant! Welcome to PropertyArk!",
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
      {/* Dialogue Bubble - Cartoon Style */}
      {showDialogue && (
        <div className={`absolute bottom-20 right-0 mb-4 transition-all duration-500 ${
          isAnimating ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}>
          <div className="relative bg-white rounded-3xl shadow-2xl border-4 border-purple-300 p-6 max-w-md lg:max-w-lg w-80 lg:w-96" style={{
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(147, 51, 234, 0.1)',
            background: 'linear-gradient(to bottom, #ffffff 0%, #faf5ff 100%)'
          }}>
            {/* Cartoon-style dialogue tail pointing to character */}
            <div className="absolute -bottom-4 right-8">
              <svg width="40" height="30" viewBox="0 0 40 30" className="drop-shadow-lg">
                <path
                  d="M 20 0 Q 30 10 35 20 Q 30 25 20 30 Q 10 25 5 20 Q 10 10 20 0 Z"
                  fill="white"
                  stroke="#c084fc"
                  strokeWidth="4"
                />
              </svg>
            </div>
            
            {/* Kiki Avatar in dialogue */}
            <div className="flex items-start space-x-4 mb-3">
              <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 border-2 border-purple-300">
                <img 
                  src="https://api.dicebear.com/7.x/avataaars/svg?seed=Kiki&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf&hair=longHair&hairColor=black,brown,blonde&facialHair=none&clothes=blazerShirt&eyes=happy&eyebrow=default&mouth=smile&skin=light&accessories=none"
                  alt="Kiki"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className="w-full h-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center" style={{ display: 'none' }}>
                  <span className="text-white text-lg font-bold">K</span>
                </div>
              </div>
              <div className="flex-1">
                <div className="font-bold text-purple-600 text-sm mb-1">Kiki</div>
                {isSpeaking && (
                  <div className="flex items-center space-x-1 mb-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                    <span className="text-xs text-purple-500 ml-1">Speaking...</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Message */}
            <p className="text-gray-800 text-base leading-relaxed font-medium">
              {currentMessage}
            </p>
          </div>
        </div>
      )}

      {/* AI Character Icon */}
      <div className="relative">
        <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden">
          <img 
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=Kiki&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf&hair=longHair&hairColor=black,brown,blonde&facialHair=none&clothes=blazerShirt&eyes=happy&eyebrow=default&mouth=smile&skin=light&accessories=none"
            alt="Kiki"
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
          <div className="w-full h-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center" style={{ display: 'none' }}>
            <span className="text-white text-2xl font-bold">K</span>
          </div>
        </div>
        
        {/* Skip Button */}
        <button
          onClick={handleSkipTour}
          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
          title="Skip Tour"
        >
          <FaTimes size={10} />
        </button>
        
        {/* Speaking Indicator */}
        {isSpeaking && (
          <div className="absolute -top-1 -left-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
            <FaVolumeUp className="text-white text-xs" />
          </div>
        )}
      </div>
    </div>
  );
};

export default AITourGuide;


