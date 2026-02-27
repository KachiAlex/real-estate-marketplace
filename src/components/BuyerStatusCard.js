import React from 'react';
import { FaShoppingCart, FaHeart, FaSearch, FaBell, FaChartLine } from 'react-icons/fa';

const BuyerStatusCard = ({ onBecomeBuyer }) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Buyer Status</h3>
        <div className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
          Not a Buyer
        </div>
      </div>
      
      <div className="text-sm text-gray-600 mb-4">
        <p>Unlock buyer features to explore and invest in properties</p>
      </div>

      <div className="space-y-3 mb-6">
        <div className="flex items-center gap-3 text-sm">
          <FaHeart className="text-red-500" />
          <span>Save properties to wishlist</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <FaSearch className="text-blue-500" />
          <span>Make property inquiries</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <FaBell className="text-green-500" />
          <span>Get personalized recommendations</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <FaChartLine className="text-purple-500" />
          <span>Access investment opportunities</span>
        </div>
      </div>

      <button
        onClick={onBecomeBuyer}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
      >
        Become a Buyer
      </button>
    </div>
  );
};

export default BuyerStatusCard;
