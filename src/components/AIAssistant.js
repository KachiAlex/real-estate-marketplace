import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useProperty } from '../contexts/PropertyContext';
import { useTour } from '../contexts/TourContext';
import { 
  FaRobot, 
  FaTimes, 
  FaPaperPlane, 
  FaMicrophone, 
  FaSearch,
  FaBell,
  FaHome,
  FaUser,
  FaQuestionCircle,
  FaLightbulb,
  FaChevronDown,
  FaChevronUp,
  FaBrain,
  FaMagic,
  FaRocket,
  FaChartLine,
  FaMap,
  FaPlay,
  FaGraduationCap
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import PropertyArkAI from '../services/propertyArkAI';
import TourSelector from './TourSelector';

const AIAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showTourSelector, setShowTourSelector] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      message: "Hello! I'm your Property Ark AI Assistant with a friendly female voice. I specialize in helping you with real estate and property-related questions on our platform.\n\nI can help you with:\n• Finding and searching properties\n• Understanding pricing and market trends\n• Financing and mortgage options\n• Legal documents and verification\n• Investment opportunities\n• Escrow and secure transactions\n• Connecting with agents\n• Navigating the platform\n\nI understand exactly where you are on our platform and can provide personalized help based on your current page. How can I assist you with your property needs today?",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef(null);
  const speakingRef = useRef(false);
  const [summary, setSummary] = useState(''); // rolling conversation summary for capacity
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { properties, searchProperties } = useProperty();
  const { startTour, availableTours, isTourCompleted } = useTour();

  const getQuickSuggestions = () => {
    const currentPath = window.location.pathname;
    
    // Context-aware suggestions based on current page
    if (currentPath === '/' || currentPath.includes('/home')) {
      // Home page suggestions
      return [
        { icon: FaSearch, text: "Find properties in Lagos", action: "search_lagos" },
        { icon: FaBell, text: "Create property alert", action: "create_alert" },
        { icon: FaHome, text: "Show me luxury properties", action: "show_luxury" },
        { icon: FaUser, text: "Help me register as a buyer", action: "help_register" },
        { icon: FaQuestionCircle, text: "How does the platform work?", action: "explain_platform" },
        { icon: FaLightbulb, text: "Investment opportunities", action: "show_investments" },
        { icon: FaQuestionCircle, text: "What can you help with?", action: "help_general" }
      ];
    } else if (currentPath.includes('/vendor')) {
      // Vendor dashboard suggestions
      return [
        { icon: FaRocket, text: "Help me create a property listing", action: "create_property_help" },
        { icon: FaBell, text: "Manage my property listings", action: "manage_listings" },
        { icon: FaUser, text: "Update my vendor profile", action: "update_profile" },
        { icon: FaChartLine, text: "View my performance analytics", action: "view_analytics" },
        { icon: FaQuestionCircle, text: "How to price my property?", action: "pricing_help" },
        { icon: FaBrain, text: "Tips for better property photos", action: "photo_tips" },
        { icon: FaQuestionCircle, text: "What can you help with?", action: "help_general" }
      ];
    } else if (currentPath.includes('/properties')) {
      // Properties page suggestions
      return [
        { icon: FaSearch, text: "Advanced property search", action: "advanced_search" },
        { icon: FaBell, text: "Save this search as alert", action: "save_search" },
        { icon: FaHome, text: "Show similar properties", action: "similar_properties" },
        { icon: FaUser, text: "Contact property agent", action: "contact_agent" },
        { icon: FaQuestionCircle, text: "Schedule property viewing", action: "schedule_viewing" },
        { icon: FaLightbulb, text: "Get property valuation", action: "property_valuation" },
        { icon: FaQuestionCircle, text: "What can you help with?", action: "help_general" }
      ];
    } else if (currentPath.includes('/investment')) {
      // Investment page suggestions
      return [
        { icon: FaLightbulb, text: "Investment calculator", action: "investment_calc" },
        { icon: FaChartLine, text: "Market analysis & trends", action: "market_analysis" },
        { icon: FaUser, text: "Create investment portfolio", action: "create_portfolio" },
        { icon: FaBell, text: "Investment alerts", action: "investment_alerts" },
        { icon: FaQuestionCircle, text: "Risk assessment", action: "risk_assessment" },
        { icon: FaBrain, text: "Investment strategies", action: "investment_strategies" },
        { icon: FaQuestionCircle, text: "What can you help with?", action: "help_general" }
      ];
    } else if (currentPath.includes('/blog')) {
      // Blog page suggestions
      return [
        { icon: FaSearch, text: "Search blog articles", action: "search_blog" },
        { icon: FaBell, text: "Subscribe to blog updates", action: "subscribe_blog" },
        { icon: FaHome, text: "Latest property news", action: "latest_news" },
        { icon: FaUser, text: "Share article", action: "share_article" },
        { icon: FaQuestionCircle, text: "Market insights", action: "market_insights" },
        { icon: FaLightbulb, text: "Property investment tips", action: "investment_tips" },
        { icon: FaQuestionCircle, text: "What can you help with?", action: "help_general" }
      ];
    } else if (currentPath.includes('/dashboard')) {
      // User dashboard suggestions
      return [
        { icon: FaBell, text: "Check my alerts", action: "check_alerts" },
        { icon: FaHome, text: "View saved properties", action: "saved_properties" },
        { icon: FaUser, text: "Update my profile", action: "update_profile" },
        { icon: FaSearch, text: "Recent searches", action: "recent_searches" },
        { icon: FaQuestionCircle, text: "Account settings", action: "account_settings" },
        { icon: FaLightbulb, text: "Personalized recommendations", action: "recommendations" },
        { icon: FaQuestionCircle, text: "What can you help with?", action: "help_general" }
      ];
    } else {
      // Default suggestions for other pages
      return [
        { icon: FaSearch, text: "Find properties", action: "search_properties" },
        { icon: FaBell, text: "Create property alert", action: "create_alert" },
        { icon: FaHome, text: "Browse properties", action: "browse_properties" },
        { icon: FaMap, text: "Take a guided tour", action: "start_tour" },
        { icon: FaUser, text: "Help me get started", action: "help_started" },
        { icon: FaQuestionCircle, text: "How can you help me?", action: "help_general" }
      ];
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addMessage = (message, type = 'user') => {
    const newMessage = {
      id: Date.now(),
      type,
      message,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const speakText = (text) => {
    try {
      if (!voiceEnabled) return;
      
      // Prefer cloud TTS if configured
      const useCloud = process.env.REACT_APP_USE_CLOUD_TTS === 'true';
      if (useCloud) {
        fetch('/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, voice: 'female' })
        }).then(r => r.json()).then(data => {
          if (data?.success && data.audioBase64) {
            const audio = new Audio(`data:audio/mp3;base64,${data.audioBase64}`);
            audio.play().catch(() => {});
          } else {
            // fallback to browser with female voice
            speakWithFemaleVoice(text);
          }
        }).catch(() => {
          speakWithFemaleVoice(text);
        });
        return;
      }
      
      speakWithFemaleVoice(text);
    } catch (_) {}
  };

  // Clean text for speech - remove icons, emojis, and special characters
  const cleanTextForSpeech = (text) => {
    if (!text) return '';
    
    let cleaned = text
      // Remove common emojis and special characters
      .replace(/ðŸ‘‹|ðŸ‘¨|ðŸ‘©|ðŸŽ‰|ðŸ’°|ðŸ |ðŸ¢|ðŸŒ|â­|ðŸ”|ðŸ“±|ðŸ’¡|ðŸ“Š|ðŸ’¬|ðŸš€|ðŸ“ˆ|ðŸŽ¯|ðŸ›¡ï¸|âœ…|âŒ|âš ï¸|â„¹ï¸/g, '')
      // Remove icon placeholders and HTML-like tags
      .replace(/<[^>]*>/g, '')
      .replace(/\{icon\}/gi, '')
      .replace(/\{emoji\}/gi, '')
      .replace(/\{.*?\}/g, '')
      // Remove markdown formatting
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/__(.*?)__/g, '$1')
      .replace(/_(.*?)_/g, '$1')
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      // Remove URLs
      .replace(/https?:\/\/[^\s]+/g, '')
      // Remove special unicode characters
      .replace(/[^\w\s.,!?;:'"-]/g, ' ')
      // Clean up multiple spaces
      .replace(/\s+/g, ' ')
      .trim();
    
    return cleaned;
  };

  const speakWithFemaleVoice = (text) => {
    if (!window.speechSynthesis) return;
    
    // Clean the text first to remove any icons, emojis, or special characters
    const cleanedText = cleanTextForSpeech(text);
    
    if (!cleanedText) {
      console.warn('No text to speak after cleaning');
      return;
    }
    
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
      
      const utterance = new SpeechSynthesisUtterance(cleanedText);
      utterance.lang = 'en-US';
      
      // Natural speech parameters for human-like voice
      utterance.rate = 0.88; // Slightly slower for natural conversation
      utterance.pitch = 1.2; // Slightly higher for female voice
      utterance.volume = 0.95; // Clear and warm
      
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      
      // Add natural pauses for better speech flow
      const naturalText = cleanedText
        .replace(/\.(?=\S)/g, '. ') // Add pause after periods (only if followed by text)
        .replace(/,(?=\S)/g, ', ') // Add pause after commas
        .replace(/:(?=\S)/g, ': ') // Add pause after colons
        .replace(/;(?=\S)/g, '; ') // Add pause after semicolons
        .replace(/!(?=\S)/g, '! ') // Add pause after exclamations
        .replace(/\?(?=\S)/g, '? ') // Add pause after questions
        .replace(/\s+/g, ' ') // Clean up extra spaces
        .trim();
      
      utterance.text = naturalText;
      
      speakingRef.current = true;
      setIsSpeaking(true);
      
      utterance.onend = () => { 
        speakingRef.current = false; 
        setIsSpeaking(false);
      };
      
      utterance.onerror = (error) => { 
        console.error('Speech synthesis error:', error);
        speakingRef.current = false; 
        setIsSpeaking(false);
      };
      
      // Cancel any ongoing speech before starting new one
      window.speechSynthesis.cancel();
      
      // Small delay to ensure cancellation takes effect
      setTimeout(() => {
        window.speechSynthesis.speak(utterance);
      }, 100);
    };
    
    // If voices are already loaded, speak immediately
    if (window.speechSynthesis.getVoices().length > 0) {
      speakWithVoice();
    } else {
      // Wait for voices to load
      window.speechSynthesis.addEventListener('voiceschanged', speakWithVoice, { once: true });
    }
  };

  // Lightweight capacity boost: keep rolling summary and trim history
  const maintainCapacity = (newUserMessage, newAIMessage) => {
    const MAX_MESSAGES = 30; // keep UI messages manageable
    setMessages(prev => prev.slice(-MAX_MESSAGES));
    // naive summarization: append last exchange to summary when messages get long
    if (messages.length > MAX_MESSAGES - 2) {
      const condensed = `${summary}\nUser: ${newUserMessage}\nAI: ${newAIMessage}`.slice(-2000);
      setSummary(condensed);
    }
  };

  const simulateAIResponse = (userMessage, action = null) => {
    setIsTyping(true);
    
    // Set context for Property Ark AI
    PropertyArkAI.setContext({
      user: user,
      currentPage: window.location.pathname,
      lastAction: action
    });
    
    setTimeout(() => {
      let aiResponse;
      
      if (action) {
        // Handle contextual suggestion actions
        switch (action) {
          // Home page actions
          case "search_lagos":
            aiResponse = PropertyArkAI.generateResponse("I want to search for properties in Lagos");
            break;
          case "create_alert":
            aiResponse = PropertyArkAI.generateResponse("I want to create a property alert");
            break;
          case "show_luxury":
            aiResponse = PropertyArkAI.generateResponse("Show me luxury properties");
            break;
          case "help_register":
            aiResponse = PropertyArkAI.generateResponse("Help me register as a buyer");
            break;
          case "explain_platform":
            aiResponse = PropertyArkAI.generateResponse("How does this platform work?");
            break;
          case "show_investments":
            aiResponse = PropertyArkAI.generateResponse("Show me investment opportunities");
            break;
          
          // Vendor dashboard actions
          case "create_property_help":
            aiResponse = PropertyArkAI.generateResponse("Help me create a property listing");
            break;
          case "manage_listings":
            aiResponse = PropertyArkAI.generateResponse("How do I manage my property listings?");
            break;
          case "update_profile":
            aiResponse = PropertyArkAI.generateResponse("Help me update my profile");
            break;
          case "view_analytics":
            aiResponse = PropertyArkAI.generateResponse("Show me my performance analytics");
            break;
          case "pricing_help":
            aiResponse = PropertyArkAI.generateResponse("How should I price my property?");
            break;
          case "photo_tips":
            aiResponse = PropertyArkAI.generateResponse("Give me tips for better property photos");
            break;
          
          // Properties page actions
          case "advanced_search":
            aiResponse = PropertyArkAI.generateResponse("Help me with advanced property search");
            break;
          case "save_search":
            aiResponse = PropertyArkAI.generateResponse("How do I save this search as an alert?");
            break;
          case "similar_properties":
            aiResponse = PropertyArkAI.generateResponse("Show me similar properties");
            break;
          case "contact_agent":
            aiResponse = PropertyArkAI.generateResponse("How do I contact the property agent?");
            break;
          case "schedule_viewing":
            aiResponse = PropertyArkAI.generateResponse("Help me schedule a property viewing");
            break;
          case "property_valuation":
            aiResponse = PropertyArkAI.generateResponse("Can you help me get a property valuation?");
            break;
          
          // Investment page actions
          case "investment_calc":
            aiResponse = PropertyArkAI.generateResponse("Help me with investment calculations");
            break;
          case "market_analysis":
            aiResponse = PropertyArkAI.generateResponse("Show me market analysis and trends");
            break;
          case "create_portfolio":
            aiResponse = PropertyArkAI.generateResponse("Help me create an investment portfolio");
            break;
          case "investment_alerts":
            aiResponse = PropertyArkAI.generateResponse("Set up investment alerts");
            break;
          case "risk_assessment":
            aiResponse = PropertyArkAI.generateResponse("Help me assess investment risks");
            break;
          case "investment_strategies":
            aiResponse = PropertyArkAI.generateResponse("What are good investment strategies?");
            break;
          
          // Blog page actions
          case "search_blog":
            aiResponse = PropertyArkAI.generateResponse("Help me search blog articles");
            break;
          case "subscribe_blog":
            aiResponse = PropertyArkAI.generateResponse("How do I subscribe to blog updates?");
            break;
          case "latest_news":
            aiResponse = PropertyArkAI.generateResponse("Show me the latest property news");
            break;
          case "share_article":
            aiResponse = PropertyArkAI.generateResponse("How do I share this article?");
            break;
          case "market_insights":
            aiResponse = PropertyArkAI.generateResponse("Give me market insights");
            break;
          case "investment_tips":
            aiResponse = PropertyArkAI.generateResponse("Share property investment tips");
            break;
          
          // Dashboard actions
          case "check_alerts":
            aiResponse = PropertyArkAI.generateResponse("Show me my property alerts");
            break;
          case "saved_properties":
            aiResponse = PropertyArkAI.generateResponse("Show me my saved properties");
            break;
          case "recent_searches":
            aiResponse = PropertyArkAI.generateResponse("Show me my recent searches");
            break;
          case "account_settings":
            aiResponse = PropertyArkAI.generateResponse("Help me with account settings");
            break;
          case "recommendations":
            aiResponse = PropertyArkAI.generateResponse("Give me personalized recommendations");
            break;
          
          // General actions
          case "search_properties":
            aiResponse = PropertyArkAI.generateResponse("Help me find properties");
            break;
          case "browse_properties":
            aiResponse = PropertyArkAI.generateResponse("Help me browse properties");
            break;
          case "start_tour":
            aiResponse = {
              response: "Oh, I'm absolutely thrilled to give you a guided tour! I'd love to show you around our amazing platform. Let me bring up the available tours for you. I'll be speaking the instructions for each step in a natural, conversational way, and you can use voice commands to navigate hands-free! It'll be like having a personal guide right there with you!",
              action: { type: 'show_tour_selector' }
            };
            break;
          case "help_started":
            aiResponse = PropertyArkAI.generateResponse("Help me get started on this platform");
            break;
          case "help_general":
            aiResponse = PropertyArkAI.generateResponse("What can you help me with?");
            break;
          
          default:
            aiResponse = PropertyArkAI.generateResponse(userMessage);
        }
      } else {
        // Use advanced Property Ark AI for natural language processing
        aiResponse = PropertyArkAI.generateResponse(userMessage);
      }
      
      setIsTyping(false);
      addMessage(aiResponse.response, 'ai');
      speakText(aiResponse.response);
      maintainCapacity(userMessage, aiResponse.response);
      
      // Handle actions from Property Ark AI
      if (aiResponse.action) {
        setTimeout(() => {
          if (aiResponse.action.type === 'navigate') {
            const params = new URLSearchParams();
            if (aiResponse.action.params) {
              Object.entries(aiResponse.action.params).forEach(([key, value]) => {
                if (value) {
                  if (Array.isArray(value)) {
                    params.append(key, value.join(','));
                  } else {
                    params.append(key, value.toString());
                  }
                }
              });
            }
            const queryString = params.toString();
            const path = queryString ? `${aiResponse.action.path}?${queryString}` : aiResponse.action.path;
            navigate(path);
            toast.success(`Navigated to ${aiResponse.action.path}!`);
          } else if (aiResponse.action.type === 'show_tour_selector') {
            setShowTourSelector(true);
          }
        }, 2000);
      }
    }, 800 + Math.random() * 400); // Faster response time
  };


  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    
    addMessage(inputMessage);
    simulateAIResponse(inputMessage);
    setInputMessage('');
    setShowSuggestions(false);
  };

  const handleSuggestionClick = (suggestion) => {
    addMessage(suggestion.text);
    simulateAIResponse(suggestion.text, suggestion.action);
    setShowSuggestions(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Speech-to-Text (Web Speech API)
  const initRecognition = () => {
    if (recognitionRef.current) return recognitionRef.current;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return null;
    const rec = new SpeechRecognition();
    rec.lang = 'en-US';
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (event) => {
      try {
        const transcript = event.results[0][0].transcript;
        setInputMessage(transcript);
        // auto-send
        addMessage(transcript);
        simulateAIResponse(transcript);
        setShowSuggestions(false);
      } catch (_) {}
    };
    rec.onend = () => setIsListening(false);
    recognitionRef.current = rec;
    return rec;
  };

  const toggleListening = () => {
    const rec = initRecognition();
    if (!rec) {
      toast.error('Voice input not supported in this browser');
      return;
    }
    if (!isListening) {
      try {
        setIsListening(true);
        rec.start();
      } catch (_) {
        setIsListening(false);
      }
    } else {
      try {
        rec.stop();
      } catch (_) {}
      setIsListening(false);
    }
  };

  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleTourRequest = () => {
    setShowTourSelector(true);
    // Speak tour invitation with natural, conversational tone
    speakText("Oh, I'm so excited to show you around! I'd absolutely love to give you a wonderful guided tour of our platform. I have some amazing tours prepared just for you! You can choose from our new user tour, vendor tour, or buyer tour. Each tour will guide you through the platform step by step with my voice instructions. I'll be speaking to you throughout the entire experience, so it'll be like having a personal guide right there with you!");
  };

  const handleStartSpecificTour = (tourId) => {
    startTour(tourId);
    setShowTourSelector(false);
    addMessage("Let's start the tour! I'll guide you through each step.");
    speakText("Fantastic choice! I'm so excited to begin your guided tour with you! I'll be speaking the instructions for each step in a natural, conversational way, and you can use voice commands to navigate hands-free. Just say 'next' to continue, 'previous' to go back, or 'skip' to skip the tour. I'm here to make this experience as smooth and enjoyable as possible for you!");
  };

  return (
    <>
      {/* AI Assistant Toggle Button */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={() => setIsOpen(true)}
            className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group animate-pulse"
            title="Open Property Ark Assistant"
          >
            <FaRobot className="text-white text-2xl group-hover:scale-110 transition-transform" />
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">!</span>
            </div>
          </button>
        </div>
      )}

      {/* AI Assistant Chat Window */}
      {isOpen && (
        <div className={`fixed bottom-6 right-6 z-50 bg-white rounded-lg shadow-2xl border transition-all duration-300 ${
          isMinimized ? 'w-80 h-16' : 'w-80 h-96'
        }`}>
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <FaRobot className="text-sm" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Property Ark - AI Assistant</h3>
                <p className="text-xs opacity-80">
                  {isSpeaking ? "🔊 Speaking..." : isListening ? "🎤 Listening..." : "Online • Ready to help"}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="text-white hover:bg-white hover:bg-opacity-20 p-1 rounded transition-colors"
                title={isMinimized ? "Expand" : "Minimize"}
              >
                {isMinimized ? <FaChevronUp /> : <FaChevronDown />}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white hover:bg-opacity-20 p-1 rounded transition-colors"
                title="Close Assistant"
              >
                <FaTimes />
              </button>
            </div>
          </div>

          {/* Chat Content */}
          {!isMinimized && (
            <>
              {/* Messages */}
              <div className="h-64 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                      msg.type === 'user' 
                        ? 'bg-blue-500 text-white rounded-br-none' 
                        : 'bg-white border rounded-bl-none shadow-sm'
                    }`}>
                      <p className="whitespace-pre-line">{msg.message}</p>
                      <p className={`text-xs mt-1 ${msg.type === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                        {formatTime(msg.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white border rounded-lg rounded-bl-none shadow-sm px-3 py-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Scope Notice */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 mb-2">
                  <p className="text-xs text-blue-800 text-center">
                    <strong>Note:</strong> I specialize in real estate and property-related topics. Ask me about properties, pricing, financing, legal documents, investments, and platform navigation.
                  </p>
                </div>

                {/* Quick Suggestions */}
                {showSuggestions && messages.length === 1 && (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500 text-center">Quick suggestions:</p>
                    <div className="grid grid-cols-1 gap-2">
                      {getQuickSuggestions().map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="flex items-center space-x-2 p-2 bg-white border rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-colors text-left text-sm"
                        >
                          <suggestion.icon className="text-blue-500 text-xs" />
                          <span>{suggestion.text}</span>
                        </button>
                      ))}
                    </div>
                    
                    {/* Tour Button */}
                    <button
                      onClick={handleTourRequest}
                      className="flex items-center justify-center space-x-2 p-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 mt-2"
                    >
                      <FaMap className="text-sm" />
                      <span className="font-medium">Take a Voice-Guided Tour</span>
                      <FaPlay className="text-xs" />
                    </button>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-3 border-t bg-white rounded-b-lg">
                <div className="flex items-center space-x-2">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask about properties, pricing, financing, legal docs..."
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim()}
                    className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Send message"
                  >
                    <FaPaperPlane className="text-sm" />
                  </button>
                </div>
                
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={toggleListening}
                      className={`transition-colors ${isListening ? 'text-red-500' : 'text-gray-400 hover:text-gray-600'}`}
                      title={isListening ? 'Stop listening' : 'Start voice input'}
                    >
                      <FaMicrophone className="text-sm" />
                    </button>
                    <label className="flex items-center gap-1 text-xs text-gray-400 cursor-pointer">
                      <input type="checkbox" checked={voiceEnabled} onChange={(e) => setVoiceEnabled(e.target.checked)} />
                      Female voice
                    </label>
                    <span className="text-xs text-gray-400">Powered by AI</span>
                  </div>
                  <button
                    onClick={() => setShowSuggestions(!showSuggestions)}
                    className="text-xs text-blue-500 hover:text-blue-600 transition-colors"
                  >
                    {showSuggestions ? 'Hide' : 'Show'} suggestions
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Tour Selector Modal */}
      {showTourSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="relative">
            <button
              onClick={() => setShowTourSelector(false)}
              className="absolute -top-4 -right-4 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
            >
              <FaTimes className="text-gray-600" />
            </button>
            <TourSelector onClose={() => setShowTourSelector(false)} />
          </div>
        </div>
      )}
    </>
  );
};

export default AIAssistant;


