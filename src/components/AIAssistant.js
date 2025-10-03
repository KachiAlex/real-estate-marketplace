import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useProperty } from '../contexts/PropertyContext';
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
  FaChartLine
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import KikiAI from '../services/kikiAI';

const AIAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      message: "👋 Hello! I'm KIKI, your AI Property Assistant with a friendly female voice. I understand exactly where you are on our platform and can provide personalized help based on your current page. Whether you're browsing properties, managing listings, or exploring investments, I'm here to guide you every step of the way. How can I assist you today?",
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
        { icon: FaLightbulb, text: "Investment opportunities", action: "show_investments" }
      ];
    } else if (currentPath.includes('/vendor')) {
      // Vendor dashboard suggestions
      return [
        { icon: FaRocket, text: "Help me create a property listing", action: "create_property_help" },
        { icon: FaBell, text: "Manage my property listings", action: "manage_listings" },
        { icon: FaUser, text: "Update my vendor profile", action: "update_profile" },
        { icon: FaChartLine, text: "View my performance analytics", action: "view_analytics" },
        { icon: FaQuestionCircle, text: "How to price my property?", action: "pricing_help" },
        { icon: FaBrain, text: "Tips for better property photos", action: "photo_tips" }
      ];
    } else if (currentPath.includes('/properties')) {
      // Properties page suggestions
      return [
        { icon: FaSearch, text: "Advanced property search", action: "advanced_search" },
        { icon: FaBell, text: "Save this search as alert", action: "save_search" },
        { icon: FaHome, text: "Show similar properties", action: "similar_properties" },
        { icon: FaUser, text: "Contact property agent", action: "contact_agent" },
        { icon: FaQuestionCircle, text: "Schedule property viewing", action: "schedule_viewing" },
        { icon: FaLightbulb, text: "Get property valuation", action: "property_valuation" }
      ];
    } else if (currentPath.includes('/investment')) {
      // Investment page suggestions
      return [
        { icon: FaLightbulb, text: "Investment calculator", action: "investment_calc" },
        { icon: FaChartLine, text: "Market analysis & trends", action: "market_analysis" },
        { icon: FaUser, text: "Create investment portfolio", action: "create_portfolio" },
        { icon: FaBell, text: "Investment alerts", action: "investment_alerts" },
        { icon: FaQuestionCircle, text: "Risk assessment", action: "risk_assessment" },
        { icon: FaBrain, text: "Investment strategies", action: "investment_strategies" }
      ];
    } else if (currentPath.includes('/blog')) {
      // Blog page suggestions
      return [
        { icon: FaSearch, text: "Search blog articles", action: "search_blog" },
        { icon: FaBell, text: "Subscribe to blog updates", action: "subscribe_blog" },
        { icon: FaHome, text: "Latest property news", action: "latest_news" },
        { icon: FaUser, text: "Share article", action: "share_article" },
        { icon: FaQuestionCircle, text: "Market insights", action: "market_insights" },
        { icon: FaLightbulb, text: "Property investment tips", action: "investment_tips" }
      ];
    } else if (currentPath.includes('/dashboard')) {
      // User dashboard suggestions
      return [
        { icon: FaBell, text: "Check my alerts", action: "check_alerts" },
        { icon: FaHome, text: "View saved properties", action: "saved_properties" },
        { icon: FaUser, text: "Update my profile", action: "update_profile" },
        { icon: FaSearch, text: "Recent searches", action: "recent_searches" },
        { icon: FaQuestionCircle, text: "Account settings", action: "account_settings" },
        { icon: FaLightbulb, text: "Personalized recommendations", action: "recommendations" }
      ];
    } else {
      // Default suggestions for other pages
      return [
        { icon: FaSearch, text: "Find properties", action: "search_properties" },
        { icon: FaBell, text: "Create property alert", action: "create_alert" },
        { icon: FaHome, text: "Browse properties", action: "browse_properties" },
        { icon: FaUser, text: "Help me get started", action: "help_started" },
        { icon: FaQuestionCircle, text: "How can you help me?", action: "help_general" },
        { icon: FaBrain, text: "Platform features", action: "platform_features" }
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

  const speakWithFemaleVoice = (text) => {
    if (!window.speechSynthesis) return;
    
    // Get available voices
    const voices = window.speechSynthesis.getVoices();
    let selectedVoice = null;
    
    // Try to find a female voice (common female voice names)
    const femaleVoiceNames = [
      'Google UK English Female', 'Google US English Female', 'Microsoft Zira Desktop',
      'Samantha', 'Karen', 'Victoria', 'Fiona', 'Moira', 'Tessa', 'Veena',
      'Microsoft Hazel Desktop', 'Microsoft Susan Desktop', 'Microsoft Eva Desktop'
    ];
    
    // Look for female voices
    selectedVoice = voices.find(voice => 
      femaleVoiceNames.some(name => voice.name.includes(name)) ||
      voice.name.toLowerCase().includes('female') ||
      (voice.name.includes('Google') && voice.name.includes('Female'))
    );
    
    // If no female voice found, use default
    if (!selectedVoice && voices.length > 0) {
      selectedVoice = voices[0];
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.9; // Slightly slower for better clarity
    utterance.pitch = 1.1; // Slightly higher pitch for female voice
    utterance.volume = 1.0;
    
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
    window.speechSynthesis.speak(utterance);
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
    
    // Set context for KIKI AI
    KikiAI.setContext({
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
            aiResponse = KikiAI.generateResponse("I want to search for properties in Lagos");
            break;
          case "create_alert":
            aiResponse = KikiAI.generateResponse("I want to create a property alert");
            break;
          case "show_luxury":
            aiResponse = KikiAI.generateResponse("Show me luxury properties");
            break;
          case "help_register":
            aiResponse = KikiAI.generateResponse("Help me register as a buyer");
            break;
          case "explain_platform":
            aiResponse = KikiAI.generateResponse("How does this platform work?");
            break;
          case "show_investments":
            aiResponse = KikiAI.generateResponse("Show me investment opportunities");
            break;
          
          // Vendor dashboard actions
          case "create_property_help":
            aiResponse = KikiAI.generateResponse("Help me create a property listing");
            break;
          case "manage_listings":
            aiResponse = KikiAI.generateResponse("How do I manage my property listings?");
            break;
          case "update_profile":
            aiResponse = KikiAI.generateResponse("Help me update my profile");
            break;
          case "view_analytics":
            aiResponse = KikiAI.generateResponse("Show me my performance analytics");
            break;
          case "pricing_help":
            aiResponse = KikiAI.generateResponse("How should I price my property?");
            break;
          case "photo_tips":
            aiResponse = KikiAI.generateResponse("Give me tips for better property photos");
            break;
          
          // Properties page actions
          case "advanced_search":
            aiResponse = KikiAI.generateResponse("Help me with advanced property search");
            break;
          case "save_search":
            aiResponse = KikiAI.generateResponse("How do I save this search as an alert?");
            break;
          case "similar_properties":
            aiResponse = KikiAI.generateResponse("Show me similar properties");
            break;
          case "contact_agent":
            aiResponse = KikiAI.generateResponse("How do I contact the property agent?");
            break;
          case "schedule_viewing":
            aiResponse = KikiAI.generateResponse("Help me schedule a property viewing");
            break;
          case "property_valuation":
            aiResponse = KikiAI.generateResponse("Can you help me get a property valuation?");
            break;
          
          // Investment page actions
          case "investment_calc":
            aiResponse = KikiAI.generateResponse("Help me with investment calculations");
            break;
          case "market_analysis":
            aiResponse = KikiAI.generateResponse("Show me market analysis and trends");
            break;
          case "create_portfolio":
            aiResponse = KikiAI.generateResponse("Help me create an investment portfolio");
            break;
          case "investment_alerts":
            aiResponse = KikiAI.generateResponse("Set up investment alerts");
            break;
          case "risk_assessment":
            aiResponse = KikiAI.generateResponse("Help me assess investment risks");
            break;
          case "investment_strategies":
            aiResponse = KikiAI.generateResponse("What are good investment strategies?");
            break;
          
          // Blog page actions
          case "search_blog":
            aiResponse = KikiAI.generateResponse("Help me search blog articles");
            break;
          case "subscribe_blog":
            aiResponse = KikiAI.generateResponse("How do I subscribe to blog updates?");
            break;
          case "latest_news":
            aiResponse = KikiAI.generateResponse("Show me the latest property news");
            break;
          case "share_article":
            aiResponse = KikiAI.generateResponse("How do I share this article?");
            break;
          case "market_insights":
            aiResponse = KikiAI.generateResponse("Give me market insights");
            break;
          case "investment_tips":
            aiResponse = KikiAI.generateResponse("Share property investment tips");
            break;
          
          // Dashboard actions
          case "check_alerts":
            aiResponse = KikiAI.generateResponse("Show me my property alerts");
            break;
          case "saved_properties":
            aiResponse = KikiAI.generateResponse("Show me my saved properties");
            break;
          case "recent_searches":
            aiResponse = KikiAI.generateResponse("Show me my recent searches");
            break;
          case "account_settings":
            aiResponse = KikiAI.generateResponse("Help me with account settings");
            break;
          case "recommendations":
            aiResponse = KikiAI.generateResponse("Give me personalized recommendations");
            break;
          
          // General actions
          case "search_properties":
            aiResponse = KikiAI.generateResponse("Help me find properties");
            break;
          case "browse_properties":
            aiResponse = KikiAI.generateResponse("Help me browse properties");
            break;
          case "help_started":
            aiResponse = KikiAI.generateResponse("Help me get started on this platform");
            break;
          case "help_general":
            aiResponse = KikiAI.generateResponse("What can you help me with?");
            break;
          case "platform_features":
            aiResponse = KikiAI.generateResponse("Tell me about platform features");
            break;
          
          default:
            aiResponse = KikiAI.generateResponse(userMessage);
        }
      } else {
        // Use advanced KIKI AI for natural language processing
        aiResponse = KikiAI.generateResponse(userMessage);
      }
      
      setIsTyping(false);
      addMessage(aiResponse.response, 'ai');
      speakText(aiResponse.response);
      maintainCapacity(userMessage, aiResponse.response);
      
      // Handle actions from KIKI AI
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

  return (
    <>
      {/* AI Assistant Toggle Button */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={() => setIsOpen(true)}
            className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group animate-pulse"
            title="Open KIKI Assistant"
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
                <h3 className="font-semibold text-sm">KIKI - AI Assistant</h3>
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
                      placeholder="Ask me anything about properties..."
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
                      🔊 Female voice
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
    </>
  );
};

export default AIAssistant;
