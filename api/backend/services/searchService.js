/**
 * Search Service - Advanced Search & Filtering for Real Estate Marketplace
 * Features: Full-text search, autocomplete, faceted filtering, search history
 */

const { errorLogger, infoLogger } = require('../config/logger');

class SearchService {
  // Mock database - Replace with actual DB queries
  static mockProperties = [
    {
      id: 1,
      title: 'Luxury 3-Bedroom Apartment in Downtown',
      description: 'Beautiful apartment with modern amenities and city views',
      type: 'apartment',
      location: 'Downtown',
      city: 'New York',
      state: 'NY',
      price: 450000,
      bedrooms: 3,
      bathrooms: 2,
      squareFeet: 2200,
      amenities: ['parking', 'gym', 'pool', 'doorman'],
      createdAt: new Date('2026-03-10'),
    },
    {
      id: 2,
      title: 'Cozy 2-Bedroom House with Backyard',
      description: 'Perfect starter home near schools and shopping',
      type: 'house',
      location: 'Residential Area',
      city: 'San Francisco',
      state: 'CA',
      price: 650000,
      bedrooms: 2,
      bathrooms: 1.5,
      squareFeet: 1500,
      amenities: ['backyard', 'garage', 'deck'],
      createdAt: new Date('2026-03-12'),
    },
    {
      id: 3,
      title: 'Modern Condo with Ocean View',
      description: 'Stunning waterfront property with premium finishes',
      type: 'condo',
      location: 'Waterfront',
      city: 'San Diego',
      state: 'CA',
      price: 1200000,
      bedrooms: 4,
      bathrooms: 3,
      squareFeet: 3500,
      amenities: ['ocean view', 'balcony', 'gym', 'pool', 'parking'],
      createdAt: new Date('2026-03-08'),
    },
    {
      id: 4,
      title: 'Victorian Manor on Historic Street',
      description: 'Classic architecture with modern updates',
      type: 'house',
      location: 'Historic District',
      city: 'Boston',
      state: 'MA',
      price: 850000,
      bedrooms: 5,
      bathrooms: 3,
      squareFeet: 4200,
      amenities: ['fireplace', 'hardwood floors', 'basement'],
      createdAt: new Date('2026-03-05'),
    },
    {
      id: 5,
      title: 'Studio Apartment Near Tech Hub',
      description: 'Compact and efficient living space',
      type: 'studio',
      location: 'Tech District',
      city: 'Austin',
      state: 'TX',
      price: 220000,
      bedrooms: 0,
      bathrooms: 1,
      squareFeet: 450,
      amenities: ['parking', 'wifi'],
      createdAt: new Date('2026-03-15'),
    },
  ];

  static mockSearchHistory = [];

  /**
   * Perform full-text search across properties
   * @param {string} query - Search query
   * @param {object} options - Search options (filters, pagination)
   * @returns {object} Search results with metadata
   */
  static async search(query, options = {}) {
    try {
      if (!query || query.trim().length === 0) {
        return {
          results: [],
          total: 0,
          query: '',
          filters: options.filters || {},
          sort: options.sort || 'relevance',
        };
      }

      const searchTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 0);
      const filters = options.filters || {};
      const sort = options.sort || 'relevance';
      const page = options.page || 1;
      const limit = options.limit || 20;
      const offset = (page - 1) * limit;

      // Full-text search scoring
      let results = this.mockProperties
        .map(prop => {
          let score = 0;

          // Title matching (highest weight)
          searchTerms.forEach(term => {
            if (prop.title.toLowerCase().includes(term)) {
              score += 10;
            }
          });

          // Description matching (medium weight)
          searchTerms.forEach(term => {
            if (prop.description.toLowerCase().includes(term)) {
              score += 5;
            }
          });

          // Location matching (medium weight)
          searchTerms.forEach(term => {
            if (
              prop.location.toLowerCase().includes(term) ||
              prop.city.toLowerCase().includes(term) ||
              prop.state.toLowerCase().includes(term)
            ) {
              score += 8;
            }
          });

          // Amenities matching (lower weight)
          searchTerms.forEach(term => {
            prop.amenities.forEach(amenity => {
              if (amenity.toLowerCase().includes(term)) {
                score += 3;
              }
            });
          });

          return {
            ...prop,
            relevanceScore: score,
          };
        })
        .filter(prop => prop.relevanceScore > 0);

      // Apply filters
      results = this._applyFilters(results, filters);

      // Apply sorting
      results = this._sortResults(results, sort);

      // Store search in history
      this._addToSearchHistory(query, filters, results.length);

      // Apply pagination
      const total = results.length;
      const paginatedResults = results.slice(offset, offset + limit);

      return {
        results: paginatedResults.map(prop => this._formatPropertyResult(prop)),
        total,
        page,
        pageSize: limit,
        totalPages: Math.ceil(total / limit),
        query,
        filters,
        sort,
        searchTime: `${Math.random() * 500}ms`,
      };
    } catch (error) {
      errorLogger('Search service error:', error);
      throw error;
    }
  }

  /**
   * Get autocomplete suggestions based on partial query
   * @param {string} query - Partial search query
   * @param {number} limit - Max suggestions to return
   * @returns {array} Autocomplete suggestions
   */
  static async getAutocomplete(query, limit = 10) {
    try {
      if (!query || query.trim().length === 0) {
        return { suggestions: [] };
      }

      const lowercaseQuery = query.toLowerCase();
      const suggestions = new Set();

      // Title suggestions
      this.mockProperties.forEach(prop => {
        if (prop.title.toLowerCase().startsWith(lowercaseQuery)) {
          suggestions.add(prop.title);
        }
      });

      // Location suggestions
      this.mockProperties.forEach(prop => {
        if (prop.city.toLowerCase().startsWith(lowercaseQuery)) {
          suggestions.add(`${prop.city}, ${prop.state}`);
        }
        if (prop.location.toLowerCase().startsWith(lowercaseQuery)) {
          suggestions.add(prop.location);
        }
      });

      // Bedroom/feature suggestions
      const patterns = [
        { pattern: /^(\d+)\s*bd/, label: 'bedrooms' },
        { pattern: /^(\d+)\s*ba/, label: 'bathrooms' },
        { pattern: /^apartment/, label: 'apartment' },
        { pattern: /^house/, label: 'house' },
        { pattern: /^condo/, label: 'condo' },
      ];

      patterns.forEach(({ pattern, label }) => {
        if (pattern.test(lowercaseQuery)) {
          suggestions.add(label);
        }
      });

      // Popular search terms (trending)
      const popularTerms = ['luxury apartment', '3 bedroom house', 'waterfront property'];
      popularTerms.forEach(term => {
        if (term.toLowerCase().startsWith(lowercaseQuery)) {
          suggestions.add(term);
        }
      });

      return {
        suggestions: Array.from(suggestions)
          .slice(0, limit)
          .map(s => ({
            text: s,
            type: this._getSuggestionType(s),
          })),
        query,
      };
    } catch (error) {
      errorLogger('Autocomplete error:', error);
      throw error;
    }
  }

  /**
   * Get available filter facets and their options
   * @param {object} currentFilters - Currently applied filters
   * @returns {object} Available facets
   */
  static async getFilterFacets(currentFilters = {}) {
    try {
      const facets = this._buildFacets(currentFilters);

      return {
        facets,
        filterableFields: [
          'type',
          'priceRange',
          'bedrooms',
          'bathrooms',
          'location',
          'amenities',
          'squareFeetRange',
        ],
        appliedFilters: currentFilters,
      };
    } catch (error) {
      errorLogger('Facets error:', error);
      throw error;
    }
  }

  /**
   * Advanced search with multiple filters and faceting
   * @param {object} criteria - Search criteria
   * @returns {object} Advanced search results
   */
  static async advancedSearch(criteria) {
    try {
      const {
        q = '',
        type = null,
        minPrice = null,
        maxPrice = null,
        minBedrooms = null,
        maxBedrooms = null,
        minBathrooms = null,
        maxBathrooms = null,
        location = null,
        amenities = [],
        minSquareFeet = null,
        maxSquareFeet = null,
        sort = 'relevance',
        page = 1,
        limit = 20,
      } = criteria;

      const filters = {
        type,
        minPrice,
        maxPrice,
        minBedrooms,
        maxBedrooms,
        minBathrooms,
        maxBathrooms,
        location,
        amenities,
        minSquareFeet,
        maxSquareFeet,
      };

      return this.search(q, { filters, sort, page, limit });
    } catch (error) {
      errorLogger('Advanced search error:', error);
      throw error;
    }
  }

  /**
   * Get user's search history
   * @param {string} userId - User ID
   * @param {number} limit - Max items to return
   * @returns {array} Search history
   */
  static async getSearchHistory(userId, limit = 10) {
    try {
      // In production, query from database filtered by userId
      const userHistory = this.mockSearchHistory.slice(-limit).reverse();

      return {
        history: userHistory.map(h => ({
          query: h.query,
          filters: h.filters,
          resultsCount: h.resultsCount,
          searchedAt: h.searchedAt,
        })),
        totalSearches: this.mockSearchHistory.length,
      };
    } catch (error) {
      errorLogger('Search history error:', error);
      throw error;
    }
  }

  /**
   * Get popular searches (trending)
   * @param {number} limit - Number of popular searches
   * @returns {array} Popular searches
   */
  static async getPopularSearches(limit = 10) {
    try {
      // Count occurrences of each search query
      const searchCounts = {};

      this.mockSearchHistory.forEach(item => {
        searchCounts[item.query] = (searchCounts[item.query] || 0) + 1;
      });

      const popular = Object.entries(searchCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([query, count]) => ({
          query,
          searchCount: count,
          trending: count > 5, // Mark trending if searched 5+ times
        }));

      return {
        popular,
        totalUniqueSearches: Object.keys(searchCounts).length,
      };
    } catch (error) {
      errorLogger('Popular searches error:', error);
      throw error;
    }
  }

  /**
   * Get search suggestions with filters
   * @param {string} query - Search query
   * @param {object} filters - Applied filters
   * @returns {object} Suggestions and refinements
   */
  static async getSearchSuggestions(query, filters = {}) {
    try {
      const searchResults = await this.search(query, { filters, limit: 100 });

      if (searchResults.total === 0) {
        // Return spell-check alternatives
        return {
          suggestions: this._getSpellCheckSuggestions(query),
          message: 'No results found. Did you mean:',
        };
      }

      // Return facet-based refinements
      const refinements = this._getSearchRefinements(searchResults.results, filters);

      return {
        suggestions: refinements,
        resultsFound: searchResults.total,
        message: `${searchResults.total} results found. Refine your search:`,
      };
    } catch (error) {
      errorLogger('Search suggestions error:', error);
      throw error;
    }
  }

  // ===== PRIVATE HELPER METHODS =====

  /**
   * Apply filters to search results
   * @private
   */
  static _applyFilters(results, filters) {
    let filtered = [...results];

    if (filters.type) {
      filtered = filtered.filter(p => p.type === filters.type);
    }

    if (filters.minPrice !== null) {
      filtered = filtered.filter(p => p.price >= filters.minPrice);
    }

    if (filters.maxPrice !== null) {
      filtered = filtered.filter(p => p.price <= filters.maxPrice);
    }

    if (filters.minBedrooms !== null) {
      filtered = filtered.filter(p => p.bedrooms >= filters.minBedrooms);
    }

    if (filters.maxBedrooms !== null) {
      filtered = filtered.filter(p => p.bedrooms <= filters.maxBedrooms);
    }

    if (filters.minBathrooms !== null) {
      filtered = filtered.filter(p => p.bathrooms >= filters.minBathrooms);
    }

    if (filters.maxBathrooms !== null) {
      filtered = filtered.filter(p => p.bathrooms <= filters.maxBathrooms);
    }

    if (filters.location) {
      const loc = filters.location.toLowerCase();
      filtered = filtered.filter(
        p =>
          p.location.toLowerCase().includes(loc) ||
          p.city.toLowerCase().includes(loc) ||
          p.state.toLowerCase().includes(loc)
      );
    }

    if (filters.amenities && filters.amenities.length > 0) {
      filtered = filtered.filter(p =>
        filters.amenities.some(a => p.amenities.map(am => am.toLowerCase()).includes(a.toLowerCase()))
      );
    }

    if (filters.minSquareFeet !== null) {
      filtered = filtered.filter(p => p.squareFeet >= filters.minSquareFeet);
    }

    if (filters.maxSquareFeet !== null) {
      filtered = filtered.filter(p => p.squareFeet <= filters.maxSquareFeet);
    }

    return filtered;
  }

  /**
   * Sort results based on criteria
   * @private
   */
  static _sortResults(results, sort) {
    const sorted = [...results];

    switch (sort) {
      case 'relevance':
        return sorted.sort((a, b) => b.relevanceScore - a.relevanceScore);
      case 'price-asc':
        return sorted.sort((a, b) => a.price - b.price);
      case 'price-desc':
        return sorted.sort((a, b) => b.price - a.price);
      case 'newest':
        return sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      case 'oldest':
        return sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      case 'bedrooms':
        return sorted.sort((a, b) => b.bedrooms - a.bedrooms);
      default:
        return sorted;
    }
  }

  /**
   * Add search to user history
   * @private
   */
  static _addToSearchHistory(query, filters, resultsCount) {
    this.mockSearchHistory.push({
      query,
      filters,
      resultsCount,
      searchedAt: new Date(),
    });

    // Keep only last 100 searches
    if (this.mockSearchHistory.length > 100) {
      this.mockSearchHistory.shift();
    }
  }

  /**
   * Format property result with minimal data
   * @private
   */
  static _formatPropertyResult(prop) {
    return {
      id: prop.id,
      title: prop.title,
      description: prop.description,
      type: prop.type,
      location: prop.location,
      city: prop.city,
      state: prop.state,
      price: prop.price,
      bedrooms: prop.bedrooms,
      bathrooms: prop.bathrooms,
      squareFeet: prop.squareFeet,
      mainAmenities: prop.amenities.slice(0, 3),
      relevanceScore: Math.round(prop.relevanceScore),
    };
  }

  /**
   * Build available facets
   * @private
   */
  static _buildFacets(currentFilters) {
    const types = [...new Set(this.mockProperties.map(p => p.type))];
    const locations = [...new Set(this.mockProperties.map(p => p.city))];
    const allAmenities = [...new Set(this.mockProperties.flatMap(p => p.amenities))];

    const prices = this.mockProperties.map(p => p.price).sort((a, b) => a - b);
    const bedrooms = [...new Set(this.mockProperties.map(p => p.bedrooms))].sort((a, b) => a - b);

    return {
      propertyType: types.map(t => ({ value: t, label: this._capitalize(t), count: this.mockProperties.filter(p => p.type === t).length })),
      priceRange: {
        min: Math.min(...prices),
        max: Math.max(...prices),
        currentMin: currentFilters.minPrice,
        currentMax: currentFilters.maxPrice,
      },
      bedroomRange: bedrooms.map(b => ({
        value: b,
        label: `${b} bedroom${b === 1 ? '' : 's'}`,
        count: this.mockProperties.filter(p => p.bedrooms === b).length,
      })),
      locations: locations.map(l => ({
        value: l,
        label: l,
        count: this.mockProperties.filter(p => p.city === l).length,
      })),
      amenities: allAmenities.map(a => ({
        value: a,
        label: this._capitalize(a),
        count: this.mockProperties.filter(p => p.amenities.includes(a)).length,
      })),
    };
  }

  /**
   * Get suggestion type
   * @private
   */
  static _getSuggestionType(suggestion) {
    if (suggestion.includes('bedroom') || /^\d+\s*bd/.test(suggestion)) return 'bedrooms';
    if (['apartment', 'house', 'condo', 'studio'].some(t => suggestion.includes(t))) return 'type';
    if ([','].some(c => suggestion.includes(c))) return 'location';
    return 'general';
  }

  /**
   * Get spell-check suggestions
   * @private
   */
  static _getSpellCheckSuggestions(query) {
    // Simple spell-check using similar searches
    const similar = this.mockSearchHistory.filter(h =>
      this._calculateSimilarity(h.query, query) > 0.6
    );

    return similar.slice(0, 3).map(h => ({
      text: h.query,
      type: 'did-you-mean',
    }));
  }

  /**
   * Calculate string similarity (Levenshtein distance)
   * @private
   */
  static _calculateSimilarity(str1, str2) {
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;

    if (longer.length === 0) return 1.0;

    const dist = this._levenshteinDistance(longer, shorter);
    return (longer.length - dist) / longer.length;
  }

  /**
   * Calculate Levenshtein distance between strings
   * @private
   */
  static _levenshteinDistance(s1, s2) {
    const costs = [];

    for (let i = 0; i <= s1.length; i++) {
      let lastValue = i;
      for (let j = 0; j <= s2.length; j++) {
        if (i === 0) {
          costs[j] = j;
        } else if (j > 0) {
          let newValue = costs[j - 1];
          if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
            newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
          }
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
      if (i > 0) costs[s2.length] = lastValue;
    }

    return costs[s2.length];
  }

  /**
   * Get search refinements based on results
   * @private
   */
  static _getSearchRefinements(results, appliedFilters) {
    if (results.length === 0) return [];

    // Suggest additional filters based on results
    const refinements = [];

    // If many results, suggest narrowing by price
    if (results.length > 50) {
      const prices = results.map(r => r.price).sort((a, b) => a - b);
      refinements.push({
        field: 'priceRange',
        suggestion: `Narrow by price range (${this._formatPrice(prices[0])} - ${this._formatPrice(prices[prices.length - 1])})`,
        type: 'price',
      });
    }

    // Suggest filtering by property type
    const types = new Set(results.map(r => r.type));
    if (types.size > 1) {
      refinements.push({
        field: 'type',
        suggestion: `Filter by property type: ${Array.from(types).join(', ')}`,
        type: 'type',
      });
    }

    return refinements;
  }

  /**
   * Capitalize string
   * @private
   */
  static _capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Format price as currency
   * @private
   */
  static _formatPrice(price) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
  }
}

module.exports = SearchService;
