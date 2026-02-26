import React from 'react';
import { Link } from 'react-router-dom';

// Minimal header used as a safe fallback while debugging syntax issues
export default function Header() {
  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="font-bold text-lg text-gray-800">PropertyArk</Link>
        <nav>
          <Link to="/properties" className="text-sm text-gray-600 hover:text-gray-900">Properties</Link>
        </nav>
      </div>
    </header>
  );
}
