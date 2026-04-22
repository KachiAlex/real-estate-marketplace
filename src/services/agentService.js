// Service to fetch real estate agents
// Combines agents from user registrations and property listings

/**
 * Get all agents from users who registered as agents
 */
const getAgentsFromUsers = () => {
  try {
    // Get all users from localStorage (they're stored when they register/login)
    const allUsers = [];
    
    // Check localStorage for current user and any cached users
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      try {
        const user = JSON.parse(currentUser);
        if (user.vendorData?.vendorCategory === 'agent') {
          allUsers.push(user);
        }
      } catch (e) {
        console.error('Error parsing currentUser:', e);
      }
    }
    
    // Also check if there's a users list in localStorage
    const usersList = localStorage.getItem('users');
    if (usersList) {
      try {
        const users = JSON.parse(usersList);
        users.forEach(user => {
          if (user.vendorData?.vendorCategory === 'agent') {
            allUsers.push(user);
          }
        });
      } catch (e) {
        console.error('Error parsing users list:', e);
      }
    }
    
    // Get agents from mockUsers (for development/testing)
    // In production, this would come from a database
    const mockUsers = [
      {
        id: 'agent_001',
        firstName: 'Emeka',
        lastName: 'Okafor',
        email: 'emeka.okafor@lagosagents.com',
        phone: '+234 801 234 5678',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
        vendorData: {
          businessName: 'Lagos Real Estate Agency',
          businessType: 'Real Estate Agent',
          vendorCategory: 'agent',
          agentLocation: 'Lagos',
          experience: '5+ years',
          phone: '+234 801 234 5678'
        }
      },
      {
        id: 'agent_002',
        firstName: 'Fatima',
        lastName: 'Ibrahim',
        email: 'fatima.ibrahim@abujaagents.com',
        phone: '+234 802 345 6789',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
        vendorData: {
          businessName: 'Abuja Properties Ltd',
          businessType: 'Real Estate Agent',
          vendorCategory: 'agent',
          agentLocation: 'Abuja',
          experience: '8+ years',
          phone: '+234 802 345 6789'
        }
      },
      {
        id: 'agent_003',
        firstName: 'Chidi',
        lastName: 'Nwankwo',
        email: 'chidi.nwankwo@riversagents.com',
        phone: '+234 803 456 7890',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        vendorData: {
          businessName: 'Rivers State Realty',
          businessType: 'Real Estate Agent',
          vendorCategory: 'agent',
          agentLocation: 'Rivers',
          experience: '10+ years',
          phone: '+234 803 456 7890'
        }
      }
    ];
    
    // Add mock agents that aren't already in allUsers
    mockUsers.forEach(mockAgent => {
      if (!allUsers.find(u => u.id === mockAgent.id || u.email === mockAgent.email)) {
        allUsers.push(mockAgent);
      }
    });
    
    return allUsers;
  } catch (error) {
    console.error('Error getting agents from users:', error);
    return [];
  }
};

/**
 * Get agents from properties (those who listed properties as agents)
 */
const getAgentsFromProperties = (properties) => {
  if (!properties || !Array.isArray(properties)) {
    return [];
  }
  
  const agentMap = new Map();
  
  properties.forEach(property => {
    // Check if property has agent information
    if (property.agent && property.agent.name) {
      const agentName = property.agent.name;
      const agentEmail = property.agent.email || property.ownerEmail;
      const agentPhone = property.agent.phone;
      
      // Create unique key from email or name
      const key = agentEmail || agentName;
      
      if (!agentMap.has(key)) {
        // Extract first and last name from agent name
        const nameParts = agentName.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';
        
        // Get location from property
        const location = property.location || property.city || 'Lagos';
        const city = typeof location === 'string' 
          ? location.split(',')[1]?.trim() || location.split(',')[0]?.trim() || 'Lagos'
          : location.city || 'Lagos';
        
        agentMap.set(key, {
          id: `agent_prop_${agentMap.size + 1}`,
          firstName,
          lastName,
          name: agentName,
          email: agentEmail,
          phone: agentPhone,
          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
          vendorData: {
            businessName: `${firstName} ${lastName} Real Estate`,
            businessType: 'Real Estate Agent',
            vendorCategory: 'agent',
            agentLocation: city,
            experience: '3+ years',
            phone: agentPhone
          },
          propertiesCount: 1
        });
      } else {
        // Increment properties count
        const existing = agentMap.get(key);
        existing.propertiesCount = (existing.propertiesCount || 1) + 1;
      }
    }
  });
  
  return Array.from(agentMap.values());
};

/**
 * Get all agents (from users and properties)
 */
export const getAllAgents = (properties = []) => {
  const agentsFromUsers = getAgentsFromUsers();
  const agentsFromProperties = getAgentsFromProperties(properties);
  
  // Combine and deduplicate by email
  const agentMap = new Map();
  
  // Add agents from users first
  agentsFromUsers.forEach(agent => {
    const key = agent.email || agent.id;
    if (key && !agentMap.has(key)) {
      agentMap.set(key, {
        ...agent,
        propertiesCount: 0
      });
    }
  });
  
  // Add agents from properties, merge if email matches
  agentsFromProperties.forEach(agent => {
    const key = agent.email || agent.id;
    if (key) {
      if (agentMap.has(key)) {
        // Merge: keep user data but update properties count
        const existing = agentMap.get(key);
        existing.propertiesCount = (existing.propertiesCount || 0) + (agent.propertiesCount || 1);
      } else {
        agentMap.set(key, agent);
      }
    }
  });
  
  return Array.from(agentMap.values());
};

/**
 * Filter agents by search query (name or city)
 */
export const filterAgents = (agents, searchQuery = '', cityFilter = 'all') => {
  let filtered = [...agents];
  
  // Filter by city
  if (cityFilter && cityFilter !== 'all') {
    filtered = filtered.filter(agent => {
      const location = agent.vendorData?.agentLocation || '';
      return location.toLowerCase().includes(cityFilter.toLowerCase());
    });
  }
  
  // Filter by search query (name)
  if (searchQuery && searchQuery.trim()) {
    const query = searchQuery.toLowerCase().trim();
    filtered = filtered.filter(agent => {
      const fullName = `${agent.firstName || ''} ${agent.lastName || ''}`.toLowerCase();
      const businessName = (agent.vendorData?.businessName || '').toLowerCase();
      const email = (agent.email || '').toLowerCase();
      
      return fullName.includes(query) || 
             businessName.includes(query) || 
             email.includes(query);
    });
  }
  
  return filtered;
};

/**
 * Paginate agents
 */
export const paginateAgents = (agents, page = 1, limit = 6) => {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  
  return {
    data: agents.slice(startIndex, endIndex),
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(agents.length / limit),
      totalItems: agents.length,
      itemsPerPage: limit,
      hasNextPage: endIndex < agents.length,
      hasPreviousPage: page > 1
    }
  };
};

