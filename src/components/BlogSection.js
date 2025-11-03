import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

const BlogSection = () => {
  const [featuredBlogs, setFeaturedBlogs] = useState([]);
  const [recentBlogs, setRecentBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBlogData();
  }, []);

  const loadBlogData = async () => {
    try {
      setLoading(true);
      
      const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api-kzs3jdpe7a-uc.a.run.app';
      
      try {
        // Fetch featured blogs
        const featuredResponse = await fetch(`${API_BASE_URL}/api/blog?featured=true&limit=3&sort=newest`);
        let featuredBlogsList = [];
        
        if (!featuredResponse.ok) {
          // API not available - silently continue
        } else {
          const contentType = featuredResponse.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            console.warn('Featured blogs response is not JSON');
          } else {
            const featuredData = await featuredResponse.json();
            if (featuredData.success && featuredData.data) {
              // Backend returns data as array directly, not data.blogs
              featuredBlogsList = Array.isArray(featuredData.data) 
                ? featuredData.data 
                : (featuredData.data.blogs || []);
            }
          }
        }
        setFeaturedBlogs(featuredBlogsList);
        
        // Fetch recent blogs
        const recentResponse = await fetch(`${API_BASE_URL}/api/blog?limit=4&sort=newest`);
        
        if (!recentResponse.ok) {
          // API not available - silently continue
          setRecentBlogs([]);
        } else {
          const contentType = recentResponse.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            console.warn('Recent blogs response is not JSON');
            setRecentBlogs([]);
          } else {
            const recentData = await recentResponse.json();
            if (recentData.success && recentData.data) {
              // Backend returns data as array directly, not data.blogs
              const recentBlogsList = Array.isArray(recentData.data) 
                ? recentData.data 
                : (recentData.data.blogs || []);
              // Filter out featured blogs from recent blogs
              const featuredIds = featuredBlogsList.map(b => b._id || b.id);
              const filteredRecent = recentBlogsList.filter(b => !featuredIds.includes(b._id || b.id));
              setRecentBlogs(filteredRecent.slice(0, 4));
            } else {
              setRecentBlogs([]);
            }
          }
        }
      } catch (apiError) {
        // Silently fail - API may not be available, that's okay
        // Component will just show empty state or not render blog section
        setFeaturedBlogs([]);
        setRecentBlogs([]);
      }
    } catch (error) {
      console.error('Error loading blog data:', error);
      setFeaturedBlogs([]);
      setRecentBlogs([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };

  const getCategoryName = (categorySlug) => {
    const categoryNames = {
      'real-estate-tips': 'Real Estate Tips',
      'market-news': 'Market News',
      'investment-guides': 'Investment Guides',
      'property-showcase': 'Property Showcase',
      'legal-advice': 'Legal Advice',
      'home-improvement': 'Home Improvement',
      'neighborhood-spotlight': 'Neighborhood Spotlight',
      'buyer-guides': 'Buyer Guides',
      'seller-guides': 'Seller Guides',
      'rental-advice': 'Rental Advice',
      'mortgage-financing': 'Mortgage & Financing',
      'property-management': 'Property Management'
    };
    return categoryNames[categorySlug] || categorySlug;
  };

  if (loading) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-64 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-96 mx-auto mb-12"></div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-200"></div>
                <div className="p-6">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Real Estate Trends & Reports
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Stay informed with the latest real estate trends, market reports, 
            investment tips, and expert advice from industry professionals.
          </p>
          <Link
            to="/blog"
            className="inline-flex items-center px-6 py-3 mt-6 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            View All Articles
            <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Featured Posts */}
        {featuredBlogs.length > 0 && (
          <div className="mb-12">
            <h3 className="text-2xl font-semibold text-gray-900 mb-8">Featured Articles</h3>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {featuredBlogs.map((blog, index) => (
                <article key={blog._id || blog.id} className={`${index === 0 ? 'lg:col-span-2' : ''} bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow`}>
                                    <Link to={`/blog/${blog.slug}`}>
                    <div className="relative">
                      <img
                        src={blog.featuredImage?.url || blog.featuredImage || 'https://via.placeholder.com/800x600?text=Real+Estate'}
                        alt={blog.title}
                        className={`w-full object-cover ${index === 0 ? 'h-64' : 'h-48'}`}
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/800x600?text=Real+Estate';
                        }}
                        loading="lazy"
                      />
                    <div className="absolute top-4 left-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Featured
                      </span>
                    </div>
                  </div>
                </Link>
                
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {getCategoryName(blog.category)}
                    </span>
                    <span className="text-sm text-gray-500">
                      {blog.readTime || 5} min read
                    </span>
                  </div>

                  <Link to={`/blog/${blog.slug}`}>
                    <h4 className={`font-semibold text-gray-900 mb-3 hover:text-blue-600 transition-colors ${index === 0 ? 'text-xl' : 'text-lg'} line-clamp-2`}>
                      {blog.title}
                    </h4>
                  </Link>

                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {blog.excerpt}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden">
                        {blog.author?.avatar ? (
                          <img src={blog.author.avatar} alt={blog.author.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-blue-600 font-semibold text-sm">
                            {blog.author?.name?.charAt(0) || 'A'}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {blog.author?.name || 'Anonymous'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDate(blog.publishedAt || blog.publishDate || blog.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span>{blog.views || 0}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        <span>{blog.likes || 0}</span>
                      </div>
                    </div>
                  </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {/* Recent Posts */}
        {recentBlogs.length > 0 && (
          <div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-8">Latest Articles</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {recentBlogs.map((blog) => (
                <article key={blog._id || blog.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  <Link to={`/blog/${blog.slug}`}>
                    <img
                      src={blog.featuredImage?.url || blog.featuredImage || 'https://via.placeholder.com/400x250?text=Real+Estate'}
                      alt={blog.title}
                      className="w-full h-40 object-cover"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/400x250?text=Real+Estate';
                      }}
                      loading="lazy"
                    />
                  </Link>
                  
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        {getCategoryName(blog.category)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {blog.readTime || 5} min
                      </span>
                    </div>

                    <Link to={`/blog/${blog.slug}`}>
                      <h4 className="font-medium text-gray-900 mb-2 hover:text-blue-600 transition-colors line-clamp-2">
                        {blog.title}
                      </h4>
                    </Link>

                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {blog.excerpt}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden">
                          {blog.author?.avatar ? (
                            <img src={blog.author.avatar} alt={blog.author.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-blue-600 font-semibold text-xs">
                              {blog.author?.name?.charAt(0) || 'A'}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {blog.author?.name || 'Anonymous'}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatDate(blog.publishedAt || blog.publishDate || blog.createdAt)}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {/* Call to Action */}
        <div className="mt-12 text-center">
          <div className="bg-blue-600 rounded-lg p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">
              Want to stay updated with real estate trends & reports?
            </h3>
            <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
              Subscribe to our newsletter and get the latest market trends, 
              property reports, and investment opportunities delivered to your inbox.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email address"
                className="flex-1 px-4 py-3 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-300 focus:outline-none"
              />
              <button className="px-6 py-3 bg-white text-blue-600 font-medium rounded-lg hover:bg-gray-100 transition-colors">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BlogSection;
