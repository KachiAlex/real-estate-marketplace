import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import BlogCard from '../components/BlogCard';
import { getAllBlogPosts, getPublishedBlogPosts } from '../data/blogPosts';

const Blog = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = useMemo(() => {
    const allPosts = getAllBlogPosts();
    const categorySet = new Set(allPosts.map((post) => post.category).filter(Boolean));
    return ['all', ...Array.from(categorySet)];
  }, []);

  const filteredPosts = useMemo(() => {
    const posts = getPublishedBlogPosts();
    if (selectedCategory === 'all') return posts;
    return posts.filter((post) => post.category === selectedCategory);
  }, [selectedCategory]);

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

        {filteredPosts.length === 0 ? (
          <div className="text-center bg-white border border-dashed border-gray-200 rounded-2xl py-16">
            <p className="text-gray-500">No articles available in this category yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>
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
