import React, { useState, useEffect } from 'react';
import { useEscrow } from '../contexts/EscrowContext';
import { 
  FaBell, 
  FaTimes, 
  FaCheck, 
  FaExclamationTriangle,
  FaClock,
  FaShieldAlt,
  FaDollarSign,
  FaHome,
  FaUser
} from 'react-icons/fa';

const EscrowNotifications = ({ userRole = 'buyer' }) => {
  const { escrowTransactions, getEscrowTimer } = useEscrow();
  const [notifications, setNotifications] = useState([]);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    generateNotifications();
  }, [escrowTransactions, userRole]);

  const generateNotifications = () => {
    const newNotifications = [];
    const now = new Date();

    escrowTransactions.forEach(transaction => {
      // Filter transactions based on user role
      const isRelevant = userRole === 'buyer' 
        ? transaction.buyerId === '1' 
        : userRole === 'vendor' 
        ? transaction.sellerId === '2'
        : true; // admin sees all

      if (!isRelevant) return;

      // Payment confirmation needed (buyer)
      if (userRole === 'buyer' && ['in_escrow', 'funded'].includes(transaction.status)) {
        const timer = getEscrowTimer(transaction.confirmationDeadline);
        if (!timer.expired) {
          newNotifications.push({
            id: `confirm-${transaction.id}`,
            type: 'warning',
            title: 'Property Confirmation Required',
            message: `You have ${timer.days} days to confirm possession of ${transaction.propertyTitle}`,
            transactionId: transaction.id,
            priority: 'high',
            timestamp: new Date(),
            action: 'confirm'
          });
        }
      }

      // Payment received (vendor)
      if (userRole === 'vendor' && transaction.status === 'funded') {
        newNotifications.push({
          id: `payment-${transaction.id}`,
          type: 'success',
          title: 'Payment Received',
          message: `Payment of ₦${transaction.amount.toLocaleString()} received for ${transaction.propertyTitle}`,
          transactionId: transaction.id,
          priority: 'high',
          timestamp: new Date(transaction.paymentDate),
          action: 'view'
        });
      }

      // Dispute filed (vendor/admin)
      if ((userRole === 'vendor' || userRole === 'admin') && transaction.status === 'disputed') {
        newNotifications.push({
          id: `dispute-${transaction.id}`,
          type: 'error',
          title: 'Dispute Filed',
          message: `A dispute has been filed for ${transaction.propertyTitle}`,
          transactionId: transaction.id,
          priority: 'urgent',
          timestamp: new Date(),
          action: userRole === 'admin' ? 'resolve' : 'view'
        });
      }

      // Auto-release triggered (buyer/vendor)
      if (transaction.status === 'auto_released') {
        newNotifications.push({
          id: `auto-release-${transaction.id}`,
          type: 'info',
          title: 'Funds Auto-Released',
          message: `Funds for ${transaction.propertyTitle} have been automatically released to vendor`,
          transactionId: transaction.id,
          priority: 'medium',
          timestamp: new Date(),
          action: 'view'
        });
      }

      // Transaction completed (both parties)
      if (transaction.status === 'completed') {
        newNotifications.push({
          id: `completed-${transaction.id}`,
          type: 'success',
          title: 'Transaction Completed',
          message: `Transaction for ${transaction.propertyTitle} has been completed successfully`,
          transactionId: transaction.id,
          priority: 'medium',
          timestamp: new Date(),
          action: 'view'
        });
      }
    });

    // Sort by priority and timestamp
    newNotifications.sort((a, b) => {
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      return new Date(b.timestamp) - new Date(a.timestamp);
    });

    setNotifications(newNotifications);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success': return <FaCheck className="h-5 w-5 text-green-600" />;
      case 'warning': return <FaClock className="h-5 w-5 text-yellow-600" />;
      case 'error': return <FaExclamationTriangle className="h-5 w-5 text-red-600" />;
      case 'info': return <FaShieldAlt className="h-5 w-5 text-blue-600" />;
      default: return <FaBell className="h-5 w-5 text-gray-600" />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'success': return 'border-l-green-500 bg-green-50';
      case 'warning': return 'border-l-yellow-500 bg-yellow-50';
      case 'error': return 'border-l-red-500 bg-red-50';
      case 'info': return 'border-l-blue-500 bg-blue-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  const handleNotificationAction = (notification) => {
    // In a real app, this would navigate to the appropriate page or open a modal
    console.log('Notification action:', notification.action, notification.transactionId);
  };

  const displayedNotifications = showAll ? notifications : notifications.slice(0, 5);
  const unreadCount = notifications.filter(n => n.priority === 'urgent' || n.priority === 'high').length;

  if (notifications.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center">
          <FaBell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Notifications</h3>
          <p className="text-gray-600">
            {userRole === 'buyer' && 'You\'re all caught up! No pending actions required.'}
            {userRole === 'vendor' && 'No new notifications at this time.'}
            {userRole === 'admin' && 'No disputes or urgent matters require attention.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FaBell className="h-6 w-6 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Escrow Notifications</h3>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          {notifications.length > 5 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="text-brand-blue hover:text-blue-700 text-sm font-medium"
            >
              {showAll ? 'Show Less' : `Show All (${notifications.length})`}
            </button>
          )}
        </div>
      </div>

      <div className="divide-y divide-gray-200">
        {displayedNotifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-6 border-l-4 ${getNotificationColor(notification.type)} hover:bg-gray-50 transition-colors`}
          >
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 mt-1">
                {getNotificationIcon(notification.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-gray-900">
                    {notification.title}
                  </h4>
                  <div className="flex items-center space-x-2">
                    {notification.priority === 'urgent' && (
                      <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                        Urgent
                      </span>
                    )}
                    {notification.priority === 'high' && (
                      <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded-full">
                        High
                      </span>
                    )}
                    <span className="text-xs text-gray-500">
                      {new Date(notification.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mb-3">
                  {notification.message}
                </p>
                
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleNotificationAction(notification)}
                    className="text-brand-blue hover:text-blue-700 text-sm font-medium"
                  >
                    {notification.action === 'confirm' && 'Confirm Property'}
                    {notification.action === 'resolve' && 'Resolve Dispute'}
                    {notification.action === 'view' && 'View Details'}
                  </button>
                  
                  <button className="text-gray-400 hover:text-gray-600 text-sm">
                    <FaTimes className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {notifications.length > 5 && !showAll && (
        <div className="p-4 bg-gray-50 text-center">
          <button
            onClick={() => setShowAll(true)}
            className="text-brand-blue hover:text-blue-700 text-sm font-medium"
          >
            View {notifications.length - 5} more notifications
          </button>
        </div>
      )}
    </div>
  );
};

export default EscrowNotifications;
