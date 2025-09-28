// Advanced KIKI AI Service - ChatGPT-like capabilities for real estate
class KikiAI {
  constructor() {
    this.context = {
      user: null,
      currentPage: null,
      conversationHistory: [],
      userPreferences: {},
      lastAction: null
    };
    
    // Intent patterns for natural language understanding
    this.intentPatterns = {
      // Property Search Intents
      search: {
        keywords: ['search', 'find', 'look for', 'show me', 'browse', 'explore', 'discover'],
        patterns: [
          /(?:find|search|show me|look for)\s+(?:properties?|homes?|houses?|apartments?)\s+(?:in|at|near|around)\s+(.+)/i,
          /(?:properties?|homes?|houses?|apartments?)\s+(?:in|at|near|around)\s+(.+)/i,
          /(?:i want|i need|i'm looking for)\s+(?:a|an|some)\s+(.+)/i
        ]
      },
      
      // Price-related intents
      price: {
        keywords: ['price', 'cost', 'expensive', 'cheap', 'budget', 'affordable', 'naira', '₦'],
        patterns: [
          /(?:under|below|less than|max|maximum)\s+(?:₦|naira|n)\s*([\d,]+(?:\.\d+)?)\s*(?:m|million|k|thousand)?/i,
          /(?:between|from|to)\s+(?:₦|naira|n)\s*([\d,]+(?:\.\d+)?)\s*(?:m|million|k|thousand)?\s*(?:and|to)\s+(?:₦|naira|n)\s*([\d,]+(?:\.\d+)?)\s*(?:m|million|k|thousand)?/i,
          /(?:budget|can afford|spend)\s+(?:is|of)?\s*(?:₦|naira|n)\s*([\d,]+(?:\.\d+)?)\s*(?:m|million|k|thousand)?/i
        ]
      },
      
      // Location intents
      location: {
        keywords: ['in', 'at', 'near', 'around', 'location', 'area', 'place', 'where'],
        patterns: [
          /(?:in|at|near|around|close to)\s+(.+)/i,
          /(?:location|area|place|where)\s+(?:is|are|at)\s+(.+)/i
        ]
      },
      
      // Property type intents
      propertyType: {
        keywords: ['apartment', 'house', 'villa', 'penthouse', 'duplex', 'bungalow', 'mansion', 'studio'],
        patterns: [
          /(?:apartment|flat|condo|condominium)/i,
          /(?:house|villa|mansion|bungalow|duplex|townhouse)/i,
          /(?:penthouse|studio|loft|maisonette)/i
        ]
      },
      
      // Amenities intents
      amenities: {
        keywords: ['pool', 'gym', 'security', 'parking', 'garden', 'balcony', 'elevator', 'wifi', 'ac', 'furnished'],
        patterns: [
          /(?:with|having|that has|including)\s+(?:a\s+)?(.+)/i,
          /(?:need|want|require)\s+(?:a\s+)?(.+)/i
        ]
      },
      
      // Bedroom/Bathroom intents
      rooms: {
        keywords: ['bedroom', 'bathroom', 'bed', 'bath', 'room'],
        patterns: [
          /(?:(\d+)\s*(?:bedroom|bed|br|bdr)s?)/i,
          /(?:(\d+)\s*(?:bathroom|bath|ba|bath)s?)/i,
          /(?:(\d+)\s*(?:bedroom|bed)s?\s*(?:and|,)\s*(\d+)\s*(?:bathroom|bath)s?)/i
        ]
      },
      
      // Help and guidance intents
      help: {
        keywords: ['help', 'how', 'guide', 'explain', 'what', 'why', 'when', 'where'],
        patterns: [
          /(?:how\s+(?:do|can|should|to))/i,
          /(?:what\s+(?:is|are|does|do|can|should))/i,
          /(?:why\s+(?:is|are|does|do|can|should))/i,
          /(?:explain|tell me about|describe)/i
        ]
      },
      
      // Action intents
      action: {
        keywords: ['create', 'make', 'add', 'set', 'register', 'sign up', 'login', 'contact', 'call', 'message'],
        patterns: [
          /(?:create|make|add|set up)\s+(?:a\s+)?(.+)/i,
          /(?:register|sign up|join)/i,
          /(?:contact|call|message|reach)\s+(?:me|us)/i
        ]
      }
    };
    
    // Response templates for different scenarios
    this.responseTemplates = {
      greeting: [
        "👋 Hello! I'm KIKI, your intelligent real estate assistant. How can I help you find your perfect property today?",
        "🏠 Hi there! I'm KIKI, ready to help you navigate the real estate market. What brings you here today?",
        "✨ Welcome! I'm KIKI, your AI-powered property companion. What can I assist you with today?"
      ],
      
      propertySearch: [
        "🔍 I'd be happy to help you find the perfect property! Based on your request, I can search our database and show you relevant options.",
        "🏡 Let me help you discover amazing properties that match your criteria. I'll use our advanced search to find the best matches.",
        "🎯 Perfect! I understand you're looking for properties. Let me find some great options for you."
      ],
      
      clarification: [
        "🤔 I want to make sure I understand you correctly. Could you provide a bit more detail about what you're looking for?",
        "💭 That's interesting! To give you the best assistance, could you clarify what specific help you need?",
        "🎯 I'm here to help! Could you tell me more about what you're trying to accomplish?"
      ],
      
      error: [
        "😅 I apologize, but I didn't quite understand that. Could you rephrase your request? I'm here to help with property search, guidance, and more!",
        "🤖 I'm still learning! Could you try asking that in a different way? I can help with property searches, explanations, and navigation.",
        "💡 I want to help you, but I need a bit more clarity. What specific assistance are you looking for?"
      ]
    };
  }
  
  // Set user context
  setContext(context) {
    this.context = { ...this.context, ...context };
  }
  
  // Analyze user intent from message
  analyzeIntent(message) {
    const lowerMessage = message.toLowerCase();
    const intents = [];
    
    // Check each intent category
    for (const [intentType, config] of Object.entries(this.intentPatterns)) {
      // Check keywords
      if (config.keywords.some(keyword => lowerMessage.includes(keyword))) {
        intents.push(intentType);
      }
      
      // Check patterns
      for (const pattern of config.patterns) {
        const match = message.match(pattern);
        if (match) {
          intents.push({
            type: intentType,
            match: match,
            confidence: 0.8
          });
        }
      }
    }
    
    return intents;
  }
  
  // Extract entities from message
  extractEntities(message) {
    const entities = {
      price: null,
      location: null,
      propertyType: null,
      bedrooms: null,
      bathrooms: null,
      amenities: []
    };
    
    // Extract price
    const priceMatch = message.match(/(?:₦|naira|n)\s*([\d,]+(?:\.\d+)?)\s*(?:m|million|k|thousand)?/i);
    if (priceMatch) {
      let amount = parseFloat(priceMatch[1].replace(/,/g, ''));
      const unit = priceMatch[0].toLowerCase();
      if (unit.includes('m') || unit.includes('million')) {
        amount *= 1000000;
      } else if (unit.includes('k') || unit.includes('thousand')) {
        amount *= 1000;
      }
      entities.price = amount;
    }
    
    // Extract location
    const locationMatch = message.match(/(?:in|at|near|around|close to)\s+([^.!?]+)/i);
    if (locationMatch) {
      entities.location = locationMatch[1].trim();
    }
    
    // Extract bedrooms
    const bedroomMatch = message.match(/(\d+)\s*(?:bedroom|bed|br|bdr)/i);
    if (bedroomMatch) {
      entities.bedrooms = parseInt(bedroomMatch[1]);
    }
    
    // Extract bathrooms
    const bathroomMatch = message.match(/(\d+)\s*(?:bathroom|bath|ba)/i);
    if (bathroomMatch) {
      entities.bathrooms = parseInt(bathroomMatch[1]);
    }
    
    // Extract property type
    const propertyTypes = ['apartment', 'house', 'villa', 'penthouse', 'duplex', 'bungalow', 'mansion', 'studio', 'condo'];
    for (const type of propertyTypes) {
      if (message.toLowerCase().includes(type)) {
        entities.propertyType = type;
        break;
      }
    }
    
    // Extract amenities
    const amenities = ['pool', 'gym', 'security', 'parking', 'garden', 'balcony', 'elevator', 'wifi', 'ac', 'furnished', 'unfurnished'];
    for (const amenity of amenities) {
      if (message.toLowerCase().includes(amenity)) {
        entities.amenities.push(amenity);
      }
    }
    
    return entities;
  }
  
  // Generate intelligent response
  generateResponse(message, context = {}) {
    const intents = this.analyzeIntent(message);
    const entities = this.extractEntities(message);
    const lowerMessage = message.toLowerCase();
    
    // Update conversation history
    this.context.conversationHistory.push({
      message,
      intents,
      entities,
      timestamp: new Date()
    });
    
    // Keep only last 10 conversations for context
    if (this.context.conversationHistory.length > 10) {
      this.context.conversationHistory = this.context.conversationHistory.slice(-10);
    }
    
    // Handle greetings
    if (this.isGreeting(lowerMessage)) {
      return {
        response: this.getRandomResponse('greeting'),
        action: null,
        entities: {}
      };
    }
    
    // Handle property search
    if (intents.includes('search') || this.isPropertySearch(lowerMessage)) {
      return this.handlePropertySearch(message, entities);
    }
    
    // Handle price queries
    if (intents.includes('price') || entities.price) {
      return this.handlePriceQuery(message, entities);
    }
    
    // Handle location queries
    if (intents.includes('location') || entities.location) {
      return this.handleLocationQuery(message, entities);
    }
    
    // Handle help requests
    if (intents.includes('help')) {
      return this.handleHelpRequest(message);
    }
    
    // Handle action requests
    if (intents.includes('action')) {
      return this.handleActionRequest(message, entities);
    }
    
    // Handle mortgage/finance queries
    if (this.isFinanceRelated(lowerMessage)) {
      return this.handleFinanceQuery(message);
    }
    
    // Handle document/legal queries
    if (this.isDocumentRelated(lowerMessage)) {
      return this.handleDocumentQuery(message);
    }
    
    // Handle agent contact queries
    if (this.isAgentRelated(lowerMessage)) {
      return this.handleAgentQuery(message);
    }
    
    // Handle investment queries
    if (this.isInvestmentRelated(lowerMessage)) {
      return this.handleInvestmentQuery(message);
    }
    
    // Handle escrow queries
    if (this.isEscrowRelated(lowerMessage)) {
      return this.handleEscrowQuery(message);
    }
    
    // Handle saved properties queries
    if (this.isSavedPropertiesRelated(lowerMessage)) {
      return this.handleSavedPropertiesQuery(message);
    }
    
    // Default intelligent response
    return this.generateContextualResponse(message, entities);
  }
  
  // Helper methods for intent detection
  isGreeting(message) {
    const greetings = ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'greetings'];
    return greetings.some(greeting => message.includes(greeting));
  }
  
  isPropertySearch(message) {
    const searchTerms = ['property', 'home', 'house', 'apartment', 'find', 'search', 'looking for'];
    return searchTerms.some(term => message.includes(term));
  }
  
  isFinanceRelated(message) {
    const financeTerms = ['mortgage', 'loan', 'finance', 'payment', 'installment', 'bank', 'credit'];
    return financeTerms.some(term => message.includes(term));
  }
  
  isDocumentRelated(message) {
    const documentTerms = ['document', 'paper', 'title', 'deed', 'certificate', 'legal', 'verification'];
    return documentTerms.some(term => message.includes(term));
  }
  
  isAgentRelated(message) {
    const agentTerms = ['agent', 'contact', 'call', 'message', 'realtor', 'broker', 'representative'];
    return agentTerms.some(term => message.includes(term));
  }
  
  isInvestmentRelated(message) {
    const investmentTerms = ['investment', 'invest', 'reit', 'return', 'profit', 'yield', 'portfolio'];
    return investmentTerms.some(term => message.includes(term));
  }
  
  isEscrowRelated(message) {
    const escrowTerms = ['escrow', 'secure', 'safe', 'protection', 'transaction', 'payment'];
    return escrowTerms.some(term => message.includes(term));
  }
  
  isSavedPropertiesRelated(message) {
    const savedTerms = ['saved', 'favorite', 'bookmark', 'wishlist', 'liked'];
    return savedTerms.some(term => message.includes(term));
  }
  
  // Response handlers
  handlePropertySearch(message, entities) {
    let response = this.getRandomResponse('propertySearch');
    let action = null;
    
    if (entities.location || entities.price || entities.propertyType || entities.bedrooms) {
      response += "\n\n🎯 Based on your criteria, I found some great matches!";
      
      if (entities.location) {
        response += `\n📍 Location: ${entities.location}`;
      }
      if (entities.price) {
        response += `\n💰 Budget: ₦${entities.price.toLocaleString()}`;
      }
      if (entities.propertyType) {
        response += `\n🏠 Type: ${entities.propertyType}`;
      }
      if (entities.bedrooms) {
        response += `\n🛏️ Bedrooms: ${entities.bedrooms}`;
      }
      if (entities.amenities.length > 0) {
        response += `\n✨ Amenities: ${entities.amenities.join(', ')}`;
      }
      
      response += "\n\nWould you like me to show you these properties?";
      action = {
        type: 'navigate',
        path: '/properties',
        params: {
          location: entities.location,
          price: entities.price,
          type: entities.propertyType,
          bedrooms: entities.bedrooms,
          amenities: entities.amenities
        }
      };
    } else {
      response += "\n\nTo give you the best results, could you tell me:\n• Your preferred location\n• Budget range\n• Property type\n• Number of bedrooms";
    }
    
    return { response, action, entities };
  }
  
  handlePriceQuery(message, entities) {
    let response = "💰 I can help you understand pricing in our market!\n\n";
    
    if (entities.price) {
      response += `For ₦${entities.price.toLocaleString()}, you can find:\n`;
      
      if (entities.price < 30000000) {
        response += "• Studio and 1-bedroom apartments\n• Starter homes in developing areas\n• Great investment opportunities";
      } else if (entities.price < 80000000) {
        response += "• 2-3 bedroom apartments\n• Townhouses and duplexes\n• Properties in good neighborhoods";
      } else if (entities.price < 150000000) {
        response += "• 3-4 bedroom apartments\n• Luxury condos\n• Houses in prime locations";
      } else {
        response += "• Luxury penthouses\n• Villas and mansions\n• Premium properties in exclusive areas";
      }
    } else {
      response += "Our properties range from ₦20M to ₦250M+. Here's what you can expect:\n\n";
      response += "🏠 **₦20M - ₦50M**: Studio to 2-bedroom apartments\n";
      response += "🏡 **₦50M - ₦100M**: 2-3 bedroom apartments, townhouses\n";
      response += "🏰 **₦100M - ₦200M**: Luxury apartments, houses\n";
      response += "👑 **₦200M+**: Penthouses, villas, mansions\n\n";
      response += "What's your budget range? I can show you specific properties!";
    }
    
    return { response, action: null, entities };
  }
  
  handleLocationQuery(message, entities) {
    let response = "📍 I can help you explore different areas!\n\n";
    
    if (entities.location) {
      response += `Great choice! ${entities.location} is a fantastic area with:\n\n`;
      
      const locationInfo = {
        'lagos': '• Victoria Island - Business district\n• Lekki - Modern developments\n• Ikoyi - Upscale residential\n• Surulere - Affordable options',
        'abuja': '• Maitama - Diplomatic area\n• Asokoro - Government district\n• Wuse 2 - Commercial hub\n• Gwarinpa - Family-friendly',
        'port harcourt': '• GRA - Upscale residential\n• Trans-Amadi - Industrial area\n• Rumuola - Commercial district'
      };
      
      const locationKey = entities.location.toLowerCase();
      if (locationInfo[locationKey]) {
        response += locationInfo[locationKey];
      } else {
        response += "• Great property options\n• Good amenities and infrastructure\n• Growing real estate market";
      }
      
      response += "\n\nWould you like me to show you properties in this area?";
    } else {
      response += "**Popular Areas in Nigeria:**\n\n";
      response += "🏙️ **Lagos**: Victoria Island, Lekki, Ikoyi, Surulere\n";
      response += "🏛️ **Abuja**: Maitama, Asokoro, Wuse 2, Gwarinpa\n";
      response += "🏭 **Port Harcourt**: GRA, Trans-Amadi, Rumuola\n";
      response += "🏘️ **Kano**: Nassarawa, Tarauni, Fagge\n\n";
      response += "Which area interests you most?";
    }
    
    return { response, action: null, entities };
  }
  
  handleHelpRequest(message) {
    const response = `🤝 I'm KIKI, your intelligent real estate assistant! I can help you with:

🔍 **Property Search**
• Find properties by location, price, type
• Advanced filtering and sorting
• Property comparisons

💰 **Financial Services**
• Mortgage calculations
• Payment plans and financing
• Investment opportunities

📋 **Process Guidance**
• Buying process explanation
• Document requirements
• Legal procedures

🔒 **Secure Transactions**
• Escrow services
• Payment protection
• Document verification

👤 **Agent Services**
• Connect with verified agents
• Schedule property viewings
• Get expert advice

💡 **Smart Features**
• Property alerts and notifications
• Saved searches and favorites
• Market insights and trends

What specific help do you need? I'm here to make your real estate journey smooth and successful!`;
    
    return { response, action: null, entities: {} };
  }
  
  handleActionRequest(message, entities) {
    let response = "🎯 I can help you with that action!\n\n";
    
    if (message.toLowerCase().includes('alert')) {
      response += "🔔 I'll help you create a property alert! This will notify you when new properties matching your criteria become available.\n\n";
      response += "Tell me your preferences:\n";
      response += "• Location\n• Property type\n• Price range\n• Number of bedrooms\n• Amenities";
      
      return {
        response,
        action: { type: 'navigate', path: '/alerts' },
        entities
      };
    }
    
    if (message.toLowerCase().includes('register') || message.toLowerCase().includes('sign up')) {
      response += "📝 Registration is quick and easy! You'll get access to:\n";
      response += "• Save and favorite properties\n• Create property alerts\n• Contact agents directly\n• Use escrow services\n• Track your inquiries\n\n";
      response += "Would you like me to take you to the registration page?";
      
      return {
        response,
        action: { type: 'navigate', path: '/register' },
        entities
      };
    }
    
    if (message.toLowerCase().includes('contact') || message.toLowerCase().includes('call')) {
      response += "📞 I can help you connect with our agents! Our verified agents are ready to assist you with:\n";
      response += "• Property viewings\n• Market information\n• Negotiations\n• Documentation\n\n";
      response += "Would you like to see our agent directory or contact a specific agent?";
      
      return { response, action: null, entities };
    }
    
    return { response, action: null, entities };
  }
  
  handleFinanceQuery(message) {
    const response = `🏦 I can help you with financing options!

**Mortgage Services:**
• Pre-approval assistance
• Interest rate comparisons
• Monthly payment calculations
• Down payment planning

**Payment Options:**
• Bank financing
• Developer financing
• Rent-to-own schemes
• Installment plans

**Investment Financing:**
• Property investment loans
• REIT opportunities
• Crowdfunding options
• Portfolio financing

Would you like me to:
• Show you our mortgage calculator
• Connect you with finance partners
• Explain different payment options
• Help with investment financing?`;
    
    return { response, action: null, entities: {} };
  }
  
  handleDocumentQuery(message) {
    const response = `📋 Document verification is crucial for safe property transactions!

**Required Documents:**
• Title deed verification
• Survey plans
• Building approval
• Tax clearance certificates
• Environmental compliance

**Our Legal Services:**
• Document verification
• Title search and clearance
• Legal opinion services
• Transaction documentation
• Post-purchase support

**Escrow Protection:**
• Secure document handling
• Verified ownership transfer
• Legal compliance check
• Risk-free transactions

Would you like me to explain any specific document requirements or show you our legal services?`;
    
    return { response, action: null, entities: {} };
  }
  
  handleAgentQuery(message) {
    const response = `👤 Our verified agents are here to help!

**Agent Services:**
• Property viewings and tours
• Market analysis and pricing
• Negotiation assistance
• Documentation support
• Post-purchase services

**How to Connect:**
• Browse agent profiles
• Schedule viewings
• Direct messaging
• Video consultations
• In-person meetings

**Agent Verification:**
• Licensed professionals
• Background verified
• Performance rated
• Customer reviewed
• Continuously monitored

Would you like me to help you find an agent or show you how to contact one?`;
    
    return { response, action: null, entities: {} };
  }
  
  handleInvestmentQuery(message) {
    const response = `💰 Great investment opportunities await!

**Investment Options:**
• REITs (Real Estate Investment Trusts)
• Land banking schemes
• Property crowdfunding
• Commercial real estate
• Development projects

**Investment Benefits:**
• Diversified portfolio
• Professional management
• Regular returns
• Tax advantages
• Liquidity options

**Risk Management:**
• Thorough due diligence
• Professional valuations
• Legal compliance
• Insurance coverage
• Exit strategies

Would you like me to show you current investment opportunities or explain any specific investment type?`;
    
    return { response, action: null, entities: {} };
  }
  
  handleEscrowQuery(message) {
    const response = `🔒 Our escrow service ensures secure transactions!

**How Escrow Works:**
1️⃣ **Initiation**: Buyer starts purchase process
2️⃣ **Fund Holding**: Money held in secure account
3️⃣ **Verification**: Property and documents verified
4️⃣ **Approval**: Buyer approves after inspection
5️⃣ **Release**: Funds released to seller
6️⃣ **Transfer**: Property ownership transferred

**Escrow Benefits:**
• Financial protection for both parties
• Document verification
• Legal compliance
• Dispute resolution
• Professional oversight

**Escrow Process:**
• 3-5 business days typical
• 24/7 online tracking
• Dedicated support team
• Legal documentation
• Secure payment processing

Would you like me to walk you through the escrow process or answer specific questions?`;
    
    return { response, action: null, entities: {} };
  }
  
  handleSavedPropertiesQuery(message) {
    const response = `❤️ Your saved properties are easily accessible!

**Saved Properties Features:**
• Quick access to favorites
• Price change notifications
• Availability updates
• Comparison tools
• Sharing options

**Managing Your Favorites:**
• Add/remove properties
• Organize by categories
• Set price alerts
• Track property status
• Export property lists

**Smart Notifications:**
• Price reductions
• New similar properties
• Market updates
• Agent communications
• Viewing reminders

Would you like me to show you your saved properties or help you manage them?`;
    
    return { response, action: null, entities: {} };
  }
  
  generateContextualResponse(message, entities) {
    // Use conversation history for better context
    const recentContext = this.context.conversationHistory.slice(-3);
    
    let response = "🤖 I understand you're asking about that topic. ";
    
    // Check if we have relevant context
    if (recentContext.length > 0) {
      const lastEntities = recentContext[recentContext.length - 1].entities;
      if (lastEntities.location || lastEntities.price || lastEntities.propertyType) {
        response += "Building on our previous conversation, ";
      }
    }
    
    response += "I can help you with property searches, market information, financing options, legal guidance, and more. ";
    
    if (entities.location || entities.price || entities.propertyType) {
      response += "Based on what you've mentioned, would you like me to help you find properties that match your criteria?";
    } else {
      response += "Could you tell me more specifically what you'd like help with?";
    }
    
    return { response, action: null, entities };
  }
  
  getRandomResponse(type) {
    const responses = this.responseTemplates[type];
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  // Get conversation summary for context
  getConversationSummary() {
    if (this.context.conversationHistory.length === 0) {
      return "New conversation started";
    }
    
    const summary = {
      topics: [],
      entities: {
        locations: new Set(),
        prices: [],
        propertyTypes: new Set(),
        amenities: new Set()
      }
    };
    
    this.context.conversationHistory.forEach(conv => {
      if (conv.entities.location) summary.entities.locations.add(conv.entities.location);
      if (conv.entities.price) summary.entities.prices.push(conv.entities.price);
      if (conv.entities.propertyType) summary.entities.propertyTypes.add(conv.entities.propertyType);
      conv.entities.amenities.forEach(amenity => summary.entities.amenities.add(amenity));
    });
    
    return summary;
  }
}

export default new KikiAI();
