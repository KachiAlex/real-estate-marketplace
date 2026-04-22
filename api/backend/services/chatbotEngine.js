// Guided chatbot backend logic for menu-driven support
const chatbotConversationTree = require('./chatbotConversationTree');

// Helper: Find a node by id
function getNodeById(id) {
  return chatbotConversationTree.find(node => node.id === id) || chatbotConversationTree[0];
}

// Helper: Get initial state (root)
function getInitialState() {
  return getNodeById('root');
}

// Helper: Get next state by current node and user option index
function getNextState(currentNodeId, optionIndex) {
  const node = getNodeById(currentNodeId);
  if (!node || !node.options || !node.options[optionIndex]) return getInitialState();
  const nextId = node.options[optionIndex].nextStateId;
  return getNodeById(nextId);
}

module.exports = {
  getNodeById,
  getInitialState,
  getNextState
};
