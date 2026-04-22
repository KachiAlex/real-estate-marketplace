/**
 * Reviews & Ratings Service - Property Reviews, Ratings, and Verification
 * Handles review creation, moderation, rating calculations, and verified purchase badges
 */

const { errorLogger, infoLogger } = require('../config/logger');

class ReviewService {
  // Mock storage using Map objects
  static reviews = new Map(); // conversationId: [reviews...]
  static propertyRatings = new Map(); // propertyId: { avgRating, totalReviews, ...}
  static userReviews = new Map(); // userId: [reviews...]
  static flaggedReviews = new Map(); // reviewId: flagCount
  static purchaseVerification = new Map(); // userId_propertyId: true/false
  static reviewReplies = new Map(); // reviewId: [replies...]

  /**
   * Create a new review with rating
   * @param {string} propertyId - Property being reviewed
   * @param {string} userId - User submitting review
   * @param {object} reviewData - Review content and rating
   * @returns {object} { success, data }
   */
  static async createReview(propertyId, userId, reviewData) {
    try {
      const { rating = 5, title = '', content = '', verifiedPurchase = false, media = [] } = reviewData;

      // Validate rating between 1-5
      if (rating < 1 || rating > 5) {
        throw new Error('Rating must be between 1 and 5');
      }

      // Validate content
      if (!content || content.trim().length < 10) {
        throw new Error('Review content must be at least 10 characters');
      }

      // Prevent duplicate reviews per user per property
      const existingReview = this._getUserPropertyReview(propertyId, userId);
      if (existingReview) {
        throw new Error('You have already reviewed this property');
      }

      const reviewId = `rev_${propertyId}_${userId}_${Date.now()}`;
      const review = {
        id: reviewId,
        propertyId,
        userId,
        rating: Math.round(rating),
        title: title.substring(0, 100),
        content: content.substring(0, 5000),
        verifiedPurchase,
        media: media.slice(0, 5), // Limit to 5 images
        helpfulCount: 0,
        unhelpfulCount: 0,
        flagCount: 0,
        replies: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isModerated: false,
        isFeatured: false,
      };

      // Store review
      const propertyReviews = this.reviews.get(propertyId) || [];
      propertyReviews.push(review);
      this.reviews.set(propertyId, propertyReviews);

      // Track in user reviews
      const userRevs = this.userReviews.get(userId) || [];
      userRevs.push(reviewId);
      this.userReviews.set(userId, userRevs);

      // Update property rating
      this._updatePropertyRating(propertyId);

      infoLogger(`Review created: ${reviewId} by user ${userId} for property ${propertyId}`);

      return {
        success: true,
        data: this._formatReview(review),
      };
    } catch (error) {
      errorLogger('Create review error:', error);
      throw error;
    }
  }

  /**
   * Get reviews for a property
   * @param {string} propertyId - Property ID
   * @param {object} options - Filter options
   * @returns {object} { success, data }
   */
  static async getPropertyReviews(propertyId, options = {}) {
    try {
      const { limit = 20, offset = 0, sortBy = 'recent', ratingFilter = null } = options;

      let reviews = this.reviews.get(propertyId) || [];

      // Filter by rating if specified
      if (ratingFilter) {
        reviews = reviews.filter(r => r.rating === parseInt(ratingFilter));
      }

      // Sort reviews
      if (sortBy === 'helpful') {
        reviews.sort((a, b) => b.helpfulCount - a.helpfulCount);
      } else if (sortBy === 'highest') {
        reviews.sort((a, b) => b.rating - a.rating);
      } else if (sortBy === 'lowest') {
        reviews.sort((a, b) => a.rating - b.rating);
      } else {
        // 'recent' - default
        reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }

      // Paginate
      const total = reviews.length;
      const paginatedReviews = reviews.slice(offset, offset + limit);

      return {
        success: true,
        data: {
          reviews: paginatedReviews.map(r => this._formatReview(r)),
          total,
          limit,
          offset,
        },
      };
    } catch (error) {
      errorLogger('Get property reviews error:', error);
      throw error;
    }
  }

  /**
   * Get reviews by a specific user
   * @param {string} userId - User ID
   * @param {object} options - Filter options
   * @returns {object} { success, data }
   */
  static async getUserReviews(userId, options = {}) {
    try {
      const { limit = 10, offset = 0 } = options;

      const reviewIds = this.userReviews.get(userId) || [];
      const reviews = [];

      for (const reviewId of reviewIds) {
        const review = this._getReviewById(reviewId);
        if (review) reviews.push(review);
      }

      // Sort by recent
      reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      const total = reviews.length;
      const paginatedReviews = reviews.slice(offset, offset + limit);

      return {
        success: true,
        data: {
          reviews: paginatedReviews.map(r => this._formatReview(r)),
          total,
          limit,
          offset,
        },
      };
    } catch (error) {
      errorLogger('Get user reviews error:', error);
      throw error;
    }
  }

  /**
   * Get rating summary for a property
   * @param {string} propertyId - Property ID
   * @returns {object} { success, data }
   */
  static async getPropertyRating(propertyId) {
    try {
      let rating = this.propertyRatings.get(propertyId);

      if (!rating) {
        // Recalculate from reviews
        this._updatePropertyRating(propertyId);
        rating = this.propertyRatings.get(propertyId);
      }

      if (!rating) {
        // No reviews yet
        rating = {
          propertyId,
          averageRating: 0,
          totalReviews: 0,
          ratingBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
          verifiedPurchaseCount: 0,
          recommendationPercentage: 0,
        };
      }

      return {
        success: true,
        data: rating,
      };
    } catch (error) {
      errorLogger('Get property rating error:', error);
      throw error;
    }
  }

  /**
   * Update a review
   * @param {string} propertyId - Property ID
   * @param {string} reviewId - Review ID
   * @param {string} userId - User ID
   * @param {object} updateData - Data to update
   * @returns {object} { success, data }
   */
  static async updateReview(propertyId, reviewId, userId, updateData) {
    try {
      const reviews = this.reviews.get(propertyId) || [];
      const reviewIndex = reviews.findIndex(r => r.id === reviewId);

      if (reviewIndex === -1) {
        throw new Error('Review not found');
      }

      const review = reviews[reviewIndex];

      // Only review author can edit
      if (review.userId !== userId) {
        throw new Error('Only review author can edit this review');
      }

      const { rating, title, content } = updateData;

      // Update fields if provided
      if (rating !== undefined) {
        if (rating < 1 || rating > 5) {
          throw new Error('Rating must be between 1 and 5');
        }
        review.rating = Math.round(rating);
      }

      if (title !== undefined) {
        review.title = title.substring(0, 100);
      }

      if (content !== undefined) {
        if (!content || content.trim().length < 10) {
          throw new Error('Review content must be at least 10 characters');
        }
        review.content = content.substring(0, 5000);
      }

      review.updatedAt = new Date().toISOString();
      reviews[reviewIndex] = review;
      this.reviews.set(propertyId, reviews);

      // Recalculate property rating
      this._updatePropertyRating(propertyId);

      infoLogger(`Review ${reviewId} updated by user ${userId}`);

      return {
        success: true,
        data: this._formatReview(review),
      };
    } catch (error) {
      errorLogger('Update review error:', error);
      throw error;
    }
  }

  /**
   * Delete a review
   * @param {string} propertyId - Property ID
   * @param {string} reviewId - Review ID
   * @param {string} userId - User ID
   * @returns {object} { success }
   */
  static async deleteReview(propertyId, reviewId, userId) {
    try {
      const reviews = this.reviews.get(propertyId) || [];
      const reviewIndex = reviews.findIndex(r => r.id === reviewId);

      if (reviewIndex === -1) {
        throw new Error('Review not found');
      }

      const review = reviews[reviewIndex];

      // Only review author or admin can delete
      if (review.userId !== userId) {
        throw new Error('Only review author can delete this review');
      }

      // Soft delete
      reviews[reviewIndex].content = '[Deleted]';
      reviews[reviewIndex].isDeleted = true;
      reviews[reviewIndex].deletedAt = new Date().toISOString();
      reviews[reviewIndex].updatedAt = new Date().toISOString();

      this.reviews.set(propertyId, reviews);

      // Remove from user reviews
      const userRevs = this.userReviews.get(userId) || [];
      const idx = userRevs.indexOf(reviewId);
      if (idx > -1) {
        userRevs.splice(idx, 1);
        this.userReviews.set(userId, userRevs);
      }

      // Recalculate property rating
      this._updatePropertyRating(propertyId);

      infoLogger(`Review ${reviewId} deleted by user ${userId}`);

      return { success: true };
    } catch (error) {
      errorLogger('Delete review error:', error);
      throw error;
    }
  }

  /**
   * Mark review as helpful
   * @param {string} propertyId - Property ID
   * @param {string} reviewId - Review ID
   * @returns {object} { success, data }
   */
  static async markHelpful(propertyId, reviewId) {
    try {
      const reviews = this.reviews.get(propertyId) || [];
      const review = reviews.find(r => r.id === reviewId);

      if (!review) {
        throw new Error('Review not found');
      }

      review.helpfulCount += 1;
      review.updatedAt = new Date().toISOString();

      this.reviews.set(propertyId, reviews);

      infoLogger(`Review ${reviewId} marked as helpful`);

      return {
        success: true,
        data: {
          reviewId,
          helpfulCount: review.helpfulCount,
          unhelpfulCount: review.unhelpfulCount,
        },
      };
    } catch (error) {
      errorLogger('Mark helpful error:', error);
      throw error;
    }
  }

  /**
   * Mark review as unhelpful
   * @param {string} propertyId - Property ID
   * @param {string} reviewId - Review ID
   * @returns {object} { success, data }
   */
  static async markUnhelpful(propertyId, reviewId) {
    try {
      const reviews = this.reviews.get(propertyId) || [];
      const review = reviews.find(r => r.id === reviewId);

      if (!review) {
        throw new Error('Review not found');
      }

      review.unhelpfulCount += 1;
      review.updatedAt = new Date().toISOString();

      this.reviews.set(propertyId, reviews);

      infoLogger(`Review ${reviewId} marked as unhelpful`);

      return {
        success: true,
        data: {
          reviewId,
          helpfulCount: review.helpfulCount,
          unhelpfulCount: review.unhelpfulCount,
        },
      };
    } catch (error) {
      errorLogger('Mark unhelpful error:', error);
      throw error;
    }
  }

  /**
   * Flag review as inappropriate
   * @param {string} propertyId - Property ID
   * @param {string} reviewId - Review ID
   * @param {string} reason - Reason for flag
   * @returns {object} { success, data }
   */
  static async flagReview(propertyId, reviewId, reason) {
    try {
      const reviews = this.reviews.get(propertyId) || [];
      const review = reviews.find(r => r.id === reviewId);

      if (!review) {
        throw new Error('Review not found');
      }

      // Increment flag count
      review.flagCount = (review.flagCount || 0) + 1;
      this.flaggedReviews.set(reviewId, (this.flaggedReviews.get(reviewId) || 0) + 1);

      // Auto-moderate if flagged too many times
      if (review.flagCount >= 3) {
        review.isModerated = true;
        review.moderationReason = 'Multiple user flags';
      }

      review.updatedAt = new Date().toISOString();
      this.reviews.set(propertyId, reviews);

      infoLogger(`Review ${reviewId} flagged for: ${reason}`);

      return {
        success: true,
        data: {
          reviewId,
          flagCount: review.flagCount,
          isModerated: review.isModerated,
        },
      };
    } catch (error) {
      errorLogger('Flag review error:', error);
      throw error;
    }
  }

  /**
   * Add reply to review (vendor response)
   * @param {string} propertyId - Property ID
   * @param {string} reviewId - Review ID
   * @param {string} vendorId - Vendor ID
   * @param {string} replyText - Reply content
   * @returns {object} { success, data }
   */
  static async addReply(propertyId, reviewId, vendorId, replyText) {
    try {
      const reviews = this.reviews.get(propertyId) || [];
      const review = reviews.find(r => r.id === reviewId);

      if (!review) {
        throw new Error('Review not found');
      }

      if (!replyText || replyText.trim().length < 5) {
        throw new Error('Reply must be at least 5 characters');
      }

      const reply = {
        id: `reply_${reviewId}_${vendorId}_${Date.now()}`,
        vendorId,
        text: replyText.substring(0, 1000),
        createdAt: new Date().toISOString(),
      };

      review.replies = review.replies || [];
      review.replies.push(reply);
      review.updatedAt = new Date().toISOString();

      this.reviews.set(propertyId, reviews);

      infoLogger(`Reply added to review ${reviewId} by vendor ${vendorId}`);

      return {
        success: true,
        data: {
          reviewId,
          reply,
          totalReplies: review.replies.length,
        },
      };
    } catch (error) {
      errorLogger('Add reply error:', error);
      throw error;
    }
  }

  /**
   * Get verified purchase badge status
   * @param {string} userId - User ID
   * @param {string} propertyId - Property ID
   * @returns {object} { success, data }
   */
  static async getVerifiedPurchaseBadge(userId, propertyId) {
    try {
      // In production, verify against payment/transaction records
      const key = `${userId}_${propertyId}`;
      const isVerified = this.purchaseVerification.get(key) || false;

      return {
        success: true,
        data: {
          userId,
          propertyId,
          isVerified,
          badge: isVerified ? '✓ Verified Purchase' : null,
        },
      };
    } catch (error) {
      errorLogger('Get verified purchase badge error:', error);
      throw error;
    }
  }

  /**
   * Set verified purchase status
   * @param {string} userId - User ID
   * @param {string} propertyId - Property ID
   * @param {boolean} verified - Verification status
   * @returns {object} { success }
   */
  static async setVerifiedPurchase(userId, propertyId, verified) {
    try {
      const key = `${userId}_${propertyId}`;
      this.purchaseVerification.set(key, verified === true);

      return { success: true };
    } catch (error) {
      errorLogger('Set verified purchase error:', error);
      throw error;
    }
  }

  /**
   * Get trending reviews across properties
   * @param {object} options - Filter options
   * @returns {object} { success, data }
   */
  static async getTrendingReviews(options = {}) {
    try {
      const { limit = 10, minRating = 4 } = options;

      const allReviews = [];
      for (const reviews of this.reviews.values()) {
        allReviews.push(...reviews);
      }

      // Filter by minimum rating
      let filtered = allReviews.filter(r => r.rating >= minRating && !r.isDeleted);

      // Sort by helpful count, then recent
      filtered.sort((a, b) => {
        if (b.helpfulCount !== a.helpfulCount) {
          return b.helpfulCount - a.helpfulCount;
        }
        return new Date(b.createdAt) - new Date(a.createdAt);
      });

      const trending = filtered.slice(0, limit);

      return {
        success: true,
        data: {
          reviews: trending.map(r => this._formatReview(r)),
          total: trending.length,
        },
      };
    } catch (error) {
      errorLogger('Get trending reviews error:', error);
      throw error;
    }
  }

  // ==================== PRIVATE HELPERS ====================

  /**
   * Get review by ID across all properties
   * @private
   */
  static _getReviewById(reviewId) {
    for (const reviews of this.reviews.values()) {
      const review = reviews.find(r => r.id === reviewId);
      if (review) return review;
    }
    return null;
  }

  /**
   * Get user's review for specific property
   * @private
   */
  static _getUserPropertyReview(propertyId, userId) {
    const reviews = this.reviews.get(propertyId) || [];
    return reviews.find(r => r.userId === userId && !r.isDeleted);
  }

  /**
   * Update property rating calculations
   * @private
   */
  static _updatePropertyRating(propertyId) {
    const reviews = this.reviews.get(propertyId) || [];

    // Only count non-deleted reviews
    const activeReviews = reviews.filter(r => !r.isDeleted);

    if (activeReviews.length === 0) {
      this.propertyRatings.delete(propertyId);
      return;
    }

    const ratingBreakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let totalRating = 0;
    let verifiedCount = 0;

    activeReviews.forEach((review) => {
      totalRating += review.rating;
      ratingBreakdown[review.rating]++;
      if (review.verifiedPurchase) verifiedCount++;
    });

    const averageRating = parseFloat((totalRating / activeReviews.length).toFixed(2));
    const recommendationPercentage = Math.round(
      ((ratingBreakdown[5] + ratingBreakdown[4]) / activeReviews.length) * 100
    );

    const rating = {
      propertyId,
      averageRating,
      totalReviews: activeReviews.length,
      ratingBreakdown,
      verifiedPurchaseCount: verifiedCount,
      recommendationPercentage,
      lastUpdated: new Date().toISOString(),
    };

    this.propertyRatings.set(propertyId, rating);
  }

  /**
   * Format review for API response
   * @private
   */
  static _formatReview(review) {
    return {
      id: review.id,

      propertyId: review.propertyId,
      userId: review.userId,
      rating: review.rating,
      title: review.title,
      content: review.content,
      verifiedPurchase: review.verifiedPurchase,
      media: review.media || [],
      helpfulCount: review.helpfulCount,
      unhelpfulCount: review.unhelpfulCount,
      flagCount: review.flagCount,
      replies: review.replies || [],
      isModerated: review.isModerated,
      isFeatured: review.isFeatured,
      isDeleted: review.isDeleted || false,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
    };
  }
}

module.exports = ReviewService;
