import React from 'react';

const PropertyCardSkeleton = ({ count = 1 }) => {
  const skeletons = Array.from({ length: count }, (_, i) => (
    <div key={i} className="bg-white rounded-xl shadow-md overflow-hidden animate-pulse">
      {/* Image skeleton */}
      <div className="w-full h-48 bg-gray-300"></div>
      
      {/* Content skeleton */}
      <div className="p-6">
        {/* Price skeleton */}
        <div className="h-8 w-32 bg-gray-300 rounded mb-3"></div>
        
        {/* Title skeleton */}
        <div className="h-6 w-full bg-gray-300 rounded mb-2"></div>
        <div className="h-6 w-3/4 bg-gray-300 rounded mb-4"></div>
        
        {/* Location skeleton */}
        <div className="h-4 w-2/3 bg-gray-300 rounded mb-4"></div>
        
        {/* Features skeleton */}
        <div className="flex items-center space-x-4 mb-4">
          <div className="h-4 w-16 bg-gray-300 rounded"></div>
          <div className="h-4 w-16 bg-gray-300 rounded"></div>
          <div className="h-4 w-16 bg-gray-300 rounded"></div>
        </div>
        
        {/* Description skeleton */}
        <div className="space-y-2 mb-4">
          <div className="h-4 w-full bg-gray-300 rounded"></div>
          <div className="h-4 w-5/6 bg-gray-300 rounded"></div>
        </div>
        
        {/* Button skeleton */}
        <div className="h-10 w-full bg-gray-300 rounded"></div>
      </div>
    </div>
  ));

  return <>{skeletons}</>;
};

export default PropertyCardSkeleton;

