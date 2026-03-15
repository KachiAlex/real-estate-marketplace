const crypto = require('crypto');
const slugify = require('slugify');
const db = require('../config/sequelizeDb');
const { Blog } = db;
const { Op, literal } = db.Sequelize;

const DEFAULT_EXCERPT_LENGTH = 240;
const DEFAULT_SORT_FIELDS = new Set(['publishedAt', 'createdAt', 'updatedAt', 'views', 'likes', 'shares']);

// Convert Sequelize instance to plain object
const convertTimestamps = (instance) => (instance ? (instance.toJSON ? instance.toJSON() : instance) : null);

const sanitizeSlug = (value) => slugify(value || '', { lower: true, strict: true, trim: true });

const ensureUniqueSlug = async (candidate, excludeId = null) => {
  let baseSlug = sanitizeSlug(candidate) || crypto.randomBytes(4).toString('hex');
  let uniqueSlug = baseSlug;
  let counter = 1;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const where = { slug: uniqueSlug };
    if (excludeId) {
      where.id = { [Op.ne]: excludeId };
    }
    const existing = await Blog.findOne({ where, attributes: ['id'] });
    if (!existing) return uniqueSlug;
    uniqueSlug = `${baseSlug}-${counter++}`;
  }
};

const normalizeTags = (tags) => {
  if (!tags) return null;
  const arrayValue = Array.isArray(tags) ? tags : [tags];
  const normalized = arrayValue
    .map((tag) => (typeof tag === 'string' ? tag : `${tag || ''}`))
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);
  return normalized.length ? normalized : null;
};

const normalizeFeaturedImage = (value) => {
  if (!value) return null;
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'object' && value.url) return value.url.trim();
  return null;
};

const generateExcerpt = (content, maxLength = DEFAULT_EXCERPT_LENGTH) => {
  if (!content) return '';
  const stripped = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  if (stripped.length <= maxLength) return stripped;
  const truncated = stripped.slice(0, maxLength);
  return `${truncated.slice(0, truncated.lastIndexOf(' ')).trim()}...`;
};

const applySearchFilter = (query, searchTerm) => {
  if (!searchTerm) return query;
  const term = `%${searchTerm.toLowerCase()}%`;
  query[Op.or] = [
    { title: { [Op.iLike]: term } },
    { excerpt: { [Op.iLike]: term } },
    { content: { [Op.iLike]: term } },
    { tags: { [Op.contains]: [searchTerm.toLowerCase()] } }
  ];
  return query;
};

// Get all blogs with filters
const getBlogs = async (filters = {}, sortBy = 'publishedAt', sortOrder = 'desc', limit = 10, offset = 0) => {
  const where = {};
  const andClauses = [];

  if (filters.status) andClauses.push({ status: filters.status });
  if (filters.category) andClauses.push({ category: filters.category });
  // NOTE: featured column doesn't exist in DB, skipping filter
  if (filters.authorId) andClauses.push({ authorId: filters.authorId });
  if (filters.ids && Array.isArray(filters.ids)) andClauses.push({ id: { [Op.in]: filters.ids } });
  if (filters.tags) {
    const tagFilter = normalizeTags(filters.tags);
    if (tagFilter && tagFilter.length) {
      andClauses.push({ tags: { [Op.contains]: tagFilter } });
    }
  }
  if (filters.publishedBefore) {
    andClauses.push({
      publishedAt: {
        [Op.lte]: filters.publishedBefore
      }
    });
  }
  if (filters.search) {
    applySearchFilter(where, filters.search);
  }

  if (andClauses.length) {
    where[Op.and] = andClauses;
  }

  let resolvedSortBy = DEFAULT_SORT_FIELDS.has(sortBy) ? sortBy : 'publishedAt';
  let order = [[resolvedSortBy, sortOrder === 'asc' ? 'ASC' : 'DESC']];
  if (sortBy === 'trending') {
    const trendingLiteral = literal('(COALESCE("views",0) + COALESCE("likes",0) * 2 + COALESCE("shares",0) * 3)');
    order = [[trendingLiteral, sortOrder === 'asc' ? 'ASC' : 'DESC']];
  }

  const { rows, count } = await Blog.findAndCountAll({ 
    where, 
    order, 
    offset, 
    limit: Number(limit),
    attributes: { exclude: ['featured'] }
  });
  return { blogs: rows.map((r) => convertTimestamps(r)), total: count, hasMore: offset + Number(limit) < count };
};

// Get blog by slug
const getBlogBySlug = async (slug) => {
  const blog = await Blog.findOne({ 
    where: { slug, status: 'published' },
    attributes: { exclude: ['featured'] }
  });
  if (!blog) return null;
  const b = blog.toJSON();
  if (b.publishedAt && new Date(b.publishedAt) > new Date()) return null;
  return b;
};

// Get featured blogs (NOTE: featured column doesn't exist in DB, returning published blogs instead)
const getFeaturedBlogs = async (limit = 5) => {
  const rows = await Blog.findAll({ 
    where: { status: 'published' }, 
    attributes: { exclude: ['featured'] },
    order: [['publishedAt', 'DESC']], 
    limit: Number(limit) 
  });
  return rows.map(r => r.toJSON());
};

// Get related blogs
const getRelatedBlogs = async (currentBlog, limit = 4) => {
  const all = await Blog.findAll({ 
    where: { status: 'published' },
    attributes: { exclude: ['featured'] }
  });
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
  const commentId = crypto.randomBytes(8).toString('hex');
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

const getBlogById = async (id) => {
  const blog = await Blog.findByPk(id, {
    attributes: { exclude: ['featured'] }
  });
  return convertTimestamps(blog);
};

const createBlog = async (payload = {}) => {
  if (!payload.title || !payload.content) {
    throw new Error('Title and content are required');
  }

  const slug = await ensureUniqueSlug(payload.slug || payload.title);
  const tags = normalizeTags(payload.tags);
  const featuredImage = normalizeFeaturedImage(payload.featuredImage) || null;
  const excerpt = payload.excerpt?.trim() || generateExcerpt(payload.content);
  const status = payload.status || 'draft';

  let publishedAt = payload.publishedAt ? new Date(payload.publishedAt) : null;
  if (status === 'published' && !publishedAt) {
    publishedAt = new Date();
  }

  const blog = await Blog.create({
    authorId: payload.authorId,
    title: payload.title.trim(),
    slug,
    content: payload.content,
    excerpt,
    category: payload.category,
    tags,
    featuredImage,
    status,
    allowComments: payload.allowComments !== undefined ? payload.allowComments : true,
    publishedAt,
    comments: payload.comments || []
  });

  return convertTimestamps(blog);
};

const updateBlog = async (id, payload = {}) => {
  const blog = await Blog.findByPk(id, {
    attributes: { exclude: ['featured'] }
  });
  if (!blog) {
    throw new Error('Blog not found');
  }

  if (payload.title !== undefined) {
    blog.title = payload.title.trim();
  }

  if (payload.slug || payload.title) {
    const newSlug = await ensureUniqueSlug(payload.slug || blog.title, blog.id);
    blog.slug = newSlug;
  }

  if (payload.content !== undefined) {
    blog.content = payload.content;
    if (!payload.excerpt) {
      blog.excerpt = generateExcerpt(payload.content);
    }
  }

  if (payload.excerpt !== undefined) {
    blog.excerpt = payload.excerpt?.trim() || generateExcerpt(blog.content);
  }

  if (payload.category !== undefined) {
    blog.category = payload.category;
  }

  // NOTE: featured column doesn't exist in DB, skipping
  if (payload.tags !== undefined) {
    blog.tags = normalizeTags(payload.tags);
  }

  if (payload.featuredImage !== undefined) {
    blog.featuredImage = normalizeFeaturedImage(payload.featuredImage);
  }

  if (payload.allowComments !== undefined) {
    blog.allowComments = Boolean(payload.allowComments);
  }

  if (payload.status) {
    blog.status = payload.status;
    if (payload.status === 'published' && !blog.publishedAt) {
      blog.publishedAt = payload.publishedAt ? new Date(payload.publishedAt) : new Date();
    }
  }

  if (payload.publishedAt !== undefined) {
    blog.publishedAt = payload.publishedAt ? new Date(payload.publishedAt) : null;
  }

  blog.updatedAt = new Date();
  await blog.save();
  return convertTimestamps(blog);
};

const updateBlogStatus = async (id, status, publishedAt) => {
  return updateBlog(id, { status, publishedAt });
};

const deleteBlog = async (id) => {
  const deleted = await Blog.destroy({ where: { id } });
  return deleted > 0;
};

const listDrafts = async (authorId, limit = 20, offset = 0) => {
  return getBlogs({ status: 'draft', authorId }, 'updatedAt', 'desc', limit, offset);
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
  getPopularTags,
  getBlogById,
  createBlog,
  updateBlog,
  updateBlogStatus,
  deleteBlog,
  listDrafts
};

