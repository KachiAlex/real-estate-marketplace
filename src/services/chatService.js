import { getApiUrl } from '../utils/apiConfig';
import { authenticatedFetch } from '../utils/authToken';

// Chat service for handling admin chat support functionality

export const chatService = {
  // Get all conversations for admin
  getConversations: async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.priority) queryParams.append('priority', filters.priority);
      if (filters.category) queryParams.append('category', filters.category);
      if (filters.search) queryParams.append('search', filters.search);
      
      const response = await authenticatedFetch(
        getApiUrl(`/admin/chat/conversations?${queryParams.toString()}`)
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch conversations');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }
  },

  // Get a specific conversation with messages
  getConversation: async (conversationId) => {
    try {
      const response = await authenticatedFetch(
        getApiUrl(`/admin/chat/conversations/${conversationId}`)
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch conversation');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching conversation:', error);
      throw error;
    }
  },

  // Send a message as admin
  sendMessage: async (conversationId, message, isAdmin = true) => {
    try {
      const response = await authenticatedFetch(getApiUrl('/admin/chat/send'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId,
          message,
          isAdmin
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  // Mark conversation as read
  markAsRead: async (conversationId) => {
    try {
      const response = await authenticatedFetch(
        getApiUrl(`/admin/chat/conversations/${conversationId}/read`),
        {
          method: 'POST'
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to mark conversation as read');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error marking conversation as read:', error);
      throw error;
    }
  },

  // Assign conversation to admin
  assignConversation: async (conversationId, adminId) => {
    try {
      const response = await authenticatedFetch(
        getApiUrl(`/admin/chat/conversations/${conversationId}/assign`),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ adminId })
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to assign conversation');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error assigning conversation:', error);
      throw error;
    }
  },

  // Update conversation priority
  updatePriority: async (conversationId, priority) => {
    try {
      const response = await authenticatedFetch(
        getApiUrl(`/admin/chat/conversations/${conversationId}/priority`),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ priority })
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to update priority');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating priority:', error);
      throw error;
    }
  },

  // Archive conversation
  archiveConversation: async (conversationId) => {
    try {
      const response = await authenticatedFetch(
        getApiUrl(`/admin/chat/conversations/${conversationId}/archive`),
        {
          method: 'POST'
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to archive conversation');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error archiving conversation:', error);
      throw error;
    }
  },

  // Get chat statistics
  getChatStats: async () => {
    try {
      const response = await authenticatedFetch(
        getApiUrl('/admin/chat/stats')
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch chat statistics');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching chat stats:', error);
      throw error;
    }
  },

  // Create new conversation (for when buyer/vendor initiates chat)
  createConversation: async (userId, message, category, propertyId = null) => {
    try {
      const response = await authenticatedFetch(getApiUrl('/admin/chat/conversations'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          message,
          category,
          propertyId
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create conversation');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  },

  // Get canned responses for quick replies
  getCannedResponses: async () => {
    try {
      const response = await authenticatedFetch(
        getApiUrl('/admin/chat/canned-responses')
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch canned responses');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching canned responses:', error);
      throw error;
    }
  },

  // Add canned response
  addCannedResponse: async (title, message, category) => {
    try {
      const response = await authenticatedFetch(getApiUrl('/admin/chat/canned-responses'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          message,
          category
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to add canned response');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error adding canned response:', error);
      throw error;
    }
  }
};

export default chatService;
