# Reviews & Ratings API Documentation

**Phase 4.5: Advanced Reviews & Ratings System with Verification & Moderation**

---

## Table of Contents

1. [Overview](#overview)
2. [Base URL & Authentication](#base-url--authentication)
3. [Data Models](#data-models)
4. [API Endpoints](#api-endpoints)
5. [Features](#features)
6. [Review Moderation](#review-moderation)
7. [Verified Purchase System](#verified-purchase-system)
8. [Error Handling](#error-handling)
9. [React Integration Examples](#react-integration-examples)
10. [Best Practices](#best-practices)
11. [Rate Limiting](#rate-limiting)

---

## Overview

The Reviews & Ratings API provides a comprehensive review management system with support for property ratings, review moderation, verified purchase badges, vendor responses, and review analytics. All reviews are moderated and support helpful/unhelpful voting.

**Key Features:**
- ✅ 5-star rating system with detailed breakdowns
- ✅ Verified purchase badge for purchasers
- ✅ Review moderation with auto-flagging
- ✅ Vendor replies to reviews
- ✅ Helpful/unhelpful voting
- ✅ Review search and trending
- ✅ Duplicate review prevention
- ✅ Rich media support (images, videos)
- ✅ Comprehensive rating analytics
- ✅ Review history and edit tracking

---

## Base URL & Authentication

**Base URL:**
```
https://api.propertyark.com/api/reviews
```

**Authentication:**
Most endpoints require a valid JWT token in the `Authorization` header:

```
Authorization: Bearer <JWT_TOKEN>
```

**Endpoints without authentication:**
Public endpoints include reading reviews, ratings, and trending reviews.

---

## Data Models

### Review Object

```json
{
  "id": "rev_prop_123_user_456_1704067200000",
  "propertyId": "prop_123",
  "userId": "user_456",
  "rating": 4,
  "title": "Great property, excellent neighborhood",
  "content": "This property exceeded my expectations. The neighborhood is quiet and safe. Highly recommend for families.",
  "verifiedPurchase": true,
  "media": [
    {
      "type": "image",
      "url": "https://s3.amazonaws.com/reviews/photo-1.jpg"
    }
  ],
  "helpfulCount": 24,
  "unhelpfulCount": 2,
  "flagCount": 0,
  "replies": [
    {
      "id": "reply_001",
      "vendorId": "vendor_789",
      "text": "Thank you for the wonderful review! We appreciate your business.",
      "createdAt": "2024-01-02T10:00:00Z"
    }
  ],
  "isModerated": false,
  "isFeatured": true,
  "isDeleted": false,
  "createdAt": "2024-01-01T12:00:00Z",
  "updatedAt": "2024-01-01T12:00:00Z"
}
```

### Rating Summary Object

```json
{
  "propertyId": "prop_123",
  "averageRating": 4.5,
  "totalReviews": 48,
  "ratingBreakdown": {
    "5": 28,
    "4": 15,
    "3": 4,
    "2": 1,
    "1": 0
  },
  "verifiedPurchaseCount": 42,
  "recommendationPercentage": 89,
  "lastUpdated": "2024-01-01T15:30:00Z"
}
```

### Rating Distribution

```json
{
  "5-stars": "58%",
  "4-stars": "31%",
  "3-stars": "8%",
  "2-stars": "2%",
  "1-star": "0%"
}
```

### Vendor Reply Object

```json
{
  "id": "reply_001",
  "vendorId": "vendor_789",
  "text": "Thank you for the wonderful review!",
  "createdAt": "2024-01-02T10:00:00Z"
}
```

---

## API Endpoints

### Create Review

```http
POST /api/reviews/properties/:propertyId/reviews
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>

{
  "rating": 4,
  "title": "Great property!",
  "content": "This property exceeded my expectations. Highly recommend!",
  "media": [
    {
      "type": "image",
      "url": "https://s3.amazonaws.com/reviews/photo.jpg"
    }
  ]
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "rev_prop_123_user_456_1704067200000",
    "propertyId": "prop_123",
    "userId": "user_456",
    "rating": 4,
    "title": "Great property!",
    "content": "This property exceeded my expectations. Highly recommend!",
    "verifiedPurchase": true,
    "media": [],
    "helpfulCount": 0,
    "unhelpfulCount": 0,
    "replies": [],
    "createdAt": "2024-01-01T12:00:00Z"
  },
  "message": "Review created successfully"
}
```

**Status Codes:**
- `201 Created` - Review created
- `400 Bad Request` - Invalid rating or duplicate review
- `401 Unauthorized` - Invalid token
- `500 Internal Server Error` - Server error

**Validation:**
- Rating must be 1-5
- Content must be at least 10 characters
- Only one review per user per property
- Maximum 5 media files per review

---

### Get Property Reviews

```http
GET /api/reviews/properties/:propertyId/reviews?limit=20&offset=0&sortBy=recent&rating=4
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "reviews": [
      {
        "id": "rev_prop_123_user_456_1704067200000",
        "propertyId": "prop_123",
        "userId": "user_456",
        "rating": 4,
        "title": "Great property!",
        "content": "This property exceeded my expectations...",
        "verifiedPurchase": true,
        "helpfulCount": 24,
        "unhelpfulCount": 2,
        "replies": [],
        "createdAt": "2024-01-01T12:00:00Z"
      }
    ],
    "total": 48,
    "limit": 20,
    "offset": 0
  }
}
```

**Query Parameters:**
- `limit` (number, default: 20, max: 100) - Results per page
- `offset` (number, default: 0) - Pagination offset
- `sortBy` (enum: "recent", "helpful", "highest", "lowest") - Sort order
- `rating` (number: 1-5) - Filter by star rating

---

### Get User Reviews

```http
GET /api/reviews/users/:userId/reviews?limit=10&offset=0
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "reviews": [
      {
        "id": "rev_prop_123_user_456_1704067200000",
        "propertyId": "prop_123",
        "rating": 4,
        "title": "Great property!",
        "createdAt": "2024-01-01T12:00:00Z"
      }
    ],
    "total": 12,
    "limit": 10,
    "offset": 0
  }
}
```

---

### Get Property Rating

```http
GET /api/reviews/properties/:propertyId/rating
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "propertyId": "prop_123",
    "averageRating": 4.5,
    "totalReviews": 48,
    "ratingBreakdown": {
      "5": 28,
      "4": 15,
      "3": 4,
      "2": 1,
      "1": 0
    },
    "verifiedPurchaseCount": 42,
    "recommendationPercentage": 89,
    "lastUpdated": "2024-01-01T15:30:00Z"
  }
}
```

---

### Update Review

```http
PUT /api/reviews/properties/:propertyId/reviews/:reviewId
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>

{
  "rating": 5,
  "title": "Excellent property!",
  "content": "Updated review content..."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "rev_prop_123_user_456_1704067200000",
    "propertyId": "prop_123",
    "rating": 5,
    "title": "Excellent property!",
    "content": "Updated review content...",
    "updatedAt": "2024-01-01T13:00:00Z"
  },
  "message": "Review updated successfully"
}
```

**Status Codes:**
- `200 OK` - Review updated
- `403 Forbidden` - Only author can edit
- `404 Not Found` - Review not found
- `500 Internal Server Error` - Server error

---

### Delete Review

```http
DELETE /api/reviews/properties/:propertyId/reviews/:reviewId
Authorization: Bearer <JWT_TOKEN>
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Review deleted successfully"
}
```

---

### Mark Review as Helpful

```http
POST /api/reviews/properties/:propertyId/reviews/:reviewId/helpful
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "reviewId": "rev_prop_123_user_456_1704067200000",
    "helpfulCount": 25,
    "unhelpfulCount": 2
  },
  "message": "Review marked as helpful"
}
```

---

### Mark Review as Unhelpful

```http
POST /api/reviews/properties/:propertyId/reviews/:reviewId/unhelpful
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "reviewId": "rev_prop_123_user_456_1704067200000",
    "helpfulCount": 24,
    "unhelpfulCount": 3
  },
  "message": "Review marked as unhelpful"
}
```

---

### Flag Review

```http
POST /api/reviews/properties/:propertyId/reviews/:reviewId/flag
Content-Type: application/json

{
  "reason": "Inappropriate content"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "reviewId": "rev_prop_123_user_456_1704067200000",
    "flagCount": 1,
    "isModerated": false
  },
  "message": "Review flagged successfully"
}
```

**Common Reasons:**
- Inappropriate content
- Spam or advertising
- Personal attack
- Duplicate review
- Off-topic content

---

### Add Vendor Reply

```http
POST /api/reviews/properties/:propertyId/reviews/:reviewId/reply
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>

{
  "text": "Thank you for your wonderful review! We appreciate your feedback."
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "reviewId": "rev_prop_123_user_456_1704067200000",
    "reply": {
      "id": "reply_001",
      "vendorId": "vendor_789",
      "text": "Thank you for your wonderful review!",
      "createdAt": "2024-01-02T10:00:00Z"
    },
    "totalReplies": 1
  },
  "message": "Reply added successfully"
}
```

**Status Codes:**
- `201 Created` - Reply added
- `404 Not Found` - Review not found
- `500 Internal Server Error` - Server error

---

### Check Verified Purchase

```http
GET /api/reviews/properties/:propertyId/verified-purchase/:userId
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "userId": "user_456",
    "propertyId": "prop_123",
    "isVerified": true,
    "badge": "✓ Verified Purchase"
  }
}
```

---

### Set Verified Purchase (Admin)

```http
POST /api/reviews/verify-purchase
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>

{
  "userId": "user_456",
  "propertyId": "prop_123",
  "verified": true
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Verified purchase status updated"
}
```

---

### Get Trending Reviews

```http
GET /api/reviews/trending?limit=10&minRating=4
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "reviews": [
      {
        "id": "rev_prop_456_user_789_1704067200000",
        "propertyId": "prop_456",
        "rating": 5,
        "title": "Exceptional property!",
        "helpfulCount": 127,
        "createdAt": "2024-01-01T10:00:00Z"
      }
    ],
    "total": 10
  }
}
```

**Query Parameters:**
- `limit` (number, default: 10, max: 50) - Number of trending reviews
- `minRating` (number, 1-5, default: 4) - Minimum rating filter

---

## Features

### 1. Star Rating System (1-5)

All properties are rated on a 5-star scale:

```
5 ⭐ - Excellent/Highly Recommend
4 ⭐ - Very Good/Recommend
3 ⭐ - Good/Neutral
2 ⭐ - Fair/Not Recommended
1 ⭐ - Poor/Not Recommended
```

Rating calculations are automatic and updated in real-time.

---

### 2. Verified Purchase Badge

Users who purchased a property receive a "✓ Verified Purchase" badge next to their review:

```json
{
  "badge": "✓ Verified Purchase",
  "isVerified": true
}
```

**Benefits:**
- Increased credibility
- Displayed prominently in reviews
- Counted separately in analytics

---

### 3. Review Moderation

Automatic moderation with manual override:

**Auto-flagging triggers:**
- 3+ user reports → Auto-moderate
- Spam keywords detected
- Multiple reviews by same user on same property
- Suspicious voting patterns

**Moderation response:**
```json
{
  "isModerated": true,
  "moderationReason": "Multiple user flags",
  "status": "Under Review"
}
```

---

### 4. Helpful/Unhelpful Voting

Community-driven review helpfulness:

```javascript
// Mark as helpful
POST /api/reviews/properties/:id/reviews/:id/helpful

// Response shows updated counts
{
  "helpfulCount": 127,
  "unhelpfulCount": 3
}
```

---

### 5. Vendor Replies

Property/vendor owners can respond to reviews:

```json
{
  "reply": {
    "id": "reply_001",
    "vendorId": "vendor_789",
    "text": "Thank you for choosing us!",
    "createdAt": "2024-01-02T10:00:00Z"
  }
}
```

---

### 6. Review Rich Media

Support for images and media in reviews:

```json
{
  "media": [
    {
      "type": "image",
      "url": "https://s3.amazonaws.com/reviews/photo-1.jpg"
    },
    {
      "type": "image",
      "url": "https://s3.amazonaws.com/reviews/photo-2.jpg"
    }
  ]
}
```

Maximum 5 media files per review.

---

### 7. Trending Reviews

Algorithmically sorted by helpfulness and recency:

```javascript
GET /api/reviews/trending?limit=10&minRating=4

// Returns top helpful reviews from recent activity
```

---

## Review Moderation

### Moderation Process

1. **User Flags Review** - Community reports inappropriate content
2. **Auto-Moderation** - 3+ flags trigger auto-moderation
3. **Admin Review** - Manual staff review of flagged content
4. **Action** - Remove, restore, or feature review

### Flag Reasons

```javascript
const flagReasons = [
  'Inappropriate content',
  'Spam or advertising',
  'Personal attack',
  'Duplicate review',
  'Off-topic content',
  'Conflict of interest'
];
```

### Moderation Policy

- Reviews with 3+ flags are automatically moderated
- Inappropriate reviews are marked `isModerated: true`
- Users can appeal moderation decisions
- Vendors and admins can respond to reviews

---

## Verified Purchase System

### How It Works

1. **Purchase Created** - User completes property transaction
2. **Badge Assigned** - `verifiedPurchase: true` flag set
3. **Review Value** - Badge shown on user reviews
4. **Analytics** - Tracked separately in rating breakdown

### Checking Verification Status

```javascript
const response = await fetch('/api/reviews/properties/prop_123/verified-purchase/user_456');
const { isVerified, badge } = response.data.data;

if (isVerified) {
  console.log('User has purchased this property');
  console.log('Badge:', badge); // "✓ Verified Purchase"
}
```

### Benefits

- **Credibility** - Verified purchases are more trustworthy
- **Transparency** - Users can identify actual purchasers
- **Analytics** - Separate tracking of verified vs. unverified reviews
- **Anti-Fraud** - Prevents fake reviews from non-purchasers

---

## Error Handling

### Standard Error Response

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

### Common Error Codes

| Status | Code | Message | Solution |
|--------|------|---------|----------|
| 400 | Bad Request | Invalid rating (must be 1-5) | Check rating value |
| 400 | Bad Request | You have already reviewed this property | Update existing review |
| 400 | Bad Request | Review content must be at least 10 characters | Provide longer content |
| 401 | Unauthorized | Invalid JWT token | Refresh token |
| 403 | Forbidden | Only review author can edit | Use own account |
| 404 | Not Found | Review not found | Verify review ID |
| 429 | Too Many Requests | Rate limit exceeded | Wait before retrying |
| 500 | Server Error | Internal server error | Contact support |

---

## React Integration Examples

### 1. Review Card Component

```javascript
import React from 'react';

function ReviewCard({ review, onHelpful, onUnhelpful }) {
  const renderStars = (rating) => {
    return Array(5)
      .fill(0)
      .map((_, i) => (
        <span key={i} style={{ color: i < rating ? '#FFB800' : '#CCCCCC' }}>
          ★
        </span>
      ));
  };

  return (
    <div className="review-card">
      <div className="review-header">
        <div className="rating">{renderStars(review.rating)}</div>
        <div className="title">{review.title}</div>
        {review.verifiedPurchase && (
          <span className="verified-badge">✓ Verified Purchase</span>
        )}
      </div>

      <div className="review-content">
        <p>{review.content}</p>
      </div>

      {review.media && review.media.length > 0 && (
        <div className="review-media">
          {review.media.map((item, idx) => (
            <img key={idx} src={item.url} alt={`Review ${idx + 1}`} />
          ))}
        </div>
      )}

      <div className="review-actions">
        <button onClick={() => onHelpful(review.id)}>
          👍 Helpful ({review.helpfulCount})
        </button>
        <button onClick={() => onUnhelpful(review.id)}>
          👎 Unhelpful ({review.unhelpfulCount})
        </button>
      </div>

      {review.replies && review.replies.length > 0 && (
        <div className="vendor-responses">
          <h4>Vendor Response:</h4>
          {review.replies.map((reply) => (
            <div key={reply.id} className="reply">
              <p>{reply.text}</p>
              <small>{new Date(reply.createdAt).toLocaleDateString()}</small>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ReviewCard;
```

---

### 2. Review Form Component

```javascript
import React, { useState } from 'react';
import axios from 'axios';

function ReviewForm({ propertyId, onReviewSubmitted }) {
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submitReview = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await axios.post(
        `/api/reviews/properties/${propertyId}/reviews`,
        {
          rating,
          title,
          content,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      onReviewSubmitted(response.data.data);
      setRating(5);
      setTitle('');
      setContent('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="review-form">
      <h3>Write a Review</h3>

      <div className="rating-input">
        <label>Rating:</label>
        <div className="star-rating">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              className={star <= rating ? 'active' : ''}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      <input
        type="text"
        placeholder="Review title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={100}
      />

      <textarea
        placeholder="Share your experience... (minimum 10 characters)"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={5}
        maxLength={5000}
      />

      {error && <p className="error">{error}</p>}

      <button
        onClick={submitReview}
        disabled={loading || content.length < 10}
      >
        {loading ? 'Submitting...' : 'Submit Review'}
      </button>
    </div>
  );
}

export default ReviewForm;
```

---

### 3. Property Rating Display

```javascript
import React, { useState, useEffect } from 'react';
import axios from 'axios';

function PropertyRating({ propertyId }) {
  const [rating, setRating] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRating();
  }, [propertyId]);

  const fetchRating = async () => {
    try {
      const response = await axios.get(
        `/api/reviews/properties/${propertyId}/rating`
      );
      setRating(response.data.data);
    } catch (error) {
      console.error('Failed to fetch rating:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!rating) return <div>No ratings yet</div>;

  return (
    <div className="property-rating">
      <div className="rating-summary">
        <div className="average">
          <span className="value">{rating.averageRating}</span>
          <span className="stars">★★★★★</span>
          <span className="count">({rating.totalReviews} reviews)</span>
        </div>

        <div className="breakdown">
          {[5, 4, 3, 2, 1].map((stars) => (
            <div key={stars} className="bar">
              <span className="label">{stars}★</span>
              <div className="progress">
                <div
                  className="fill"
                  style={{
                    width: `${(rating.ratingBreakdown[stars] / rating.totalReviews) * 100}%`,
                  }}
                ></div>
              </div>
              <span className="number">{rating.ratingBreakdown[stars]}</span>
            </div>
          ))}
        </div>

        <div className="stats">
          <p>{rating.recommendationPercentage}% would recommend this property</p>
          <p>{rating.verifiedPurchaseCount} verified purchase reviews</p>
        </div>
      </div>
    </div>
  );
}

export default PropertyRating;
```

---

### 4. Reviews List Component

```javascript
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ReviewCard from './ReviewCard';

function ReviewsList({ propertyId }) {
  const [reviews, setReviews] = useState([]);
  const [sortBy, setSortBy] = useState('recent');
  const [ratingFilter, setRatingFilter] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, [propertyId, sortBy, ratingFilter]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: 20,
        sortBy,
        ...(ratingFilter && { rating: ratingFilter }),
      });

      const response = await axios.get(
        `/api/reviews/properties/${propertyId}/reviews?${params}`
      );
      setReviews(response.data.data.reviews);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleHelpful = async (reviewId) => {
    try {
      await axios.post(
        `/api/reviews/properties/${propertyId}/reviews/${reviewId}/helpful`
      );
      fetchReviews();
    } catch (error) {
      console.error('Failed to mark as helpful:', error);
    }
  };

  const handleUnhelpful = async (reviewId) => {
    try {
      await axios.post(
        `/api/reviews/properties/${propertyId}/reviews/${reviewId}/unhelpful`
      );
      fetchReviews();
    } catch (error) {
      console.error('Failed to mark as unhelpful:', error);
    }
  };

  return (
    <div className="reviews-list">
      <div className="filters">
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="recent">Most Recent</option>
          <option value="helpful">Most Helpful</option>
          <option value="highest">Highest Rating</option>
          <option value="lowest">Lowest Rating</option>
        </select>

        <select
          value={ratingFilter || ''}
          onChange={(e) => setRatingFilter(e.target.value || null)}
        >
          <option value="">All Ratings</option>
          <option value="5">5 Stars</option>
          <option value="4">4 Stars</option>
          <option value="3">3 Stars</option>
          <option value="2">2 Stars</option>
          <option value="1">1 Star</option>
        </select>
      </div>

      {loading ? (
        <p>Loading reviews...</p>
      ) : reviews.length === 0 ? (
        <p>No reviews found</p>
      ) : (
        <div className="review-items">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              onHelpful={handleHelpful}
              onUnhelpful={handleUnhelpful}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default ReviewsList;
```

---

### 5. Flag Review Component

```javascript
import React, { useState } from 'react';
import axios from 'axios';

function FlagReview({ propertyId, reviewId }) {
  const [showModal, setShowModal] = useState(false);
  const [reason, setReason] = useState('Inappropriate content');
  const [loading, setLoading] = useState(false);

  const flagReasons = [
    'Inappropriate content',
    'Spam or advertising',
    'Personal attack',
    'Duplicate review',
    'Off-topic content',
  ];

  const handleFlag = async () => {
    try {
      setLoading(true);
      await axios.post(
        `/api/reviews/properties/${propertyId}/reviews/${reviewId}/flag`,
        { reason }
      );
      alert('Review flagged successfully');
      setShowModal(false);
    } catch (error) {
      alert('Failed to flag review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button onClick={() => setShowModal(true)} className="flag-btn">
        🚩 Report
      </button>

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>Report this review</h3>

            <select value={reason} onChange={(e) => setReason(e.target.value)}>
              {flagReasons.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>

            <div className="modal-actions">
              <button onClick={handleFlag} disabled={loading}>
                {loading ? 'Reporting...' : 'Report'}
              </button>
              <button onClick={() => setShowModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default FlagReview;
```

---

## Best Practices

### For Users

1. **Write Honest Reviews** - Base reviews on actual experience
2. **Be Specific** - Include details about property features
3. **Be Respectful** - Avoid personal attacks
4. **Include Photos** - High-quality images increase review credibility
5. **Stay On Topic** - Focus on the property, not unrelated matters
6. **Use Rating Scale Appropriately:**
   - 5⭐ = Exceeded expectations
   - 4⭐ = Met expectations
   - 3⭐ = Average/Neutral
   - 2⭐ = Below expectations
   - 1⭐ = Poor experience

### For Vendors

1. **Respond Promptly** - Reply to reviews within 48 hours
2. **Be Professional** - Thank reviewers and address concerns
3. **Offer Solutions** - Provide remedies for negative reviews
4. **Don't Be Defensive** - Accept feedback gracefully
5. **Encourage Reviews** - Ask satisfied customers to share reviews

### For Platforms

1. **Monitor Quality** - Regular review of flagged content
2. **Prevent Abuse** - Enforce duplicate and verified purchase policies
3. **Encourage Engagement** - Promote helpful reviews
4. **Transparency** - Clearly disclose moderation policies
5. **Protect Privacy** - Don't display sensitive personal info

---

## Rate Limiting

**Rate Limit Tiers:**
- Creating reviews: 1 per property per user (prevention of duplicates)
- Marking helpful/unhelpful: 10 per minute per user
- Flagging reviews: 5 per hour per user
- General API calls: 100 per minute per user

**Rate Limit Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1704067260
```

**Rate Limit Exceeded Response (429):**
```json
{
  "success": false,
  "message": "Too many requests, please try again later",
  "retryAfter": 60
}
```

---

## API Summary Table

| Endpoint | Method | Purpose | Auth | Public |
|----------|--------|---------|------|--------|
| `/properties/:id/reviews` | POST | Create review | ✅ | ❌ |
| `/properties/:id/reviews` | GET | Get property reviews | ❌ | ✅ |
| `/users/:id/reviews` | GET | Get user reviews | ❌ | ✅ |
| `/properties/:id/rating` | GET | Get rating summary | ❌ | ✅ |
| `/properties/:id/reviews/:id` | PUT | Update review | ✅ | ❌ |
| `/properties/:id/reviews/:id` | DELETE | Delete review | ✅ | ❌ |
| `/properties/:id/reviews/:id/helpful` | POST | Mark helpful | ❌ | ✅ |
| `/properties/:id/reviews/:id/unhelpful` | POST | Mark unhelpful | ❌ | ✅ |
| `/properties/:id/reviews/:id/flag` | POST | Flag review | ❌ | ✅ |
| `/properties/:id/reviews/:id/reply` | POST | Add vendor reply | ✅ | ❌ |
| `/properties/:id/verified-purchase/:id` | GET | Check badge | ❌ | ✅ |
| `/verify-purchase` | POST | Set purchase badge | ✅ | ❌ |
| `/trending` | GET | Get trending reviews | ❌ | ✅ |

---

## Support & Contact

For API support or issues:
- 📧 Email: api-support@propertyark.com
- 📱 Slack: #reviews-api-support
- 📖 Documentation: https://docs.propertyark.com/reviews

---

**Last Updated:** January 1, 2024
**Version:** 1.0.0
**Status:** Production Ready
