import React from 'react';

const TableSkeleton = ({ rows = 5, columns = 4 }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Table header skeleton */}
      <div className="border-b border-gray-200 bg-gray-50">
        <div className="grid gap-4 p-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }, (_, i) => (
            <div key={i} className="h-4 w-24 bg-gray-300 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
      
      {/* Table rows skeleton */}
      <div className="divide-y divide-gray-200">
        {Array.from({ length: rows }, (_, rowIndex) => (
          <div key={rowIndex} className="grid gap-4 p-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {Array.from({ length: columns }, (_, colIndex) => (
              <div key={colIndex} className="h-4 bg-gray-200 rounded animate-pulse" style={{ 
                width: colIndex === 0 ? '80%' : colIndex === columns - 1 ? '60%' : '100%',
                animationDelay: `${rowIndex * 50}ms`
              }}></div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TableSkeleton;

