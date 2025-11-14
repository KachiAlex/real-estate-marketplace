import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FaSearch, FaQuestionCircle, FaPhone, FaEnvelope, FaClock, FaFileAlt, FaVideo, FaBook, FaHeadset, FaTicketAlt, FaChevronDown, FaChevronUp, FaMapMarkerAlt, FaWhatsapp, FaTelegram } from 'react-icons/fa';

const HelpSupport = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedFAQ, setExpandedFAQ] = useState(null);
  const [contactForm, setContactForm] = useState({
    subject: '',
    category: '',
    message: '',
    priority: 'medium'
  });

  // FAQ Categories and Questions
  const faqCategories = [
    {
      id: 'general',
      name: 'General',
      icon: FaQuestionCircle,
      questions: [
        {
          id: 1,
          question: 'How do I create an account on Property Ark?',
          answer: 'Creating an account is simple! Click the "Register" button on the homepage, fill in your details including name, email, and phone number. Verify your email address and you\'re ready to start browsing properties.'
        },
        {
          id: 2,
          question: 'What types of properties are available on the platform?',
          answer: 'We offer a wide range of properties including luxury apartments, villas, penthouses, commercial properties, and land plots across major Nigerian cities like Lagos, Abuja, Port Harcourt, and more.'
        },
        {
          id: 3,
          question: 'How do I verify a property listing?',
          answer: 'All properties on our platform are verified by our team. Look for the "Verified" badge on property listings. You can also request additional verification documents through the property details page.'
        }
      ]
    },
    {
      id: 'investment',
      name: 'Investment',
      icon: FaBook,
      questions: [
        {
          id: 4,
          question: 'How does property investment work on your platform?',
          answer: 'Our investment platform allows you to invest in real estate projects with as little as ₦100,000. You can choose from various projects, track your returns, and manage your portfolio through our dashboard.'
        },
        {
          id: 5,
          question: 'What is the minimum investment amount?',
          answer: 'The minimum investment varies by project, but typically starts from ₦100,000. Each project clearly displays the minimum investment amount and expected returns.'
        },
        {
          id: 6,
          question: 'How are returns calculated and paid?',
          answer: 'Returns are calculated based on project performance and are typically paid quarterly. You can track your returns in real-time through your investment dashboard.'
        }
      ]
    },
    {
      id: 'mortgage',
      name: 'Mortgage',
      icon: FaFileAlt,
      questions: [
        {
          id: 7,
          question: 'What mortgage options are available?',
          answer: 'We partner with leading Nigerian banks to offer various mortgage options including 15-year, 20-year, and 30-year fixed-rate mortgages, as well as adjustable-rate mortgages (ARMs).'
        },
        {
          id: 8,
          question: 'How do I apply for a mortgage?',
          answer: 'Use our mortgage calculator to estimate payments, then click "Apply for Mortgage" on any eligible property. Our team will connect you with our partner banks for pre-qualification.'
        },
        {
          id: 9,
          question: 'What documents do I need for mortgage application?',
          answer: 'You\'ll need proof of income, bank statements, employment letter, valid ID, and property documents. Our team will provide a complete checklist during the application process.'
        }
      ]
    },
    {
      id: 'payments',
      name: 'Payments & Escrow',
      icon: FaTicketAlt,
      questions: [
        {
          id: 10,
          question: 'How does the escrow system work?',
          answer: 'Our escrow system holds your funds securely until all transaction conditions are met. Funds are only released to the seller after property transfer is completed and verified.'
        },
        {
          id: 11,
          question: 'What payment methods are accepted?',
          answer: 'We accept all major payment methods including bank transfers, debit/credit cards, and mobile money through our Flutterwave integration. All transactions are secure and encrypted.'
        },
        {
          id: 12,
          question: 'Are there any transaction fees?',
          answer: 'Transaction fees vary by payment method and transaction type. Standard fees are 2.5% for card payments and 1% for bank transfers. Escrow fees are 0.5% of the transaction amount.'
        }
      ]
    }
  ];

  // Contact methods
  const contactMethods = [
    {
      icon: FaPhone,
      title: 'Phone Support',
      description: 'Speak directly with our support team',
      contact: '+234 800 123 4567',
      availability: 'Mon-Fri: 8AM-6PM, Sat: 9AM-4PM',
      color: 'bg-green-100 text-green-600'
    },
    {
      icon: FaEnvelope,
      title: 'Email Support',
      description: 'Get detailed help via email',
      contact: 'support@propertyark.com',
      availability: '24/7 response within 2 hours',
      color: 'bg-blue-100 text-blue-600'
    },
    {
      icon: FaWhatsapp,
      title: 'WhatsApp Support',
      description: 'Quick assistance via WhatsApp',
      contact: '+234 800 123 4567',
      availability: '24/7 instant response',
      color: 'bg-green-100 text-green-600'
    },
    {
      icon: FaTelegram,
      title: 'Telegram Support',
      description: 'Get help through Telegram',
      contact: '@PropertyArkSupport',
      availability: '24/7 instant response',
      color: 'bg-blue-100 text-blue-600'
    }
  ];

  // Support resources
  const supportResources = [
    {
      icon: FaVideo,
      title: 'Video Tutorials',
      description: 'Step-by-step video guides',
      count: '25+ videos',
      link: '#'
    },
    {
      icon: FaBook,
      title: 'User Guide',
      description: 'Comprehensive platform guide',
      count: '50+ pages',
      link: '#'
    },
    {
      icon: FaFileAlt,
      title: 'Documentation',
      description: 'Technical documentation',
      count: '100+ articles',
      link: '#'
    },
    {
      icon: FaHeadset,
      title: 'Live Chat',
      description: 'Chat with support agents',
      count: '24/7 available',
      link: '#'
    }
  ];

  const filteredFAQs = faqCategories.flatMap(category => 
    category.questions.filter(q => 
      q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const handleContactSubmit = (e) => {
    e.preventDefault();
    // Handle contact form submission
    console.log('Contact form submitted:', contactForm);
    alert('Your message has been sent! We\'ll get back to you within 2 hours.');
    setContactForm({ subject: '', category: '', message: '', priority: 'medium' });
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Help & Support</h1>
        <p className="text-gray-600">
          Get the help you need to make the most of Property Ark
        </p>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search for help articles, FAQs, or topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
          />
        </div>
      </div>

      {/* Quick Contact Methods */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {contactMethods.map((method, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6 text-center">
            <div className={`p-3 rounded-full w-fit mx-auto mb-4 ${method.color}`}>
              <method.icon className="text-xl" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{method.title}</h3>
            <p className="text-gray-600 mb-3">{method.description}</p>
            <p className="font-medium text-gray-900 mb-2">{method.contact}</p>
            <p className="text-sm text-gray-500">{method.availability}</p>
          </div>
        ))}
      </div>

      {/* Support Resources */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Support Resources</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {supportResources.map((resource, index) => (
            <div key={index} className="text-center p-4 border border-gray-200 rounded-lg hover:border-brand-blue transition-colors cursor-pointer">
              <div className="p-3 bg-brand-blue bg-opacity-10 rounded-full w-fit mx-auto mb-3">
                <resource.icon className="text-brand-blue text-xl" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{resource.title}</h3>
              <p className="text-gray-600 mb-2">{resource.description}</p>
              <p className="text-sm text-brand-blue font-medium">{resource.count}</p>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Frequently Asked Questions</h2>
        
        {/* Category Filter */}
        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedCategory === 'all'
                ? 'bg-brand-blue text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Categories
          </button>
          {faqCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
                selectedCategory === category.id
                  ? 'bg-brand-blue text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <category.icon />
              <span>{category.name}</span>
            </button>
          ))}
        </div>

        {/* FAQ List */}
        <div className="space-y-4">
          {(selectedCategory === 'all' ? faqCategories.flatMap(cat => cat.questions) : 
            faqCategories.find(cat => cat.id === selectedCategory)?.questions || [])
            .filter(q => 
              searchQuery === '' || 
              q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
              q.answer.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .map((faq) => (
            <div key={faq.id} className="border border-gray-200 rounded-lg">
              <button
                onClick={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
                className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
              >
                <span className="font-medium text-gray-900">{faq.question}</span>
                {expandedFAQ === faq.id ? (
                  <FaChevronUp className="text-gray-400" />
                ) : (
                  <FaChevronDown className="text-gray-400" />
                )}
              </button>
              {expandedFAQ === faq.id && (
                <div className="px-6 pb-4">
                  <p className="text-gray-600">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Contact Form */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Send us a Message</h2>
        <form onSubmit={handleContactSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
              <input
                type="text"
                value={contactForm.subject}
                onChange={(e) => setContactForm({...contactForm, subject: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                placeholder="What can we help you with?"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={contactForm.category}
                onChange={(e) => setContactForm({...contactForm, category: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                required
              >
                <option value="">Select a category</option>
                <option value="general">General Inquiry</option>
                <option value="technical">Technical Support</option>
                <option value="billing">Billing & Payments</option>
                <option value="investment">Investment</option>
                <option value="mortgage">Mortgage</option>
                <option value="property">Property Related</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
            <select
              value={contactForm.priority}
              onChange={(e) => setContactForm({...contactForm, priority: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
            >
              <option value="low">Low - General inquiry</option>
              <option value="medium">Medium - Need assistance</option>
              <option value="high">High - Urgent issue</option>
              <option value="critical">Critical - System down</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
            <textarea
              value={contactForm.message}
              onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue focus:border-transparent"
              placeholder="Please provide as much detail as possible about your inquiry..."
              required
            />
          </div>
          
          <button type="submit" className="btn-primary">
            Send Message
          </button>
        </form>
      </div>

      {/* Office Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Visit Our Office</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Lagos Office</h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <FaMapMarkerAlt className="text-brand-blue mt-1" />
                <div>
                  <p className="font-medium text-gray-900">Address</p>
                  <p className="text-gray-600">123 Victoria Island, Lagos, Nigeria</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <FaPhone className="text-brand-blue mt-1" />
                <div>
                  <p className="font-medium text-gray-900">Phone</p>
                  <p className="text-gray-600">+234 800 123 4567</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <FaClock className="text-brand-blue mt-1" />
                <div>
                  <p className="font-medium text-gray-900">Hours</p>
                  <p className="text-gray-600">Monday - Friday: 8:00 AM - 6:00 PM</p>
                  <p className="text-gray-600">Saturday: 9:00 AM - 4:00 PM</p>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Abuja Office</h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <FaMapMarkerAlt className="text-brand-blue mt-1" />
                <div>
                  <p className="font-medium text-gray-900">Address</p>
                  <p className="text-gray-600">456 Central Business District, Abuja, Nigeria</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <FaPhone className="text-brand-blue mt-1" />
                <div>
                  <p className="font-medium text-gray-900">Phone</p>
                  <p className="text-gray-600">+234 800 123 4568</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <FaClock className="text-brand-blue mt-1" />
                <div>
                  <p className="font-medium text-gray-900">Hours</p>
                  <p className="text-gray-600">Monday - Friday: 8:00 AM - 6:00 PM</p>
                  <p className="text-gray-600">Saturday: 9:00 AM - 4:00 PM</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpSupport;



