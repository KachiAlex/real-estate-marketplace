import React, { useState, useEffect } from 'react';
import { 
  FaQuestionCircle, 
  FaSearch, 
  FaPhone, 
  FaEnvelope, 
  FaComments, 
  FaBook, 
  FaHome,
  FaDownload,
  FaChevronDown,
  FaChevronUp,
  FaCheckCircle,
  FaTicketAlt
} from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext-new';
import apiClient from '../services/apiClient';
import CreateTicketModal from '../components/support/CreateTicketModal';

const topicArticles = {
  'account-setup': {
    title: 'Account Setup Checklist',
    summary: 'Create a secure vendor login and unlock the rest of the dashboard.',
    sections: [
      {
        heading: 'Create your vendor identity',
        items: [
          'Register with a work email that prospects can trust and verify it via the link sent to your inbox.',
          'Complete your profile with business name, contact numbers, and office address so leads know how to reach you.',
          'Upload a clear profile logo or photo—listings with a recognizable brand convert up to 18% better.'
        ]
      },
      {
        heading: 'Security + access tips',
        items: [
          'Enable two-factor authentication inside Profile Settings > Security.',
          'Add teammates under Vendor Team if multiple people manage listings.',
          'Save a recovery phone number for quick password resets.'
        ]
      }
    ],
    resources: [
      { label: 'Open Profile Settings', to: '/vendor/profile' }
    ]
  },
  'property-listing': {
    title: 'Property Listing Essentials',
    summary: 'Ensure every new listing meets Marketplace standards before it goes live.',
    sections: [
      {
        heading: 'Mandatory data fields',
        items: [
          'Accurate location hierarchy (State > City > Neighborhood).',
          'Property status (For Sale, For Rent, Shortlet) and availability date.',
          'Detailed description (minimum 120 characters) including unique selling points.',
          'Pricing with currency (₦) and any service charges disclosed up-front.'
        ]
      },
      {
        heading: 'Approval process',
        items: [
          'Listings are reviewed within 4 business hours.',
          'You’ll get an email + notification if more documents or photos are required.',
          'Use the “Preview” option to double-check formatting before submitting.'
        ]
      }
    ]
  },
  'profile-verification': {
    title: 'Profile Verification',
    summary: 'Verified vendors enjoy better placement in search and instant trust badges.',
    sections: [
      {
        heading: 'Documents to prepare',
        items: [
          'Government-issued ID (international passport, driver’s license, or NIN).',
          'Proof of ownership or agency mandate for each property category you handle.',
          'Corporate affairs registration (CAC) or business permit for companies.',
          'Recent utility bill showing business address (not older than 3 months).'
        ]
      },
      {
        heading: 'Submission tips',
        items: [
          'Upload clear scans (minimum 300dpi) in PDF or JPEG format.',
          'Ensure names on IDs match the account profile exactly.',
          'Use the “Notes” field to explain any discrepancies and speed up approval.'
        ]
      }
    ],
    resources: [
      { label: 'Upload verification documents', to: '/vendor/profile' }
    ]
  },
  'payment-setup': {
    title: 'Payment Setup',
    summary: 'Connect your bank account so commissions and subscription fees are processed seamlessly.',
    sections: [
      {
        heading: 'Receiving payouts',
        items: [
          'Navigate to Billing & Payments > Payout Accounts.',
          'Add a Nigerian bank account (NGN) with matching account name.',
          'Complete the micro-deposit verification—we send ₦20-₦50 with a reference code.',
          'Set a default account; you can keep up to 3 backup accounts.'
        ]
      },
      {
        heading: 'Paying platform fees',
        items: [
          'Vendor subscriptions automatically renew via Paystack.',
          'Update your card on file at least 3 days before renewal to avoid listing pauses.',
          'Download receipts from the Subscription page for accounting purposes.'
        ]
      }
    ]
  },
  'adding-properties': {
    title: 'Adding Properties',
    summary: 'Step-by-step guide to publish a new property in under five minutes.',
    sections: [
      {
        heading: 'Quick add flow',
        items: [
          'Click “Add Property” on your dashboard or Properties tab.',
          'Choose a template (Residential, Commercial, Land) to auto-fill relevant fields.',
          'Bulk-upload images (drag & drop) and rearrange using the gallery manager.',
          'Save as draft if you need internal review before submitting.'
        ]
      },
      {
        heading: 'Document attachments',
        items: [
          'Attach floor plans, survey plans, or tenancy agreements as PDFs.',
          'Flag restricted documents as “agent only” to hide them from buyers.'
        ]
      }
    ],
    resources: [
      { label: 'Add a new property', to: '/add-property' }
    ]
  },
  'managing-listings': {
    title: 'Managing Listings',
    summary: 'Keep your portfolio fresh with status updates, boosts, and collaboration tools.',
    sections: [
      {
        heading: 'Status updates',
        items: [
          'Switch listings to Pending, Sold, or Rented to maintain accurate analytics.',
          'Schedule expirations to auto-hide stale listings.',
          'Use bulk actions to update prices or availability for multiple units.'
        ]
      },
      {
        heading: 'Collaboration',
        items: [
          'Invite team members with role-based permissions (view-only, edit, publish).',
          'Leave internal notes on each property to track negotiations.'
        ]
      }
    ]
  },
  'photo-guidelines': {
    title: 'Photo & Media Guidelines',
    summary: 'High-quality visuals increase click-through rates by 42%.',
    sections: [
      {
        heading: 'Capture standards',
        items: [
          'Landscape orientation, minimum 1600px width, well-lit rooms.',
          'Avoid heavy watermarks—use subtle branding in corners only.',
          'Include hero exterior shot, living area, kitchen, bedrooms, bathrooms, and amenities.'
        ]
      },
      {
        heading: 'Media uploads',
        items: [
          'Upload up to 30 images plus 2 short videos (MP4, under 90 seconds).',
          'Tag premium photos to highlight them in search results.'
        ]
      }
    ]
  },
  'pricing-strategy': {
    title: 'Pricing Strategy',
    summary: 'Position your listing competitively without leaving money on the table.',
    sections: [
      {
        heading: 'Market research',
        items: [
          'Use the Comparable Listings widget to benchmark against similar properties.',
          'Factor in currency fluctuations and local demand cycles.',
          'Offer flexible payment milestones for off-plan sales.'
        ]
      },
      {
        heading: 'Dynamic adjustments',
        items: [
          'Create weekend promos or shortlet discounts to boost occupancy.',
          'Enable auto-notifications when inquiries drop so you can review pricing instantly.'
        ]
      }
    ]
  },
  'handling-inquiries': {
    title: 'Handling Inquiries',
    summary: 'Respond quickly and keep conversations organized inside the dashboard.',
    sections: [
      {
        heading: 'Response playbook',
        items: [
          'Aim to reply within 2 hours—buyers get auto-reminders if you miss 24 hours.',
          'Use saved replies for common questions (payment schedule, viewing availability).',
          'Convert serious leads into inspection requests directly from the inquiry thread.'
        ]
      }
    ],
    resources: [
      { label: 'Open My Inquiries', to: '/my-inquiries' }
    ]
  },
  'escrow-process': {
    title: 'Escrow Process',
    summary: 'Understand how funds move from buyer to seller safely.',
    sections: [
      {
        heading: 'Lifecycle',
        items: [
          'Buyer deposits funds into escrow via bank transfer or card.',
          'PropertyArk verifies inspection completion and documentation.',
          'Funds are released after buyer confirmation or automatically after 7 days.',
          'Disputes route to our compliance team with evidence uploads.'
        ]
      },
      {
        heading: 'Your responsibilities',
        items: [
          'Upload signed contracts and proof of ownership promptly.',
          'Share final invoices so the escrow amount matches closing costs.'
        ]
      }
    ]
  },
  'commission-rates': {
    title: 'Commission Rates',
    summary: 'Platform fees that apply when a transaction closes.',
    sections: [
      {
        heading: 'Standard structure',
        items: [
          '₦0-₦9.9M: 3% platform commission.',
          '₦10M+: 2.5% platform commission.',
          'Shortlets: 10% of booking value, collected per stay.',
          'Custom enterprise arrangements available for large portfolios.'
        ]
      },
      {
        heading: 'Payout timing',
        items: [
          'Commissions are deducted automatically before funds hit your payout account.',
          'Download statements from Vendor Earnings for accounting.'
        ]
      }
    ]
  },
  'payment-processing': {
    title: 'Payment Processing',
    summary: 'Keep Paystack and bank transactions running smoothly.',
    sections: [
      {
        heading: 'Incoming buyer payments',
        items: [
          'Buyers can pay via card, transfer, or wallet; you receive status alerts instantly.',
          'Track every transaction under Vendor Earnings > Payment History.',
          'Use the reference number when following up with support.'
        ]
      },
      {
        heading: 'Failed transactions',
        items: [
          'Most failures stem from card limits—ask the buyer to retry or use transfer.',
          'Escalate persistent failures with screenshots to payments@propertyark.com.'
        ]
      }
    ]
  }
};

const VendorHelp = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [selectedArticleId, setSelectedArticleId] = useState('account-setup');
  const [tickets, setTickets] = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [ticketsError, setTicketsError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const loadTickets = async () => {
    if (!currentUser || !(currentUser.id || currentUser.uid)) return;
    setTicketsLoading(true);
    setTicketsError(null);
    try {
      const resp = await apiClient.get('/support/inquiries');
      const data = resp.data || {};
      if (!data?.success) throw new Error(data?.message || 'Failed to load tickets');
      setTickets(data.data || []);
    } catch (err) {
      console.error('Vendor support tickets error:', err);
      setTicketsError(err.message || 'Failed to load tickets');
    } finally {
      setTicketsLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, [currentUser]);

  const handleOpenTicketModal = () => {
    if (!currentUser || !(currentUser.id || currentUser.uid)) {
      toast.error('Please log in to create a support ticket');
      navigate('/auth/login');
      return;
    }
    setShowCreateModal(true);
  };

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
        { id: 'account-setup', label: 'Account Setup' },
        { id: 'property-listing', label: 'Property Listing' },
        { id: 'profile-verification', label: 'Profile Verification' },
        { id: 'payment-setup', label: 'Payment Setup' }
      ]
    },
    {
      title: "Property Management",
      icon: FaHome,
      topics: [
        { id: 'adding-properties', label: 'Adding Properties' },
        { id: 'managing-listings', label: 'Managing Listings' },
        { id: 'photo-guidelines', label: 'Photo Guidelines' },
        { id: 'pricing-strategy', label: 'Pricing Strategy' }
      ]
    },
    {
      title: "Sales & Transactions",
      icon: FaComments,
      topics: [
        { id: 'handling-inquiries', label: 'Handling Inquiries' },
        { id: 'escrow-process', label: 'Escrow Process' },
        { id: 'commission-rates', label: 'Commission Rates' },
        { id: 'payment-processing', label: 'Payment Processing' }
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
                {category.topics.map((topic) => (
                  <li key={topic.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedArticleId(topic.id)}
                      className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                        selectedArticleId === topic.id
                          ? 'bg-blue-50 text-brand-blue font-semibold'
                          : 'text-gray-600 hover:text-brand-blue hover:bg-gray-50'
                      }`}
                    >
                      {topic.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Selected Article */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
        {topicArticles[selectedArticleId] ? (
          <div>
            <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400">Help Guide</p>
                <h2 className="text-2xl font-semibold text-gray-900">{topicArticles[selectedArticleId].title}</h2>
                <p className="text-gray-600 mt-2 max-w-3xl">{topicArticles[selectedArticleId].summary}</p>
              </div>
            </div>
            <div className="space-y-6">
              {topicArticles[selectedArticleId].sections?.map((section, idx) => (
                <div key={idx}>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">{section.heading}</h3>
                  <ul className="space-y-2">
                    {section.items.map((item, itemIdx) => (
                      <li key={itemIdx} className="flex items-start gap-2 text-gray-700">
                        <FaCheckCircle className="text-green-500 mt-1 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            {topicArticles[selectedArticleId].resources?.length ? (
              <div className="mt-6 flex flex-wrap gap-3">
                {topicArticles[selectedArticleId].resources.map((resource, idx) => (
                  resource.to ? (
                    <Link
                      key={idx}
                      to={resource.to}
                      className="px-4 py-2 rounded-lg bg-brand-blue text-white text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                      {resource.label}
                    </Link>
                  ) : (
                    <a
                      key={idx}
                      href={resource.href}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 rounded-lg bg-brand-blue text-white text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                      {resource.label}
                    </a>
                  )
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="text-gray-500">Select a topic to view detailed guidance.</div>
        )}
      </div>

      {/* Support Tickets */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-400">Support</p>
            <h2 className="text-2xl font-semibold text-gray-900">My Support Tickets</h2>
            <p className="text-gray-600">Track previous inquiries and raise new requests for the vendor success team.</p>
          </div>
          <button onClick={handleOpenTicketModal} className="btn-primary w-full md:w-auto">
            Create Support Ticket
          </button>
        </div>

        <div className="border border-gray-100 rounded-lg p-4">
          {ticketsLoading ? (
            <p className="text-gray-500">Loading tickets…</p>
          ) : ticketsError ? (
            <p className="text-red-500">{ticketsError}</p>
          ) : tickets.length === 0 ? (
            <p className="text-gray-600">You have no support tickets yet. Use the button above to contact support.</p>
          ) : (
            <div className="space-y-4">
              {tickets.map((ticket) => (
                <div key={ticket.id} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{ticket.subject || ticket.category || 'Support Ticket'}</h3>
                      <p className="text-sm text-gray-500">
                        {ticket.userEmail || 'Vendor'} • {ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : ''}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${ticket.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {ticket.status || 'Pending'}
                    </span>
                  </div>
                  <p className="mt-2 text-gray-700 whitespace-pre-wrap">{ticket.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
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
            <FaTicketAlt className="text-purple-600 h-8 w-8" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Support Tickets</h3>
          <p className="text-gray-600 mb-4">Raise a ticket and get email + dashboard updates</p>
          <button onClick={handleOpenTicketModal} className="bg-brand-blue text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Create Ticket
          </button>
          <p className="text-sm text-gray-500 mt-2">Responses within 24 hours</p>
        </div>
      </div>

      {showCreateModal && (
        <CreateTicketModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadTickets();
          }}
        />
      )}

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
        </div>
      </div>
    </div>
  );
};

export default VendorHelp;

