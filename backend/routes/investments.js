const express = require('express');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all investments
// @route   GET /api/investments
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Investments route - to be implemented',
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