import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const FooterQuickLinks = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const goToProperties = (e) => {
    e.preventDefault();
    if (user) {
      // Signed-in users go to dashboard's properties view
      navigate('/dashboard?view=properties', { replace: false });
    } else {
      // Public users should see a restricted/public dashboard with only properties tab
      navigate('/dashboard?public=1&view=properties', { replace: false });
    }
  };

  const goToMortgage = (e) => {
    e.preventDefault();
    if (user) {
      navigate('/dashboard?view=mortgage', { replace: false });
    } else {
      navigate('/dashboard?public=1&view=mortgage', { replace: false });
    }
  };

  const goToInvestments = (e) => {
    e.preventDefault();
    if (user) {
      navigate('/dashboard?view=investments', { replace: false });
    } else {
      navigate('/dashboard?public=1&view=investments', { replace: false });
    }
  };

  const goToAbout = (e) => {
    e.preventDefault();
    navigate('/about', { replace: false });
  };

  return (
    <ul className="space-y-3">
      <li>
        <a href="/dashboard?view=properties" onClick={goToProperties} className="text-gray-400 hover:text-white transition-colors">Browse Properties</a>
      </li>
      <li>
        <a href="/dashboard?view=mortgage" onClick={goToMortgage} className="text-gray-400 hover:text-white transition-colors">Mortgage Calculator</a>
      </li>
      <li>
        <a href="/dashboard?view=investments" onClick={goToInvestments} className="text-gray-400 hover:text-white transition-colors">Investment Opportunities</a>
      </li>
      <li>
        <a href="/about" onClick={goToAbout} className="text-gray-400 hover:text-white transition-colors">About Us</a>
      </li>
    </ul>
  );
};

export default FooterQuickLinks;
