// Blog posts data for the home page

export const blogPosts = [
  {
    id: 1,
    title: 'Getting Started with PropertyArk',
    excerpt: 'Learn how to set up your PropertyArk account and start managing your properties.',
    date: '2024-01-15',
    author: 'PropertyArk Team',
    category: 'Getting Started',
    published: true,
  },
  {
    id: 2,
    title: 'Property Investment Tips',
    excerpt: 'Discover key strategies for successful property investment and portfolio management.',
    date: '2024-01-10',
    author: 'Investment Expert',
    category: 'Investment',
    published: true,
  },
  {
    id: 3,
    title: 'Market Trends 2024',
    excerpt: 'Analysis of current real estate market trends and what they mean for investors.',
    date: '2024-01-05',
    author: 'Market Analyst',
    category: 'Market Analysis',
    published: true,
  },
];

export const getPublishedBlogPosts = () => blogPosts.filter(post => post.published);

export const findBlogPost = (slug) => {
  return blogPosts.find(post => {
    // Create a slug from title for matching
    const postSlug = post.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    
    return postSlug === slug;
  });
};

export default blogPosts;
