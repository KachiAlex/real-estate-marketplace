const express = require('express');
const router = express.Router();
const Blog = require('../models/Blog');
const User = require('../models/User');
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

// @desc    Get all published blogs
// @route   GET /api/blog
// @access  Public
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('category').optional().isString(),
  query('tag').optional().isString(),
  query('search').optional().isString(),
  query('sort').optional().isIn(['newest', 'oldest', 'popular', 'trending']),
  validate
], async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      tag,
      search,
      sort = 'newest'
    } = req.query;

    // Build filter object
    const filter = {
      status: 'published',
      publishedAt: { $lte: new Date() }
    };

    if (category) {
      filter.category = category;
    }

    if (tag) {
      filter.tags = { $in: [tag.toLowerCase()] };
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Build sort object
    let sortObj = {};
    switch (sort) {
      case 'oldest':
        sortObj = { publishedAt: 1 };
        break;
      case 'popular':
        sortObj = { views: -1, publishedAt: -1 };
        break;
      case 'trending':
        sortObj = { likes: -1, shares: -1, views: -1 };
        break;
      default:
        sortObj = { publishedAt: -1 };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const blogs = await Blog.find(filter)
      .populate('author.id', 'firstName lastName avatar')
      .select('-content') // Exclude full content for list view
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Blog.countDocuments(filter);
    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      data: blogs,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching blogs:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @desc    Get featured blogs
// @route   GET /api/blog/featured
// @access  Public
router.get('/featured', async (req, res) => {
  try {
    const { limit = 5 } = req.query;

    const blogs = await Blog.getFeatured()
      .populate('author.id', 'firstName lastName avatar')
      .select('-content')
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: blogs
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
  validate
], async (req, res) => {
  try {
    const blog = await Blog.findOne({
      slug: req.params.slug,
      status: 'published',
      publishedAt: { $lte: new Date() }
    })
    .populate('author.id', 'firstName lastName avatar bio')
    .populate('relatedProperties', 'title price images location')
    .populate('relatedPosts', 'title slug excerpt featuredImage publishedAt');

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }

    // Increment views
    await blog.incrementViews();

    res.json({
      success: true,
      data: blog
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
  validate
], async (req, res) => {
  try {
    const { limit = 4 } = req.query;

    // First get the current blog to find related posts
    const currentBlog = await Blog.findOne({
      slug: req.params.slug,
      status: 'published'
    });

    if (!currentBlog) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }

    // Find related blogs by category and tags
    const relatedBlogs = await Blog.find({
      _id: { $ne: currentBlog._id },
      status: 'published',
      publishedAt: { $lte: new Date() },
      $or: [
        { category: currentBlog.category },
        { tags: { $in: currentBlog.tags } }
      ]
    })
    .populate('author.id', 'firstName lastName avatar')
    .select('-content')
    .sort({ publishedAt: -1 })
    .limit(parseInt(limit));

    res.json({
      success: true,
      data: relatedBlogs
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
    const blog = await Blog.findOne({
      slug: req.params.slug,
      status: 'published'
    });

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }

    await blog.addLike();

    res.json({
      success: true,
      message: 'Blog post liked successfully',
      likes: blog.likes + 1
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
    const blog = await Blog.findOne({
      slug: req.params.slug,
      status: 'published'
    });

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: 'Blog post not found'
      });
    }

    await blog.addShare();

    res.json({
      success: true,
      message: 'Blog post shared successfully',
      shares: blog.shares + 1
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
  validate
], async (req, res) => {
  try {
    const blog = await Blog.findOne({
      slug: req.params.slug,
      status: 'published'
    });

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

    blog.comments.push(comment);
    await blog.save();

    res.json({
      success: true,
      message: 'Comment added successfully. It will be visible after approval.',
      data: blog.comments[blog.comments.length - 1]
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
    const categories = await Blog.aggregate([
      { $match: { status: 'published' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

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
      slug: cat._id,
      name: categoryNames[cat._id] || cat._id,
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

    const tags = await Blog.aggregate([
      { $match: { status: 'published' } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: parseInt(limit) }
    ]);

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
