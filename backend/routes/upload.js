const express = require('express');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @desc    Upload file
// @route   POST /api/upload
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Upload route - to be implemented',
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router; 