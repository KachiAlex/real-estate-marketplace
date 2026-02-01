/**
 * Pagination Middleware
 * Standardizes pagination across all routes
 */

/**
 * Parse and validate pagination parameters
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const paginationMiddleware = (req, res, next) => {
  // Parse page number (default: 1)
  const page = parseInt(req.query.page) || 1;
  
  // Parse limit (default: 12, max: 100)
  let limit = parseInt(req.query.limit) || 12;
  limit = Math.min(limit, 100); // Cap at 100 items per page
  
  // Calculate skip value
  const skip = (page - 1) * limit;
  
  // Attach to request object
  req.pagination = {
    page,
    limit,
    skip
  };
  
  next();
};

/**
 * Generate pagination metadata
 * @param {Number} total - Total number of items
 * @param {Number} page - Current page
 * @param {Number} limit - Items per page
 * @returns {Object} Pagination metadata
 */
const generatePaginationMeta = (total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;
  
  return {
    currentPage: page,
    totalPages,
    totalItems: total,
    itemsPerPage: limit,
    hasNextPage,
    hasPrevPage,
    nextPage: hasNextPage ? page + 1 : null,
    prevPage: hasPrevPage ? page - 1 : null
  };
};

/**
 * Send paginated response
 * @param {Object} res - Express response object
 * @param {Array} data - Array of data items
 * @param {Number} total - Total number of items
 * @param {Object} pagination - Pagination params from req.pagination
 * @param {Object} additionalData - Any additional data to include in response
 */
const sendPaginatedResponse = (res, data, total, pagination, additionalData = {}) => {
  const meta = generatePaginationMeta(total, pagination.page, pagination.limit);
  
  res.json({
    success: true,
    data,
    pagination: meta,
    ...additionalData
  });
};

module.exports = {
  paginationMiddleware,
  generatePaginationMeta,
  sendPaginatedResponse
};

