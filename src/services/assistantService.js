import apiClient from './apiClient';

export const sendAssistantMessage = async ({ message, context = {} }) => {
  const payload = {
    message,
    context
  };

  const response = await apiClient.post('/assistant/message', payload);
  return response?.data?.data || null;
};

export default {
  sendAssistantMessage
};
