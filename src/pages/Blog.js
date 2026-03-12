import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import BlogCard from '../components/BlogCard';
import { getPublishedBlogPosts } from '../data/blogPosts';
import { fetchPublishedBlogs } from '../api/blog';

const FALLBACK_POSTS = getPublishedBlogPosts();

const Blog = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [posts, setPosts] = useState(FALLBACK_POSTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [usingFallback, setUsingFallback] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadPosts = async () => {
      setLoading(true);
      setError('');
      try {
        const remotePosts = await fetchPublishedBlogs({ limit: 60 });
        if (!isMounted) return;

        if (remotePosts.length > 0) {
          setPosts(remotePosts);
          setUsingFallback(false);
        } else {
          setPosts([]);
          setUsingFallback(false);
          setError('No articles available yet. Check back soon!');
        }
      } catch (err) {
        console.warn('Failed to fetch blog posts, using fallback data', err);
        if (!isMounted) return;
        setPosts(FALLBACK_POSTS);
        setUsingFallback(true);
        setError('Showing sample articles while we reconnect to the blog service.');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadPosts();
    return () => {
      isMounted = false;
    };
  }, []);

  const categories = useMemo(() => {
    const categorySet = new Set(posts.map((post) => post.category).filter(Boolean));
    return ['all', ...Array.from(categorySet)];
  }, [posts]);

  const filteredPosts = useMemo(() => {
    if (selectedCategory === 'all') return posts;
    return posts.filter((post) => post.category === selectedCategory);
  }, [posts, selectedCategory]);

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-gradient-to-r from-brand-orange/90 to-brand-orange text-white py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-white/80">Insights & News</p>
          <h1 className="mt-4 text-4xl sm:text-5xl font-bold">PropertyArk Blog</h1>
          <p className="mt-4 text-lg text-white/90">
            Stay informed with market updates, mortgage intel, and investment playbooks curated by our experts.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-wrap gap-3 justify-center mb-12">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition border ${
                selectedCategory === category
                  ? 'bg-brand-orange text-white border-brand-orange'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-brand-orange/40'
              }`}
            >
              {category === 'all' ? 'All Topics' : category}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center bg-white border border-dashed border-gray-200 rounded-2xl py-16">
            <p className="text-gray-500">Loading the latest insights...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center bg-white border border-dashed border-gray-200 rounded-2xl py-16">
            <p className="text-gray-500">{error || 'No articles available in this category yet.'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>
        )}

        {usingFallback && !loading && (
          <p className="mt-8 text-center text-sm text-gray-500">
            Showing sample articles while we reconnect to the live blog feed.
          </p>
        )}

        <div className="mt-16 flex justify-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-brand-orange font-semibold hover:gap-3 transition-all"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Blog;
