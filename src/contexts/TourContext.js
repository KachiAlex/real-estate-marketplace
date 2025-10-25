import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const TourContext = createContext();

export const useTour = () => {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return context;
};

export const TourProvider = ({ children }) => {
  const [isTourActive, setIsTourActive] = useState(false);
  const [currentTourStep, setCurrentTourStep] = useState(0);
  const [tourSteps, setTourSteps] = useState([]);
  const [tourProgress, setTourProgress] = useState(0);
  const [completedTours, setCompletedTours] = useState([]);
  const [highlightedElement, setHighlightedElement] = useState(null);
  const [showTourStartModal, setShowTourStartModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Load completed tours from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('completedTours');
    if (saved) {
      setCompletedTours(JSON.parse(saved));
    }
  }, []);

  // Save completed tours to localStorage
  const saveCompletedTours = (tours) => {
    setCompletedTours(tours);
    localStorage.setItem('completedTours', JSON.stringify(tours));
  };

  // Define available tours
  const availableTours = {
    'comprehensive': {
      id: 'comprehensive',
      name: 'Complete Platform Tour',
      description: 'Explore all features of the platform',
      duration: '8-12 minutes',
      steps: [
        {
          id: 'welcome',
          title: 'Welcome to KIKI ESTATES!',
          content: 'Hi there! I\'m KIKI, your friendly AI assistant. I\'m so excited to show you around our amazing platform! Let me take you on a comprehensive tour where you\'ll discover all the wonderful features we have to offer.',
          target: null,
          action: null,
          position: 'center'
        },
        {
          id: 'home-hero',
          title: 'Beautiful Home Page',
          content: 'This is our stunning home page where you can see featured properties and get a feel for our platform. Notice how clean and modern everything looks!',
          target: null,
          action: { type: 'scroll', direction: 'down', amount: 300 },
          position: 'center'
        },
        {
          id: 'navigation',
          title: 'Navigation Menu',
          content: 'Here\'s your main navigation menu. From here you can access Properties, Investments, Dashboard, and much more. It\'s your gateway to everything on our platform!',
          target: 'nav-menu',
          action: null,
          position: 'bottom'
        },
        {
          id: 'search',
          title: 'Smart Search',
          content: 'This is our powerful search bar. You can find properties by location, price, or type. It\'s super intuitive and will help you find exactly what you\'re looking for!',
          target: 'search-bar',
          action: null,
          position: 'bottom'
        },
        {
          id: 'properties',
          title: 'Property Listings',
          content: 'Let\'s explore our properties page where you can see all available listings. This is where the magic happens - you\'ll find your dream property here!',
          target: null,
          action: { type: 'navigate', path: '/properties' },
          position: 'center'
        },
        {
          id: 'property-scroll',
          title: 'Browse Properties',
          content: 'Look at all these amazing properties! You can scroll through them, use filters, and find the perfect home. Each card shows you all the important details.',
          target: null,
          action: { type: 'scroll', direction: 'down', amount: 500 },
          position: 'center'
        },
        {
          id: 'property-card',
          title: 'Property Details',
          content: 'Each property card shows you everything you need to know - price, location, bedrooms, bathrooms, and beautiful photos. Click on any property to see full details!',
          target: 'property-card',
          action: null,
          position: 'top'
        },
        {
          id: 'filters',
          title: 'Smart Filters',
          content: 'These filters are incredibly powerful! You can narrow down your search by price, bedrooms, bathrooms, location, and so much more. It makes finding your perfect property so easy!',
          target: 'property-filters',
          action: null,
          position: 'left'
        },
        {
          id: 'investments',
          title: 'Investment Opportunities',
          content: 'Now let\'s explore our investment section! This is where you can invest in real estate projects and grow your wealth. It\'s perfect for both beginners and experienced investors.',
          target: null,
          action: { type: 'navigate', path: '/investments' },
          position: 'center'
        },
        {
          id: 'investment-scroll',
          title: 'Investment Options',
          content: 'Look at all these amazing investment opportunities! You can see expected returns, risk levels, and minimum investment amounts. Real estate investment has never been this accessible!',
          target: null,
          action: { type: 'scroll', direction: 'down', amount: 400 },
          position: 'center'
        },
        {
          id: 'investment-card',
          title: 'Investment Details',
          content: 'Each investment opportunity shows you everything you need to make informed decisions. You can see the project details, expected returns, and risk assessments.',
          target: 'investment-card',
          action: null,
          position: 'top'
        },
        {
          id: 'vendor-dashboard',
          title: 'Vendor Dashboard',
          content: 'Now let\'s explore the vendor side of our platform! This is where property owners and agents can list their properties and manage their business.',
          target: null,
          action: { type: 'navigate', path: '/vendor/dashboard' },
          position: 'center'
        },
        {
          id: 'vendor-features',
          title: 'Vendor Features',
          content: 'As a vendor, you can list properties, manage bookings, view analytics, and so much more! This dashboard gives you complete control over your real estate business.',
          target: null,
          action: { type: 'scroll', direction: 'down', amount: 300 },
          position: 'center'
        },
        {
          id: 'dashboard',
          title: 'Your Personal Dashboard',
          content: 'This is your personal dashboard where you can see saved properties, alerts, and account information. It\'s your home base on our platform!',
          target: null,
          action: { type: 'navigate', path: '/dashboard' },
          position: 'center'
        },
        {
          id: 'dashboard-features',
          title: 'Dashboard Features',
          content: 'Your dashboard shows you everything at a glance - saved properties, alerts, recent searches, and personalized recommendations. It\'s designed to make your experience seamless!',
          target: null,
          action: { type: 'scroll', direction: 'down', amount: 400 },
          position: 'center'
        },
        {
          id: 'blog',
          title: 'Real Estate Blog',
          content: 'Let\'s check out our blog section! Here you\'ll find the latest real estate news, market insights, and helpful tips for buyers and sellers.',
          target: null,
          action: { type: 'navigate', path: '/blog' },
          position: 'center'
        },
        {
          id: 'blog-content',
          title: 'Expert Content',
          content: 'Our blog features expert articles about real estate trends, investment strategies, and market analysis. It\'s a great resource for staying informed!',
          target: null,
          action: { type: 'scroll', direction: 'down', amount: 300 },
          position: 'center'
        },
        {
          id: 'kiki-help',
          title: 'I\'m Always Here to Help!',
          content: 'Remember, I\'m always available to help you! Just click my icon to ask questions, get assistance, or take another tour. I\'m here to make your experience amazing!',
          target: 'kiki-button',
          action: null,
          position: 'left'
        },
        {
          id: 'completion',
          title: 'Tour Complete!',
          content: 'Congratulations! You\'ve completed our comprehensive tour. You now know all the amazing features our platform has to offer. I\'m so excited for you to start exploring and finding your perfect property!',
          target: null,
          action: null,
          position: 'center'
        }
      ]
    },
    'new-user': {
      id: 'new-user',
      name: 'Welcome Tour',
      description: 'Get familiar with the platform',
      duration: '5-7 minutes',
      steps: [
        {
          id: 'welcome',
          title: 'Welcome to KIKI ESTATES!',
          content: 'I\'m KIKI, your AI assistant. Let me show you around our platform and help you get started.',
          target: null,
          action: null,
          position: 'center'
        },
        {
          id: 'navigation',
          title: 'Navigation Menu',
          content: 'This is your main navigation menu. From here you can access Properties, Investments, Dashboard, and more.',
          target: 'nav-menu',
          action: null,
          position: 'bottom'
        },
        {
          id: 'search',
          title: 'Search Properties',
          content: 'Use the search bar to find properties by location, price, or type. You can also use the advanced filters.',
          target: 'search-bar',
          action: null,
          position: 'bottom'
        },
        {
          id: 'properties',
          title: 'Browse Properties',
          content: 'Let\'s explore the properties page where you can see all available listings.',
          target: null,
          action: { type: 'navigate', path: '/properties' },
          position: 'center'
        },
        {
          id: 'property-card',
          title: 'Property Cards',
          content: 'Each property is displayed as a card with key information. Click on any property to see full details.',
          target: 'property-card',
          action: null,
          position: 'top'
        },
        {
          id: 'filters',
          title: 'Property Filters',
          content: 'Use these filters to narrow down your search by price, bedrooms, bathrooms, and more.',
          target: 'property-filters',
          action: null,
          position: 'left'
        },
        {
          id: 'investments',
          title: 'Investment Opportunities',
          content: 'Now let\'s explore investment opportunities where you can invest in real estate projects.',
          target: null,
          action: { type: 'navigate', path: '/investments' },
          position: 'center'
        },
        {
          id: 'investment-card',
          title: 'Investment Cards',
          content: 'Investment opportunities show expected returns, risk levels, and minimum investment amounts.',
          target: 'investment-card',
          action: null,
          position: 'top'
        },
        {
          id: 'dashboard',
          title: 'Your Dashboard',
          content: 'Your personal dashboard shows saved properties, alerts, and account information.',
          target: null,
          action: { type: 'navigate', path: '/dashboard' },
          position: 'center'
        },
        {
          id: 'kiki-help',
          title: 'I\'m Always Here!',
          content: 'Remember, I\'m always available to help! Just click my icon to ask questions or get assistance.',
          target: 'kiki-button',
          action: null,
          position: 'left'
        }
      ]
    },
    'vendor-tour': {
      id: 'vendor-tour',
      name: 'Vendor Tour',
      description: 'Learn how to list and manage properties',
      duration: '8-10 minutes',
      steps: [
        {
          id: 'vendor-welcome',
          title: 'Welcome, Vendor!',
          content: 'Let me show you how to effectively use our platform to list and manage your properties.',
          target: null,
          action: null,
          position: 'center'
        },
        {
          id: 'vendor-dashboard',
          title: 'Vendor Dashboard',
          content: 'This is your vendor dashboard where you can manage listings, view analytics, and track earnings.',
          target: null,
          action: { type: 'navigate', path: '/vendor/dashboard' },
          position: 'center'
        },
        {
          id: 'add-property',
          title: 'Add New Property',
          content: 'Click here to add a new property listing. We\'ll guide you through the process.',
          target: 'add-property-btn',
          action: null,
          position: 'bottom'
        },
        {
          id: 'property-form',
          title: 'Property Listing Form',
          content: 'Fill out this form with your property details. High-quality photos and accurate information help attract buyers.',
          target: 'property-form',
          action: null,
          position: 'top'
        },
        {
          id: 'upload-photos',
          title: 'Upload Photos',
          content: 'Upload multiple high-quality photos. Good photos are crucial for attracting potential buyers.',
          target: 'photo-upload',
          action: null,
          position: 'right'
        },
        {
          id: 'pricing-tips',
          title: 'Pricing Your Property',
          content: 'Research similar properties in your area to set competitive prices. I can help with market analysis.',
          target: 'pricing-section',
          action: null,
          position: 'left'
        },
        {
          id: 'manage-listings',
          title: 'Manage Your Listings',
          content: 'From your dashboard, you can edit, update, or remove your property listings.',
          target: 'property-list',
          action: null,
          position: 'top'
        },
        {
          id: 'analytics',
          title: 'View Analytics',
          content: 'Track views, inquiries, and performance of your listings to optimize your strategy.',
          target: 'analytics-section',
          action: null,
          position: 'bottom'
        }
      ]
    },
    'buyer-tour': {
      id: 'buyer-tour',
      name: 'Buyer Tour',
      description: 'Learn how to find and purchase properties',
      duration: '6-8 minutes',
      steps: [
        {
          id: 'buyer-welcome',
          title: 'Welcome, Buyer!',
          content: 'Let me show you how to find your perfect property and navigate the buying process.',
          target: null,
          action: null,
          position: 'center'
        },
        {
          id: 'search-properties',
          title: 'Search Properties',
          content: 'Use our advanced search to find properties that match your criteria.',
          target: null,
          action: { type: 'navigate', path: '/properties' },
          position: 'center'
        },
        {
          id: 'filter-properties',
          title: 'Filter Your Search',
          content: 'Use filters to narrow down properties by price, location, bedrooms, and more.',
          target: 'property-filters',
          action: null,
          position: 'left'
        },
        {
          id: 'save-properties',
          title: 'Save Properties',
          content: 'Click the heart icon to save properties you like. View them later in your dashboard.',
          target: 'save-property-btn',
          action: null,
          position: 'top'
        },
        {
          id: 'property-details',
          title: 'View Property Details',
          content: 'Click on any property to see full details, photos, location, and contact information.',
          target: 'property-details',
          action: null,
          position: 'center'
        },
        {
          id: 'contact-agent',
          title: 'Contact Agent',
          content: 'Use the contact form to get in touch with property agents or schedule viewings.',
          target: 'contact-form',
          action: null,
          position: 'bottom'
        },
        {
          id: 'escrow-protection',
          title: 'Escrow Protection',
          content: 'We offer secure escrow protection for property purchases to keep your money safe.',
          target: 'escrow-info',
          action: null,
          position: 'right'
        },
        {
          id: 'investment-options',
          title: 'Investment Opportunities',
          content: 'Explore investment options if you\'re interested in real estate investment.',
          target: null,
          action: { type: 'navigate', path: '/investments' },
          position: 'center'
        }
      ]
    }
  };

  // Start a tour
  const startTour = (tourId) => {
    const tour = availableTours[tourId];
    if (!tour) return;

    setTourSteps(tour.steps);
    setCurrentTourStep(0);
    setIsTourActive(true);
    setTourProgress(0);
    
    // Execute first step if it has an action
    if (tour.steps[0].action) {
      executeStepAction(tour.steps[0].action);
    }
  };

  // Execute step action (navigation, scrolling, etc.)
  const executeStepAction = (action) => {
    if (action.type === 'navigate') {
      navigate(action.path);
    } else if (action.type === 'scroll') {
      const scrollAmount = action.amount || 300;
      const scrollDirection = action.direction === 'up' ? -scrollAmount : scrollAmount;
      window.scrollBy({
        top: scrollDirection,
        behavior: 'smooth'
      });
    }
  };

  // Go to next step
  const nextStep = () => {
    if (currentTourStep < tourSteps.length - 1) {
      const nextStepIndex = currentTourStep + 1;
      setCurrentTourStep(nextStepIndex);
      setTourProgress((nextStepIndex / tourSteps.length) * 100);
      
      // Execute action for next step
      if (tourSteps[nextStepIndex].action) {
        setTimeout(() => {
          executeStepAction(tourSteps[nextStepIndex].action);
        }, 500);
      }
    } else {
      // Tour completed
      completeTour(tourSteps[0]?.id || 'unknown');
    }
  };

  // Go to previous step
  const previousStep = () => {
    if (currentTourStep > 0) {
      const prevStepIndex = currentTourStep - 1;
      setCurrentTourStep(prevStepIndex);
      setTourProgress((prevStepIndex / tourSteps.length) * 100);
      
      // Execute action for previous step
      if (tourSteps[prevStepIndex].action) {
        setTimeout(() => {
          executeStepAction(tourSteps[prevStepIndex].action);
        }, 500);
      }
    }
  };

  // Complete tour
  const completeTour = (tourId) => {
    setIsTourActive(false);
    setCurrentTourStep(0);
    setTourSteps([]);
    setTourProgress(0);
    setHighlightedElement(null);
    
    const updatedCompleted = [...completedTours, tourId];
    saveCompletedTours(updatedCompleted);
    
    // Mark user as visited if this is their first tour
    if (tourId === 'comprehensive') {
      markAsVisited();
    }
  };

  // Skip tour
  const skipTour = () => {
    setIsTourActive(false);
    setCurrentTourStep(0);
    setTourSteps([]);
    setTourProgress(0);
    setHighlightedElement(null);
    
    // Mark user as visited even if they skip
    markAsVisited();
  };

  // Check if tour is completed
  const isTourCompleted = (tourId) => {
    return completedTours.includes(tourId);
  };

  // Check if user is a first-time visitor
  const isFirstTimeVisitor = () => {
    const hasVisited = localStorage.getItem('hasVisitedApp');
    return !hasVisited;
  };

  // Mark user as visited
  const markAsVisited = () => {
    localStorage.setItem('hasVisitedApp', 'true');
  };

  // Check if user should see tour start button
  const shouldShowTourButton = () => {
    return isFirstTimeVisitor() && !isTourActive && location.pathname === '/';
  };

  // Check for tour button visibility on location change
  useEffect(() => {
    // No auto-start, just check if we should show the tour button
  }, [location.pathname]);

  // Reset completed tours
  const resetCompletedTours = () => {
    setCompletedTours([]);
    localStorage.removeItem('completedTours');
  };

  // Get current step
  const getCurrentStep = () => {
    return tourSteps[currentTourStep] || null;
  };

  // Handle tour start modal
  const handleTourStart = () => {
    setShowTourStartModal(false);
    startTour('comprehensive');
  };

  const handleTourSkip = () => {
    setShowTourStartModal(false);
    markAsVisited();
  };

  // Highlight element
  const highlightElement = (elementId) => {
    setHighlightedElement(elementId);
  };

  // Clear highlight
  const clearHighlight = () => {
    setHighlightedElement(null);
  };

  const value = {
    // State
    isTourActive,
    currentTourStep,
    tourSteps,
    tourProgress,
    completedTours,
    highlightedElement,
    showTourStartModal,
    availableTours,
    
    // Actions
    startTour,
    nextStep,
    previousStep,
    completeTour,
    skipTour,
    isTourCompleted,
    resetCompletedTours,
    getCurrentStep,
    highlightElement,
    clearHighlight,
    executeStepAction,
    isFirstTimeVisitor,
    markAsVisited,
    shouldShowTourButton,
    handleTourStart,
    handleTourSkip
  };

  return (
    <TourContext.Provider value={value}>
      {children}
    </TourContext.Provider>
  );
};
