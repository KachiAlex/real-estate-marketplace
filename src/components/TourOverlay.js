import React, { useEffect, useState, useRef } from 'react';
import { FaTimes, FaChevronLeft, FaChevronRight, FaPlay, FaPause, FaMicrophone, FaVolumeUp, FaVolumeMute } from 'react-icons/fa';
import { useTour } from '../contexts/TourContext';

const TourOverlay = () => {
  const {
    isTourActive,
    currentTourStep,
    tourSteps,
    tourProgress,
    getCurrentStep,
    nextStep,
    previousStep,
    completeTour,
    skipTour,
    highlightedElement
  } = useTour();

  const [isPaused, setIsPaused] = useState(false);
  const [highlightStyle, setHighlightStyle] = useState({});
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [voiceCommands, setVoiceCommands] = useState([]);
  const [showWelcome, setShowWelcome] = useState(false);
  const recognitionRef = useRef(null);
  const speakingRef = useRef(false);

  const currentStep = getCurrentStep();

  // Voice commands for tour navigation
  useEffect(() => {
    setVoiceCommands([
      { command: 'next', action: () => handleNext() },
      { command: 'continue', action: () => handleNext() },
      { command: 'go to next', action: () => handleNext() },
      { command: 'previous', action: () => handlePrevious() },
      { command: 'go back', action: () => handlePrevious() },
      { command: 'skip', action: () => handleSkip() },
      { command: 'skip tour', action: () => handleSkip() },
      { command: 'stop tour', action: () => handleSkip() },
      { command: 'complete', action: () => handleComplete() },
      { command: 'finish tour', action: () => handleComplete() },
      { command: 'pause', action: () => setIsPaused(true) },
      { command: 'resume', action: () => setIsPaused(false) },
      { command: 'yes', action: () => handleWelcomeResponse(true) },
      { command: 'start tour', action: () => handleWelcomeResponse(true) },
      { command: 'begin tour', action: () => handleWelcomeResponse(true) },
      { command: 'no', action: () => handleWelcomeResponse(false) },
      { command: 'decline', action: () => handleWelcomeResponse(false) }
    ]);
  }, []);

  // Speak tour instructions with natural, human-like voice
  const speakText = (text) => {
    if (!voiceEnabled) return;
    
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
          // Stop text animation when voice ends
          const textElement = document.querySelector('.tour-bubble .text-center');
          if (textElement) {
            textElement.style.animation = 'none';
          }
        };
        
        utterance.onerror = (event) => { 
          console.error('Speech synthesis error:', event.error);
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

  // Initialize speech recognition
  const initRecognition = () => {
    if (recognitionRef.current) return recognitionRef.current;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return null;
    
    const rec = new SpeechRecognition();
    rec.lang = 'en-US';
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.continuous = true;
    
    rec.onresult = (event) => {
      try {
        const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
        console.log('Voice command detected:', transcript);
        
        // Check for voice commands
        const matchedCommand = voiceCommands.find(cmd => 
          transcript.includes(cmd.command.toLowerCase())
        );
        
        if (matchedCommand) {
          matchedCommand.action();
          setIsListening(false);
        }
      } catch (error) {
        console.error('Error processing voice command:', error);
      }
    };
    
    rec.onend = () => setIsListening(false);
    rec.onerror = () => setIsListening(false);
    
    recognitionRef.current = rec;
    return rec;
  };

  // Toggle voice listening
  const toggleListening = () => {
    const rec = initRecognition();
    if (!rec) {
      alert('Voice recognition not supported in this browser');
      return;
    }
    
    if (!isListening) {
      try {
        setIsListening(true);
        rec.start();
        speakText("I'm listening for your voice commands. You can say 'next' to continue, 'previous' to go back, 'skip' to skip the tour, or 'complete' to finish. Just speak naturally and I'll understand you.");
      } catch (error) {
        setIsListening(false);
      }
    } else {
      try {
        rec.stop();
      } catch (error) {}
      setIsListening(false);
    }
  };

  // Update highlight style when highlighted element changes
  useEffect(() => {
    if (highlightedElement && currentStep?.target) {
      const element = document.querySelector(`[data-tour="${currentStep.target}"]`);
      if (element) {
        const rect = element.getBoundingClientRect();
        setHighlightStyle({
          position: 'fixed',
          top: rect.top - 8,
          left: rect.left - 8,
          width: rect.width + 16,
          height: rect.height + 16,
          borderRadius: '8px',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          border: '2px solid #3b82f6',
          boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.2)',
          zIndex: 1000,
          pointerEvents: 'none',
          transition: 'all 0.3s ease'
        });
      }
    } else {
      setHighlightStyle({});
    }
  }, [highlightedElement, currentStep]);

  // Show welcome message when tour starts
  useEffect(() => {
    if (isTourActive && currentStep && currentStep.id === 'welcome') {
      setShowWelcome(true);
      // Speak welcome message
      const welcomeMessage = "Hello! I'm your Property Ark AI assistant. Would you like me to give you a guided tour of our amazing real estate platform? I can show you all the wonderful features we have to offer. Just say 'yes' to start the tour, or 'no' to skip it.";
      setTimeout(() => {
        speakText(welcomeMessage);
      }, 500);
    } else if (isTourActive && currentStep && currentStep.id !== 'welcome') {
      setShowWelcome(false);
    }
  }, [isTourActive, currentStep]);

  // Auto-speak tour instructions when step changes (but not for welcome step)
  useEffect(() => {
    if (currentStep && voiceEnabled && currentStep.id !== 'welcome') {
      // Create more natural, conversational instruction text
      const naturalInstruction = `${currentStep.title}. ${currentStep.content}. When you're ready, you can say 'next' to continue, 'previous' to go back, or 'skip' to skip the tour.`;
      setTimeout(() => {
        speakText(naturalInstruction);
      }, 1000); // Longer delay to allow page navigation and scrolling to complete
    }
  }, [currentStep, voiceEnabled]);

  // Clean up speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (speakingRef.current) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  if (!isTourActive || !currentStep) return null;

  // Show welcome message for welcome step
  if (showWelcome && currentStep.id === 'welcome') {
    return (
      <>
        {/* CSS Animation for moving text */}
        <style>
          {`
            @keyframes scrollText {
              0% { 
                transform: translateX(100%); 
                opacity: 0;
              }
              10% { 
                opacity: 1;
              }
              90% { 
                opacity: 1;
              }
              100% { 
                transform: translateX(-100%); 
                opacity: 0;
              }
            }
            
            .tour-bubble {
              background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
              box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(59, 130, 246, 0.1);
              backdrop-filter: blur(10px);
            }
          `}
        </style>
        
        {/* Overlay */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity duration-300"
          onClick={handleSkip}
        />
        
        {/* Welcome Bubble */}
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 1001,
          borderRadius: '50%',
          border: '2px solid #3b82f6',
          width: '200px',
          height: '200px',
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          transition: 'all 0.3s ease',
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(59, 130, 246, 0.1)',
          backdropFilter: 'blur(10px)'
        }}>
          <div className="relative w-full h-full flex flex-col items-center justify-center">
            {/* Voice status indicators */}
            <div className="absolute top-2 left-2 flex space-x-1">
              {isSpeaking && <span className="text-blue-500 text-xs">🔊</span>}
              {isListening && <span className="text-red-500 text-xs">🎤</span>}
            </div>
            
            {/* Welcome text content */}
            <div className="w-full h-full flex items-center justify-center overflow-hidden relative">
              <div className="text-center text-sm text-gray-700 leading-tight px-2">
                <div className="font-semibold text-blue-600 mb-2">👋 Welcome!</div>
                <div className="subtitle-bubble text-blue-800 px-3 py-1 rounded-full text-xs inline-block">
                  Would you like a guided tour of our platform?
                </div>
              </div>
            </div>
            
            {/* Response buttons */}
            <div className="absolute bottom-2 left-0 right-0 flex justify-center space-x-2">
              <button
                onClick={() => handleWelcomeResponse(true)}
                className="w-8 h-8 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center text-white text-xs transition-colors"
                title="Yes, start tour"
              >
                ✓
              </button>
              
              <button
                onClick={() => handleWelcomeResponse(false)}
                className="w-8 h-8 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white text-xs transition-colors"
                title="No, skip tour"
              >
                ✗
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  const handleNext = () => {
    if (currentStep.id === 'welcome' || currentStep.id === 'vendor-welcome' || currentStep.id === 'buyer-welcome') {
      // Start the actual tour navigation
      nextStep();
    } else {
      nextStep();
    }
  };

  const handlePrevious = () => {
    previousStep();
  };

  const handleSkip = () => {
    skipTour();
  };

  const handleComplete = () => {
    completeTour(tourSteps[0]?.id || 'unknown');
  };

  const handleWelcomeResponse = (accepted) => {
    if (accepted) {
      setShowWelcome(false);
      // Continue to next step
      nextStep();
    } else {
      // Skip the tour
      skipTour();
    }
  };

  const getTooltipPosition = () => {
    if (!currentStep.position) return 'bottom';
    return currentStep.position;
  };

  const getTooltipStyle = () => {
    const position = getTooltipPosition();
    const baseStyle = {
      position: 'fixed',
      zIndex: 1001,
      borderRadius: '50%',
      border: '2px solid #3b82f6',
      width: '180px',
      height: '180px',
      padding: '16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      transition: 'all 0.3s ease'
    };

    if (position === 'center') {
      return {
        ...baseStyle,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)'
      };
    }

    if (currentStep.target) {
      const element = document.querySelector(`[data-tour="${currentStep.target}"]`);
      if (element) {
        const rect = element.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

        switch (position) {
          case 'bottom':
            return {
              ...baseStyle,
              top: rect.bottom + scrollTop + 20,
              left: rect.left + scrollLeft + rect.width / 2,
              transform: 'translate(-50%, 0)'
            };
          case 'top':
            return {
              ...baseStyle,
              top: rect.top + scrollTop - 200,
              left: rect.left + scrollLeft + rect.width / 2,
              transform: 'translate(-50%, 0)'
            };
          case 'left':
            return {
              ...baseStyle,
              top: rect.top + scrollTop + rect.height / 2,
              left: rect.left + scrollLeft - 200,
              transform: 'translate(0, -50%)'
            };
          case 'right':
            return {
              ...baseStyle,
              top: rect.top + scrollTop + rect.height / 2,
              left: rect.right + scrollLeft + 20,
              transform: 'translate(0, -50%)'
            };
          default:
            return baseStyle;
        }
      }
    }

    return baseStyle;
  };

  const isFirstStep = currentTourStep === 0;
  const isLastStep = currentTourStep === tourSteps.length - 1;

  return (
    <>
      {/* CSS Animation for moving text */}
      <style>
        {`
          @keyframes scrollText {
            0% { 
              transform: translateX(100%); 
              opacity: 0;
            }
            10% { 
              opacity: 1;
            }
            90% { 
              opacity: 1;
            }
            100% { 
              transform: translateX(-100%); 
              opacity: 0;
            }
          }
          
          .subtitle-bubble {
            background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
            border: 1px solid #3b82f6;
            box-shadow: 0 2px 4px rgba(59, 130, 246, 0.1);
            transition: all 0.3s ease;
          }
          
          .subtitle-bubble:hover {
            background: linear-gradient(135deg, #bfdbfe 0%, #93c5fd 100%);
            transform: scale(1.05);
          }
          
          .tour-bubble {
            background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(59, 130, 246, 0.1);
            backdrop-filter: blur(10px);
          }
        `}
      </style>
      
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity duration-300"
        onClick={handleSkip}
      />
      
      {/* Highlight */}
      {highlightedElement && (
        <div style={highlightStyle} />
      )}
      
      {/* Spherical Bubble Tooltip */}
      <div style={getTooltipStyle()} className="tour-bubble">
        <div className="relative w-full h-full flex flex-col items-center justify-center">
          {/* Step indicator */}
          <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
            {currentTourStep + 1}
          </div>
          
          {/* Voice status indicators */}
          <div className="absolute top-2 left-2 flex space-x-1">
            {isSpeaking && <span className="text-blue-500 text-xs">🔊</span>}
            {isListening && <span className="text-red-500 text-xs">🎤</span>}
          </div>
          
          {/* Moving text content */}
          <div className="w-full h-full flex flex-col items-center justify-center overflow-hidden relative">
            {/* Title */}
            <div className="text-center text-sm font-semibold text-blue-600 mb-2">
              {currentStep.title}
            </div>
            
            {/* Subtitle as horizontal bubble */}
            <div 
              className="subtitle-bubble text-blue-800 px-3 py-1 rounded-full text-xs inline-block max-w-full"
              style={{
                animation: currentStep.content.length > 60 && isSpeaking ? `scrollText ${Math.max(8, currentStep.content.length * 0.1)}s linear infinite` : 'none',
                whiteSpace: 'nowrap',
                width: 'max-content',
                left: currentStep.content.length > 60 ? '100%' : '50%',
                transform: currentStep.content.length > 60 ? 'none' : 'translateX(-50%)'
              }}
            >
              {currentStep.content}
            </div>
          </div>
          
          {/* Navigation controls */}
          <div className="absolute bottom-2 left-0 right-0 flex justify-center space-x-1">
            <button
              onClick={handlePrevious}
              disabled={isFirstStep}
              className="w-6 h-6 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-full flex items-center justify-center text-xs transition-colors"
              title="Previous"
            >
              <FaChevronLeft size={8} />
            </button>
            
            <button
              onClick={handleSkip}
              className="w-6 h-6 bg-red-200 hover:bg-red-300 rounded-full flex items-center justify-center text-xs transition-colors"
              title="Skip"
            >
              <FaTimes size={8} />
            </button>
            
            {isLastStep ? (
              <button
                onClick={handleComplete}
                className="w-6 h-6 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center text-white text-xs transition-colors"
                title="Complete"
              >
                <FaPlay size={8} />
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="w-6 h-6 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center text-white text-xs transition-colors"
                title="Next"
              >
                <FaChevronRight size={8} />
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default TourOverlay;
