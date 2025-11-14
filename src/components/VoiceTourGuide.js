import React, { useEffect, useState, useRef } from 'react';
import { FaTimes, FaVolumeUp, FaMicrophone, FaChevronRight, FaChevronLeft } from 'react-icons/fa';
import { useTour } from '../contexts/TourContext';

const VoiceTourGuide = () => {
  const {
    isTourActive,
    currentTourStep,
    tourSteps,
    tourProgress,
    getCurrentStep,
    nextStep,
    previousStep,
    completeTour,
    skipTour
  } = useTour();

  const [isSpeaking, setIsSpeaking] = useState(false);
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
      { command: 'finish tour', action: () => handleComplete() }
    ]);
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

  // Auto-speak tour instructions when step changes
  useEffect(() => {
    if (currentStep && isTourActive) {
      // Create more natural, conversational instruction text
      const naturalInstruction = `Hi there! ${currentStep.title}. ${currentStep.content}. When you're ready, you can say 'next' to continue, 'previous' to go back, or 'skip' to skip the tour. Take your time!`;
      setTimeout(() => {
        speakText(naturalInstruction);
      }, 800); // Longer delay to allow page navigation to complete
    }
  }, [currentStep, isTourActive]);

  // Cleanup speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (error) {}
      }
    };
  }, []);

  const handleNext = () => {
    nextStep();
  };

  const handlePrevious = () => {
    previousStep();
  };

  const handleComplete = () => {
    completeTour();
  };

  const handleSkip = () => {
    skipTour();
  };

  if (!isTourActive || !currentStep) return null;

  return (
    <div className="fixed top-4 right-4 z-40 bg-white rounded-lg shadow-lg border border-gray-200 max-w-sm">
      {/* Tour Progress Bar */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-1 rounded-t-lg">
        <div 
          className="bg-white h-full transition-all duration-300 ease-out"
          style={{ width: `${(tourProgress * 100)}%` }}
        />
      </div>

      {/* Tour Content */}
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <FaMicrophone className="text-white text-xs" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">Property Ark Tour Guide</h3>
              <p className="text-xs text-gray-500">Step {currentTourStep + 1} of {tourSteps.length}</p>
            </div>
          </div>
          <button
            onClick={handleSkip}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            title="Skip Tour"
          >
            <FaTimes size={16} />
          </button>
        </div>

        {/* Step Content */}
        <div className="mb-4">
          <h4 className="font-medium text-gray-900 text-sm mb-2">{currentStep.title}</h4>
          <p className="text-xs text-gray-600 leading-relaxed">{currentStep.content}</p>
        </div>

        {/* Voice Controls */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleListening}
              className={`p-2 rounded-lg transition-colors ${
                isListening ? 'text-red-500 hover:bg-red-50' : 'text-gray-500 hover:bg-gray-50'
              }`}
              title={isListening ? 'Stop listening' : 'Start voice commands'}
            >
              <FaMicrophone size={14} />
            </button>
            {isSpeaking && <FaVolumeUp className="text-blue-500 animate-pulse" size={14} />}
          </div>
          
          {/* Navigation Buttons */}
          <div className="flex items-center space-x-1">
            <button
              onClick={handlePrevious}
              disabled={currentTourStep === 0}
              className="p-2 rounded-lg transition-colors disabled:text-gray-300 disabled:cursor-not-allowed text-gray-500 hover:bg-gray-50"
              title="Previous Step"
            >
              <FaChevronLeft size={12} />
            </button>
            <button
              onClick={handleNext}
              disabled={currentTourStep === tourSteps.length - 1}
              className="p-2 rounded-lg transition-colors disabled:text-gray-300 disabled:cursor-not-allowed text-gray-500 hover:bg-gray-50"
              title="Next Step"
            >
              <FaChevronRight size={12} />
            </button>
          </div>
        </div>

        {/* Voice Commands Help */}
        <div className="bg-blue-50 p-2 rounded text-xs text-blue-800">
          <strong>🎤 Voice Commands:</strong> Say "next", "previous", "skip", or "complete"
        </div>
      </div>
    </div>
  );
};

export default VoiceTourGuide;
