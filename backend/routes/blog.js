const express = require('express');
const router = express.Router();
const blogService = require('../services/blogService');
const { protect, authorize } = require('../middleware/auth');
const { validate, sanitizeInput } = require('../middleware/validation');
const { body, param, query } = require('express-validator');

// Validation rules
const blogValidation = [
  body('title')
    .trim()
    .isLength({ min: 10, max: 200 })
    .withMessage('Title must be between 10 and 200 characters'),
  body('excerpt')
    .trim()
    .isLength({ min: 50, max: 500 })
    .withMessage('Excerpt must be between 50 and 500 characters'),
  body('content')
    .trim()
    .isLength({ min: 100 })
    .withMessage('Content must be at least 100 characters'),
  body('category')
    .isIn([
      'real-estate-tips',
      'market-news',
      'investment-guides',
      'property-showcase',
      'legal-advice',
      'home-improvement',
      'neighborhood-spotlight',
      'buyer-guides',
      'seller-guides',
      'rental-advice',
      'mortgage-financing',
      'property-management'
    ])
    .withMessage('Invalid category'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('featuredImage.url')
    .isURL()
    .withMessage('Featured image must be a valid URL'),
  body('status')
    .optional()
    .isIn(['draft', 'published', 'archived'])
    .withMessage('Invalid status'),
  body('featured')
    .optional()
    .isBoolean()
    .withMessage('Featured must be a boolean'),
  body('allowComments')
    .optional()
    .isBoolean()
    .withMessage('Allow comments must be a boolean')
];

// @desc    Test route - simple blog endpoint without validation
// @route   GET /api/blog/test
// @access  Public
router.get('/test', async (req, res) => {
  console.log('📝 Blog test route called');
  try {
    const result = await blogService.getBlogs({}, 'publishedAt', 'desc', 10, 0);
    res.json({
      success: true,
      data: result.blogs || [],
      total: result.total || 0
    });
  } catch (error) {
    console.error('Error in blog test route:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Get all published blogs
// @route   GET /api/blog
// @access  Public
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('category').optional().isString(),
  query('tag').optional().isString(),
  query('search').optional().isString(),
  query('featured').optional().customSanitizer(value => {
    if (value === 'true' || value === '1') return true;
    if (value === 'false' || value === '0') return false;
    return value;
  }).isBoolean().withMessage('Featured must be true or false'),
  query('sort').optional().customSanitizer(value => {
    // Handle sort parameter - remove any MongoDB-style suffixes like :1
    if (typeof value === 'string') {
      return value.split(':')[0]; // Take only the part before ':'
    }
    return value;
  }).isIn(['newest', 'oldest', 'popular', 'trending']).withMessage('Sort must be one of: newest, oldest, popular, trending'),
  validate()
], async (req, res) => {
  console.log('📝 Blog route handler called', { path: req.path, query: req.query, url: req.url });
  try {
    const {
      page = 1,
      limit = 10,
      category,
      tag,
      search,
      featured,
      sort = 'newest'
    } = req.query;

    // Build filter object
    const filters = {
      status: 'published',
      publishedAt: new Date() // Only get published blogs
    };

    if (category) {
      filters.category = category;
    }

    if (tag) {
      filters.tags = tag.toLowerCase();
    }

    if (featured === 'true' || featured === true) {
      filters.featured = true;
    }

    if (search) {
      filters.search = search;
    }

    // Determine sort field and order
    let sortBy = 'publishedAt';
    let sortOrder = 'desc';
    
    switch (sort) {
      case 'oldest':
        sortBy = 'publishedAt';
        sortOrder = 'asc';
        break;
      case 'popular':
        sortBy = 'views';
        sortOrder = 'desc';
        break;
      case 'trending':
        sortBy = 'trending';
        sortOrder = 'desc';
        break;
      default: // newest
        sortBy = 'publishedAt';
        sortOrder = 'desc';
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const result = await blogService.getBlogs(
      filters,
      sortBy,
      sortOrder,
      parseInt(limit),
      offset
    );

    // Handle undefined or null result
    if (!result || !result.blogs) {
      return res.json({
        success: true,
        data: [],
        pagination: {
          currentPage: parseInt(page),
          totalPages: 0,
          totalItems: 0,
          itemsPerPage: parseInt(limit)
        }
      });
    }

    // Format response to match MongoDB structure
    const blogs = (result.blogs || []).map(blog => ({
      _id: blog.id,
      id: blog.id,
      ...blog
    }));

    const totalPages = Math.ceil((result.total || 0) / parseInt(limit));

    res.json({
      success: true,
      data: blogs,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: result.total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching blogs:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// @desc    Get featured blogs
// @route   GET /api/blog/featured
// @access  Public
router.get('/featured', async (req, res) => {
  try {
    const { limit = 5 } = req.query;

    const blogs = await blogService.getFeaturedBlogs(parseInt(limit));

    // Format response to match MongoDB structure
    const formattedBlogs = blogs.map(blog => ({
      _id: blog.id,
      id: blog.id,
      ...blog
    }));

    res.json({
      success: true,
      data: formattedBlogs
    });
  } catch (error) {
    console.error('Error fetching featured blogs:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get blog by slug
// @route   GET /api/blog/:slug
// @access  Public
router.get('/:slug', [
  param('slug').isSlug().withMessage('Invalid slug'),
  validate()
], async (req, res) => {
  try {
    const blog = await blogService.getBlogBySlug(req.params.slug);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }

    // Increment views
    if (blog.id) {
      await blogService.incrementViews(blog.id);
      blog.views = (blog.views || 0) + 1;
    }

    // Format response to match MongoDB structure
    const formattedBlog = {
      _id: blog.id,
      id: blog.id,
      ...blog
    };

    res.json({
      success: true,
      data: formattedBlog
    });
  } catch (error) {
    console.error('Error fetching blog:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get related blogs
// @route   GET /api/blog/:slug/related
// @access  Public
router.get('/:slug/related', [
  param('slug').isSlug().withMessage('Invalid slug'),
  query('limit').optional().isInt({ min: 1, max: 10 }).withMessage('Limit must be between 1 and 10'),
  validate()
], async (req, res) => {
  try {
    const { limit = 4 } = req.query;

    // First get the current blog
    const currentBlog = await blogService.getBlogBySlug(req.params.slug);

    if (!currentBlog) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }

    // Get related blogs
    const relatedBlogs = await blogService.getRelatedBlogs(currentBlog, parseInt(limit));

    // Format response to match MongoDB structure
    const formattedBlogs = relatedBlogs.map(blog => ({
      _id: blog.id,
      id: blog.id,
      ...blog
    }));

    res.json({
      success: true,
      data: formattedBlogs
    });
  } catch (error) {
    console.error('Error fetching related blogs:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Like a blog post
// @route   POST /api/blog/:slug/like
// @access  Private
router.post('/:slug/like', protect, async (req, res) => {
  try {
    const blog = await blogService.getBlogBySlug(req.params.slug);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }

    await blogService.incrementLikes(blog.id);

    res.json({
      success: true,
      message: 'Blog post liked successfully',
      likes: (blog.likes || 0) + 1
    });
  } catch (error) {
    console.error('Error liking blog:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Share a blog post
// @route   POST /api/blog/:slug/share
// @access  Private
router.post('/:slug/share', protect, async (req, res) => {
  try {
    const blog = await blogService.getBlogBySlug(req.params.slug);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }

    await blogService.incrementShares(blog.id);

    res.json({
      success: true,
      message: 'Blog post shared successfully',
      shares: (blog.shares || 0) + 1
    });
  } catch (error) {
    console.error('Error sharing blog:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Add comment to blog post
// @route   POST /api/blog/:slug/comments
// @access  Private
router.post('/:slug/comments', [
  protect,
  body('content')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Comment must be between 10 and 1000 characters'),
  validate()
], async (req, res) => {
  try {
    const blog = await blogService.getBlogBySlug(req.params.slug);

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }

    if (!blog.allowComments) {
      return res.status(400).json({
        success: false,
        message: 'Comments are disabled for this post'
      });
    }

    const comment = {
      user: {
        id: req.user.id,
        name: `${req.user.firstName} ${req.user.lastName}`,
        avatar: req.user.avatar || ''
      },
      content: req.body.content,
      isApproved: false // Comments need approval
    };

    const newComment = await blogService.addComment(blog.id, comment);

    res.json({
      success: true,
      message: 'Comment added successfully. It will be visible after approval.',
      data: newComment
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get blog categories
// @route   GET /api/blog/categories
// @access  Public
router.get('/categories', async (req, res) => {
  try {
    const categories = await blogService.getCategories();

    const categoryNames = {
      'real-estate-tips': 'Real Estate Tips',
      'market-news': 'Market News',
      'investment-guides': 'Investment Guides',
      'property-showcase': 'Property Showcase',
      'legal-advice': 'Legal Advice',
      'home-improvement': 'Home Improvement',
      'neighborhood-spotlight': 'Neighborhood Spotlight',
      'buyer-guides': 'Buyer Guides',
      'seller-guides': 'Seller Guides',
      'rental-advice': 'Rental Advice',
      'mortgage-financing': 'Mortgage & Financing',
      'property-management': 'Property Management'
    };

    const formattedCategories = categories.map(cat => ({
      slug: cat.slug,
      name: categoryNames[cat.slug] || cat.slug,
      count: cat.count
    }));

    res.json({
      success: true,
      data: formattedCategories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get popular tags
// @route   GET /api/blog/tags
// @access  Public
router.get('/tags', async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const tags = await blogService.getPopularTags(parseInt(limit));

    res.json({
      success: true,
      data: tags
    });
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
