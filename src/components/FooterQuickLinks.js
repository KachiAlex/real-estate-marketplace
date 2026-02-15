import React from 'react';
import { useNavigate } from 'react-router-dom';

const FooterQuickLinks = () => {


  return (
    <ul className="space-y-3">
      <li>
        <a
          href="/properties"
          className="text-gray-400 hover:text-white transition-colors"
        >
          Browse Properties
        </a>
      </li>
      <li>
        <a
          href="/mortgage"
          className="text-gray-400 hover:text-white transition-colors"
        >
          Mortgage Calculator
        </a>
      </li>
      <li>
        <a
          href="/investment-opportunities"
          className="text-gray-400 hover:text-white transition-colors"
        >
          Investment Opportunities
        </a>
      </li>
      <li>
        <a href="/about" className="text-gray-400 hover:text-white transition-colors">About Us</a>
      </li>
    </ul>
  );
};

export default FooterQuickLinks;
