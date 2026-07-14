import React, { useState, useCallback } from 'react';
import EnhancedFileUpload from './EnhancedFileUpload';
import { FaLink, FaPlus, FaTrash } from 'react-icons/fa';
import toast from 'react-hot-toast';

const getEmbedUrl = (url) => {
  if (!url) return null;
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  // Already an embed URL
  if (url.includes('/embed/') || url.includes('player.vimeo.com')) return url;
  return null;
};

const PropertyVideoUpload = ({
  propertyId,
  onVideosChange,
  initialVideos = [],
  maxVideos = 5,
  disabled = false,
  className = ''
}) => {
  const [embedUrl, setEmbedUrl] = useState('');

  // Separate file uploads from embed URLs
  const fileVideos = initialVideos.filter(v => !v.isEmbed && !v.embedUrl);
  const embedVideos = initialVideos.filter(v => v.isEmbed || v.embedUrl);

  const handleFilesChange = useCallback((files) => {
    onVideosChange([...files, ...embedVideos]);
  }, [onVideosChange, embedVideos]);

  const handleAddEmbed = () => {
    if (!embedUrl.trim()) return;
    const normalized = getEmbedUrl(embedUrl.trim());
    if (!normalized) {
      toast.error('Invalid URL. Please paste a YouTube or Vimeo link.', { duration: 4000 });
      return;
    }
    if (embedVideos.length >= maxVideos) {
      toast.error(`Maximum ${maxVideos} videos allowed.`);
      return;
    }
    const newEmbed = {
      url: normalized,
      embedUrl: normalized,
      name: 'Embedded Video',
      isEmbed: true,
      type: 'embed'
    };
    onVideosChange([...fileVideos, ...embedVideos, newEmbed]);
    setEmbedUrl('');
    toast.success('Video embed added!');
  };

  const handleRemoveEmbed = (index) => {
    const updated = embedVideos.filter((_, i) => i !== index);
    onVideosChange([...fileVideos, ...updated]);
  };

  const totalCount = fileVideos.length + embedVideos.length;

  return (
    <div className={className}>
      <EnhancedFileUpload
        propertyId={propertyId}
        onFilesChange={handleFilesChange}
        initialFiles={fileVideos}
        maxFiles={maxVideos}
        maxSize={10 * 1024 * 1024} // 10MB — matches Cloudinary free plan limit
        allowedTypes={['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime']}
        type="video"
        disabled={disabled || totalCount >= maxVideos}
      />

      {/* Embed URL Section */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-sm text-gray-600 mb-2">
          Or paste a YouTube / Vimeo link (no upload size limit):
        </p>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <FaLink className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <input
              type="url"
              value={embedUrl}
              onChange={(e) => setEmbedUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddEmbed()}
              placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
              disabled={disabled || totalCount >= maxVideos}
              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            />
          </div>
          <button
            type="button"
            onClick={handleAddEmbed}
            disabled={!embedUrl.trim() || disabled || totalCount >= maxVideos}
            className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm flex items-center gap-1"
          >
            <FaPlus size={12} />
            Add
          </button>
        </div>
      </div>

      {/* Embed list */}
      {embedVideos.length > 0 && (
        <div className="mt-3 space-y-2">
          {embedVideos.map((embed, index) => (
            <div key={`embed-${index}`} className="flex items-center justify-between p-2 bg-white rounded border border-gray-200 text-sm">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-blue-600 flex-shrink-0">🔗</span>
                <span className="text-gray-700 truncate">{embed.url}</span>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveEmbed(index)}
                className="text-red-500 hover:text-red-700 p-1 flex-shrink-0"
                title="Remove"
              >
                <FaTrash size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {totalCount >= maxVideos && (
        <p className="text-xs text-amber-600 mt-2">Maximum {maxVideos} videos reached.</p>
      )}
    </div>
  );
};

export default PropertyVideoUpload;
