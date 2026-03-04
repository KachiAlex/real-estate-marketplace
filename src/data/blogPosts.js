const FALLBACK_BLOG_POSTS = [
  {
    id: 'blog-1',
    slug: 'january-market-update',
    title: 'January Market Update',
    category: 'Market Trends',
    status: 'published',
    publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    content:
      'Rental demand across Lekki and Ikoyi jumped 18% MoM. Property values in prime locations continue to show strong appreciation, driven by limited inventory and improved infrastructure spending...',
    excerpt: 'Rental demand across Lekki and Ikoyi jumped 18% MoM. Here is how it impacts investors...'
  },
  {
    id: 'blog-2',
    slug: 'smart-investment-strategies-2024',
    title: 'Smart Investment Strategies for 2024',
    category: 'Investment',
    status: 'published',
    publishedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    content:
      'Discover the top property investment strategies that are yielding the best returns in the current market. From co-ownership models to short-let hybrids, here is how savvy investors are positioning their portfolios...',
    excerpt: "Learn about the most effective property investment approaches for maximizing returns in today's market."
  },
  {
    id: 'blog-3',
    slug: 'mortgage-playbook-2024',
    title: 'Mortgage Playbook 2024',
    category: 'Mortgage',
    status: 'published',
    publishedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    content:
      'Everything our buyers should know about the revamped PropertyArk mortgage partners and financing options. Understand amortization updates, rate changes, and how to secure faster approvals...',
    excerpt: 'Everything our buyers should know about the revamped PropertyArk mortgage partners.'
  }
];

const isBrowser = typeof window !== 'undefined';

const readPostsFromStorage = () => {
  if (!isBrowser) return null;
  try {
    const stored = window.localStorage.getItem('blogPosts');
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : null;
  } catch (error) {
    console.error('Failed to parse blog posts from storage', error);
    return null;
  }
};

export const getAllBlogPosts = () => readPostsFromStorage() || FALLBACK_BLOG_POSTS;

export const getPublishedBlogPosts = () =>
  getAllBlogPosts()
    .filter((post) => post.status === 'published')
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

export const findBlogPost = (slugOrId) =>
  getAllBlogPosts().find(
    (post) => post.id === slugOrId || post.slug === slugOrId
  );

export default FALLBACK_BLOG_POSTS;
