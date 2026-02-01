import React, { useState, useEffect } from 'react';
import { FaBell, FaComments } from 'react-icons/fa';

const ChatNotificationBadge = ({ unreadCount = 0, urgentCount = 0 }) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (unreadCount > 0) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [unreadCount]);

  const totalNotifications = unreadCount + urgentCount;

  return (
    <div className="relative">
      <FaComments className="text-xl" />
      {totalNotifications > 0 && (
        <>
          {/* Badge */}
          <span 
            className={`absolute -top-2 -right-2 min-w-[20px] h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-semibold ${
              isAnimating ? 'animate-bounce' : ''
            }`}
          >
            {totalNotifications > 99 ? '99+' : totalNotifications}
          </span>
          
          {/* Pulse effect for urgent messages */}
          {urgentCount > 0 && (
            <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-25"></div>
          )}
        </>
      )}
    </div>
  );
};

export default ChatNotificationBadge;
