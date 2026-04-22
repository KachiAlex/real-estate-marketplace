import React from 'react';
import { Link } from 'react-router-dom';
import { FaHeart, FaSearch, FaBell, FaChartLine, FaListUl } from 'react-icons/fa';

const defaultBenefits = [
  { icon: FaHeart, label: 'Save properties to wishlist', className: 'text-red-500' },
  { icon: FaSearch, label: 'Make property inquiries', className: 'text-blue-500' },
  { icon: FaBell, label: 'Get personalized recommendations', className: 'text-green-500' },
  { icon: FaChartLine, label: 'Access investment opportunities', className: 'text-purple-500' }
];

const formatList = (items = []) => (items.length ? items.join(', ') : 'Not set yet');

const BuyerStatusCard = ({
  isBuyer = false,
  preferences = {},
  buyerSince,
  onBecomeBuyer,
  onManagePreferences
}) => {
  const statusLabel = isBuyer ? 'Active Buyer' : 'Not a Buyer';
  const statusStyles = isBuyer ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Buyer Status</h3>
        <div className={`${statusStyles} px-2 py-1 rounded-full text-xs font-medium`}>{statusLabel}</div>
      </div>

      {isBuyer ? (
        <div className="space-y-4 text-sm text-gray-600">
          {buyerSince && (
            <p className="text-xs text-gray-500">Buyer since {new Date(buyerSince).toLocaleDateString()}</p>
          )}
          <div>
            <div className="text-xs uppercase tracking-wide text-gray-500">Preferred property types</div>
            <div className="font-medium text-gray-900">{formatList(preferences.propertyTypes)}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-gray-500">Budget range</div>
            <div className="font-medium text-gray-900">{preferences.budgetRange || 'Not set yet'}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-gray-500">Preferred locations</div>
            <div className="font-medium text-gray-900">{formatList(preferences.locations)}</div>
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={onManagePreferences}
              className="w-full inline-flex items-center justify-center gap-2 border border-blue-200 text-blue-600 hover:bg-blue-50 font-medium py-2 px-4 rounded-md"
            >
              <FaListUl /> Update preferences
            </button>
            <Link
              to="/saved-properties"
              className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
            >
              Go to buyer tools
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="text-sm text-gray-600 mb-4">
            <p>Unlock buyer features to explore and invest in properties</p>
          </div>

          <div className="space-y-3 mb-6">
            {defaultBenefits.map(({ icon: Icon, label, className }) => (
              <div key={label} className="flex items-center gap-3 text-sm">
                <Icon className={className} />
                <span>{label}</span>
              </div>
            ))}
          </div>

          <button
            onClick={onBecomeBuyer}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            Become a Buyer
          </button>
        </>
      )}
    </div>
  );
};

export default BuyerStatusCard;
