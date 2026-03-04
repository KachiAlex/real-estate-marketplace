import { useState, useRef, useCallback, useEffect } from 'react';

const NATURAL_FEMALE_VOICES = [
  'Samantha',
  'Karen',
  'Victoria',
  'Fiona',
  'Moira',
  'Tessa',
  'Veena',
  'Microsoft Zira Desktop',
  'Microsoft Hazel Desktop',
  'Microsoft Susan Desktop',
  'Microsoft Eva Desktop',
  'Google UK English Female',
  'Google US English Female',
  'Google Australian English Female',
  'Google Canadian English Female',
  'Google Indian English Female',
  'Google Irish English Female',
  'Google New Zealand English Female',
  'Google South African English Female',
  'Google Welsh English Female'
];

const cleanTextForSpeech = (text = '') => {
  const value = text || '';
  return value
    .replace(/ðŸ‘‹|ðŸ‘¨|ðŸ‘©|ðŸŽ‰|ðŸ’°|ðŸ |ðŸ¢|ðŸŒ|â­|ðŸ”|ðŸ“±|ðŸ’¡|ðŸ“Š|ðŸ’¬|ðŸš€|ðŸ“ˆ|ðŸŽ¯|ðŸ›¡ï¸|âœ…|âŒ|âš ï¸|â„¹ï¸/g, '')
    .replace(/<[^>]*>/g, '')
    .replace(/\{icon\}|\{emoji\}/gi, '')
    .replace(/\{.*?\}/g, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/https?:\/\/[^\s]+/g, '')
    .replace(/[^\w\s.,!?;:'"-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const formatNaturalPauses = (text = '') =>
  text
    .replace(/\.(?=\S)/g, '. ')
    .replace(/,(?=\S)/g, ', ')
    .replace(/:(?=\S)/g, ': ')
    .replace(/;(?=\S)/g, '; ')
    .replace(/!(?=\S)/g, '! ')
    .replace(/\?(?=\S)/g, '? ')
    .replace(/\s+/g, ' ')
    .trim();

const useVoiceAssistant = ({ onTranscript, defaultVoiceEnabled = true } = {}) => {
  const [voiceEnabled, setVoiceEnabled] = useState(defaultVoiceEnabled);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const speakingRef = useRef(false);
  const transcriptHandlerRef = useRef(onTranscript);

  useEffect(() => {
    transcriptHandlerRef.current = onTranscript;
  }, [onTranscript]);

  const cancelSpeech = useCallback(() => {
    try {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    } catch (error) {
      console.warn('Speech cancel failed', error);
    } finally {
      speakingRef.current = false;
      setIsSpeaking(false);
    }
  }, []);

  const speakText = useCallback(
    (text) => {
      if (!voiceEnabled || typeof window === 'undefined') {
        return;
      }

      try {
        const cleaned = cleanTextForSpeech(text);
        if (!cleaned) {
          return;
        }

        const speakWithVoice = () => {
          const voices = window.speechSynthesis.getVoices();
          let selectedVoice = voices.find((voice) =>
            NATURAL_FEMALE_VOICES.some((name) => voice.name.includes(name))
          );

          if (!selectedVoice) {
            selectedVoice = voices.find((voice) =>
              voice.name.toLowerCase().includes('female') ||
              voice.name.toLowerCase().includes('woman') ||
              voice.name.toLowerCase().includes('girl')
            );
          }

          if (!selectedVoice && voices.length) {
            [selectedVoice] = voices;
          }

          const utterance = new SpeechSynthesisUtterance(formatNaturalPauses(cleaned));
          utterance.lang = 'en-US';
          utterance.rate = 0.88;
          utterance.pitch = 1.2;
          utterance.volume = 0.95;
          if (selectedVoice) {
            utterance.voice = selectedVoice;
          }

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
          setTimeout(() => {
            window.speechSynthesis.speak(utterance);
          }, 80);
        };

        const useCloud = process.env.REACT_APP_USE_CLOUD_TTS === 'true';
        if (useCloud && typeof fetch === 'function') {
          fetch('/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: cleaned, voice: 'female' })
          })
            .then((response) => response.json())
            .then((data) => {
              if (data?.success && data.audioBase64) {
                const audio = new Audio(`data:audio/mp3;base64,${data.audioBase64}`);
                audio.onended = () => {
                  speakingRef.current = false;
                  setIsSpeaking(false);
                };
                audio.onerror = () => {
                  speakingRef.current = false;
                  setIsSpeaking(false);
                };
                speakingRef.current = true;
                setIsSpeaking(true);
                audio.play().catch(() => {
                  speakingRef.current = false;
                  setIsSpeaking(false);
                  speakWithVoice();
                });
              } else {
                speakWithVoice();
              }
            })
            .catch(() => {
              speakWithVoice();
            });

          return;
        }

        if (window.speechSynthesis.getVoices().length > 0) {
          speakWithVoice();
        } else {
          window.speechSynthesis.addEventListener('voiceschanged', speakWithVoice, { once: true });
        }
      } catch (error) {
        console.warn('Speech synthesis failed', error);
      }
    },
    [voiceEnabled]
  );

  const ensureRecognition = useCallback(() => {
    if (typeof window === 'undefined') {
      return null;
    }
    if (recognitionRef.current) {
      return recognitionRef.current;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      try {
        const transcript = event.results[0][0].transcript;
        transcriptHandlerRef.current?.(transcript);
      } catch (error) {
        console.warn('Speech recognition result error', error);
      }
    };
    recognition.onend = () => {
      setIsListening(false);
    };
    recognition.onerror = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    return recognitionRef.current;
  }, []);

  const toggleListening = useCallback(() => {
    const recognition = ensureRecognition();
    if (!recognition) {
      return null;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
      return false;
    }

    try {
      recognition.start();
      setIsListening(true);
      return true;
    } catch (error) {
      console.warn('Speech recognition start failed', error);
      setIsListening(false);
      return false;
    }
  }, [ensureRecognition, isListening]);

  return {
    speakText,
    isSpeaking,
    toggleListening,
    isListening,
    voiceEnabled,
    setVoiceEnabled,
    cancelSpeech
  };
};

export default useVoiceAssistant;
