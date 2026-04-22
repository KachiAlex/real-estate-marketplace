const express = require('express');
const router = express.Router();
const chatbotEngine = require('../services/chatbotEngine');

// Get the initial chatbot state
router.get('/initial', (req, res) => {
  const node = chatbotEngine.getInitialState();
  res.json({ success: true, node });
});

// Get the next chatbot state based on current node and user option
router.post('/next', (req, res) => {
  const { currentNodeId, optionIndex } = req.body;
  if (typeof currentNodeId !== 'string' || typeof optionIndex !== 'number') {
    return res.status(400).json({ success: false, message: 'Invalid input' });
  }
  const node = chatbotEngine.getNextState(currentNodeId, optionIndex);
  res.json({ success: true, node });
});

module.exports = router;
