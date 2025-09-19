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
  FaChevronUp
} from 'react-icons/fa';
import toast from 'react-hot-toast';

const AIAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      message: "👋 Hello! I'm your AI Property Assistant. I'm here to help you navigate our platform, search for properties, create alerts, and answer any questions you might have. How can I assist you today?",
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

  const quickSuggestions = [
    { icon: FaSearch, text: "Search for properties in Lagos", action: "search_lagos" },
    { icon: FaBell, text: "Create a property alert", action: "create_alert" },
    { icon: FaHome, text: "Show me luxury properties", action: "show_luxury" },
    { icon: FaUser, text: "Help with registration", action: "help_register" },
    { icon: FaQuestionCircle, text: "How does escrow work?", action: "explain_escrow" },
    { icon: FaLightbulb, text: "Investment opportunities", action: "show_investments" }
  ];

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
    
    setTimeout(() => {
      let response = "";
      
      if (action) {
        switch (action) {
          case "search_lagos":
            response = "🏠 I found several properties in Lagos! Let me show you some options. You can filter by price range, property type, and amenities. Would you like me to navigate you to the properties page with Lagos pre-selected?";
            setTimeout(() => {
              navigate('/properties?location=Lagos');
              toast.success('Navigated to Lagos properties!');
            }, 2000);
            break;
            
          case "create_alert":
            response = "🔔 I can help you create a property alert! This will notify you when new properties matching your criteria become available. What type of property are you looking for? (e.g., '3-bedroom apartment in Victoria Island under ₦50M')";
            break;
            
          case "show_luxury":
            response = "✨ Here are some luxury properties I recommend! Our luxury collection includes penthouses, waterfront villas, and high-end apartments with premium amenities. Would you like me to show you the luxury filter options?";
            break;
            
          case "help_register":
            response = "📝 I'd be happy to help you register! Registration gives you access to save properties, create alerts, contact agents, and use our escrow services. The process is simple - just provide your email, create a password, and verify your account. Would you like me to take you to the registration page?";
            break;
            
          case "explain_escrow":
            response = "🔒 Our escrow service provides secure property transactions! Here's how it works:\n\n1️⃣ Buyer initiates purchase\n2️⃣ Funds are held securely in escrow\n3️⃣ Property verification and documentation\n4️⃣ Buyer approves and releases funds to vendor\n\nThis protects both buyer and seller. Would you like to see a demo of the escrow process?";
            break;
            
          case "show_investments":
            response = "💰 Great choice! We offer various investment opportunities including REITs, land banking, and property crowdfunding. Our investment platform provides detailed analytics and projected returns. Would you like me to show you current investment opportunities?";
            break;
            
          default:
            response = getContextualResponse(userMessage.toLowerCase());
        }
      } else {
        response = getContextualResponse(userMessage.toLowerCase());
      }
      
      setIsTyping(false);
      addMessage(response, 'ai');
    }, 1500 + Math.random() * 1000); // Simulate thinking time
  };

  const getContextualResponse = (message) => {
    if (message.includes('price') || message.includes('cost') || message.includes('naira') || message.includes('₦')) {
      return "💰 Our properties range from ₦20M to ₦250M+. You can use our advanced filters to set your budget range. We also offer mortgage calculator to help estimate monthly payments. Would you like me to show you properties in a specific price range?";
    }
    
    if (message.includes('location') || message.includes('area') || message.includes('where')) {
      return "📍 We have properties across Nigeria's prime locations including Lagos (Victoria Island, Lekki, Ikoyi), Abuja (Maitama, Asokoro), and other major cities. Which area interests you most?";
    }
    
    if (message.includes('mortgage') || message.includes('loan') || message.includes('finance')) {
      return "🏦 We provide mortgage assistance and have partnerships with leading banks. Our mortgage calculator can help estimate your monthly payments. Would you like me to show you the mortgage calculator or connect you with our finance partners?";
    }
    
    if (message.includes('document') || message.includes('paper') || message.includes('title')) {
      return "📋 All our properties come with verified documentation. We ensure proper title verification, survey plans, and legal compliance. Our legal team handles all paperwork through the escrow process for your security.";
    }
    
    if (message.includes('agent') || message.includes('contact') || message.includes('call')) {
      return "👤 I can help you connect with verified property agents! Each property listing has contact details for the responsible agent. You can also schedule property viewings directly through our platform. Need help contacting a specific agent?";
    }
    
    if (message.includes('search') || message.includes('find') || message.includes('look')) {
      return "🔍 I can help you search for properties! Use our advanced search with filters for location, price, bedrooms, amenities, and more. What type of property are you looking for? I can guide you through the search process.";
    }
    
    if (message.includes('save') || message.includes('favorite') || message.includes('bookmark')) {
      return "❤️ You can save properties to your favorites by clicking the heart icon on any property card. Saved properties are accessible from your dashboard. Would you like me to show you how to manage your saved properties?";
    }
    
    if (message.includes('help') || message.includes('how') || message.includes('guide')) {
      return "🤝 I'm here to help! I can assist with:\n• Property search and filtering\n• Creating property alerts\n• Understanding the buying process\n• Escrow and payment information\n• Registration and account setup\n• Investment opportunities\n\nWhat specific help do you need?";
    }
    
    // Default response
    return `🤖 I understand you're asking about "${message}". I'm here to help with property search, alerts, registration, escrow services, and more. Could you be more specific about what you'd like to know? You can also try one of the quick suggestions below!`;
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
            title="Open AI Assistant"
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
                <h3 className="font-semibold text-sm">AI Property Assistant</h3>
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
                      {quickSuggestions.map((suggestion, index) => (
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
