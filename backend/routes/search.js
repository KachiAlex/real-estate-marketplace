/**
 * Search Routes - Advanced Search & Filtering API
 * Endpoints for searching properties with full-text search, filters, and suggestions
 */

const express = require('express');
const router = express.Router();
const SearchService = require('../services/searchService');
const { protect } = require('../middleware/auth');
const { errorLogger, infoLogger } = require('../config/logger');

/**
 * @route   GET /api/search
 * @desc    Perform basic full-text search with optional filters
 * @access  Public
 * @params  q (query), filters (JSON), sort, page, limit
 */
router.get('/', async (req, res) => {
  try {
    const { q = '', sort = 'relevance', page = 1, limit = 20 } = req.query;

    // Parse filters from query parameters
    const filters = {
      type: req.query.type || null,
      minPrice: req.query.minPrice ? parseInt(req.query.minPrice) : null,
      maxPrice: req.query.maxPrice ? parseInt(req.query.maxPrice) : null,
      minBedrooms: req.query.minBedrooms ? parseInt(req.query.minBedrooms) : null,
      maxBedrooms: req.query.maxBedrooms ? parseInt(req.query.maxBedrooms) : null,
      minBathrooms: req.query.minBathrooms ? parseFloat(req.query.minBathrooms) : null,
      maxBathrooms: req.query.maxBathrooms ? parseFloat(req.query.maxBathrooms) : null,
      location: req.query.location || null,
      amenities: req.query.amenities ? (Array.isArray(req.query.amenities) ? req.query.amenities : [req.query.amenities]) : [],
      minSquareFeet: req.query.minSquareFeet ? parseInt(req.query.minSquareFeet) : null,
      maxSquareFeet: req.query.maxSquareFeet ? parseInt(req.query.maxSquareFeet) : null,
    };

    // Validate pagination
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));

    // Log search
    infoLogger(`Search performed: query="${q}", filters=${JSON.stringify(filters)}, page=${pageNum}`);

    // Perform search
    const results = await SearchService.search(q, {
      filters,
      sort,
      page: pageNum,
      limit: limitNum,
    });

    res.json({
      success: true,
      data: results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    errorLogger('Search endpoint error:', error);
    res.status(500).json({
      success: false,
      message: 'Search failed',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/search/advanced
 * @desc    Advanced search with detailed filters
 * @access  Public
 * @body    {q, type, minPrice, maxPrice, minBedrooms, maxBedrooms, etc.}
 */
router.get('/advanced', async (req, res) => {
  try {
    const criteria = {
      q: req.query.q || '',
      type: req.query.type || null,
      minPrice: req.query.minPrice ? parseInt(req.query.minPrice) : null,
      maxPrice: req.query.maxPrice ? parseInt(req.query.maxPrice) : null,
      minBedrooms: req.query.minBedrooms ? parseInt(req.query.minBedrooms) : null,
      maxBedrooms: req.query.maxBedrooms ? parseInt(req.query.maxBedrooms) : null,
      minBathrooms: req.query.minBathrooms ? parseFloat(req.query.minBathrooms) : null,
      maxBathrooms: req.query.maxBathrooms ? parseFloat(req.query.maxBathrooms) : null,
      location: req.query.location || null,
      amenities: req.query.amenities ? (Array.isArray(req.query.amenities) ? req.query.amenities : [req.query.amenities]) : [],
      minSquareFeet: req.query.minSquareFeet ? parseInt(req.query.minSquareFeet) : null,
      maxSquareFeet: req.query.maxSquareFeet ? parseInt(req.query.maxSquareFeet) : null,
      sort: req.query.sort || 'relevance',
      page: Math.max(1, parseInt(req.query.page) || 1),
      limit: Math.min(100, Math.max(1, parseInt(req.query.limit) || 20)),
    };

    infoLogger(`Advanced search: ${JSON.stringify(criteria)}`);

    const results = await SearchService.advancedSearch(criteria);

    res.json({
      success: true,
      data: results,
      appliedCriteria: criteria,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    errorLogger('Advanced search error:', error);
    res.status(500).json({
      success: false,
      message: 'Advanced search failed',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/search/autocomplete
 * @desc    Get autocomplete suggestions for search query
 * @access  Public
 * @params  q (partial query), limit
 */
router.get('/autocomplete', async (req, res) => {
  try {
    const { q = '', limit = 10 } = req.query;

    if (!q || q.length < 2) {
      return res.json({
        success: true,
        data: {
          suggestions: [],
          message: 'Enter at least 2 characters',
        },
      });
    }

    const suggestions = await SearchService.getAutocomplete(q, Math.min(limit, 50));

    res.json({
      success: true,
      data: suggestions,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    errorLogger('Autocomplete error:', error);
    res.status(500).json({
      success: false,
      message: 'Autocomplete failed',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/search/facets
 * @desc    Get available filter facets and their options
 * @access  Public
 * @params  filters (optional, applied filters as JSON)
 */
router.get('/facets', async (req, res) => {
  try {
    // Parse current filters if provided
    const currentFilters = req.query.filters ? JSON.parse(req.query.filters) : {};

    const facets = await SearchService.getFilterFacets(currentFilters);

    res.json({
      success: true,
      data: facets,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    errorLogger('Facets error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch filter facets',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/search/suggestions
 * @desc    Get search suggestions and refinements
 * @access  Public
 * @params  q (query), filters (optional)
 */
router.get('/suggestions', async (req, res) => {
  try {
    const { q = '' } = req.query;
    const filters = req.query.filters ? JSON.parse(req.query.filters) : {};

    if (!q) {
      return res.json({
        success: true,
        data: {
          suggestions: [],
          message: 'Enter a search query',
        },
      });
    }

    const suggestions = await SearchService.getSearchSuggestions(q, filters);

    res.json({
      success: true,
      data: suggestions,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    errorLogger('Suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get suggestions',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/search/history
 * @desc    Get user's search history (requires authentication)
 * @access  Private
 */
router.get('/history', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);

    const history = await SearchService.getSearchHistory(userId, limit);

    res.json({
      success: true,
      data: history,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    errorLogger('Search history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch search history',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/search/popular
 * @desc    Get popular/trending searches
 * @access  Public
 * @params  limit
 */
router.get('/popular', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);

    const popular = await SearchService.getPopularSearches(limit);

    res.json({
      success: true,
      data: popular,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    errorLogger('Popular searches error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch popular searches',
      error: error.message,
    });
  }
});

module.exports = router;
