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
      message: "👋 Hello! I'm KIKI, your AI Property Assistant. I'm here to help you navigate our platform, search for properties, create alerts, and answer any questions you might have. How can I assist you today?",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { properties, searchProperties } = useProperty();

  const getQuickSuggestions = () => {
    const baseSuggestions = [
      { icon: FaSearch, text: "Find properties in Lagos", action: "search_lagos" },
      { icon: FaBell, text: "Create property alert", action: "create_alert" },
      { icon: FaHome, text: "Luxury properties", action: "show_luxury" },
      { icon: FaUser, text: "Help me register", action: "help_register" },
      { icon: FaQuestionCircle, text: "How does escrow work?", action: "explain_escrow" },
      { icon: FaLightbulb, text: "Investment options", action: "show_investments" },
      { icon: FaBrain, text: "What can you help me with?", action: "help_general" },
      { icon: FaMagic, text: "Market insights", action: "market_info" }
    ];
    
    // Add contextual suggestions based on current page
    const currentPath = window.location.pathname;
    const contextualSuggestions = [];
    
    if (currentPath.includes('/vendor')) {
      contextualSuggestions.push(
        { icon: FaRocket, text: "Help with property listing", action: "vendor_help" },
        { icon: FaBell, text: "Manage my listings", action: "manage_listings" }
      );
    } else if (currentPath.includes('/properties')) {
      contextualSuggestions.push(
        { icon: FaSearch, text: "Advanced property search", action: "advanced_search" },
        { icon: FaBell, text: "Save this search", action: "save_search" }
      );
    } else if (currentPath.includes('/investment')) {
      contextualSuggestions.push(
        { icon: FaLightbulb, text: "Investment calculator", action: "investment_calc" },
        { icon: FaChartLine, text: "Market analysis", action: "market_analysis" }
      );
    }
    
    return [...baseSuggestions, ...contextualSuggestions].slice(0, 6);
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
        // Handle quick suggestion actions
        switch (action) {
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
            aiResponse = KikiAI.generateResponse("Help me register");
            break;
          case "explain_escrow":
            aiResponse = KikiAI.generateResponse("Explain how escrow works");
            break;
          case "show_investments":
            aiResponse = KikiAI.generateResponse("Show me investment opportunities");
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
                <p className="text-xs opacity-80">Online • Ready to help</p>
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
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      title="Voice input (coming soon)"
                    >
                      <FaMicrophone className="text-sm" />
                    </button>
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
