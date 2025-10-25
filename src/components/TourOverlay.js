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
      { command: 'resume', action: () => setIsPaused(false) }
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

  // Auto-speak tour instructions when step changes
  useEffect(() => {
    if (currentStep && voiceEnabled) {
      // Create more natural, conversational instruction text
      const naturalInstruction = `Hi there! ${currentStep.title}. ${currentStep.content}. When you're ready, you can say 'next' to continue, 'previous' to go back, or 'skip' to skip the tour. Take your time!`;
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

  const getTooltipPosition = () => {
    if (!currentStep.position) return 'bottom';
    return currentStep.position;
  };

  const getTooltipStyle = () => {
    const position = getTooltipPosition();
    const baseStyle = {
      position: 'fixed',
      zIndex: 1001,
      backgroundColor: 'white',
      borderRadius: '12px',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      border: '1px solid #e5e7eb',
      maxWidth: '400px',
      padding: '24px'
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
              top: rect.bottom + scrollTop + 16,
              left: rect.left + scrollLeft,
              transform: 'translateX(-50%)'
            };
          case 'top':
            return {
              ...baseStyle,
              top: rect.top + scrollTop - 16,
              left: rect.left + scrollLeft,
              transform: 'translate(-50%, -100%)'
            };
          case 'left':
            return {
              ...baseStyle,
              top: rect.top + scrollTop + rect.height / 2,
              left: rect.left + scrollLeft - 16,
              transform: 'translate(-100%, -50%)'
            };
          case 'right':
            return {
              ...baseStyle,
              top: rect.top + scrollTop + rect.height / 2,
              left: rect.right + scrollLeft + 16,
              transform: 'translateY(-50%)'
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
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity duration-300"
        onClick={handleSkip}
      />
      
      {/* Highlight */}
      {highlightedElement && (
        <div style={highlightStyle} />
      )}
      
      {/* Tooltip */}
      <div style={getTooltipStyle()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">
                {currentTourStep + 1}
              </span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {currentStep.title}
              </h3>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>Step {currentTourStep + 1} of {tourSteps.length}</span>
                <span>•</span>
                <span>{Math.round(tourProgress)}% complete</span>
                {isSpeaking && <span className="text-blue-500">🔊 Speaking...</span>}
                {isListening && <span className="text-red-500">🎤 Listening...</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {/* Voice Controls */}
            <button
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              className={`p-2 rounded-lg transition-colors ${
                voiceEnabled ? 'text-blue-500 hover:bg-blue-50' : 'text-gray-400 hover:bg-gray-50'
              }`}
              title={voiceEnabled ? 'Disable voice' : 'Enable voice'}
            >
              {voiceEnabled ? <FaVolumeUp size={16} /> : <FaVolumeMute size={16} />}
            </button>
            <button
              onClick={toggleListening}
              className={`p-2 rounded-lg transition-colors ${
                isListening ? 'text-red-500 hover:bg-red-50' : 'text-gray-500 hover:bg-gray-50'
              }`}
              title={isListening ? 'Stop listening' : 'Start voice commands'}
            >
              <FaMicrophone size={16} />
            </button>
            <button
              onClick={handleSkip}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <FaTimes size={20} />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${tourProgress}%` }}
          />
        </div>

        {/* Content */}
        <div className="mb-6">
          <p className="text-gray-700 leading-relaxed">
            {currentStep.content}
          </p>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrevious}
              disabled={isFirstStep}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <FaChevronLeft size={14} />
              <span>Previous</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleSkip}
              className="px-4 py-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              Skip Tour
            </button>
            
            {isLastStep ? (
              <button
                onClick={handleComplete}
                className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
              >
                <span>Complete Tour</span>
                <FaPlay size={12} />
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
              >
                <span>Next</span>
                <FaChevronRight size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Tour Tips */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>💡 Tip:</strong> You can click anywhere outside this tooltip to skip the tour, or use the navigation buttons to go step by step.
          </p>
          <p className="text-sm text-blue-800 mt-2">
            <strong>🎤 Voice Commands:</strong> Say "next", "previous", "skip", or "complete" to navigate the tour hands-free!
          </p>
        </div>
      </div>
    </>
  );
};

export default TourOverlay;
