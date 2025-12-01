import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const BlogDetail = () => {
  const { slug } = useParams();
  const { user } = useAuth();
  const [blog, setBlog] = useState(null);
  const [relatedBlogs, setRelatedBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentContent, setCommentContent] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentSuccess, setCommentSuccess] = useState(false);

  useEffect(() => {
    loadBlog();
    loadRelatedBlogs();
  }, [slug]);

  const loadBlog = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/blog/${slug}`);
      const data = await response.json();

      if (data.success) {
        setBlog(data.data);
      }
    } catch (error) {
      console.error('Error loading blog:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRelatedBlogs = async () => {
    try {
      const response = await fetch(`/api/blog/${slug}/related?limit=3`);
      const data = await response.json();

      if (data.success) {
        setRelatedBlogs(data.data);
      }
    } catch (error) {
      console.error('Error loading related blogs:', error);
    }
  };

  const handleLike = async () => {
    try {
      const response = await fetch(`/api/blog/${slug}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success && blog) {
        setBlog(prev => ({
          ...prev,
          likes: data.likes
        }));
      }
    } catch (error) {
      console.error('Error liking blog:', error);
    }
  };

  const handleShare = async () => {
    try {
      const response = await fetch(`/api/blog/${slug}/share`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success && blog) {
        setBlog(prev => ({
          ...prev,
          shares: prev.shares + 1
        }));
      }
    } catch (error) {
      console.error('Error sharing blog:', error);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please login to comment');
      return;
    }

    if (!commentContent.trim()) {
      return;
    }

    try {
      setSubmittingComment(true);
      const response = await fetch(`/api/blog/${slug}/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: commentContent })
      });

      const data = await response.json();
      if (data.success) {
        setCommentContent('');
        setCommentSuccess(true);
        setTimeout(() => setCommentSuccess(false), 3000);
        
        // Reload blog to get updated comments
        loadBlog();
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setSubmittingComment(false);
    }
  };

  const formatDate = (dateString) => {
    return format(new Date(dateString), 'MMMM dd, yyyy');
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Blog Post Not Found</h1>
          <Link to="/blog" className="text-blue-600 hover:text-blue-800">
            ← Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
            <Link to="/" className="hover:text-blue-600">Home</Link>
            <span>→</span>
            <Link to="/blog" className="hover:text-blue-600">Blog</Link>
            <span>→</span>
            <span className="text-gray-900">{blog.title}</span>
          </nav>

          <div className="mb-6">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              {getCategoryName(blog.category)}
            </span>
          </div>

          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {blog.title}
          </h1>

          <p className="text-xl text-gray-600 mb-8">
            {blog.excerpt}
          </p>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img
                src={blog.author.avatar || '/default-avatar.png'}
                alt={blog.author.name}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div>
                <p className="font-medium text-gray-900">{blog.author.name}</p>
                <p className="text-sm text-gray-500">
                  {formatDate(blog.publishedAt)} • {blog.readTime} min read
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={handleLike}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span>{blog.likes}</span>
              </button>

              <button
                onClick={handleShare}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
                <span>{blog.shares}</span>
              </button>

              <div className="flex items-center space-x-1 text-sm text-gray-500">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span>{blog.views} views</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Image */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <img
          src={blog.featuredImage.url}
          alt={blog.featuredImage.alt || blog.title}
          className="w-full h-96 object-cover rounded-lg shadow-lg"
        />
        {blog.featuredImage.caption && (
          <p className="text-sm text-gray-500 text-center mt-2 italic">
            {blog.featuredImage.caption}
          </p>
        )}
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <article className="prose prose-lg max-w-none">
              <div 
                className="blog-content"
                dangerouslySetInnerHTML={{ __html: blog.content }}
              />
            </article>

            {/* Tags */}
            {blog.tags && blog.tags.length > 0 && (
              <div className="mt-8 pt-8 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {blog.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Comments Section */}
            {blog.allowComments && (
              <div className="mt-12 pt-8 border-t border-gray-200">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">
                  Comments ({blog.comments.filter(c => c.isApproved).length})
                </h3>

                {/* Add Comment Form */}
                {user ? (
                  <form onSubmit={handleCommentSubmit} className="mb-8">
                    <div className="bg-white p-6 rounded-lg border border-gray-200">
                      <textarea
                        value={commentContent}
                        onChange={(e) => setCommentContent(e.target.value)}
                        placeholder="Share your thoughts..."
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        required
                      />
                      <div className="flex justify-between items-center mt-4">
                        <p className="text-sm text-gray-500">
                          Comments are moderated and will appear after approval.
                        </p>
                        <button
                          type="submit"
                          disabled={submittingComment || !commentContent.trim()}
                          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {submittingComment ? 'Posting...' : 'Post Comment'}
                        </button>
                      </div>
                      {commentSuccess && (
                        <div className="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                          Comment submitted successfully! It will appear after approval.
                        </div>
                      )}
                    </div>
                  </form>
                ) : (
                  <div className="bg-gray-50 p-6 rounded-lg text-center mb-8">
                    <p className="text-gray-600 mb-4">
                      Please <Link to="/login" className="text-blue-600 hover:text-blue-800">login</Link> to comment.
                    </p>
                  </div>
                )}

                {/* Comments List */}
                <div className="space-y-6">
                  {blog.comments
                    .filter(comment => comment.isApproved)
                    .map((comment) => (
                    <div key={comment._id} className="bg-white p-6 rounded-lg border border-gray-200">
                      <div className="flex items-start space-x-4">
                        <img
                          src={comment.user.avatar || '/default-avatar.png'}
                          alt={comment.user.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className="font-medium text-gray-900">{comment.user.name}</h4>
                            <span className="text-sm text-gray-500">
                              {formatDate(comment.createdAt)}
                            </span>
                          </div>
                          <p className="text-gray-700">{comment.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {blog.comments.filter(c => c.isApproved).length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <p>No comments yet. Be the first to share your thoughts!</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-8">
              {/* Author Info */}
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">About the Author</h3>
                <div className="flex items-start space-x-3">
                  <img
                    src={blog.author.avatar || '/default-avatar.png'}
                    alt={blog.author.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <h4 className="font-medium text-gray-900">{blog.author.name}</h4>
                    <p className="text-sm text-gray-500 mt-1">
                      Real Estate Expert
                    </p>
                  </div>
                </div>
              </div>

              {/* Related Posts */}
              {relatedBlogs.length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Related Posts</h3>
                  <div className="space-y-4">
                    {relatedBlogs.map((relatedBlog) => (
                      <Link
                        key={relatedBlog._id}
                        to={`/blog/${relatedBlog.slug}`}
                        className="block group"
                      >
                        <div className="flex space-x-3">
                          <img
                            src={relatedBlog.featuredImage.url}
                            alt={relatedBlog.featuredImage.alt || relatedBlog.title}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                              {relatedBlog.title}
                            </h4>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatDate(relatedBlog.publishedAt)}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Share Buttons */}
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Share this post</h3>
                <div className="flex space-x-3">
                  <button
                    onClick={handleShare}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                    </svg>
                    <span className="text-sm">Twitter</span>
                  </button>
                  <button
                    onClick={handleShare}
                    className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-800 text-white rounded-lg hover:bg-blue-900 transition-colors"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    <span className="text-sm">Facebook</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogDetail;
