const { getFirestore } = require('../config/firestore');
const admin = require('firebase-admin');

const COLLECTION = 'blogs';

// Helper to convert Firestore timestamp to Date
const convertTimestamps = (doc) => {
  if (!doc) return null;
  
  const data = doc.data ? doc.data() : doc;
  const id = doc.id || data.id || doc._id;
  
  // Convert Firestore timestamps to JavaScript dates
  const converted = { id, ...data };
  
  // Convert Timestamp fields
  if (converted.publishedAt && converted.publishedAt.toDate) {
    converted.publishedAt = converted.publishedAt.toDate();
  }
  if (converted.createdAt && converted.createdAt.toDate) {
    converted.createdAt = converted.createdAt.toDate();
  }
  if (converted.updatedAt && converted.updatedAt.toDate) {
    converted.updatedAt = converted.updatedAt.toDate();
  }
  
  // Convert nested timestamps (e.g., in comments)
  if (converted.comments && Array.isArray(converted.comments)) {
    converted.comments = converted.comments.map(comment => {
      if (comment.createdAt && comment.createdAt.toDate) {
        comment.createdAt = comment.createdAt.toDate();
      }
      return comment;
    });
  }
  
  return converted;
};

// Get all blogs with filters
const getBlogs = async (filters = {}, sortBy = 'publishedAt', sortOrder = 'desc', limit = 10, offset = 0) => {
  try {
    const db = getFirestore();
    if (!db) {
      console.error('Firestore not initialized');
      return { blogs: [], total: 0, hasMore: false };
    }
    let query = db.collection(COLLECTION);
    
    // Apply filters
    if (filters.status) {
      query = query.where('status', '==', filters.status);
    }
    
    if (filters.category) {
      query = query.where('category', '==', filters.category);
    }
    
    if (filters.featured !== undefined) {
      query = query.where('featured', '==', filters.featured);
    }
    
    // Note: Firestore doesn't support array-contains with multiple filters easily
    // For tag filtering, we'll filter in memory if needed
    const snapshot = await query.get();
    
    let blogs = snapshot.docs.map(doc => convertTimestamps(doc));
    
    // Filter by published date
    if (filters.publishedAt) {
      const now = filters.publishedAt instanceof Date ? filters.publishedAt : new Date();
      blogs = blogs.filter(blog => {
        if (!blog.publishedAt) return false;
        const pubDate = blog.publishedAt instanceof Date ? blog.publishedAt : blog.publishedAt.toDate();
        return pubDate <= now;
      });
    }
    
    // Filter by tag (in memory since Firestore array-contains is limited)
    if (filters.tags) {
      const tag = Array.isArray(filters.tags) ? filters.tags[0] : filters.tags;
      blogs = blogs.filter(blog => 
        blog.tags && blog.tags.some(t => 
          t.toLowerCase() === tag.toLowerCase()
        )
      );
    }
    
    // Search (in memory - for better search, consider Algolia or similar)
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      blogs = blogs.filter(blog => 
        blog.title?.toLowerCase().includes(searchTerm) ||
        blog.excerpt?.toLowerCase().includes(searchTerm) ||
        blog.content?.toLowerCase().includes(searchTerm) ||
        blog.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }
    
    // Sort
    blogs.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'publishedAt':
          aValue = a.publishedAt?.getTime() || 0;
          bValue = b.publishedAt?.getTime() || 0;
          break;
        case 'views':
          aValue = a.views || 0;
          bValue = b.views || 0;
          break;
        case 'likes':
          aValue = a.likes || 0;
          bValue = b.likes || 0;
          break;
        case 'trending':
          // Combined score: likes + shares + views
          aValue = (a.likes || 0) + (a.shares || 0) + (a.views || 0);
          bValue = (b.likes || 0) + (b.shares || 0) + (b.views || 0);
          break;
        default:
          aValue = a.publishedAt?.getTime() || 0;
          bValue = b.publishedAt?.getTime() || 0;
      }
      
      return sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
    });
    
    // Pagination
    const total = blogs.length;
    const paginatedBlogs = blogs.slice(offset, offset + limit);
    
    return {
      blogs: paginatedBlogs,
      total,
      hasMore: offset + limit < total
    };
  } catch (error) {
    console.error('Error fetching blogs from Firestore:', error);
    // Return empty result instead of throwing to prevent server crashes
    return { blogs: [], total: 0, hasMore: false };
  }
};

// Get blog by slug
const getBlogBySlug = async (slug) => {
  try {
    const db = getFirestore();
    const snapshot = await db.collection(COLLECTION)
      .where('slug', '==', slug)
      .where('status', '==', 'published')
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      return null;
    }
    
    const doc = snapshot.docs[0];
    const blog = convertTimestamps(doc);
    
    // Check published date
    if (blog.publishedAt) {
      const pubDate = blog.publishedAt instanceof Date ? blog.publishedAt : blog.publishedAt.toDate();
      if (pubDate > new Date()) {
        return null; // Not published yet
      }
    }
    
    return blog;
  } catch (error) {
    console.error('Error fetching blog by slug:', error);
    throw error;
  }
};

// Get featured blogs
const getFeaturedBlogs = async (limit = 5) => {
  try {
    const db = getFirestore();
    const snapshot = await db.collection(COLLECTION)
      .where('status', '==', 'published')
      .where('featured', '==', true)
      .orderBy('publishedAt', 'desc')
      .limit(limit)
      .get();
    
    return snapshot.docs.map(doc => convertTimestamps(doc));
  } catch (error) {
    console.error('Error fetching featured blogs:', error);
    throw error;
  }
};

// Get related blogs
const getRelatedBlogs = async (currentBlog, limit = 4) => {
  try {
    const db = getFirestore();
    let query = db.collection(COLLECTION)
      .where('status', '==', 'published');
    
    const snapshot = await query.get();
    
    let related = snapshot.docs
      .map(doc => convertTimestamps(doc))
      .filter(blog => {
        // Exclude current blog
        if (blog.id === currentBlog.id || blog.slug === currentBlog.slug) {
          return false;
        }
        
        // Check if published
        if (blog.publishedAt) {
          const pubDate = blog.publishedAt instanceof Date ? blog.publishedAt : blog.publishedAt.toDate();
          if (pubDate > new Date()) {
            return false;
          }
        }
        
        // Match by category or tags
        const sameCategory = blog.category === currentBlog.category;
        const sharedTags = blog.tags && currentBlog.tags && 
          blog.tags.some(tag => currentBlog.tags.includes(tag));
        
        return sameCategory || sharedTags;
      })
      .sort((a, b) => {
        const aDate = a.publishedAt?.getTime() || 0;
        const bDate = b.publishedAt?.getTime() || 0;
        return bDate - aDate;
      })
      .slice(0, limit);
    
    return related;
  } catch (error) {
    console.error('Error fetching related blogs:', error);
    throw error;
  }
};

// Increment views
const incrementViews = async (blogId) => {
  try {
    const db = getFirestore();
    const blogRef = db.collection(COLLECTION).doc(blogId);
    await blogRef.update({
      views: admin.firestore.FieldValue.increment(1),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error incrementing views:', error);
    throw error;
  }
};

// Increment likes
const incrementLikes = async (blogId) => {
  try {
    const db = getFirestore();
    const blogRef = db.collection(COLLECTION).doc(blogId);
    await blogRef.update({
      likes: admin.firestore.FieldValue.increment(1),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error incrementing likes:', error);
    throw error;
  }
};

// Increment shares
const incrementShares = async (blogId) => {
  try {
    const db = getFirestore();
    const blogRef = db.collection(COLLECTION).doc(blogId);
    await blogRef.update({
      shares: admin.firestore.FieldValue.increment(1),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error incrementing shares:', error);
    throw error;
  }
};

// Add comment
const addComment = async (blogId, comment) => {
  try {
    const db = getFirestore();
    const blogRef = db.collection(COLLECTION).doc(blogId);
    const blogDoc = await blogRef.get();
    
    if (!blogDoc.exists) {
      throw new Error('Blog not found');
    }
    
    const blog = blogDoc.data();
    const comments = blog.comments || [];
    
    // Generate unique comment ID
    const commentId = db.collection('_temp').doc().id;
    
    comments.push({
      ...comment,
      id: commentId,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    await blogRef.update({
      comments,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return comments[comments.length - 1];
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
};

// Get categories with counts
const getCategories = async () => {
  try {
    const db = getFirestore();
    const snapshot = await db.collection(COLLECTION)
      .where('status', '==', 'published')
      .get();
    
    const categoryCounts = {};
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const category = data.category;
      if (category) {
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      }
    });
    
    return Object.entries(categoryCounts)
      .map(([slug, count]) => ({ slug, count }))
      .sort((a, b) => b.count - a.count);
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

// Get popular tags
const getPopularTags = async (limit = 20) => {
  try {
    const db = getFirestore();
    const snapshot = await db.collection(COLLECTION)
      .where('status', '==', 'published')
      .get();
    
    const tagCounts = {};
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const tags = data.tags || [];
      tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    
    return Object.entries(tagCounts)
      .map(([tag, count]) => ({ _id: tag, tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  } catch (error) {
    console.error('Error fetching tags:', error);
    throw error;
  }
};

module.exports = {
  getBlogs,
  getBlogBySlug,
  getFeaturedBlogs,
  getRelatedBlogs,
  incrementViews,
  incrementLikes,
  incrementShares,
  addComment,
  getCategories,
  getPopularTags
};

