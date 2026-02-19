/* eslint-disable no-undef */
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaQuestionCircle, FaPhone, FaEnvelope, FaClock, FaFileAlt, FaBook, FaHeadset, FaTicketAlt, FaChevronDown, FaChevronUp, FaChevronRight, FaMapMarkerAlt, FaWhatsapp, FaTelegram, FaTimes, FaArrowLeft } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { getApiUrl } from '../utils/apiConfig';
import apiClient from '../services/apiClient';
import CreateTicketModal from '../components/support/CreateTicketModal';

const HelpSupport = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const subjectRef = useRef(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedFAQ, setExpandedFAQ] = useState(null);
  const [activeResource, setActiveResource] = useState(null); // 'guide', 'docs', 'support'
  const [selectedGuideSection, setSelectedGuideSection] = useState(null);
  const [selectedDocCategory, setSelectedDocCategory] = useState('all');
  // live chat removed — using support ticket flow instead
  const [contactForm, setContactForm] = useState({
    subject: '',
    category: '',
    message: '',
    priority: 'medium'
  });

  // Chat state (legacy handlers reference these; live chat UI removed)
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([]);

  

  // FAQ Categories and Questions
  const faqCategories = [
    {
      id: 'general',
      name: 'General',
      icon: FaQuestionCircle,
      questions: [
        {
          id: 1,
          question: 'How do I create an account on PropertyArk?',
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
      id: 'guide',
      icon: FaBook,
      title: 'User Guide',
      description: 'Comprehensive platform guide',
      count: '50+ pages'
    },
    {
      id: 'docs',
      icon: FaFileAlt,
      title: 'Documentation',
      description: 'Technical documentation',
      count: '100+ articles'
    },
    {
      id: 'support',
      icon: FaHeadset,
      title: 'Support Tickets',
      description: 'Create a support ticket and receive email replies',
      count: 'Response within 24 hours'
    }
  ];

  // User Guide Sections
  const userGuideSections = [
    {
      id: 'introduction',
      title: 'Introduction to PropertyArk',
      content: `
        <h3>Welcome to PropertyArk</h3>
        <p>PropertyArk is Nigeria's premier real estate marketplace, connecting buyers, sellers, and investors in a secure, transparent platform.</p>
        
        <h4>What You Can Do:</h4>
        <ul>
          <li>Browse thousands of verified property listings</li>
          <li>Invest in real estate projects with as little as ₦100,000</li>
          <li>Apply for mortgages through partner banks</li>
          <li>Use our secure escrow system for safe transactions</li>
          <li>Schedule property viewings and inspections</li>
        </ul>
      `
    },
    {
      id: 'account-setup',
      title: 'Account Setup & Profile',
      content: `
        <h3>Creating Your Account</h3>
        <p>Getting started is easy! Follow these steps:</p>
        <ol>
          <li>Click the "Register" button on the homepage</li>
          <li>Fill in your personal information (name, email, phone)</li>
          <li>Verify your email address</li>
          <li>Complete your profile with additional details</li>
          <li>Add a profile picture (optional but recommended)</li>
        </ol>
        
        <h4>Profile Settings</h4>
        <p>Keep your profile updated to get the best experience:</p>
        <ul>
          <li>Update your contact information regularly</li>
          <li>Set your property preferences</li>
          <li>Configure notification settings</li>
          <li>Link your payment methods</li>
        </ul>
      `
    },
    {
      id: 'searching',
      title: 'Searching for Properties',
      content: `
        <h3>Finding Your Perfect Property</h3>
        <p>Our powerful search system helps you find exactly what you're looking for.</p>
        
        <h4>Search Filters</h4>
        <ul>
          <li><strong>Location:</strong> Search by city, state, or neighborhood</li>
          <li><strong>Property Type:</strong> Apartment, Villa, Commercial, Land, etc.</li>
          <li><strong>Price Range:</strong> Set your budget limits</li>
          <li><strong>Bedrooms/Bathrooms:</strong> Filter by size</li>
          <li><strong>Status:</strong> For Sale, For Rent, Shortlet</li>
        </ul>
        
        <h4>Save Your Searches</h4>
        <p>Save frequently used search criteria to quickly find new listings that match your preferences.</p>
      `
    },
    {
      id: 'investment',
      title: 'Property Investment Guide',
      content: `
        <h3>Investing in Real Estate</h3>
        <p>PropertyArk makes real estate investment accessible to everyone.</p>
        
        <h4>How It Works</h4>
        <ol>
          <li>Browse available investment opportunities</li>
          <li>Review project details, expected returns, and timelines</li>
          <li>Invest with as little as ₦100,000</li>
          <li>Track your investment performance in real-time</li>
          <li>Receive returns as projects mature</li>
        </ol>
        
        <h4>Investment Types</h4>
        <ul>
          <li><strong>Residential Projects:</strong> Apartment complexes, housing estates</li>
          <li><strong>Commercial Projects:</strong> Office buildings, retail spaces</li>
          <li><strong>Mixed-Use Developments:</strong> Combined residential and commercial</li>
        </ul>
      `
    },
    {
      id: 'mortgage',
      title: 'Mortgage Application Guide',
      content: `
        <h3>Applying for a Mortgage</h3>
        <p>Get financing for your property purchase through our partner banks.</p>
        
        <h4>Mortgage Calculator</h4>
        <p>Use our mortgage calculator to estimate your monthly payments before applying.</p>
        
        <h4>Application Process</h4>
        <ol>
          <li>Select a property and click "Apply for Mortgage"</li>
          <li>Fill out the pre-qualification form</li>
          <li>Submit required documents</li>
          <li>Wait for bank approval (typically 3-5 business days)</li>
          <li>Complete the mortgage process with your chosen bank</li>
        </ol>
        
        <h4>Required Documents</h4>
        <ul>
          <li>Valid government-issued ID</li>
          <li>Proof of income (payslips, bank statements)</li>
          <li>Employment letter</li>
          <li>Property documents</li>
        </ul>
      `
    },
    {
      id: 'payments',
      title: 'Payments & Escrow System',
      content: `
        <h3>Secure Payment Processing</h3>
        <p>Our escrow system ensures safe and secure transactions.</p>
        
        <h4>How Escrow Works</h4>
        <ol>
          <li>Buyer initiates payment through our platform</li>
          <li>Funds are held securely in escrow</li>
          <li>Property transfer is completed and verified</li>
          <li>Funds are released to the seller</li>
        </ol>
        
        <h4>Payment Methods</h4>
        <ul>
          <li>Bank Transfer (1% fee)</li>
          <li>Debit/Credit Cards (2.5% fee)</li>
          <li>Mobile Money</li>
        </ul>
        
        <h4>Transaction Fees</h4>
        <p>Standard escrow fee: 0.5% of transaction amount. All fees are clearly displayed before payment.</p>
      `
    }
  ];

  // Documentation Articles
  const documentationArticles = [
    {
      id: 1,
      title: 'API Authentication',
      category: 'api',
      content: 'Learn how to authenticate API requests using JWT tokens and manage session security.',
      readTime: '5 min read'
    },
    {
      id: 2,
      title: 'Property Data Models',
      category: 'api',
      content: 'Understanding the property data structure and available fields for API integration.',
      readTime: '8 min read'
    },
    {
      id: 3,
      title: 'Webhook Integration',
      category: 'integration',
      content: 'Set up webhooks to receive real-time notifications for property updates and transactions.',
      readTime: '10 min read'
    },
    {
      id: 4,
      title: 'Payment Gateway Integration',
      category: 'payments',
      content: 'Integrate our payment gateway for seamless transaction processing.',
      readTime: '12 min read'
    },
    {
      id: 5,
      title: 'Search API Endpoints',
      category: 'api',
      content: 'Comprehensive guide to using our search API with filters and pagination.',
      readTime: '7 min read'
    },
    {
      id: 6,
      title: 'Mobile SDK Setup',
      category: 'mobile',
      content: 'Get started with our mobile SDK for iOS and Android applications.',
      readTime: '15 min read'
    },
    {
      id: 7,
      title: 'Rate Limiting',
      category: 'api',
      content: 'Understand API rate limits and best practices for handling rate limit errors.',
      readTime: '4 min read'
    },
    {
      id: 8,
      title: 'Error Handling',
      category: 'api',
      content: 'Common API errors and how to handle them effectively in your application.',
      readTime: '6 min read'
    }
  ];

  const docCategories = [
    { id: 'all', name: 'All Articles' },
    { id: 'api', name: 'API Reference' },
    { id: 'integration', name: 'Integration' },
    { id: 'payments', name: 'Payments' },
    { id: 'mobile', name: 'Mobile SDK' }
  ];

  const filteredFAQs = faqCategories.flatMap(category => 
    category.questions.filter(q => 
      q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const handleContactSubmit = async (e) => {
    e.preventDefault();

    if (!contactForm.subject || !contactForm.category || !contactForm.message) {
      toast.error('Please complete subject, category and message');
      return;
    }

    try {
      const payload = {
        message: `Subject: ${contactForm.subject}\nPriority: ${contactForm.priority}\n\n${contactForm.message}`,
        category: contactForm.category
      };

      const resp = await apiClient.post('/support/inquiry', payload);

      if (resp?.data?.success) {
        toast.success(resp.data?.message || 'Support ticket submitted. We will respond soon.');
        setContactForm({ subject: '', category: '', message: '', priority: 'medium' });
        if (typeof loadTickets === 'function') loadTickets();
      } else if (resp?.status === 401 || resp?.data?.status === 401) {
        toast.error('Authentication required. Please log in again.');
      } else {
        const err = resp?.data || {};
        toast.error(err.error || 'Failed to submit ticket');
      }
    } catch (error) {
      console.error('Support ticket submit error:', error);
      toast.error('Failed to submit support ticket. Please try again later.');
    }
  };

  // Tickets state and loader
  const [tickets, setTickets] = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [ticketsError, setTicketsError] = useState(null);

  const loadTickets = async () => {
    if (!user || !user.uid) return;
    setTicketsLoading(true);
    setTicketsError(null);
    try {
      const resp = await apiClient.get('/support/inquiries');
      const data = resp.data || {};
      if (!data?.success) {
        throw new Error(data?.message || 'Failed to load tickets');
      }
      setTickets(data.data || []);
    } catch (err) {
      console.error('Failed to load tickets:', err);
      setTicketsError(err.message || 'Failed to load tickets');
    } finally {
      setTicketsLoading(false);
    }
  };

  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (activeResource === 'support') {
      loadTickets();
    }
  }, [activeResource, user]);

  const handleSendChatMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    // Require authentication for sending chat messages
    if (!user || !user.uid) {
      toast.error('Please log in to send messages to support');
      navigate('/auth/login');
      return;
    }

    const userMessage = {
      id: Date.now(),
      text: chatInput,
      sender: 'user',
      timestamp: new Date()
    };
    setChatMessages(prev => [...prev, userMessage]);
    const messageText = chatInput;
    setChatInput('');

    // Send message to support inquiry system (use same path as contact form)
    try {
      const resp = await apiClient.post('/support/inquiry', { message: messageText, category: 'general_inquiry' });
      if (resp?.data?.success) {
        const confirmMessage = {
          id: Date.now() + 1,
          text: '✓ Your message has been sent to our support team. You will receive a response shortly.',
          sender: 'bot',
          timestamp: new Date(),
          isConfirmation: true
        };
        setChatMessages(prev => [...prev, confirmMessage]);
      } else if (resp?.status === 401 || resp?.data?.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      } else {
        const errorData = resp?.data || {};
        throw new Error(errorData.error || 'Server error');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        text: `Error: ${error.message || 'Failed to send message'}. Please contact support at support@propertyark.com`,
        sender: 'bot',
        timestamp: new Date(),
        isError: true
      };
      setChatMessages(prev => [...prev, errorMessage]);
    }
  };

  const filteredDocs = selectedDocCategory === 'all'
    ? documentationArticles
    : documentationArticles.filter(d => d.category === selectedDocCategory);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Help & Support</h1>
        <p className="text-gray-600">
          Get the help you need to make the most of PropertyArk
        </p>
      </div>

      {/* Search Bar */}
      <div id="contact-form" className="bg-white rounded-lg shadow p-6 mb-8">
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
      {!activeResource ? (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Support Resources</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {supportResources.map((resource) => (
              <div 
                key={resource.id}
                onClick={() => setActiveResource(resource.id)}
                className="text-center p-4 border border-gray-200 rounded-lg hover:border-brand-blue hover:shadow-md transition-all cursor-pointer"
              >
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
      ) : (
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          {/* Back Button */}
          <button
            onClick={() => {
              setActiveResource(null);
              setSelectedGuideSection(null);
              setSelectedDocCategory('all');
            }}
            className="flex items-center space-x-2 text-gray-600 hover:text-brand-blue mb-6"
          >
            <FaArrowLeft />
            <span>Back to Support Resources</span>
          </button>

          {/* User Guide Section */}
          {activeResource === 'guide' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">User Guide</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Guide Navigation */}
                <div className="lg:col-span-1">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-4">Table of Contents</h3>
                    <div className="space-y-2">
                      {userGuideSections.map((section) => (
                        <button
                          key={section.id}
                          onClick={() => setSelectedGuideSection(section.id)}
                          className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                            selectedGuideSection === section.id
                              ? 'bg-brand-blue text-white'
                              : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {section.title}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Guide Content */}
                <div className="lg:col-span-2">
                  <div className="border border-gray-200 rounded-lg p-6">
                    {selectedGuideSection ? (
                      <div 
                        className="prose max-w-none"
                        dangerouslySetInnerHTML={{ 
                          __html: userGuideSections.find(s => s.id === selectedGuideSection)?.content || '' 
                        }}
                      />
                    ) : (
                      <div className="text-center py-12">
                        <FaBook className="text-6xl text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-600">Select a section from the table of contents to get started</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Documentation Section */}
          {activeResource === 'docs' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Documentation</h2>
              
              {/* Category Filter */}
              <div className="flex flex-wrap gap-3 mb-6">
                {docCategories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedDocCategory(cat.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedDocCategory === cat.id
                        ? 'bg-brand-blue text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>

              {/* Articles List */}
              <div className="space-y-4">
                {filteredDocs.map((article) => (
                  <div 
                    key={article.id}
                    className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => {
                      // Expand article or navigate to detail page
                      toast.info(`Opening: ${article.title}`);
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{article.title}</h3>
                        <p className="text-gray-600 mb-3">{article.content}</p>
                        <div className="flex items-center space-x-4">
                          <span className="text-sm text-gray-500">{article.readTime}</span>
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                            {docCategories.find(c => c.id === article.category)?.name || article.category}
                          </span>
                        </div>
                      </div>
                      <FaChevronRight className="text-gray-400 ml-4" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Live chat removed — use Support Tickets via the contact form below */}
          {activeResource === 'support' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">My Support Tickets</h2>

              <div className="border border-gray-200 rounded-lg p-4 mb-6">
                {ticketsLoading ? (
                  <p>Loading tickets...</p>
                ) : ticketsError ? (
                  <p className="text-red-500">{ticketsError}</p>
                ) : tickets.length === 0 ? (
                  <p className="text-gray-600">You have no support tickets. Use the button below to submit one.</p>
                ) : (
                  <div className="space-y-4">
                    {tickets.map(t => (
                      <div key={t.id} className="border p-3 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold">{t.category} — {t.status}</h3>
                            <p className="text-sm text-gray-600">{t.userEmail} • {new Date(t.createdAt).toLocaleString()}</p>
                          </div>
                          <div className="text-sm text-gray-500">{t.isRead ? 'Read' : 'New'}</div>
                        </div>
                        <p className="mt-2 text-gray-800 whitespace-pre-wrap">{t.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="mt-4">
                <button
                  onClick={() => {
                    if (!user) {
                      toast.error('Please log in to create a support ticket');
                      navigate('/auth/login');
                      return;
                    }
                    setShowCreateModal(true);
                  }}
                  className="btn-primary"
                >
                  Create Support Ticket
                </button>
              </div>
            </div>
          )}
        </div>
      )}

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
                ref={subjectRef}
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
      {showCreateModal && (
        <CreateTicketModal onClose={() => setShowCreateModal(false)} onSuccess={() => loadTickets()} />

      )}
    </div>
  );
}

export default HelpSupport;



