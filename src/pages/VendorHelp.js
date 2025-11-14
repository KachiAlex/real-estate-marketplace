import React, { useState } from 'react';
import { 
  FaQuestionCircle, 
  FaSearch, 
  FaPhone, 
  FaEnvelope, 
  FaComments, 
  FaBook, 
  FaVideo, 
  FaDownload,
  FaChevronDown,
  FaChevronUp
} from 'react-icons/fa';

const VendorHelp = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState(null);

  const faqs = [
    {
      id: 1,
      question: "How do I add a new property listing?",
      answer: "Go to the Properties tab in your vendor dashboard and click 'Add New Property'. Fill in all the required details including property images, description, price, and location. Make sure to provide accurate information to attract potential buyers."
    },
    {
      id: 2,
      question: "What are the commission rates for vendors?",
      answer: "Our commission structure is competitive and varies based on property value. For properties under ₦10M, we charge 3% commission. For properties ₦10M and above, we charge 2.5% commission. There are no hidden fees."
    },
    {
      id: 3,
      question: "How does the escrow payment system work?",
      answer: "When a buyer makes a purchase, funds are held in our secure escrow account for 7 days. The buyer can confirm property possession or file a dispute. If no action is taken, funds are automatically released to you. This protects both parties."
    },
    {
      id: 4,
      question: "How do I manage property inquiries?",
      answer: "All inquiries appear in your 'My Inquiries' section. You can respond directly to buyers, schedule property viewings, and track conversation history. We recommend responding within 24 hours for better conversion rates."
    },
    {
      id: 5,
      question: "What documents do I need to verify my vendor account?",
      answer: "You'll need to provide: 1) Government-issued ID, 2) Proof of property ownership or authorization to sell, 3) Bank account details for payments, 4) Tax identification number (TIN). All documents are verified within 2-3 business days."
    },
    {
      id: 6,
      question: "How do I track my earnings and payments?",
      answer: "Your earnings dashboard shows all completed transactions, pending payments, and commission breakdowns. Payments are processed within 24-48 hours after transaction completion. You can download detailed reports for accounting purposes."
    }
  ];

  const helpCategories = [
    {
      title: "Getting Started",
      icon: FaBook,
      topics: [
        "Account Setup",
        "Property Listing",
        "Profile Verification",
        "Payment Setup"
      ]
    },
    {
      title: "Property Management",
      icon: FaVideo,
      topics: [
        "Adding Properties",
        "Managing Listings",
        "Photo Guidelines",
        "Pricing Strategy"
      ]
    },
    {
      title: "Sales & Transactions",
      icon: FaComments,
      topics: [
        "Handling Inquiries",
        "Escrow Process",
        "Commission Rates",
        "Payment Processing"
      ]
    }
  ];

  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleFaq = (id) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Help & Support</h1>
        <p className="text-gray-600">
          Get help with your vendor account, property listings, and transactions
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-8">
        <div className="relative max-w-md">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search help articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
          />
        </div>
      </div>

      {/* Quick Help Categories */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {helpCategories.map((category, index) => {
          const Icon = category.icon;
          return (
            <div key={index} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-3 bg-brand-blue bg-opacity-10 rounded-lg">
                  <Icon className="text-brand-blue h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{category.title}</h3>
              </div>
              <ul className="space-y-2">
                {category.topics.map((topic, topicIndex) => (
                  <li key={topicIndex} className="text-sm text-gray-600 hover:text-brand-blue cursor-pointer">
                    {topic}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* FAQ Section */}
      <div className="bg-white rounded-lg border border-gray-200 mb-8">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Frequently Asked Questions</h2>
          <p className="text-gray-600 mt-1">Find answers to common vendor questions</p>
        </div>
        
        <div className="divide-y divide-gray-200">
          {filteredFaqs.map((faq) => (
            <div key={faq.id} className="p-6">
              <button
                onClick={() => toggleFaq(faq.id)}
                className="w-full flex items-center justify-between text-left"
              >
                <h3 className="text-lg font-medium text-gray-900 pr-4">{faq.question}</h3>
                {expandedFaq === faq.id ? (
                  <FaChevronUp className="text-gray-400 h-5 w-5 flex-shrink-0" />
                ) : (
                  <FaChevronDown className="text-gray-400 h-5 w-5 flex-shrink-0" />
                )}
              </button>
              
              {expandedFaq === faq.id && (
                <div className="mt-4 text-gray-600 leading-relaxed">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Contact Support */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
          <div className="p-3 bg-green-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <FaPhone className="text-green-600 h-8 w-8" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Phone Support</h3>
          <p className="text-gray-600 mb-4">Speak directly with our support team</p>
          <p className="text-brand-blue font-semibold">+234 800 123 4567</p>
          <p className="text-sm text-gray-500 mt-1">Mon-Fri 8AM-6PM WAT</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
          <div className="p-3 bg-blue-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <FaEnvelope className="text-blue-600 h-8 w-8" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Email Support</h3>
          <p className="text-gray-600 mb-4">Send us a detailed message</p>
          <p className="text-brand-blue font-semibold">vendors@propertyark.com</p>
          <p className="text-sm text-gray-500 mt-1">Response within 24 hours</p>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
          <div className="p-3 bg-purple-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <FaComments className="text-purple-600 h-8 w-8" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Live Chat</h3>
          <p className="text-gray-600 mb-4">Get instant help via chat</p>
          <button className="bg-brand-blue text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Start Chat
          </button>
          <p className="text-sm text-gray-500 mt-2">Available 24/7</p>
        </div>
      </div>

      {/* Resources */}
      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Resources</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-3">
            <FaDownload className="text-gray-400 h-5 w-5" />
            <div>
              <p className="font-medium text-gray-900">Vendor Guide PDF</p>
              <p className="text-sm text-gray-600">Complete guide to using our platform</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <FaVideo className="text-gray-400 h-5 w-5" />
            <div>
              <p className="font-medium text-gray-900">Video Tutorials</p>
              <p className="text-sm text-gray-600">Step-by-step video guides</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorHelp;

