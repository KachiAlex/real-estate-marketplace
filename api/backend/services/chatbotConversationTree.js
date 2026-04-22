// Guided chatbot conversation tree for support
// Each node has: id, message, options (label, nextStateId)

const chatbotConversationTree = [
  {
    id: 'root',
    message: 'Welcome! How can I help you today?',
    options: [
      { label: 'Property Listings', nextStateId: 'property_listings' },
      { label: 'Account Issues', nextStateId: 'account_issues' },
      { label: 'Payment & Escrow', nextStateId: 'payment_escrow' },
      { label: 'Contact Support', nextStateId: 'contact_support' }
    ]
  },
  {
    id: 'property_listings',
    message: 'What would you like to do regarding property listings?',
    options: [
      { label: 'Search for properties', nextStateId: 'search_properties' },
      { label: 'Learn about listing a property', nextStateId: 'list_property_info' },
      { label: 'Go back', nextStateId: 'root' }
    ]
  },
  {
    id: 'search_properties',
    message: 'You can search for properties using our main search page. Would you like a direct link?',
    options: [
      { label: 'Yes, show me', nextStateId: 'show_search_link' },
      { label: 'Go back', nextStateId: 'property_listings' }
    ]
  },
  {
    id: 'show_search_link',
    message: 'Here is the link to our property search: [Property Search Page URL]',
    options: [
      { label: 'Go back', nextStateId: 'property_listings' },
      { label: 'Main Menu', nextStateId: 'root' }
    ]
  },
  {
    id: 'list_property_info',
    message: 'To list a property, you need to create an account and follow the listing steps. Would you like to see the guide?',
    options: [
      { label: 'Show me the guide', nextStateId: 'show_listing_guide' },
      { label: 'Go back', nextStateId: 'property_listings' }
    ]
  },
  {
    id: 'show_listing_guide',
    message: 'Here is our property listing guide: [Listing Guide URL]',
    options: [
      { label: 'Go back', nextStateId: 'property_listings' },
      { label: 'Main Menu', nextStateId: 'root' }
    ]
  },
  {
    id: 'account_issues',
    message: 'What account issue can we help you with?',
    options: [
      { label: 'Reset password', nextStateId: 'reset_password' },
      { label: 'Update profile', nextStateId: 'update_profile' },
      { label: 'Go back', nextStateId: 'root' }
    ]
  },
  {
    id: 'reset_password',
    message: 'To reset your password, use the "Forgot Password" link on the login page. Need more help?',
    options: [
      { label: 'Contact Support', nextStateId: 'contact_support' },
      { label: 'Go back', nextStateId: 'account_issues' }
    ]
  },
  {
    id: 'update_profile',
    message: 'You can update your profile from your account dashboard. Need more help?',
    options: [
      { label: 'Contact Support', nextStateId: 'contact_support' },
      { label: 'Go back', nextStateId: 'account_issues' }
    ]
  },
  {
    id: 'payment_escrow',
    message: 'What would you like to know about payment and escrow?',
    options: [
      { label: 'How does escrow work?', nextStateId: 'escrow_info' },
      { label: 'Payment methods', nextStateId: 'payment_methods' },
      { label: 'Go back', nextStateId: 'root' }
    ]
  },
  {
    id: 'escrow_info',
    message: 'Escrow protects both buyers and sellers. Funds are held securely until all conditions are met. Need more details?',
    options: [
      { label: 'Contact Support', nextStateId: 'contact_support' },
      { label: 'Go back', nextStateId: 'payment_escrow' }
    ]
  },
  {
    id: 'payment_methods',
    message: 'We accept bank transfer, credit/debit cards, and more. Need more help?',
    options: [
      { label: 'Contact Support', nextStateId: 'contact_support' },
      { label: 'Go back', nextStateId: 'payment_escrow' }
    ]
  },
  {
    id: 'contact_support',
    message: 'A support agent will be with you shortly. Is there anything else you want to do?',
    options: [
      { label: 'Main Menu', nextStateId: 'root' }]
  }
];

module.exports = chatbotConversationTree;
