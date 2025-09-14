import React from 'react';
import { 
  FaDollarSign, 
  FaChartLine, 
  FaCalendarAlt, 
  FaDownload,
  FaEye,
  FaFilter
} from 'react-icons/fa';

const VendorEarnings = () => {
  // Mock data for earnings
  const earningsData = {
    totalEarnings: 125000,
    monthlyEarnings: 8500,
    pendingPayouts: 3200,
    completedTransactions: 45
  };

  const recentTransactions = [
    {
      id: 1,
      property: 'Luxury Villa in Ikoyi',
      buyer: 'John Smith',
      amount: 15000,
      commission: 1500,
      date: '2024-01-15',
      status: 'Completed'
    },
    {
      id: 2,
      property: 'Modern Apartment in Victoria Island',
      buyer: 'Sarah Johnson',
      amount: 12000,
      commission: 1200,
      date: '2024-01-12',
      status: 'Pending'
    },
    {
      id: 3,
      property: 'Penthouse in Lekki',
      buyer: 'Michael Brown',
      amount: 25000,
      commission: 2500,
      date: '2024-01-10',
      status: 'Completed'
    }
  ];

  const monthlyStats = [
    { month: 'Jan', earnings: 8500 },
    { month: 'Dec', earnings: 7200 },
    { month: 'Nov', earnings: 6800 },
    { month: 'Oct', earnings: 9200 }
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Earnings Dashboard</h1>
        <p className="text-gray-600">Track your property sales commissions and earnings</p>
      </div>

      {/* Earnings Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Earnings</p>
              <p className="text-2xl font-bold text-green-600">₦{earningsData.totalEarnings.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FaDollarSign className="text-green-600 text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-blue-600">₦{earningsData.monthlyEarnings.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FaCalendarAlt className="text-blue-600 text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Payouts</p>
              <p className="text-2xl font-bold text-orange-600">₦{earningsData.pendingPayouts.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <FaChartLine className="text-orange-600 text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed Sales</p>
              <p className="text-2xl font-bold text-purple-600">{earningsData.completedTransactions}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <FaEye className="text-purple-600 text-xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Earnings Chart */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Monthly Earnings Trend</h2>
          <div className="flex space-x-2">
            <button className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
              <FaFilter className="h-4 w-4" />
              <span>Filter</span>
            </button>
            <button className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-white bg-brand-blue rounded-lg hover:bg-blue-700">
              <FaDownload className="h-4 w-4" />
              <span>Export</span>
            </button>
          </div>
        </div>
        
        <div className="h-64 flex items-end space-x-4">
          {monthlyStats.map((stat, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div 
                className="w-full bg-gradient-to-t from-brand-blue to-blue-400 rounded-t-lg mb-2"
                style={{ height: `${(stat.earnings / 10000) * 200}px` }}
              ></div>
              <p className="text-sm font-medium text-gray-600">{stat.month}</p>
              <p className="text-xs text-gray-500">₦{stat.earnings.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Recent Transactions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Buyer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commission</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentTransactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{transaction.property}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{transaction.buyer}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">₦{transaction.amount.toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-green-600">₦{transaction.commission.toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{transaction.date}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      transaction.status === 'Completed' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {transaction.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default VendorEarnings;
