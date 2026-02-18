const db = require('../config/sequelizeDb');
const { Blog } = db;

// Convert Sequelize instance to plain object
const convertTimestamps = (instance) => instance ? (instance.toJSON ? instance.toJSON() : instance) : null;

// Get all blogs with filters
const getBlogs = async (filters = {}, sortBy = 'publishedAt', sortOrder = 'desc', limit = 10, offset = 0) => {
  const where = {};
  if (filters.status) where.status = filters.status;
  if (filters.category) where.category = filters.category;
  if (filters.featured !== undefined) where.featured = filters.featured;

  if (filters.tags) {
    // tags is stored as JSON array - simple contains check
    where.tags = { [db.Sequelize.Op.contains]: Array.isArray(filters.tags) ? filters.tags : [filters.tags] };
  }

  const order = [[sortBy, sortOrder === 'asc' ? 'ASC' : 'DESC']];
  const { rows, count } = await Blog.findAndCountAll({ where, order, offset, limit });
  return { blogs: rows.map(r => convertTimestamps(r)), total: count, hasMore: offset + limit < count };
};

// Get blog by slug
const getBlogBySlug = async (slug) => {
  const blog = await Blog.findOne({ where: { slug, status: 'published' } });
  if (!blog) return null;
  const b = blog.toJSON();
  if (b.publishedAt && new Date(b.publishedAt) > new Date()) return null;
  return b;
};

// Get featured blogs
const getFeaturedBlogs = async (limit = 5) => {
  const rows = await Blog.findAll({ where: { status: 'published', featured: true }, order: [['publishedAt', 'DESC']], limit: Number(limit) });
  return rows.map(r => r.toJSON());
};

// Get related blogs
const getRelatedBlogs = async (currentBlog, limit = 4) => {
  const all = await Blog.findAll({ where: { status: 'published' } });
  const blogs = all.map(b => b.toJSON());
  const related = blogs
    .filter(blog => {
      if (blog.id === currentBlog.id || blog.slug === currentBlog.slug) return false;
      if (blog.publishedAt && new Date(blog.publishedAt) > new Date()) return false;
      const sameCategory = blog.category === currentBlog.category;
      const sharedTags = blog.tags && currentBlog.tags && blog.tags.some(tag => currentBlog.tags.includes(tag));
      return sameCategory || sharedTags;
    })
    .sort((a, b) => (new Date(b.publishedAt || 0)) - (new Date(a.publishedAt || 0)))
    .slice(0, Number(limit));
  return related;
};

// Increment views/likes/shares
const incrementViews = async (blogId) => {
  await Blog.increment('views', { by: 1, where: { id: blogId } });
  return true;
};
const incrementLikes = async (blogId) => {
  await Blog.increment('likes', { by: 1, where: { id: blogId } });
  return true;
};
const incrementShares = async (blogId) => {
  await Blog.increment('shares', { by: 1, where: { id: blogId } });
  return true;
};

// Add comment
const addComment = async (blogId, comment) => {
  const blog = await Blog.findByPk(blogId);
  if (!blog) throw new Error('Blog not found');
  const comments = blog.comments || [];
  const commentId = require('crypto').randomBytes(8).toString('hex');
  const newComment = { id: commentId, ...comment, createdAt: new Date() };
  comments.push(newComment);
  await blog.update({ comments, updatedAt: new Date() });
  return newComment;
};

// Get categories with counts
const getCategories = async () => {
  const rows = await Blog.findAll({ where: { status: 'published' }, attributes: ['category'] });
  const counts = {};
  rows.forEach(r => { if (r.category) counts[r.category] = (counts[r.category] || 0) + 1; });
  return Object.entries(counts).map(([slug, count]) => ({ slug, count })).sort((a,b) => b.count - a.count);
};

// Get popular tags
const getPopularTags = async (limit = 20) => {
  const rows = await Blog.findAll({ where: { status: 'published' }, attributes: ['tags'] });
  const tagCounts = {};
  rows.forEach(r => { (r.tags || []).forEach(t => { tagCounts[t] = (tagCounts[t] || 0) + 1; }); });
  return Object.entries(tagCounts).map(([tag, count]) => ({ _id: tag, tag, count })).sort((a,b) => b.count - a.count).slice(0, limit);
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

