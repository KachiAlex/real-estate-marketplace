const express = require('express');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @desc    Get escrow transactions
// @route   GET /api/escrow
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Escrow route - to be implemented',
      data: []
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router; 