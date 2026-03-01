import React from 'react';
import { FaCalendar, FaTag, FaEdit, FaTrash } from 'react-icons/fa';

const BlogCard = ({ post, onEdit, onDelete, isEditable = false }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'published':
        return 'bg-emerald-100 text-emerald-700';
      case 'draft':
        return 'bg-amber-100 text-amber-700';
      case 'scheduled':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-5 border border-gray-100">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900 flex-1 pr-2">{post?.title || 'Blog Post'}</h3>
        {isEditable && (
          <div className="flex gap-2">
            {onEdit && (
              <button
                onClick={() => onEdit(post)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                title="Edit post"
              >
                <FaEdit size={16} />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(post.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                title="Delete post"
              >
                <FaTrash size={16} />
              </button>
            )}
          </div>
        )}
      </div>

      <p className="text-sm text-gray-600 mb-4 line-clamp-2">{post?.excerpt || ''}</p>

      <div className="flex flex-wrap gap-2 mb-4">
        <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(post?.status)}`}>
          <FaTag size={12} />
          {post?.category || 'General'}
        </span>
        <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(post?.status)}`}>
          {post?.status ? post.status.charAt(0).toUpperCase() + post.status.slice(1) : 'Draft'}
        </span>
      </div>

      {post?.publishedAt && (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <FaCalendar size={12} />
          <span>{formatDate(post.publishedAt)}</span>
        </div>
      )}
    </div>
  );
};

export default BlogCard;
