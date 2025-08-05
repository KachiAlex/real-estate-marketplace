import React from 'react';
import { Link } from 'react-router-dom';
import { FaHome, FaPhone, FaEnvelope, FaMapMarkerAlt, FaFacebook, FaTwitter, FaLinkedin, FaInstagram, FaArrowRight } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-full h-full" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }}></div>
      </div>
      
      <div className="container mx-auto px-6 py-16 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          {/* Company Info */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <FaHome className="text-white text-xl" />
              </div>
              <div>
                <span className="text-2xl font-bold gradient-text">RealEstate</span>
                <div className="text-sm text-gray-400 font-medium">Premium Properties</div>
              </div>
            </div>
            <p className="text-gray-300 mb-8 leading-relaxed text-lg">
              Your trusted partner in real estate transactions. We provide secure escrow services, 
              investment opportunities, and comprehensive property solutions for buyers, sellers, and investors.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center hover:bg-white/20 transition-all duration-300 group">
                <FaFacebook className="text-white text-lg group-hover:scale-110 transition-transform" />
              </a>
              <a href="#" className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center hover:bg-white/20 transition-all duration-300 group">
                <FaTwitter className="text-white text-lg group-hover:scale-110 transition-transform" />
              </a>
              <a href="#" className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center hover:bg-white/20 transition-all duration-300 group">
                <FaLinkedin className="text-white text-lg group-hover:scale-110 transition-transform" />
              </a>
              <a href="#" className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center hover:bg-white/20 transition-all duration-300 group">
                <FaInstagram className="text-white text-lg group-hover:scale-110 transition-transform" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xl font-bold mb-6 text-white">Quick Links</h3>
            <ul className="space-y-4">
              <li>
                <Link to="/properties" className="text-gray-300 hover:text-white transition-all duration-300 flex items-center group">
                  <FaArrowRight className="mr-3 text-sm opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-1" />
                  <span>Properties</span>
                </Link>
              </li>
              <li>
                <Link to="/investments" className="text-gray-300 hover:text-white transition-all duration-300 flex items-center group">
                  <FaArrowRight className="mr-3 text-sm opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-1" />
                  <span>Investments</span>
                </Link>
              </li>
              <li>
                <Link to="/mortgages" className="text-gray-300 hover:text-white transition-all duration-300 flex items-center group">
                  <FaArrowRight className="mr-3 text-sm opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-1" />
                  <span>Mortgages</span>
                </Link>
              </li>
              <li>
                <Link to="/escrow" className="text-gray-300 hover:text-white transition-all duration-300 flex items-center group">
                  <FaArrowRight className="mr-3 text-sm opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-1" />
                  <span>Escrow Services</span>
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-300 hover:text-white transition-all duration-300 flex items-center group">
                  <FaArrowRight className="mr-3 text-sm opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-1" />
                  <span>About Us</span>
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-300 hover:text-white transition-all duration-300 flex items-center group">
                  <FaArrowRight className="mr-3 text-sm opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-1" />
                  <span>Contact</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-xl font-bold mb-6 text-white">Contact Info</h3>
            <div className="space-y-6">
              <div className="flex items-start space-x-4 group">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <FaMapMarkerAlt className="text-white text-sm" />
                </div>
                <div>
                  <span className="text-gray-300 leading-relaxed">
                    123 Real Estate Ave, Suite 100<br />
                    New York, NY 10001
                  </span>
                </div>
              </div>
              <div className="flex items-start space-x-4 group">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <FaPhone className="text-white text-sm" />
                </div>
                <div>
                  <span className="text-gray-300">+1 (555) 123-4567</span>
                </div>
              </div>
              <div className="flex items-start space-x-4 group">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <FaEnvelope className="text-white text-sm" />
                </div>
                <div>
                  <span className="text-gray-300">info@realestate.com</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 mt-12 pt-8">
          <div className="flex flex-col lg:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm mb-4 lg:mb-0">
              © 2024 RealEstate. All rights reserved.
            </p>
            <div className="flex space-x-8">
              <Link to="/privacy" className="text-gray-400 hover:text-white text-sm transition-all duration-300 hover:scale-105">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-gray-400 hover:text-white text-sm transition-all duration-300 hover:scale-105">
                Terms of Service
              </Link>
              <Link to="/cookies" className="text-gray-400 hover:text-white text-sm transition-all duration-300 hover:scale-105">
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 