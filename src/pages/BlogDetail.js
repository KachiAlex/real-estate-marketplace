import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { FaArrowLeft, FaCalendar, FaTag } from 'react-icons/fa';
import BlogCard from '../components/BlogCard';
import { findBlogPost, getPublishedBlogPosts } from '../data/blogPosts';
import { fetchBlogBySlug, fetchRelatedBlogs } from '../api/blog';

const formatDate = (date) =>
  date
    ? new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : '';

const FALLBACK_POSTS = getPublishedBlogPosts();

const BlogDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(() => findBlogPost(slug));
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [usingFallback, setUsingFallback] = useState(!post);

  useEffect(() => {
    let isMounted = true;

    const buildFallbackRelated = (currentPost) =>
      FALLBACK_POSTS.filter((p) => p.id !== currentPost?.id).slice(0, 3);

    const loadBlog = async () => {
      setLoading(true);
      setError('');
      try {
        const remotePost = await fetchBlogBySlug(slug);
        if (!isMounted) return;

        if (remotePost) {
          setPost(remotePost);
          setUsingFallback(false);
          const remoteRelated = await fetchRelatedBlogs(remotePost.slug, { limit: 3 });
          if (!isMounted) return;
          if (remoteRelated.length > 0) {
            setRelatedPosts(remoteRelated);
          } else {
            setRelatedPosts(buildFallbackRelated(remotePost));
          }
        } else {
          const fallbackPost = findBlogPost(slug);
          if (fallbackPost) {
            setPost(fallbackPost);
            setUsingFallback(true);
            setError('Showing sample article while we reconnect to the blog service.');
            setRelatedPosts(buildFallbackRelated(fallbackPost));
          } else {
            setPost(null);
            setRelatedPosts([]);
            setError('Article not found');
          }
        }
      } catch (err) {
        console.warn('Failed to load blog post, using fallback data', err);
        if (!isMounted) return;
        const fallbackPost = findBlogPost(slug);
        if (fallbackPost) {
          setPost(fallbackPost);
          setUsingFallback(true);
          setError('Showing sample article while we reconnect to the blog service.');
          setRelatedPosts(buildFallbackRelated(fallbackPost));
        } else {
          setPost(null);
          setRelatedPosts([]);
          setError('Article not found');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadBlog();
    return () => {
      isMounted = false;
    };
  }, [slug]);

  const paragraphs = useMemo(() => post?.content?.split(/\n{2,}/).filter(Boolean) || [], [post?.content]);
  const morePosts = useMemo(() => relatedPosts, [relatedPosts]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl p-10 max-w-lg w-full text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-gray-400 mb-4">Blog</p>
          <h1 className="text-2xl font-semibold text-gray-900 mb-3">Loading article...</h1>
          <p className="text-gray-500">Fetching the latest details for you.</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl p-10 max-w-lg w-full text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-gray-400 mb-4">Blog</p>
          <h1 className="text-3xl font-semibold text-gray-900 mb-3">Article not found</h1>
          <p className="text-gray-500 mb-8">
            {error || 'The article you are looking for may have been unpublished or moved. Please return to the blog to explore our latest insights.'}
          </p>
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-brand-orange text-white font-semibold hover:bg-orange-600 transition-colors"
          >
            Back to all articles
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <header className="bg-gradient-to-b from-brand-orange/90 to-brand-orange text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-white/80 hover:text-white transition mb-8"
          >
            <FaArrowLeft size={14} />
            Back
          </button>
          <p className="text-sm uppercase tracking-[0.3em] text-white/70">{post.category}</p>
          <h1 className="mt-5 text-4xl sm:text-5xl font-bold leading-tight">{post.title}</h1>
          <div className="mt-6 flex flex-wrap items-center gap-4 text-white/80 text-sm">
            <span className="inline-flex items-center gap-2">
              <FaCalendar size={14} />
              {formatDate(post.publishedAt)}
            </span>
            <span className="inline-flex items-center gap-2">
              <FaTag size={14} />
              {post.category}
            </span>
          </div>
          {usingFallback && (
            <p className="mt-4 text-sm text-white/80">
              Showing sample article while we reconnect to the live blog feed.
            </p>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <article className="bg-white rounded-3xl shadow-xl p-8 sm:p-12 border border-gray-100">
          {paragraphs.map((paragraph, index) => (
            <p key={index} className="text-lg leading-relaxed text-gray-700 mb-6">
              {paragraph}
            </p>
          ))}
        </article>

        {morePosts.length > 0 && (
          <section className="mt-16">
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="text-sm uppercase tracking-[0.4em] text-brand-orange">More Articles</p>
                <h2 className="mt-2 text-2xl font-semibold text-gray-900">You might also like</h2>
              </div>
              <Link to="/blog" className="text-brand-orange font-semibold hover:text-orange-600 transition">
                View all
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {morePosts.map((relatedPost) => (
                <BlogCard key={relatedPost.id} post={relatedPost} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default BlogDetail;
