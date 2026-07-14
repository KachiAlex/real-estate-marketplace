import React, { useState, useEffect } from 'react';
import { FaClock, FaExclamationTriangle, FaCreditCard } from 'react-icons/fa';

const TrialCountdown = ({ trialEndDate, onExpired, compact = false }) => {
  const [timeRemaining, setTimeRemaining] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    expired: false
  });

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date().getTime();
      const trialEnd = new Date(trialEndDate).getTime();
      const difference = trialEnd - now;

      if (difference <= 0) {
        setTimeRemaining({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          expired: true
        });
        
        if (onExpired) {
          onExpired();
        }
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeRemaining({
        days,
        hours,
        minutes,
        seconds,
        expired: false
      });
    };

    calculateTimeRemaining();
    const timer = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(timer);
  }, [trialEndDate, onExpired]);

  const getUrgencyLevel = () => {
    if (timeRemaining.expired) return 'expired';
    if (timeRemaining.days <= 0) return 'critical';
    if (timeRemaining.days <= 3) return 'urgent';
    if (timeRemaining.days <= 7) return 'warning';
    return 'normal';
  };

  const getUrgencyColors = () => {
    const level = getUrgencyLevel();
    switch (level) {
      case 'expired':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'critical':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'urgent':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'warning':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  const getUrgencyIcon = () => {
    const level = getUrgencyLevel();
    switch (level) {
      case 'expired':
      case 'critical':
        return <FaExclamationTriangle className="text-red-500" />;
      case 'urgent':
        return <FaExclamationTriangle className="text-orange-500" />;
      case 'warning':
        return <FaClock className="text-yellow-500" />;
      default:
        return <FaClock className="text-blue-500" />;
    }
  };

  const getUrgencyMessage = () => {
    const level = getUrgencyLevel();
    switch (level) {
      case 'expired':
        return 'Trial expired - Account suspended';
      case 'critical':
        return 'Trial expires today - Pay now!';
      case 'urgent':
        return `Trial expires in ${timeRemaining.days} day${timeRemaining.days !== 1 ? 's' : ''}`;
      case 'warning':
        return `Trial expires in ${timeRemaining.days} days`;
      default:
        return `Free trial - ${timeRemaining.days} days remaining`;
    }
  };

  const formatTime = (value) => {
    return value.toString().padStart(2, '0');
  };

  const handlePayment = () => {
    // Navigate to subscription dashboard
    window.location.href = '/dashboard?tab=subscription';
  };

  if (compact) {
    return (
      <div className={`flex items-center px-3 py-2 rounded-lg border ${getUrgencyColors()}`}>
        {getUrgencyIcon()}
        <span className="ml-2 text-sm font-medium">{getUrgencyMessage()}</span>
        {getUrgencyLevel() === 'critical' && (
          <button
            onClick={handlePayment}
            className="ml-auto bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700 transition-colors"
          >
            <FaCreditCard className="inline mr-1" />
            Pay Now
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`rounded-lg border p-6 ${getUrgencyColors()}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          {getUrgencyIcon()}
          <h3 className="ml-3 font-semibold">Trial Period</h3>
        </div>
        
        {getUrgencyLevel() === 'critical' && (
          <button
            onClick={handlePayment}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            <FaCreditCard className="inline mr-2" />
            Pay Now
          </button>
        )}
      </div>

      <div className="text-center mb-4">
        <p className="text-lg font-medium mb-2">{getUrgencyMessage()}</p>
        
        {!timeRemaining.expired && (
          <div className="flex justify-center space-x-4 text-2xl font-bold">
            <div className="text-center">
              <div className="bg-white bg-opacity-30 rounded-lg px-3 py-2">
                {formatTime(timeRemaining.days)}
              </div>
              <div className="text-xs mt-1 opacity-75">Days</div>
            </div>
            <div className="text-center">
              <div className="bg-white bg-opacity-30 rounded-lg px-3 py-2">
                {formatTime(timeRemaining.hours)}
              </div>
              <div className="text-xs mt-1 opacity-75">Hours</div>
            </div>
            <div className="text-center">
              <div className="bg-white bg-opacity-30 rounded-lg px-3 py-2">
                {formatTime(timeRemaining.minutes)}
              </div>
              <div className="text-xs mt-1 opacity-75">Minutes</div>
            </div>
            <div className="text-center">
              <div className="bg-white bg-opacity-30 rounded-lg px-3 py-2">
                {formatTime(timeRemaining.seconds)}
              </div>
              <div className="text-xs mt-1 opacity-75">Seconds</div>
            </div>
          </div>
        )}
      </div>

      {getUrgencyLevel() === 'warning' && (
        <div className="text-center">
          <button
            onClick={handlePayment}
            className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded font-medium transition-colors"
          >
            <FaCreditCard className="inline mr-2" />
            Set Up Payment Method
          </button>
        </div>
      )}

      {timeRemaining.expired && (
        <div className="text-center">
          <p className="text-sm mb-3">Your trial has expired. Please subscribe to continue using the platform.</p>
          <button
            onClick={handlePayment}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            <FaCreditCard className="inline mr-2" />
            Subscribe Now
          </button>
        </div>
      )}
    </div>
  );
};

export default TrialCountdown;
