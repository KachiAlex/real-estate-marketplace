import apiClient from '../services/apiClient';

const normalizeBlog = (blog) => {
  if (!blog) return blog;
  if (!blog.id && blog._id) {
    const { _id, ...rest } = blog;
    return { id: _id, ...rest };
  }
  return blog;
};

const normalizeList = (list = []) => list.map((item) => normalizeBlog(item));

const extractList = (response) => {
  if (!response) return [];
  const payload = response.data;
  if (Array.isArray(payload)) return normalizeList(payload);
  if (Array.isArray(payload?.data)) return normalizeList(payload.data);
  return [];
};

const extractData = (response) => {
  if (!response) return null;
  const data = response.data?.data !== undefined ? response.data.data : response.data;
  return normalizeBlog(data);
};

export async function fetchPublishedBlogs(options = {}) {
  const {
    page = 1,
    limit = 12,
    category,
    tag,
    search,
    featured,
    sort = 'newest'
  } = options;

  const params = { page, limit, sort };
  if (category && category !== 'all') params.category = category;
  if (tag) params.tag = tag;
  if (search) params.search = search;
  if (featured !== undefined) params.featured = featured ? 'true' : 'false';

  const response = await apiClient.get('/blog', { params });
  return extractList(response);
}

export async function fetchBlogBySlug(slug) {
  if (!slug) return null;
  try {
    const response = await apiClient.get(`/blog/${slug}`);
    return extractData(response);
  } catch (error) {
    if (error?.response?.status === 404) return null;
    throw error;
  }
}

export async function fetchRelatedBlogs(slug, { limit = 3 } = {}) {
  if (!slug) return [];
  try {
    const response = await apiClient.get(`/blog/${slug}/related`, { params: { limit } });
    return extractList(response);
  } catch (error) {
    console.warn('Failed to fetch related blogs', error);
    return [];
  }
}

export async function fetchFeaturedBlogs(limit = 3) {
  try {
    const response = await apiClient.get('/blog/featured', { params: { limit } });
    return extractList(response);
  } catch (error) {
    console.warn('Failed to fetch featured blogs', error);
    return [];
  }
}

export async function fetchBlogCategories() {
  try {
    const response = await apiClient.get('/blog/categories');
    return extractList(response);
  } catch (error) {
    console.warn('Failed to fetch blog categories', error);
    return [];
  }
}

export async function adminListBlogs(params = {}) {
  const response = await apiClient.get('/blog/admin', { params });
  const payload = response?.data || {};
  return {
    posts: Array.isArray(payload?.data) ? normalizeList(payload.data) : extractList(response),
    total: typeof payload?.total === 'number' ? payload.total : (payload?.data?.length || 0)
  };
}

export async function adminCreateBlog(payload) {
  const response = await apiClient.post('/blog', payload);
  return extractData(response);
}

export async function adminUpdateBlog(id, payload) {
  const response = await apiClient.put(`/blog/${id}`, payload);
  return extractData(response);
}

export async function adminUpdateBlogStatus(id, status, publishedAt) {
  const response = await apiClient.patch(`/blog/${id}/status`, { status, publishedAt });
  return extractData(response);
}

export async function adminDeleteBlog(id) {
  const response = await apiClient.delete(`/blog/${id}`);
  return response?.data || { success: true };
}
