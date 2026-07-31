// chatService deprecated — chat migrated to PostgreSQL/Sequelize (use Message/SupportInquiry models).
const logger = { info: () => {}, warn: () => {}, error: () => {} };

class ChatService {
  initializeSocketIO() { console.warn('Chat service disabled - use Sequelize-backed chat'); }
  async getConversations() { throw new Error('Chat service disabled'); }
  async getConversation() { throw new Error('Chat service disabled'); }
  async sendMessage() { throw new Error('Chat service disabled'); }
  async createConversation() { throw new Error('Chat service disabled'); }
  async markAsRead() { throw new Error('Chat service disabled'); }
  async assignConversation() { throw new Error('Chat service disabled'); }
  async updatePriority() { throw new Error('Chat service disabled'); }
  async archiveConversation() { throw new Error('Chat service disabled'); }
  async getChatStats() { throw new Error('Chat service disabled'); }
  async getUserConversations() { throw new Error('Chat service disabled'); }
  async getCannedResponses() { throw new Error('Chat service disabled'); }
  async addCannedResponse() { throw new Error('Chat service disabled'); }
  async deleteCannedResponse() { throw new Error('Chat service disabled'); }
  async sendAdminChatNotification() { throw new Error('Chat service disabled'); }
}

module.exports = new ChatService();
